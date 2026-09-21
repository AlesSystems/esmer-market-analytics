import { expect, test } from "vitest";
import writeXlsxFile from "write-excel-file/node";
import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { expenseColumns } from "../../src/expenses/template";
import { readExpenseWorkbook } from "../../src/expenses/workbook";

async function workbook() {
  return writeXlsxFile([
    expenseColumns.map(value => ({ type: String, value })),
    [{ type: String, value: "reference-1" }, { type: String, value: "15.01.2026" }, null, null, null, { type: Number, value: 50 }],
  ]).toBuffer();
}
function change(bytes: Uint8Array, path: string, edit: (xml: string) => string) {
  const files = unzipSync(bytes);
  const original = strFromU8(files[path]), modified = edit(original);
  expect(modified).not.toBe(original);
  files[path] = strToU8(modified);
  return zipSync(files);
}

test("rejects ambiguous financial cells rather than selecting the first stored value", async () => {
  const bytes = await workbook();
  expect(readExpenseWorkbook(bytes)[0][5].value).toBe("50");
  const repeated = change(bytes, "xl/worksheets/sheet1.xml", xml => xml.replace('<v>50</v>', '<v>50</v><v>500</v>'));
  expect(() => readExpenseWorkbook(repeated)).toThrow();
});

test("rejects invalid archive endings, external targets and duplicate worksheet relationships", async () => {
  const bytes = await workbook();
  expect(() => readExpenseWorkbook(bytes.subarray(0, bytes.length - 22))).toThrow();
  const external = change(bytes, "xl/_rels/workbook.xml.rels", xml => xml.replace('Target="worksheets/sheet1.xml"', 'Target="worksheets/sheet1.xml" TargetMode="External"'));
  expect(() => readExpenseWorkbook(external)).toThrow();
  const ambiguous = change(bytes, "xl/_rels/workbook.xml.rels", xml => xml.replace(/(<Relationship\s[^>]*Type="[^"]*\/worksheet"[^>]*\/>)/, '$1$1'));
  expect(() => readExpenseWorkbook(ambiguous)).toThrow();
});
