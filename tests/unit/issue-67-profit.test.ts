import { expect, test } from "vitest";
import { calculateSales } from "../../src/analytics/sales";
import { estimateGrossResult } from "../../src/analytics/costs";
import { buildProductProfit } from "../../src/analytics/product-profit";
import { sum } from "../../src/domain/money";
import { businessRecords, historicalCost } from "../helpers/business-fixtures";
import type { Records } from "../../src/source/package";

type Event = { id: string; date: string; quantity: string; net: string; kind: "sale" | "customer-return"; original?: string; cost?: string | null; product?: string };
function syntheticRecords(events: Event[]): Records {
  const base = businessRecords(), document = base.documents[0], line = base.lines[0];
  return {
    suppliers: [],
    documents: events.map(event => ({ ...structuredClone(document), id: event.id, date: event.date, kind: event.kind, sales: { ...document.sales!, net: event.net, tax: "0", gross: event.net } })),
    lines: events.map(event => ({ ...structuredClone(line), id: event.id, documentId: event.id, quantity: event.quantity, net: event.net, sales: { ...line.sales!, productId: event.product ?? "A", productName: `Synthetic ${event.product ?? "A"}`, unitNet: "100", taxRate: "0", tax: "0", gross: event.net }, business: { historicalCost: event.cost === null ? null : { ...historicalCost(event.cost ?? "60"), originalSaleLineId: event.original ?? null }, inventory: null } })),
  };
}
function calculate(records: Records, period = "2025-09") {
  const context = { mappingVersion: "synthetic-business-v1", from: `${period}-01`, to: `${period}-${period === "2025-09" ? "30" : "31"}` };
  const sales = calculateSales(records, context), gross = estimateGrossResult(records, context);
  const report = buildProductProfit({ sales, gross, records, lineage: "issue-67-synthetic", period, coverage: { from: context.from, to: context.to, complete: true } });
  return { sales, gross, report };
}
function assertPartitions(result: ReturnType<typeof calculate>, recognized: string[], covered: string[], expected: { netSales: string; coveredSales: string; coveredCost: string; coveredGrossProfit: string }) {
  const ids = (rows: { lineId: string }[]) => rows.map(row => row.lineId).sort();
  expect(ids(result.sales.lines)).toEqual(recognized);
  expect(ids(result.report.lines)).toEqual(recognized);
  expect(ids(result.gross.covered)).toEqual(covered);
  expect(ids(result.report.lines.filter(row => row.costReason === null))).toEqual(covered);
  expect(result.report.summary).toMatchObject(expected);
  for (const field of ["netSales", "coveredSales", "coveredCost", "coveredGrossProfit"] as const) {
    expect(sum(result.report.products.map(row => row[field] ?? "0"))).toBe(expected[field]);
    expect(sum(result.report.daily.map(row => row[field] ?? "0"))).toBe(expected[field]);
  }
}

test("S01 F04: unsupported return retains recognized revenue beside a covered sale", () => {
  const records = syntheticRecords([
    { id: "S", date: "2025-09-01", kind: "sale", quantity: "1", net: "100" },
    { id: "R", date: "2025-09-02", kind: "customer-return", quantity: "0.5", net: "-50" },
  ]);
  const result = calculate(records);
  assertPartitions(result, ["R", "S"], ["S"], { netSales: "50", coveredSales: "100", coveredCost: "60", coveredGrossProfit: "40" });
  expect(result.gross.excluded).toMatchObject([{ lineId: "R", reason: "RETURN_ATTRIBUTION", cost: null }]);
  expect(result.report.summary).toMatchObject({ scope: "covered", coveredCount: 1, excludedCount: 1, costCoveragePercent: "66.67", exposures: { coveredSales: "100", coveredReturns: "0", excludedSales: "0", excludedReturns: "-50" } });
});

test("S01 F05: fractional partial returns reverse original cost and reconcile across days", () => {
  const records = syntheticRecords([
    { id: "S", date: "2025-08-31", kind: "sale", quantity: "3", net: "300" },
    { id: "R1", date: "2025-09-01", kind: "customer-return", quantity: "1", net: "-100", original: "S" },
    { id: "R2", date: "2025-09-02", kind: "customer-return", quantity: "0.5", net: "-50", original: "S" },
  ]);
  const result = calculate(records);
  assertPartitions(result, ["R1", "R2"], ["R1", "R2"], { netSales: "-150", coveredSales: "-150", coveredCost: "-90", coveredGrossProfit: "-60" });
  expect(result.report.lines.map(row => [row.lineId, row.quantity, row.cost])).toEqual([["R1", "-1", "-60"], ["R2", "-0.5", "-30"]]);
  expect(result.report.summary).toMatchObject({ coveredMarginPercent: null, costCoveragePercent: "100", quantities: [{ unit: "piece", sold: "0", returned: "1.5", net: "-1.5" }] });
  assertPartitions(calculate(records, "2025-08"), ["S"], ["S"], { netSales: "300", coveredSales: "300", coveredCost: "180", coveredGrossProfit: "120" });
});

test("S01 F05/F12: a later snapshot with excess returns changes earlier coverage independent of input order", () => {
  const records = syntheticRecords([
    { id: "S", date: "2025-08-31", kind: "sale", quantity: "2", net: "200" },
    { id: "R1", date: "2025-09-30", kind: "customer-return", quantity: "1.5", net: "-150", original: "S" },
    { id: "B", date: "2025-09-01", kind: "sale", quantity: "1", net: "100", product: "B", cost: "80" },
  ]);
  const before = calculate(records);
  assertPartitions(before, ["B", "R1"], ["B", "R1"], { netSales: "-50", coveredSales: "-50", coveredCost: "-10", coveredGrossProfit: "-40" });
  const late = syntheticRecords([{ id: "R2", date: "2025-10-01", kind: "customer-return", quantity: "1.5", net: "-150", original: "S" }]);
  records.documents.push(...late.documents); records.lines.push(...late.lines);
  const expected = { netSales: "-50", coveredSales: "100", coveredCost: "80", coveredGrossProfit: "20" };
  for (const input of [records, { ...records, documents: [...records.documents].reverse(), lines: [...records.lines].reverse() }]) {
    const result = calculate(input);
    assertPartitions(result, ["B", "R1"], ["B"], expected);
    expect(result.gross.excluded).toMatchObject([{ lineId: "R1", reason: "RETURN_ATTRIBUTION", cost: null }]);
    expect(result.report.summary).toMatchObject({ scope: "covered", costCoveragePercent: "40", exposures: { coveredSales: "100", coveredReturns: "0", excludedSales: "0", excludedReturns: "-150" } });
    const october = calculate(input, "2025-10");
    expect(october.sales.lines.map(row => row.lineId)).toEqual(["R2"]);
    expect(october.gross.excluded).toMatchObject([{ lineId: "R2", reason: "RETURN_ATTRIBUTION" }]);
    expect(october.report.summary).toMatchObject({ netSales: "-150", coveredCost: null, coveredGrossProfit: null, coveredCount: 0, excludedCount: 1 });
  }
  expect(before.report.summary).toMatchObject({ coveredCost: "-10", coveredGrossProfit: "-40" });
});
