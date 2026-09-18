import { expect, test } from "vitest";
import Decimal from "decimal.js";
import { readSheet } from "read-excel-file/node";
import writeXlsxFile from "write-excel-file/node";
import { openStore } from "../../src/store/store";
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
  const store = openStore(":memory:");
  expect(store.availability()).toEqual({
    status: "ready",
    store: "empty",
    liveConnection: "disabled",
  });
  store.close();
});
