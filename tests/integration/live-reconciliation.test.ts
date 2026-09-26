import { expect, test } from "vitest";
import { LiveSynchronizer, liveFingerprint, liveIdentity } from "../../src/source/live";
import { readPackage, writePackage } from "../../src/source/package";
import { openStore } from "../../src/store/store";
import { sourcePackage } from "../helpers/store-fixtures";

test("full candidates reconcile edits, deletes, backdated low IDs, unchanged polls and A-B-A reversion", async () => {
  const store = openStore(":memory:");
  let bytes = sourcePackage("a");
  const controller = new LiveSynchronizer({extract: async () => bytes, importCandidate: candidate => { const result = store.importPackage(candidate); return result.status === "failed" ? {...result, message: "failure"} : result; }, activeDataset: () => { const snapshot = store.readSnapshot(); return snapshot.metadata && snapshot.pin.datasetId ? {datasetId: snapshot.pin.datasetId, fingerprint: liveFingerprint(snapshot.metadata), identity: liveIdentity(snapshot.metadata)} : null; }});
  try {
    controller.enable();
    expect(await controller.refresh()).toMatchObject({status: "active"});
    const initial = store.readSnapshot();
    bytes = sourcePackage("a", undefined, "second-capture");
    expect(await controller.refresh()).toEqual({status: "unchanged", datasetId: initial.pin.datasetId});
    expect(store.history()).toHaveLength(1);
    bytes = sourcePackage("b");
    expect(await controller.refresh()).toMatchObject({status: "active"});
    expect(store.readSnapshot().records.lines.map(row => [row.id, row.net])).toEqual([["line-edit", "90"], ["line-insert", "20"]]);
    bytes = sourcePackage("a", undefined, "reversion-capture");
    expect(await controller.refresh()).toMatchObject({status: "active"});
    expect(store.readSnapshot().records).toEqual(initial.records);
    const parsed = readPackage(bytes); if (!parsed.ok) throw new Error("fixture");
    parsed.records.documents.push({id: "0001", kind: "sale", date: "2025-01-01", supplierId: null});
    parsed.records.lines.push({id: "0001", documentId: "0001", quantity: "1", net: "3", cost: null});
    bytes = writePackage([{stream: "documents", records: parsed.records.documents}, {stream: "lines", records: parsed.records.lines}], {...parsed.metadata, extractionId: "late-low-id"});
    expect(await controller.refresh()).toMatchObject({status: "active"});
    expect(store.readSnapshot().records.lines.find(row => row.id === "0001")?.net).toBe("3");
    store.importPackage(sourcePackage("b", undefined, "manual-package"));
    bytes = writePackage([{stream: "documents", records: parsed.records.documents}, {stream: "lines", records: parsed.records.lines}], {...parsed.metadata, extractionId: "after-manual-capture"});
    expect(await controller.refresh()).toMatchObject({status: "active"});
    expect(store.readSnapshot().records.lines.find(row => row.id === "0001")?.net).toBe("3");
  } finally {await controller.close(); store.close();}
});
