import { afterEach, expect, test } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSyntheticSource, metadata } from "../helpers/synthetic-source";
import { extract } from "../../src/source/extract";
import { readPackage, writePackage } from "../../src/source/package";
import { preparePackage } from "../../tools/prepare-backup";

const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
async function fixture() { const dir = await mkdtemp(join(tmpdir(), "analytics-package-")); dirs.push(dir); const path = join(dir, "synthetic.sqlite"); createSyntheticSource(path); return { dir, path }; }

test("real extraction round-trips precise strings with deterministic bytes and warnings", async () => {
  const { path } = await fixture();
  const records = await Array.fromAsync(extract({ path, mappingVersion: "synthetic-relational-v1" }));
  const bytes = writePackage(records, metadata);
  expect(writePackage([...records].reverse(), metadata)).toEqual(bytes);
  const result = readPackage(bytes);
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.code);
  expect(result.records.lines[0]).toEqual({ id: "line-1", documentId: "9007199254740993", quantity: "0.125000000000000001", net: "12345678901234567890.123456789", cost: null });
  expect(result.metadata.sourceReconciled).toBe(false);
  expect(result.warnings).toEqual(["SYNTHETIC_ONLY", "PARTIAL_COVERAGE", "MISSING_COST"]);
  expect(result.records.suppliers).toEqual([{ id: "supplier-1" }]);
});

test("reader rejects tampering, schema drift, unknown fields, references, invalid UTF8 and truncation", async () => {
  const { path } = await fixture();
  const bytes = writePackage(await Array.fromAsync(extract({ path, mappingVersion: "synthetic-relational-v1" })), metadata);
  for (const mutate of [
    (x: { manifest: { schemaVersion: string; streams: { lines: { count: number } } }; payload: Record<string, Record<string, unknown>[]> }) => { x.payload.lines[0].net = "1"; },
    (x: { manifest: { schemaVersion: string; streams: { lines: { count: number } } }; payload: Record<string, Record<string, unknown>[]> }) => { x.manifest.schemaVersion = "unknown"; },
    (x: { manifest: { schemaVersion: string; streams: { lines: { count: number } } }; payload: Record<string, Record<string, unknown>[]> }) => { x.payload.customers = []; },
    (x: { manifest: { schemaVersion: string; streams: { lines: { count: number } } }; payload: Record<string, Record<string, unknown>[]> }) => { x.payload.lines[0].documentId = "absent"; },
    (x: { manifest: { schemaVersion: string; streams: { lines: { count: number } } }; payload: Record<string, Record<string, unknown>[]> }) => { x.payload.documents[0].customerName = "PRIVATE"; },
    (x: { manifest: { schemaVersion: string; streams: { lines: { count: number } } }; payload: Record<string, Record<string, unknown>[]> }) => { x.manifest.streams.lines.count++; },
  ]) {
    const value = JSON.parse(bytes.toString()); mutate(value);
    expect(readPackage(Buffer.from(JSON.stringify(value))).ok).toBe(false);
  }
  expect(readPackage(bytes.subarray(0, -1)).ok).toBe(false);
  expect(readPackage(Buffer.from([0xff])).ok).toBe(false);
  expect(readPackage(Buffer.alloc(32 * 1024 * 1024 + 1)).ok).toBe(false);
});

test("preparation publishes once, preserves existing target and leaves no partial on failure", async () => {
  const { path, dir } = await fixture(); const destination = join(dir, "output.json");
  expect(await preparePackage({ path, destination, mappingVersion: "synthetic-relational-v1", metadata })).toEqual({ ok: true });
  const first = await readFile(destination);
  expect(await preparePackage({ path, destination, mappingVersion: "synthetic-relational-v1", metadata })).toEqual({ ok: false, code: "PREPARATION_FAILED" });
  expect(await readFile(destination)).toEqual(first);
});
