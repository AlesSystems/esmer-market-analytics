import { expect, test } from "vitest";
import { estimateGrossResult } from "../../src/analytics/costs";
import { calculateSales } from "../../src/analytics/sales";
import { buildProductProfit } from "../../src/analytics/product-profit";
import { readPackage } from "../../src/source/package";
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";
import { dependencyCapacityRecords } from "../helpers/issue-67-capacity";

test("synthetic dependency population survives import without entering the selected month's totals", () => {
  const records = dependencyCapacityRecords(32);
  const bytes = businessPackage(records, {
    lineage: "synthetic-issue-67-capacity",
    coverage: { from: "2025-08-01", to: "2025-09-30", complete: true },
  });
  const parsed = readPackage(bytes);
  expect(parsed.ok).toBe(true);
  if (!parsed.ok) throw new Error(parsed.code);
  expect(parsed.metadata).toMatchObject({
    provenance: "synthetic", sourceReconciled: false,
    streams: { documents: { count: 96 }, lines: { count: 96 }, suppliers: { count: 0 } },
  });
  expect(parsed.records.lines.filter(line => line.business?.historicalCost?.originalSaleLineId)).toHaveLength(32);
  const store = openStore(":memory:");
  try {
    expect(store.importPackage(bytes).status).toBe("active");
    const imported = store.readSnapshot().records;
    expect(imported).toEqual(parsed.records);
    const context = { mappingVersion: "synthetic-business-v1", from: "2025-09-01", to: "2025-09-30" };
    const sales = calculateSales(imported, context);
    const gross = estimateGrossResult(imported, context);
    const product = buildProductProfit({ sales, gross, records: imported, lineage: "synthetic-issue-67-capacity", period: "2025-09", coverage: { from: context.from, to: context.to, complete: true } });
    expect(product.summary).toMatchObject({ netSales: "-1600", coveredCost: "-960", coveredGrossProfit: "-640", coveredMarginPercent: null, coveredCount: 64, excludedCount: 0 });
    expect(product.lines).toHaveLength(64);
    expect(product.lines.filter(line => line.originalSaleLineId !== null)).toHaveLength(32);
    expect(product.lines.some(line => line.lineId.endsWith("-A1"))).toBe(false);
    expect(imported.lines.filter(line => line.id.endsWith("-A1"))).toHaveLength(32);
  } finally {
    store.close();
  }
});
