import { expect, test } from "vitest";
import { zipSync, unzipSync, strFromU8, strToU8 } from "fflate";
import writeXlsxFile from "write-excel-file/node";
import { expenseColumns } from "../../src/expenses/template";
import { dateCell, decimalCell, readExpenseWorkbook } from "../../src/expenses/workbook";
const cell = (value: string, numeric = false, date1904 = false) => ({ value, numeric, date1904 });
async function file() { return writeXlsxFile([expenseColumns.map(value => ({ type: String, value })), [{ type: String, value: "reference" }]]).toBuffer(); }
function mutate(bytes: Uint8Array, path: string, update: (xml: string) => string) { const files = unzipSync(bytes); files[path] = strToU8(update(strFromU8(files[path]))); return zipSync(files); }
test("Turkish decimal text, numeric precision, UTC dates and both Excel epochs", () => {
  expect(decimalCell(cell("1.234,567"))).toBe("1234.567");
  expect(decimalCell(cell("1.234", true))).toBe("1.234");
  expect(decimalCell(cell("1.234"))).toBe("1234");
  expect(dateCell(cell("29.02.2024"))).toBe("2024-02-29");
  expect(dateCell(cell("61", true))).toBe("1900-03-01");
  expect(dateCell(cell("0", true, true))).toBe("1904-01-01");
  for (const value of ["60", "1.5", "-1"]) expect(() => dateCell(cell(value, true))).toThrow();
  for (const value of ["29.02.2026", "31.04.2026"]) expect(() => dateCell(cell(value))).toThrow();
  for (const value of ["1,234.50", "1.23", "", "-50"]) expect(() => decimalCell(cell(value))).toThrow();
});
test("canonical writer roundtrip and rejection of formula caches, payroll columns and invalid containers", async () => {
  const bytes = await file();
  expect(readExpenseWorkbook(bytes)[0][0].value).toBe("reference");
  for (const formula of ["<f>SUM(A1)</f><v>50</v>", "<f t=\"shared\" si=\"0\"/>", "<f t=\"array\">1</f>"]) {
    expect(() => readExpenseWorkbook(mutate(bytes, "xl/worksheets/sheet1.xml", xml => xml.replace("</c>", formula + "</c>")))).toThrow();
  }
  expect(() => readExpenseWorkbook(mutate(bytes, "xl/worksheets/sheet1.xml", xml => xml.replace("<sheetData>", "<!DOCTYPE x [<!ENTITY z 'secret'>]><sheetData>")))).toThrow();
  expect(() => readExpenseWorkbook(mutate(bytes, "xl/sharedStrings.xml", xml => xml.replace("Kayıt referansı", "Personel adı PRIVATE_SENTINEL")))).toThrow();
  expect(() => readExpenseWorkbook(mutate(bytes, "xl/_rels/workbook.xml.rels", xml => xml.replace("worksheets/sheet1.xml", "worksheets/sheet2.xml")))).toThrow();
  expect(() => readExpenseWorkbook(new Uint8Array([1, 2, 3]))).toThrow();
});
