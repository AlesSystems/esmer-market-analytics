import { afterEach, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { sourcePackage } from "../helpers/store-fixtures";
import { openStore } from "../../src/store/store";
import { type AppChange } from "../../src/store/revisions";
import { readPackage, writePackage } from "../../src/source/package";
const directories: string[] = [];
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }); });
function fixture() { const dir = mkdtempSync(join(tmpdir(), "import-activation-")); directories.push(dir); const path = join(dir, "store.sqlite"); return { path, store: openStore(path) }; }
const expense = (entityId: string, net = "50"): AppChange => ({ kind: "expense", entityId, value: { net, date: "2025-01-15", reason: "Synthetic original", evidence: `fixture:${entityId}` } });
const adjustment = (entityId: string, datasetId: string, sourceId: string): AppChange => ({ kind: "adjustment", entityId, value: { net: "5", reason: "Synthetic adjustment", evidence: `fixture:${entityId}`, target: { datasetId, kind: "line", sourceId }, reversed: false } });

test("A/B overlap preserves concurrent app writes, exact report pins and original adjustment targets", () => {
  const { store, path } = fixture();
  const a = sourcePackage("a"); const b = sourcePackage("b");
  expect(store.importPackage(a).status).toBe("active");
  const aId = store.readSnapshot().pin.datasetId!;
  store.appendRevision(expense("expense-1"));
  store.appendRevision(adjustment("adjustment-1", aId, "line-delete"));
  store.appendRevision({ kind: "setting", entityId: "setting-1", value: { currency: "TRY", reason: "TRY only", evidence: "fixture:setting" } });
  store.appendRevision({ kind: "confirmation", entityId: "confirmation-1", value: { period: "2025-01", reviewedRevision: 3, complete: false, reason: "Synthetic unconfirmed", evidence: "fixture:confirmation" } });
  const accepted = store.readSnapshot();
  store.acceptReport({ id: "report-1", pin: accepted.pin, calculationVersion: "synthetic-calculation-v1", evidence: ["fixture:source-a"], output: { net: "150" } });
  const staged = store.stage(b); expect(staged.status).toBe("validated"); if (staged.status !== "validated") throw new Error("stage");
  store.appendRevision(expense("expense-during-stage", "7"));
  store.appendRevision(adjustment("adjustment-during-stage", aId, "line-edit"));
  expect(store.activate(staged.id).status).toBe("active");
  const current = store.readSnapshot();
  expect(current.pin.appRevision).toBe(6);
  expect(current.records.lines.map(row => [row.id, row.net])).toEqual([["line-edit", "90"], ["line-insert", "20"]]);
  expect(current.records.documents.find(row => row.id === "doc-edit")?.date).toBe("2025-01-31");
  expect(current.app.map(row => row.entityId)).toEqual(["expense-1", "adjustment-1", "setting-1", "confirmation-1", "expense-during-stage", "adjustment-during-stage"]);
  expect(current.app.filter(row => row.kind === "adjustment").map(row => [row.applicability, row.value.target])).toEqual([
    ["review-required", { datasetId: aId, kind: "line", sourceId: "line-delete" }],
    ["review-required", { datasetId: aId, kind: "line", sourceId: "line-edit" }],
  ]);
  expect(store.readPinned(accepted.pin)).toEqual(accepted);
  expect(store.readReport("report-1").output).toEqual({ net: "150" });
  expect(store.importPackage(b)).toEqual({ status: "unchanged", datasetId: current.pin.datasetId });
  expect(store.importPackage(a)).toEqual({ status: "historical", datasetId: aId });
  expect(store.readSnapshot()).toEqual(current);
  expect(store.history().at(-1)?.difference).toMatchObject({ from: aId, to: current.pin.datasetId, appRevision: 6, streams: { lines: { inserted: ["line-insert"], deleted: ["line-delete"], changed: ["line-edit"] }, documents: { changed: ["doc-edit"] } } });
  store.close();
  const reopened = openStore(path); expect(reopened.readSnapshot()).toEqual(current); expect(reopened.readPinned(accepted.pin)).toEqual(accepted); reopened.close();
});

test("changed parent documents and reused IDs in a different lineage never silently reapply an adjustment", () => {
  const { store } = fixture(); store.importPackage(sourcePackage("a"));
  const original = store.readSnapshot();
  store.appendRevision(adjustment("adjustment", original.pin.datasetId!, "line-edit"));
  const parsed = readPackage(sourcePackage("a")); if (!parsed.ok) throw new Error("fixture");
  parsed.records.documents[1].date = "2025-01-31";
  const { metadata, records } = parsed;
  store.importPackage(writePackage([{ stream: "documents", records: records.documents }, { stream: "lines", records: records.lines }], { ...metadata, extractionId: "changed-parent" }));
  expect(store.readSnapshot().app[0].applicability).toBe("review-required");
  store.importPackage(sourcePackage("a", "different-lineage"));
  expect(store.readSnapshot().records.lines).toEqual(original.records.lines);
  expect(store.history().at(-1)?.difference).toMatchObject({ lineageChanged: true, previousLineage: "synthetic-market-1", lineage: "different-lineage", streams: { lines: { inserted: ["line-delete", "line-edit"], deleted: ["line-delete", "line-edit"], changed: [] } } });
  expect(store.readSnapshot().app[0].applicability).toBe("review-required");
  expect(() => store.appendRevision(adjustment("adjustment", store.readSnapshot().pin.datasetId!, "line-edit"))).toThrow("INVALID_CHANGE");
  store.close();
});

test("retention keeps active, rollback, accepted reports and adjustment evidence while pruning candidate facts and retaining dedup identity", () => {
  const { store, path } = fixture();
  store.importPackage(sourcePackage("a")); const a = store.readSnapshot();
  store.appendRevision(adjustment("retained-adjustment", a.pin.datasetId!, "line-edit"));
  store.importPackage(sourcePackage("b")); const b = store.readSnapshot();
  store.acceptReport({ id: "accepted", pin: b.pin, calculationVersion: "v1", evidence: ["fixture:b"], output: { net: "110" } });
  store.importPackage(sourcePackage("a", "lineage-c")); const c = store.readSnapshot();
  store.importPackage(sourcePackage("a", "lineage-d"));
  store.importPackage(sourcePackage("a", "lineage-e"));
  const candidate = store.stage(sourcePackage("a", "cancelled")); if (candidate.status !== "validated") throw new Error("stage");
  store.cancel(candidate.id);
  expect(store.prune()).toBe(2);
  expect(store.readPinned(a.pin)).toEqual(a);
  expect(store.readPinned(b.pin)).toEqual(b);
  expect(() => store.readPinned(c.pin)).toThrow("INVALID_CHANGE");
  expect(store.importPackage(sourcePackage("a", "lineage-c"))).toEqual({ status: "historical", datasetId: c.pin.datasetId });
  expect(store.history().find(row => row.id === candidate.id)?.state).toBe("cancelled");
  store.close();
  const db = new DatabaseSync(path); expect(db.prepare("SELECT COUNT(*) AS count FROM datasets").get()?.count).toBe(4); expect(db.prepare("PRAGMA foreign_key_check").all()).toEqual([]); db.close();
});

test("runtime validation rejects malformed revisions and preserves all original revision rows", () => {
  const { store, path } = fixture();
  store.appendRevision(expense("first", "0.00000000000001")); store.appendRevision(expense("second", "2"));
  const pin = store.readSnapshot().pin;
  store.appendRevision(expense("first", "3"));
  expect(store.readPinned(pin).app.map(row => row.kind === "expense" && row.value.net)).toEqual(["0.00000000000001", "2"]);
  expect(store.readSnapshot().app.map(row => row.entityId)).toEqual(["second", "first"]);
  for (const change of [{ ...expense("invalid"), extra: "private" }, { ...expense("invalid"), value: { net: 1, date: "2025-01-15", reason: "reason", evidence: "fixture:1" } }, { ...expense("invalid"), value: { net: "1", date: "2025-02-30", reason: "reason", evidence: "fixture:1" } }]) expect(() => store.appendRevision(change as AppChange)).toThrow();
  store.close(); const db = new DatabaseSync(path);
  expect(db.prepare("SELECT COUNT(*) AS count FROM app_revisions").get()?.count).toBe(3);
  expect(() => db.exec("DELETE FROM app_revisions")).toThrow("IMMUTABLE_REVISION"); db.close();
});

test("accepted unsorted package arrays retain their canonical order through staging and restart", async () => {
  const { createHash } = await import("node:crypto"); const { canonical } = await import("../../src/source/package");
  const { store, path } = fixture(); const value = JSON.parse(sourcePackage("a").toString());
  for (const stream of ["documents", "lines", "suppliers"]) {
    value.payload[stream].reverse();
    value.manifest.streams[stream].sha256 = createHash("sha256").update(canonical(value.payload[stream])).digest("hex");
  }
  const bytes = Buffer.from(canonical(value)); expect(readPackage(bytes).ok).toBe(true);
  expect(store.importPackage(bytes).status).toBe("active");
  expect(store.readSnapshot().records).toEqual(value.payload); store.close();
  const reopened = openStore(path); expect(reopened.readSnapshot().records).toEqual(value.payload); reopened.close();
});
