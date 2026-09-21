import writeXlsxFile from "write-excel-file/node";
import { expenseColumns } from "../../src/expenses/template";
export async function workbook(rows: (string | number | null)[][]) {
  return writeXlsxFile([expenseColumns.map(value => ({ type: String, value })), ...rows.map(row => row.map(value => (value === null ? null : typeof value === "number" ? { type: Number, value } : { type: String, value }))) ]).toBuffer();
}
export const row = ["ref-1", "15.01.2026", "01.02.2026", "Kira", "operating-expense", "50,00", "0", "50", "non-recoverable", "tax-1", "bill-1", null, null, null];
