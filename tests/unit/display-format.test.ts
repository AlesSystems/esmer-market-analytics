import { expect, test } from "vitest";
import { decimal, money, percent, quantity } from "../../src/ui/format";
import { percentText } from "../../src/ui/pages/month-summary";

test("readable Turkish amounts, quantities and percentages round to at most two decimal places", () => {
  expect(money("480.006")).toBe("480,01 ₺");
  expect(money("5")).toBe("5,00 ₺");
  expect(decimal("123456789012345678901234567890.995")).toBe("123.456.789.012.345.678.901.234.567.891");
  expect(quantity({ piece: "2", kg: "1.2345" })).toBe("2 adet · 1,23 kg");
  expect(percent("98.765")).toBe("%98,77");
  expect(percentText("-1.235")).toBe("-%1,24");
  expect(percentText("13.00")).toBe("%13,00");
});
