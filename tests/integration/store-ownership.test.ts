import { afterEach, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openStore } from "../../src/store/store";
import { migrate } from "../../src/store/migrations";
import { writePackage } from "../../src/source/package";
import { metadata } from "../helpers/synthetic-source";

const directories: string[] = [];
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }); });
function databasePath() { const path = mkdtempSync(join(tmpdir(), "store-ownership-")); directories.push(path); return join(path, "analytics.sqlite"); }
const bytes = writePackage([
  { stream: "documents", records: [{ id: "doc-1", kind: "sale", date: "2026-01-01", supplierId: null }] },
  { stream: "lines", records: [{ id: "line-1", documentId: "doc-1", quantity: "0.125000000000000001", net: "12345678901234567890.123456789", cost: null }] },
], metadata);

test("file-backed migration preserves precise facts, app revisions, pins and accepted evidence", () => {
  const path = databasePath();
  const initial = new DatabaseSync(path); migrate(initial, 1); initial.close();
  let store = openStore(path, { schemaVersion: 1 });
  expect(store.importPackage(bytes).status).toBe("active");
  store.appendRevision({ kind: "expense", entityId: "expense-1", value: { net: "50.000000000000001", date: "2026-01-01", reason: "Original", evidence: "fixture:expense-1" } });
  const before = store.readSnapshot();
  const report = { id: "report-1", pin: before.pin, calculationVersion: "fixture-v1", evidence: ["fixture:report-1"], output: { net: "12345678901234567890.123456789" } };
  store.acceptReport(report); store.close();
  store = openStore(path);
  expect(store.readSnapshot()).toEqual(before);
  expect(store.readPinned(before.pin)).toEqual(before);
  expect(store.readReport("report-1")).toEqual(report);
  expect(() => store.acceptReport({ ...report, output: { net: "0" } })).toThrow();
  store.appendRevision({ kind: "expense", entityId: "expense-1", value: { net: "60", date: "2026-01-01", reason: "Correction", evidence: "fixture:expense-2" } });
  expect(store.readPinned(before.pin)).toEqual(before);
  expect(store.readSnapshot().app.map(row => row.value)).toEqual([{ net: "60", date: "2026-01-01", reason: "Correction", evidence: "fixture:expense-2" }]);
  store.close();
  const db = new DatabaseSync(path); expect(db.prepare("PRAGMA user_version").get()).toEqual({ user_version: 2 }); db.close();
});

test("unknown and future databases are rejected without changing their bytes", () => {
  for (const sql of ["CREATE TABLE foreign_source (id TEXT)", "PRAGMA application_id=1163087186; PRAGMA user_version=999"]) {
    const path = databasePath(); const db = new DatabaseSync(path); db.exec(sql); db.close();
    expect(() => openStore(path)).toThrow("UNSUPPORTED_STORE");
    const check = new DatabaseSync(path); expect(check.prepare("PRAGMA user_version").get()?.user_version).toBe(sql.includes("999") ? 999 : 0); check.close();
  }
});
