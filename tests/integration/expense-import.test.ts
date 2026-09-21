import { expect, test } from "vitest";
import writeXlsxFile from "write-excel-file/node";
import { openStore } from "../../src/store/store";
import { Expenses } from "../../src/expenses/import";
import { expenseColumns } from "../../src/expenses/template";
export async function workbook(rows: (string | number | null)[][]) {
  return writeXlsxFile([expenseColumns.map(value => ({ type: String, value })), ...rows.map(row => row.map(value => (value === null ? null : typeof value === "number" ? { type: Number, value } : { type: String, value }))) ]).toBuffer();
}
export const row = ["ref-1", "15.01.2026", "01.02.2026", "Kira", "operating-expense", "50,00", "0", "50", "non-recoverable", "tax-1", "bill-1", null, null, null];
test("preview is read-only, confirmation is atomic and exact replay is idempotent", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store), bytes = await workbook([row]);
  const preview = expenses.preview(bytes);
  expect(preview.rows[0].errors).toEqual([]);
  expect(store.readSnapshot().pin.appRevision).toBe(0);
  expect(expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] })).toMatchObject({ status: "imported", count: 1 });
  expect(expenses.query({ period: "2026-01" })).toMatchObject({ incurred: "50", payments: "0", complete: false });
  expect(expenses.query({ period: "2026-02" })).toMatchObject({ incurred: "0", payments: "50" });
  expect(new Expenses(store).preview(bytes).alreadyImported).toBe(true);
  const repeat = expenses.preview(bytes);
  expect(expenses.confirm({ previewId: repeat.previewId, keepCandidateRows: [] }).status).toBe("already-imported");
  expect(store.readSnapshot().pin.appRevision).toBe(1);
  store.close();
});
test("date/amount duplicates need explicit keep, conflicting references cannot overwrite", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store);
  const p = expenses.preview(await workbook([row, [null, ...row.slice(1)]]));
  expect(p.rows[1].duplicates.length).toBeGreaterThan(0);
  expect(() => expenses.confirm({ previewId: p.previewId, keepCandidateRows: [] })).toThrow();
  expect(store.readSnapshot().pin.appRevision).toBe(0);
  expenses.confirm({ previewId: p.previewId, keepCandidateRows: [3] });
  const conflict = expenses.preview(await workbook([[...row.slice(0, 5), "60", "0", "60", ...row.slice(8)]]));
  expect(conflict.rows[0].errors.length).toBeGreaterThan(0);
  expect(() => expenses.confirm({ previewId: conflict.previewId, keepCandidateRows: [] })).toThrow();
  expect(store.readSnapshot().app).toHaveLength(2);
  store.close();
});
