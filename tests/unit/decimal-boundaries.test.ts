import { expect, test } from "vitest";
import { calculateSales } from "../../src/analytics/sales";
import { percentageChange, rounded } from "../../src/domain/money";
import { salesRecords } from "../helpers/sales-fixtures";
const context = { mappingVersion: "synthetic-sales-v1", from: "2025-09-01", to: "2025-09-30" };

test("decimal arithmetic preserves fractional quantity and price beyond binary precision", () => {
  const records = structuredClone(salesRecords);
  Object.assign(records.lines[0], { quantity: "0.000000000000001", net: "0.000000000000000000000000000001" });
  Object.assign(records.lines[0].sales!, { unitNet: "0.000000000000001", discountRate: "0", taxRate: "0", tax: "0", gross: "0.000000000000000000000000000001", unit: "kg" });
  expect(calculateSales(records, context)).toMatchObject({ netSales: "0.000000000000000000000000000001", quantities: { kg: "0.000000000000001", piece: "0" } });
  expect(rounded("1.005")).toBe("1.01"); expect(rounded("-1.005")).toBe("-1.01");
  expect(percentageChange("1", "0")).toBeNull(); expect(percentageChange("1", "-1")).toBeNull(); expect(percentageChange("2", "1")).toBe("100");
});

test("maximum legal line aggregation keeps low-order decimal digits", () => {
  const records = structuredClone(salesRecords);
  const template = records.lines[0];
  template.quantity = "1"; template.net = "99999999999999999999.999999999999999";
  Object.assign(template.sales!, { unitNet: template.net, discountRate: "0", taxRate: "0", tax: "0", gross: template.net });
  records.lines = Array.from({ length: 99_999 }, (_, index) => ({ ...template, id: `line-${index}` }));
  expect(calculateSales(records, context).netSales).toBe("9999899999999999999999999.999999999900001");
});

test("large sale and return cancellation preserves a tiny positive contribution", () => {
  const records = structuredClone(salesRecords); records.documents = []; records.lines = [];
  for (const [id, kind, quantity, unitNet, net] of [
    ["A", "sale", "99999999999999999999", "99999999999999999999", "9999999999999999999800000000000000000001"],
    ["B", "sale", "0.000000000000001", "0.000000000000001", "0.000000000000000000000000000001"],
    ["C", "customer-return", "99999999999999999999", "99999999999999999999", "-9999999999999999999800000000000000000001"],
  ] as const) {
    records.documents.push({ id, kind, date: "2025-09-01", supplierId: null, sales: { state: "completed", convertedTo: null, net, tax: "0", gross: net } });
    records.lines.push({ id: `${id}-line`, documentId: id, quantity, net, cost: null, sales: { ...salesRecords.lines[0].sales!, unitNet, discountRate: "0", taxRate: "0", tax: "0", gross: net } });
  }
  expect(calculateSales(records, context)).toMatchObject({ netSales: "0.000000000000000000000000000001", complete: true });
  records.lines.reverse(); records.documents.reverse();
  expect(calculateSales(records, context).netSales).toBe("0.000000000000000000000000000001");
});
