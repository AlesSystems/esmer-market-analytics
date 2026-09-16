import { expect, test } from "vitest";
import Decimal from "decimal.js";
import { readSheet } from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";
import { getAvailability } from "../../src/service/operations";
test("locked decimal and Excel dependencies preserve synthetic values", async () => {
  expect(new Decimal("0.1").plus("0.2").toString()).toBe("0.3");
  const file = await writeXlsxFile([
    [{ type: String, value: "Tutar" }],
    [{ type: Number, value: 123.45 }],
  ]).toBuffer();
  expect(await readSheet(file, { parseNumber: (value) => value })).toEqual([
    ["Tutar"],
    ["123.45"],
  ]);
});
test("local SQLite can start empty without a source connection", () => {
  expect(getAvailability()).toEqual({
    status: "ready",
    store: "empty",
    liveConnection: "disabled",
  });
});
