import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { emptySalesFilters } from "../../src/reports/contracts";
import { journeyRecords, salesPackage } from "../helpers/sales-fixtures";

test("month to product to receipt retains one snapshot after two imports and pruning", () => {
  const store = openStore(":memory:");
  try {
    expect(store.importPackage(salesPackage(journeyRecords())).status).toBe("active");
    const reports = new SalesReports(store);
    const opened = reports.open({ period: "2025-09" });
    if (opened.status !== "report") throw new Error(opened.code);
    expect(opened.view.metrics).toMatchObject({ netSales: "365", saleDocumentCount: 3, averageBasket: "133.33", quantities: { piece: "11", kg: "2" } });
    const context = opened.view.context;
    const filters = { ...emptySalesFilters, productId: "water" };
    expect(store.importPackage(salesPackage(journeyRecords(), { extractionId: "second" })).status).toBe("active");
    expect(store.importPackage(salesPackage(journeyRecords(), { extractionId: "third" })).status).toBe("active");
    expect(store.prune()).toBe(1);
    expect(() => store.readPinned(context)).toThrow();
    const view = reports.query({ context, filters });
    expect(view).toMatchObject({ status: "report", view: { stale: true, metrics: { netSales: "100" }, transactions: [{ documentId: "S002", scopeNet: "60", net: "130" }, { documentId: "S001", scopeNet: "40", net: "70" }] } });
    expect(reports.inspect({ context, filters, documentId: "S002" })).toMatchObject({ status: "detail", detail: { context, scopeNet: "60", totals: { net: "130" }, extractionId: "sales-1", lines: [{ lineId: "L003", matchesScope: true }, { lineId: "L004", matchesScope: false }] } });
    expect(reports.open({ period: "2025-09" }).status).toBe("report");
    expect(reports.query({ context, filters })).toMatchObject({ status: "unavailable", code: "STALE_CONTEXT" });
  } finally { store.close(); }
});
