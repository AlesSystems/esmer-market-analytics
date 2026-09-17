import { afterEach, expect, test } from "vitest";
import { mkdtemp, readFile, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { createSyntheticSource, collect } from "../helpers/synthetic-source";
import { openSyntheticReadOnly } from "../../src/source/connection";
import { extract } from "../../src/source/extract";
const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
async function fixture() { const dir = await mkdtemp(join(tmpdir(), "source-readonly-")); dirs.push(dir); const path = join(dir, "synthetic.sqlite"); createSyntheticSource(path); return { dir, path }; }

test("approved reads succeed and private reads, DML, DDL and administration fail on generated DB", async () => {
  const { path, dir } = await fixture(); const before = await readFile(path);
  const db = openSyntheticReadOnly(path);
  try {
    expect(db.prepare("SELECT id FROM documents").all()).toHaveLength(2);
    for (const sql of ["SELECT customerName FROM documents", "SELECT secret FROM customers", "UPDATE documents SET kind='sale'", "DELETE FROM lines", "CREATE TABLE bad (id TEXT)", "PRAGMA user_version=9", "ATTACH ':memory:' AS other", "VACUUM"]) expect(() => db.exec(sql)).toThrow();
  } finally { db.close(); }
  expect(await collect(extract({ path, mappingVersion: "synthetic-relational-v1" }))).toHaveLength(3);
  expect(await readFile(path)).toEqual(before);
  expect(await readdir(dir)).toEqual(["synthetic.sqlite"]);
});

test("unsupported mapping fails before opening a path and abort/early exit release source", async () => {
  const { path } = await fixture(); const before = await readFile(path);
  await expect(collect(extract({ path: "DO_NOT_OPEN", mappingVersion: "real-source" }))).rejects.toThrow("UNSUPPORTED_MAPPING");
  const signal = AbortSignal.abort();
  await expect(collect(extract({ path, mappingVersion: "synthetic-relational-v1", signal }))).rejects.toThrow("EXTRACTION_CANCELLED");
  const controller = new AbortController(); const iterator = extract({ path, mappingVersion: "synthetic-relational-v1", signal: controller.signal });
  await iterator.next(); controller.abort();
  await expect(iterator.next()).rejects.toThrow("EXTRACTION_CANCELLED");
  for await (const batch of extract({ path, mappingVersion: "synthetic-relational-v1" })) { expect(batch.stream).toBe("documents"); break; }
  const db = new DatabaseSync(path); db.exec("BEGIN EXCLUSIVE; ROLLBACK"); db.close();
  expect(await readFile(path)).toEqual(before);
});

test("invalid initialization and query failure close connections without raw diagnostics", async () => {
  const { path } = await fixture(); const db = new DatabaseSync(path); db.exec("DROP TABLE lines"); db.close();
  await expect(collect(extract({ path, mappingVersion: "synthetic-relational-v1" }))).rejects.toThrow("EXTRACTION_FAILED");
  const writable = new DatabaseSync(path); writable.exec("BEGIN EXCLUSIVE; ROLLBACK"); writable.close();
});

test("deadline and abort during initialization terminate the worker before returning", async () => {
  const { path } = await fixture();
  await expect(collect(extract({ path, mappingVersion: "synthetic-relational-v1", timeoutMs: 1 }))).rejects.toThrow("EXTRACTION_TIMEOUT");
  const controller = new AbortController();
  const pending = collect(extract({ path, mappingVersion: "synthetic-relational-v1", signal: controller.signal }));
  controller.abort(); await expect(pending).rejects.toThrow("EXTRACTION_CANCELLED");
  const db = new DatabaseSync(path); db.exec("BEGIN EXCLUSIVE; ROLLBACK"); db.close();
});

test("abort closes a worker even while its consumer is paused after a batch", async () => {
  const { path } = await fixture(); const controller = new AbortController();
  const iterator = extract({ path, mappingVersion: "synthetic-relational-v1", signal: controller.signal });
  await iterator.next(); controller.abort();
  const db = new DatabaseSync(path, { timeout: 1000 });
  try { db.exec("BEGIN EXCLUSIVE; ROLLBACK"); } finally { db.close(); await iterator.return(undefined); }
});
