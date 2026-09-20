import { expect, test } from "vitest";
import { estimateGrossResult } from "../../src/analytics/costs";
import { businessRecords } from "../helpers/business-fixtures";
test("G02 covers the same sales and cost population", () => {
  const result = estimateGrossResult(businessRecords(), { mappingVersion: "synthetic-business-v1", from: "2025-09-01", to: "2025-09-30" });
  expect(result.coveredSales).toBe("100"); expect(result.coveredCost).toBe("60"); expect(result.coveredGrossProfit).toBe("40"); expect(result.costCoveragePercent).toBe("50"); expect(result.confidence).toBe("estimated");
});

test("unknown units, tax, zero and negative costs remain excluded", () => {
  for (const [patch, reason] of [[{ unit: "unknown" }, "UNKNOWN_UNIT"], [{ taxBasis: "unknown" }, "UNKNOWN_TAX"], [{ unitCost: "0" }, "UNDOCUMENTED_ZERO"], [{ unitCost: "-1" }, "NEGATIVE_COST"]] as const) {
    const records = businessRecords(); Object.assign(records.lines[0].business!.historicalCost!, patch);
    expect(estimateGrossResult(records, { mappingVersion: "synthetic-business-v1", from: "2025-09-01", to: "2025-09-30" }).excluded[0].reason).toBe(reason);
  }
  const records = businessRecords(); Object.assign(records.lines[0].business!.historicalCost!, { unitCost: "0", documentedZero: true });
  expect(estimateGrossResult(records, { mappingVersion: "synthetic-business-v1", from: "2025-09-01", to: "2025-09-30" }).coveredCost).toBe("0");
});
test("zero monetary exposure withholds percentages", () => {
  const records = businessRecords(); for (const line of records.lines) { line.sales!.unitNet = "0"; line.net = "0"; }
  const result = estimateGrossResult(records, { mappingVersion: "synthetic-business-v1", from: "2025-09-01", to: "2025-09-30" });
  expect(result.costCoveragePercent).toBeNull(); expect(result.coveredMarginPercent).toBeNull();
});
