import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { ReportVersions } from "../../src/reports/versions";
import { businessPackage } from "../helpers/business-fixtures";

test("selected product reads exact stored summary and daily outcomes by report identity", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2 report");
    const productId = opened.report.productProfit.products[0].productId;
    const result = versions.product({ reportId: opened.report.id, productId });
    expect(result).toMatchObject({ status: "product", reportId: opened.report.id, productId, summary: opened.report.productProfit.products[0] });
    if (result.status !== "product") throw new Error("Expected selected product");
    expect(result.daily).toHaveLength(30);
    expect(result.daily.find(day => day.date === "2025-09-01")).toMatchObject({ netSales: "200", coveredCost: "60", coveredGrossProfit: "40" });
  } finally { store.close(); }
});
