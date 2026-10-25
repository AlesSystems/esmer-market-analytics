import { expect, test } from "vitest";
import { calculateSales } from "../../src/analytics/sales";
import { salesRecords } from "../helpers/sales-fixtures";

const context = { mappingVersion: "synthetic-sales-v1", from: "2025-09-01", to: "2025-09-30" } as const;
test("G01 derives net 180, tax 9 and gross 189 from two 100 units and 10 percent discount", () => {
  const result = calculateSales(salesRecords, context);
  expect(result).toMatchObject({ status: "ready", netSales: "180", tax: "9", gross: "189", saleDocumentCount: 1, averageBasket: "180", complete: true, quantities: { piece: "2", kg: "0" } });
  expect(result.lines[0]).toMatchObject({ lineId: "L1", net: "180", tax: "9", gross: "189" });
});

test("recorded tax stays visible when the synthetic rate prediction differs", () => {
  const records = structuredClone(salesRecords);
  records.lines[0].sales!.tax = "10"; records.lines[0].sales!.gross = "190";
  const result = calculateSales(records, context);
  expect(result).toMatchObject({ netSales: "180", tax: "10", gross: "190", complete: false });
  expect(result.lines[0]).toMatchObject({ expectedTax: "9", recorded: { tax: "10", gross: "190" }, reconciled: false });
});

test("returns reduce net sales but not sale count or basket numerator, voids never deduct twice", async () => {
  const { journeyRecords } = await import("../helpers/sales-fixtures");
  const records = journeyRecords();
  records.documents.push({ ...records.documents[0], id: "VOID", sales: { ...records.documents[0].sales!, state: "void" } });
  const result = calculateSales(records, context);
  expect(result).toMatchObject({ netSales: "365", saleDocumentCount: 3, basketNumerator: "400", averageBasket: "133.33", quantities: { piece: "11", kg: "2" } });
  expect(result.exclusions).toEqual([{ documentId: "VOID", reason: "VOID" }]);
  expect(calculateSales({ ...records, documents: [...records.documents].reverse(), lines: [...records.lines].reverse() }, context)).toEqual(result);
});

test("conversion links count one consistent sale but conflicting amounts or ownership stay incomplete", () => {
  const records = structuredClone(salesRecords);
  records.documents.push({ ...structuredClone(records.documents[0]), id: "ORIGINAL", sales: { ...records.documents[0].sales!, state: "converted", convertedTo: "S1" } });
  records.lines.push({ ...structuredClone(records.lines[0]), id: "ORIGINAL-LINE", documentId: "ORIGINAL" });
  expect(calculateSales(records, context)).toMatchObject({ netSales: "180", saleDocumentCount: 1, complete: true, exclusions: [{ documentId: "ORIGINAL", reason: "CONVERTED" }] });
  records.lines[1].quantity = "3";
  expect(calculateSales(records, context)).toMatchObject({ netSales: "0", saleDocumentCount: 0, complete: false, exclusions: [{ documentId: "ORIGINAL", reason: "CONVERSION_CONFLICT" }, { documentId: "S1", reason: "CONVERSION_CONFLICT" }] });
});

test("unknown units and meanings exclude documents instead of claiming known zero, legacy mapping unavailable", () => {
  const records = structuredClone(salesRecords); records.lines[0].sales!.unit = "unknown";
  expect(calculateSales(records, context)).toMatchObject({ complete: false, exclusions: [{ documentId: "S1", reason: "UNKNOWN_MEANING" }], averageBasket: null });
  expect(calculateSales(salesRecords, { ...context, mappingVersion: "synthetic-relational-v1" }).status).toBe("unavailable");
});

test("duplicate conversion owners are excluded and cannot inflate a completed target", () => {
  const records = structuredClone(salesRecords);
  for (const id of ["A", "B"]) {
    records.documents.push({ ...structuredClone(records.documents[0]), id, sales: { ...records.documents[0].sales!, state: "converted", convertedTo: "S1" } });
    records.lines.push({ ...structuredClone(records.lines[0]), id: `${id}-line`, documentId: id });
  }
  expect(calculateSales(records, context)).toMatchObject({ netSales: "0", complete: false, exclusions: [{ documentId: "A", reason: "CONVERSION_CONFLICT" }, { documentId: "B", reason: "CONVERSION_CONFLICT" }, { documentId: "S1", reason: "CONVERSION_CONFLICT" }] });
});

test("two completed sales totaling 200 and a 50 return produce net 150 and basket 100", () => {
  const records = structuredClone(salesRecords); records.documents = []; records.lines = [];
  for (const [id, amount, kind] of [["S1", "100", "sale"], ["S2", "100", "sale"], ["R1", "-50", "customer-return"]] as const) {
    records.documents.push({ id, date: "2025-09-01", kind, supplierId: null, sales: { state: "completed", convertedTo: null, net: amount, tax: "0", gross: amount } });
    records.lines.push({ id: `${id}-line`, documentId: id, quantity: "1", net: amount, cost: null, sales: { ...salesRecords.lines[0].sales!, unitNet: kind === "sale" ? "100" : "50", discountRate: "0", taxRate: "0", tax: "0", gross: amount } });
  }
  const expected = calculateSales(records, context);
  expect(expected).toMatchObject({ netSales: "150", saleDocumentCount: 2, basketNumerator: "200", averageBasket: "100" });
  const original = process.env.TZ;
  try {
    for (const timezone of ["Pacific/Honolulu", "Europe/Istanbul", "Pacific/Kiritimati"]) { process.env.TZ = timezone; expect(calculateSales(records, context)).toEqual(expected); }
  } finally { if (original === undefined) delete process.env.TZ; else process.env.TZ = original; }
  expect(calculateSales({ documents: [], lines: [], suppliers: [] }, context)).toMatchObject({ status: "ready", complete: true, netSales: "0", saleDocumentCount: 0, averageBasket: null });
});
