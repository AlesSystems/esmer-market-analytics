import { expect, test } from "vitest";
import { SalesReports } from "../../src/reports/query";
import { emptySalesFilters } from "../../src/reports/contracts";
import { openStore } from "../../src/store/store";
import { businessPackage, businessRecords } from "../helpers/business-fixtures";

test("one pinned session returns one canonical all-products monthly candidate", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const reports = new SalesReports(store);
    const opened = reports.open({ period: "2025-09" });
    if (opened.status !== "report") throw new Error("Expected report");
    const first = reports.monthly(opened.view.context);
    expect(reports.query({ context: opened.view.context, filters: { ...emptySalesFilters, productId: "missing-product" } })).toMatchObject({ status: "report", view: { metrics: { netSales: "0" } } });
    const second = reports.monthly(opened.view.context);
    expect(second).toMatchObject({ status: "monthly", report: { sales: { filters: emptySalesFilters, metrics: { netSales: "200", saleDocumentCount: 2 } }, purchasing: { gross: { coveredSales: "100", coveredCost: "60", coveredGrossProfit: "40" } } } });
    if (first.status !== "monthly" || second.status !== "monthly") throw new Error("Expected monthly");
    expect(second.report.id).toBe(first.report.id);
    expect(second.report).toEqual(first.report);
  } finally { store.close(); }
});

test("a new source or expense revision is visible only after open replaces the pinned cache", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const reports = new SalesReports(store);
    const opened = reports.open({ period: "2025-09" });
    if (opened.status !== "report") throw new Error("Expected report");
    const original = reports.monthly(opened.view.context);
    if (original.status !== "monthly") throw new Error("Expected monthly");

    store.appendRevision({ kind: "expense", entityId: "expense", value: { net: "50", date: "2025-09-01", reason: "Sentetik gider", evidence: "fixture:expense" } });
    const records = businessRecords();
    records.documents[0].sales = { ...records.documents[0].sales!, net: "120", tax: "6", gross: "126" };
    records.lines[0].net = "120";
    records.lines[0].sales = { ...records.lines[0].sales!, unitNet: "120", tax: "6", gross: "126" };
    store.importPackage(businessPackage(records, { extractionId: "cache-next" }));

    expect(reports.monthly(opened.view.context)).toMatchObject({ status: "monthly", report: { sales: { metrics: original.report.sales.metrics, stale: true }, purchasing: { stale: true }, operating: { expenseRevision: original.report.operating.expenseRevision, stale: true } } });
    const reopened = reports.open({ period: "2025-09" });
    if (reopened.status !== "report") throw new Error("Expected reopened report");
    expect(reports.monthly(opened.view.context)).toMatchObject({ status: "unavailable", code: "STALE_CONTEXT" });
    expect(reports.monthly(reopened.view.context)).toMatchObject({ status: "monthly", report: { sales: { metrics: { netSales: "220" } }, operating: { expenseRecords: [expect.objectContaining({ entityId: "expense" })] } } });
  } finally { store.close(); }
});

test("cancelled monthly composition leaves the session reusable and returned mutations cannot poison it", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const reports = new SalesReports(store);
    const opened = reports.open({ period: "2025-09" });
    if (opened.status !== "report") throw new Error("Expected report");
    let checks = 0;
    expect(() => reports.monthly(opened.view.context, { checkCancelled: () => { if (++checks === 4) throw new Error("CANCELLED"); } })).toThrow("CANCELLED");
    const retry = reports.monthly(opened.view.context);
    if (retry.status !== "monthly") throw new Error("Expected monthly");
    const id = retry.report.id;
    retry.report.sales.metrics.netSales = "999999";
    expect(() => reports.monthly(opened.view.context, { checkCancelled: () => { throw new Error("CANCELLED"); } })).toThrow("CANCELLED");
    expect(reports.monthly(opened.view.context)).toMatchObject({ status: "monthly", report: { sales: { metrics: { netSales: "200" } } } });
    const warm = reports.monthly(opened.view.context);
    if (warm.status !== "monthly") throw new Error("Expected monthly");
    expect(warm.report.id).toBe(id);
  } finally { store.close(); }
});
