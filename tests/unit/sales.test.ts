import { expect, test } from "vitest";
import { calculateSales } from "../../src/analytics/sales";
import { salesRecords } from "../helpers/sales-fixtures";

const context = { mappingVersion: "synthetic-sales-v1", from: "2025-09-01", to: "2025-09-30" } as const;
test("G01 derives net180 tax9 gross189 from two100 units and10percent discount", () => {
  const result = calculateSales(salesRecords, context);
  expect(result).toMatchObject({ status: "ready", netSales: "180", tax: "9", gross: "189", saleDocumentCount: 1, averageBasket: "180", complete: true, quantities: { piece: "2", kg: "0" } });
  expect(result.lines[0]).toMatchObject({ lineId: "L1", net: "180", tax: "9", gross: "189" });
});
