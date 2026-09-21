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
test("repeated legitimate rows have bounded duplicate evidence without losing explicit consent", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store);
  try {
    const count = 5000;
    const preview = expenses.preview(await workbook(Array.from({ length: count }, (_, index) => [`repeat-${index}`, ...row.slice(1)])));
    expect(preview.errors).toEqual([]);
    expect(preview.rows).toHaveLength(count);
    expect(preview.rows.every(candidate => candidate.duplicates.length <= 1)).toBe(true);
    expect(Buffer.byteLength(JSON.stringify(preview))).toBeLessThan(count * 1200);
    expect(preview.rows.filter(candidate => candidate.duplicates.length)).toHaveLength(count - 1);
    expect(() => expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] })).toThrow();
    expect(expenses.confirm({ previewId: preview.previewId, keepCandidateRows: preview.rows.slice(1).map(candidate => candidate.row) })).toMatchObject({ status: "imported", count });
    expect(expenses.query({ period: "2026-01" }).rows).toHaveLength(count);
  } finally { store.close(); }
});
test("bounded duplicate lookup still rejects repeated stock-loss evidence within and across batches", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store);
  try {
    const loss = [...row]; loss[4] = "inventory-loss"; loss[12] = "same-loss"; loss[13] = "separate";
    const another = [...loss]; another[0] = "loss-ref-2"; another[1] = "16.01.2026";
    const preview = expenses.preview(await workbook([loss, another]));
    expect(preview.rows[1].errors).toContain("Kayıp kanıtı başka bir kayıtta kullanılmış.");
    expect(() => expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] })).toThrow();
    const first = expenses.preview(await workbook([loss])); expenses.confirm({ previewId: first.previewId, keepCandidateRows: [] });
    expect(expenses.preview(await workbook([another])).rows[0].errors).toContain("Kayıp kanıtı başka bir kayıtta kullanılmış.");
  } finally { store.close(); }
});
