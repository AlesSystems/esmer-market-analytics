import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { ReportVersions } from "../../src/reports/versions";
import { businessPackage, businessRecords } from "../helpers/business-fixtures";

test("accepted monthly output preserves deleted source facts, app revisions and version explanations", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const first = versions.open({ period: "2025-09" });
    if (first.status !== "monthly") throw new Error("Expected monthly report");
    expect(first.report.purchasing.gross.coveredGrossProfit).toBe("40");
    expect(first.report.operating.result.value).toBeNull();
    versions.accept({ candidateId: first.report.id, previousAcceptedId: null, reason: "İlk inceleme" });
    const saved = versions.selected(first.report.id);
    const records = businessRecords(); records.documents = []; records.lines = [];
    store.appendRevision({ kind: "expense", entityId: "expense", value: { net: "50", date: "2025-09-01", reason: "Düzeltme", evidence: "synthetic-expense" } });
    store.importPackage(businessPackage(records, { extractionId: "deleted" }));
    const next = versions.open({ period: "2025-09" });
    if (next.status !== "monthly") throw new Error("Expected candidate");
    expect(versions.compare({ candidateId: next.report.id, acceptedId: saved.id }).changes.length).toBeGreaterThan(0);
    store.prune(versions.protectedDatasetIds());
    expect(versions.selected(saved.id)).toEqual(saved);
    expect(store.readPinned({ datasetId: saved.context.datasetId, appRevision: saved.context.appRevision }).records.lines.length).toBeGreaterThan(0);
    const restarted = new ReportVersions(store, new SalesReports(store));
    expect(restarted.selected(saved.id)).toEqual(saved);
    expect(restarted.list({ period: "2025-09" }).reports).toHaveLength(1);
  } finally { store.close(); }
});

test("cancellation during row persistence and before activation preserves the active pin without import failure", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage()); const before = store.readSnapshot();
    let checks = 0;
    expect(store.importPackage(businessPackage(undefined, { extractionId: "cancelled" }), { checkCancelled: () => { if (++checks === 4) throw new Error("CANCELLED"); } })).toEqual({ status: "cancelled" });
    expect(store.readSnapshot()).toEqual(before);
    expect(store.availability()).not.toHaveProperty("lastImportError");
    const stage = store.stage(businessPackage(undefined, { extractionId: "cancel-activation" }));
    if (stage.status !== "validated") throw new Error("Expected staged package");
    expect(store.activate(stage.id, { checkCancelled: () => { throw new Error("CANCELLED"); } })).toEqual({ status: "cancelled" });
    expect(store.readSnapshot()).toEqual(before);
  } finally { store.close(); }
});
