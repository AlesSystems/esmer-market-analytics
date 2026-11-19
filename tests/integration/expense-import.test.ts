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

test("the owner chooses which identical monthly bill receives the Excel details", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store);
  try {
    const fields = { period: "2026-01", category: "Kira", amount: "50,00" };
    const first = expenses.create({ action: "save-bill", requestId: "first-bill", fields });
    const second = expenses.create({ action: "save-bill", requestId: "second-bill", fields });
    if (first.status !== "saved" || second.status !== "saved") throw Error("Fixture bills not saved");
    store.confirmExpensesComplete({ period: fields.period, reviewedRevision: second.revision, complete: true, reason: "Synthetic review" });
    const before = store.readSnapshot();
    const bytes = await workbook([row]);
    const abandoned = expenses.preview(bytes);
    expect(store.readSnapshot()).toEqual(before);
    expect(expenses.cancelPreview({ previewId: abandoned.previewId })).toEqual({ status: "cancelled" });
    expect(() => expenses.confirm({ previewId: abandoned.previewId, keepCandidateRows: [], matches: [{ row: 2, entityId: second.entityId }] })).toThrow();
    const preview = expenses.preview(bytes);
    expect(preview.manualCandidates[preview.rows[0].matchKey!]).toMatchObject([
      { entityId: first.entityId, revision: first.revision, category: "Kira", period: "2026-01", amount: "50" },
      { entityId: second.entityId, revision: second.revision, category: "Kira", period: "2026-01", amount: "50" },
    ]);
    const matches = [{ row: 2, entityId: second.entityId }];
    expect(() => expenses.confirm({ previewId: abandoned.previewId, keepCandidateRows: [], matches })).toThrow();
    expect(() => expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] })).toThrow();
    expect(store.readSnapshot()).toEqual(before);
    expect(expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [], matches })).toMatchObject({ status: "imported", count: 1 });
    const current = expenses.query({ period: fields.period });
    expect(current).toMatchObject({ confirmation: "stale", incurred: "100", rows: [
      { entityId: first.entityId, value: { format: "manual-bill-v1" } },
      { entityId: second.entityId, value: { date: "2026-01-15", origin: { kind: "manual", requestId: "second-bill" }, attachment: { batchId: preview.batchId, row: 2 }, replacesRevision: second.revision } },
    ] });
    expect(store.readPinned(before.pin)).toEqual(before);
    const repeat = expenses.preview(bytes);
    expect(expenses.confirm({ previewId: repeat.previewId, keepCandidateRows: [] }).status).toBe("already-imported");
    const equivalent = expenses.preview(await workbook([Array(row.length).fill(null), row]));
    expect(equivalent.rows[0]).toMatchObject({ row: 3, alreadyPresent: true });
    expect(expenses.confirm({ previewId: equivalent.previewId, keepCandidateRows: [] })).toMatchObject({ status: "imported", count: 0 });
    expect(expenses.create({ action: "resolve", requestId: "second-bill" })).toMatchObject({ status: "already-saved", revision: second.revision });
  } finally { store.close(); }
});

test("same-bill selection is exclusive, stale or failed imports change nothing, and genuine peers stay separate", async () => {
  let fault = false, rowsWritten = 0;
  const store = openStore(":memory:", { fault: stage => { if (stage === "expense-row" && fault && ++rowsWritten === 2) throw Error("fixture write fault"); } });
  const expenses = new Expenses(store);
  try {
    const fields = { period: "2026-01", category: "Kira", amount: "50" };
    const bill = expenses.create({ action: "save-bill", requestId: "rent-bill", fields });
    const otherMonth = expenses.create({ action: "save-bill", requestId: "feb-rent-bill", fields: { ...fields, period: "2026-02" } });
    if (bill.status !== "saved" || otherMonth.status !== "saved") throw Error("Fixture bills not saved");
    const bytes = await workbook([row, ["another-bill", ...row.slice(1)]]);
    const preview = expenses.preview(bytes);
    expect(preview.manualCandidates[preview.rows[0].matchKey!].map(item => item.entityId)).toEqual([bill.entityId]);
    expect(() => expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [], matches: [2, 3].map(row => ({ row, entityId: bill.entityId })) })).toThrow();
    expect(() => expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [3], matches: [{ row: 2, entityId: otherMonth.entityId }] })).toThrow();
    store.appendRevision({ kind: "setting", entityId: "currency", value: { currency: "TRY", reason: "Synthetic update", evidence: "fixture" } });
    const before = store.readSnapshot(), generation = store.recoveryGeneration();
    const selection = { keepCandidateRows: [3], matches: [{ row: 2, entityId: bill.entityId }] };
    expect(() => expenses.confirm({ previewId: preview.previewId, ...selection })).toThrow();
    const retry = expenses.preview(bytes);
    fault = true;
    expect(() => expenses.confirm({ previewId: retry.previewId, ...selection })).toThrow("fixture write fault");
    expect(store.readSnapshot()).toEqual(before);
    expect(store.expenseBatches()).toEqual([]);
    expect(store.recoveryGeneration()).toEqual(generation);
    fault = false;
    expect(expenses.confirm({ previewId: retry.previewId, ...selection })).toMatchObject({ status: "imported", count: 2 });
    expect(expenses.query({ period: fields.period })).toMatchObject({ incurred: "100", rows: [
      { entityId: bill.entityId, value: { attachment: { batchId: retry.batchId, row: 2 } } },
      { value: { origin: { batchId: retry.batchId, row: 3 } } },
    ] });
  } finally { store.close(); }
});

test("many workbook rows can share one selectable candidate set without repeating its payload", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store);
  try {
    const fields = { period: "2026-01", category: "Kira", amount: "50" };
    for (let i = 0; i < 20; i++) expect(expenses.create({ action: "save-bill", requestId: `bill-${i}`, fields }).status).toBe("saved");
    const preview = expenses.preview(await workbook(Array.from({ length: 100 }, (_, index) => [`ref-${index}`, ...row.slice(1)])));
    expect(preview.rows).toHaveLength(100);
    const matchKeys = [...new Set(preview.rows.map(row => row.matchKey))];
    expect(matchKeys).toHaveLength(1);
    expect(preview.manualCandidates[matchKeys[0]!]).toHaveLength(20);
    expect(Buffer.byteLength(JSON.stringify(preview))).toBeLessThan(120_000);
  } finally { store.close(); }
});
