import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { Expenses } from "../../src/expenses/import";
import { workbook, row } from "../helpers/expense-fixtures";
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
test("mixed rows reject the entire batch with safe column explanations and previews go stale", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store);
  for (const [index, replacement, explanation] of [[1, "31.02.2026", "Gider tarihi"], [5, "", "Net tutar"], [7, "51", "Brüt tutar"], [4, "PRIVATE_SENTINEL", "Sınıflandırma"], [8, "PRIVATE_SENTINEL", "KDV işlemi"], [9, "", "KDV kanıtı"]] as const) {
    const bad = [...row]; bad[index] = replacement;
    const preview = expenses.preview(await workbook([row, bad]));
    expect(preview.rows[1].errors.join()).toContain(explanation);
    expect(JSON.stringify(preview)).not.toContain("PRIVATE_SENTINEL");
    expect(() => expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] })).toThrow();
    expect(store.readSnapshot().pin.appRevision).toBe(0);
  }
  const preview = expenses.preview(await workbook([row]));
  store.appendRevision({ kind: "setting", entityId: "currency", value: { currency: "TRY", reason: "Updated", evidence: "test" } });
  expect(() => expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] })).toThrow();
  expect(store.expenseBatches()).toEqual([]);
  store.close();
});
