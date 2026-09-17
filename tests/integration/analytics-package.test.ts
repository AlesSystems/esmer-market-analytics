import { afterEach, expect, test } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSyntheticSource, metadata } from "../helpers/synthetic-source";
import { collect } from "../helpers/synthetic-source";
import { extract } from "../../src/source/extract";
import { readPackage, writePackage } from "../../src/source/package";
import { preparePackage } from "../../tools/prepare-backup";

const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
async function fixture() { const dir = await mkdtemp(join(tmpdir(), "analytics-package-")); dirs.push(dir); const path = join(dir, "synthetic.sqlite"); createSyntheticSource(path); return { dir, path }; }

test("real extraction round-trips precise strings with deterministic bytes and warnings", async () => {
  const { path } = await fixture();
  const records = await collect(extract({ path, mappingVersion: "synthetic-relational-v1" }));
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
  const bytes = writePackage(await collect(extract({ path, mappingVersion: "synthetic-relational-v1" })), metadata);
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
  expect(readPackage(Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), bytes])).ok).toBe(false);
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

test("schema and references reject independently rehashed malformed payloads", async () => {
  const { createHash } = await import("node:crypto");
  const { canonical } = await import("../../src/source/package");
  const { path } = await fixture();
  const bytes = writePackage(await collect(extract({ path, mappingVersion: "synthetic-relational-v1" })), metadata);
  for (const change of ["reference", "duplicate", "private", "supplier", "numeric", "kind-array"]) {
    const value = JSON.parse(bytes.toString());
    if (change === "reference") value.payload.lines[0].documentId = "missing";
    if (change === "duplicate") value.payload.lines.push(value.payload.lines[0]);
    if (change === "private") value.payload.documents[0].customerName = "PRIVATE_SENTINEL";
    if (change === "supplier") value.payload.suppliers.push({ id: "unreferenced" });
    if (change === "kind-array") value.payload.documents[0].kind = ["sale"];
    if (change === "numeric") value.payload.lines[0].net = 123;
    for (const stream of ["documents", "lines", "suppliers"]) value.manifest.streams[stream] = { count: value.payload[stream].length, sha256: createHash("sha256").update(canonical(value.payload[stream])).digest("hex") };
    expect(readPackage(Buffer.from(canonical(value)))).toEqual({ ok: false, code: "INVALID_PACKAGE" });
  }
});

test("preparation retries a transient initialization lock once without duplicated batches", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  const { path, dir } = await fixture(); const lock = new DatabaseSync(path); lock.exec("BEGIN EXCLUSIVE");
  let retries = 0;
  try {
    const destination = join(dir, "retry.json");
    expect(await preparePackage({ path, destination, mappingVersion: "synthetic-relational-v1", metadata, onRetry: () => { retries++; lock.exec("ROLLBACK"); lock.close(); } })).toEqual({ ok: true });
    expect(retries).toBe(1);
    const result = readPackage(await readFile(destination));
    expect(result.ok && result.records.documents.length).toBe(2);
  } finally { if (lock.isOpen) { lock.exec("ROLLBACK"); lock.close(); } }
});

test("pagination retains all source IDs and rejects empty, null and duplicate IDs", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  for (const invalid of [null, "", "line-1"]) {
    const { path } = await fixture(); const db = new DatabaseSync(path);
    db.exec("ALTER TABLE lines RENAME TO old_lines; CREATE TABLE lines (id TEXT, documentId TEXT, quantity TEXT, net TEXT, cost TEXT); INSERT INTO lines SELECT * FROM old_lines");
    const insert = db.prepare("INSERT INTO lines VALUES (?, '9007199254740993', '1', '1', NULL)");
    db.exec("BEGIN");
    for (let i = 0; i < 260; i++) insert.run(`valid-${i}`);
    insert.run(invalid); db.exec("COMMIT"); db.close();
    const batches = await collect(extract({ path, mappingVersion: "synthetic-relational-v1" }));
    expect(batches.filter(batch => batch.stream === "lines").reduce((sum, batch) => sum + batch.records.length, 0)).toBe(262);
    expect(() => writePackage(batches, metadata)).toThrow();
  }
});

test("preparation rejects shadowed SQLite row identifiers without publishing truncated rows", async () => {
  const { DatabaseSync } = await import("node:sqlite");
  for (const alias of ["ROWID INTEGER DEFAULT 1", "_rowid_ INTEGER DEFAULT 1", "oid INTEGER DEFAULT 1", "RoWiD INTEGER GENERATED ALWAYS AS (1) VIRTUAL"]) {
    const { path, dir } = await fixture(); const db = new DatabaseSync(path);
    db.exec(`ALTER TABLE lines ADD COLUMN ${alias}`);
    const insert = db.prepare("INSERT INTO lines (id, documentId, quantity, net, cost) VALUES (?, '9007199254740993', '1', '1', NULL)");
    db.exec("BEGIN");
    for (let i = 0; i < 300; i++) insert.run(`shadow-${i}`);
    db.exec("COMMIT"); db.close();
    const before = await readFile(path); const destination = join(dir, "shadow.json");
    expect(await preparePackage({ path, destination, mappingVersion: "synthetic-relational-v1", metadata })).toEqual({ ok: false, code: "PREPARATION_FAILED" });
    await expect(readFile(destination)).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readFile(path)).toEqual(before);
  }
});
