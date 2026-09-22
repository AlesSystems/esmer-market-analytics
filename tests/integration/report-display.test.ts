import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { ReportVersions } from "../../src/reports/versions";
import { validMonthlyRequest } from "../../src/desktop/requests";
import { businessPackage, businessRecords } from "../helpers/business-fixtures";

test("monthly display omits bulk evidence and pages the selected immutable report", () => {
  const store = openStore(":memory:");
  try {
    const records = businessRecords(), document = records.documents[0], line = records.lines[0];
    records.documents = Array.from({ length: 205 }, (_, index) => ({ ...document, id: `S${String(index).padStart(3, "0")}` }));
    records.lines = records.documents.map(row => ({ ...line, id: `L${row.id}`, documentId: row.id }));
    store.importPackage(businessPackage(records));
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected monthly report");
    const reportId = opened.report.id;
    const display = versions.display({ reportId });
    expect(display.report.sales.metrics.netSales).toBe("20500");
    expect(display.report.purchasing.gross).toMatchObject({ coveredCost: "12300", coveredGrossProfit: "8200", coveredCount: 205, excludedCount: 0 });
    expect(display.report).not.toHaveProperty("salesEvidence");
    expect(display.report.sales).not.toHaveProperty("transactions");
    expect(display.report.purchasing.gross).not.toHaveProperty("covered");
    expect(Buffer.byteLength(JSON.stringify(display))).toBeLessThan(20_000);
    const request = { reportId, section: "components" as const, offset: 0, search: "", range: "current" as const, documentId: null };
    const first = versions.evidence(request), second = versions.evidence({ ...request, offset: 100 }), last = versions.evidence({ ...request, offset: 200 });
    expect(first.total).toBe(205);
    expect(first.rows).toHaveLength(100);
    expect(second.rows).toHaveLength(100);
    expect(last.rows).toHaveLength(5);
    expect(last.rows[4]).toMatchObject({ documentId: "S204", lineId: "LS204", net: "100" });
    expect(versions.evidence({ ...request, search: "İÇME" }).total).toBe(205);
    expect(versions.evidence({ ...request, section: "lines", documentId: "S204" }).rows).toEqual([records.lines[204]]);
    expect(versions.evidence({ ...request, section: "documents", search: "S204" }).rows).toEqual([records.documents[204]]);
    versions.accept({ candidateId: reportId, previousAcceptedId: null, reason: "Sentetik kontrol" });
    const accepted = versions.selected(reportId);
    store.importPackage(businessPackage({ documents: [], lines: [], suppliers: [] }, { extractionId: "deleted" }));
    versions.open({ period: "2025-09" });
    const restarted = new ReportVersions(store, new SalesReports(store));
    expect(restarted.display({ reportId }).report.sales.metrics.netSales).toBe("20500");
    expect(restarted.evidence({ ...request, offset: 200 }).rows).toHaveLength(5);
    expect(restarted.selected(reportId)).toEqual(accepted);
  } finally { store.close(); }
});

test("evidence requests reject unbounded pages and arbitrary selectors", () => {
  const request = { reportId: "report", section: "components", offset: 0, search: "", range: "current", documentId: null };
  expect(validMonthlyRequest("readReportEvidence", request)).toBe(true);
  for (const invalid of [{ ...request, offset: -1 }, { ...request, offset: 0.5 }, { ...request, limit: 1000 }, { ...request, section: "sql" }, { ...request, range: "all" }, { ...request, search: "x".repeat(161) }, { ...request, section: "lines" }, { ...request, documentId: "S1" }]) {
    expect(validMonthlyRequest("readReportEvidence", invalid)).toBe(false);
  }
});

test("revisiting an accepted candidate keeps its review and saved display", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected monthly report");
    versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Sentetik kontrol" });
    const saved = versions.display({ reportId: opened.report.id });
    expect(versions.currentDisplay({ context: opened.report.context })).toEqual(saved);
  } finally { store.close(); }
});
