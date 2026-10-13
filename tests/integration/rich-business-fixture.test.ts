import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { readPackage } from "../../src/source/package";
import { richBusinessPackage, richBusinessRecords, seedRichExpenses } from "../helpers/rich-business-fixture";

test("rich business fixture is deterministic and reads back as a valid package", () => {
  expect(Buffer.compare(richBusinessPackage(), richBusinessPackage())).toBe(0);
  const read = readPackage(richBusinessPackage());
  expect(read.ok).toBe(true);
  if (read.ok) expect(read.warnings).toEqual(expect.arrayContaining(["SYNTHETIC_ONLY", "MISSING_COST"]));
  const records = richBusinessRecords(), september = records.documents.filter(row => row.date.startsWith("2025-09"));
  for (const date of new Set(september.filter(row => row.kind === "sale").map(row => row.date))) {
    const count = september.filter(row => row.date === date && (row.kind === "sale" || row.kind === "customer-return")).length;
    expect(count).toBeGreaterThanOrEqual(20); expect(count).toBeLessThanOrEqual(62);
  }
});

test("rich business fixture imports active and builds a populated September report", () => {
  const store = openStore(":memory:");
  try {
    expect(store.importPackage(richBusinessPackage())).toMatchObject({ status: "active" });
    seedRichExpenses(store);
    const reports = new SalesReports(store), opened = reports.open({ period: "2025-09" });
    if (opened.status !== "report") throw new Error("Expected sales report");
    const monthly = reports.monthly(opened.view.context);
    if (monthly.status !== "monthly" || monthly.report.format !== "monthly-report-v2") throw new Error("Expected monthly report");
    const { productProfit, sales, purchasing, operating } = monthly.report;
    expect(productProfit.products.length).toBeGreaterThanOrEqual(25);
    expect(productProfit.daily.filter(day => day.netSales !== null && day.coveredCount + day.excludedCount > 0).length).toBeGreaterThanOrEqual(28);
    expect(sales.daily.filter(day => Number(day.netSales) > 0).length).toBeGreaterThanOrEqual(28);
    expect(productProfit.summary.excludedCount).toBeGreaterThan(0);
    expect(productProfit.summary.exposures.excludedSales).not.toBe("0");
    expect(Number(productProfit.summary.coveredGrossProfit)).toBeGreaterThan(0);
    expect(Number(productProfit.summary.costCoveragePercent)).toBeGreaterThan(85);
    expect(sales.complete).toBe(true);
    expect(sales.metrics.saleDocumentCount).toBeGreaterThan(600);
    expect(productProfit.lines.filter(line => line.kind === "customer-return").length).toBeGreaterThan(10);
    expect(Number(productProfit.summary.exposures.coveredReturns)).toBeLessThan(0);
    expect(productProfit.lines.filter(line => line.costReason === "RETURN_ATTRIBUTION")).toEqual([]);
    expect(sales.categories.length).toBeGreaterThanOrEqual(6);
    expect(purchasing.purchasing.history.length).toBeGreaterThan(30);
    expect(new Set(purchasing.purchasing.history.map(row => row.supplierName))).toEqual(new Set(["Toptancı A", "Toptancı B", "Toptancı C"]));
    expect(purchasing.purchasing.exclusions).toEqual([]);
    expect(operating.status).toBe("operating");
    if (operating.status === "operating") { expect(operating.expenseRecords).toHaveLength(8); expect(operating.result.status).toBe("unavailable"); }
  } finally { store.close(); }
});
