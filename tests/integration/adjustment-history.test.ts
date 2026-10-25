import { expect, test, vi } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { Expenses } from "../../src/expenses/import";
import { isExpense, fieldKeys } from "../../src/expenses/validation";
import type { ExpenseFields } from "../../src/expenses/contracts";
import { businessPackage, businessRecords } from "../helpers/business-fixtures";
import { workbook, row } from "../helpers/expense-fixtures";
import { handleRequest } from "../../src/desktop/requests";
function fields(value: object): ExpenseFields { return Object.fromEntries(fieldKeys.map(k => [k, value[k as keyof typeof value]])) as unknown as ExpenseFields; }
test("reasoned corrections, reversal and restore append immutable versions and invalidate both moved periods", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store), preview = expenses.preview(await workbook([row]));
  expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
  const january = expenses.query({ period: "2026-01" }), original = january.rows[0];
  store.confirmExpensesComplete({ period: "2026-01", reviewedRevision: january.expenseRevision, complete: true, reason: "İncelendi" });
  store.confirmExpensesComplete({ period: "2026-02", reviewedRevision: 0, complete: true, reason: "İncelendi" });
  const pin = store.readSnapshot();
  expect(() => store.changeExpense({ entityId: original.entityId, expectedRevision: original.revision, replacement: fields(original.value), reason: "" })).toThrow();
  const changed = store.changeExpense({ entityId: original.entityId, expectedRevision: original.revision, replacement: { ...fields(original.value), date: "2026-02-15" }, reason: "Dönem düzeltildi" });
  expect(expenses.query({ period: "2026-01" }).complete).toBe(false);
  expect(expenses.query({ period: "2026-02" }).complete).toBe(false);
  expect(() => store.confirmExpensesComplete({ period: "2026-01", reviewedRevision: january.expenseRevision, complete: true, reason: "Eski ekran" })).toThrow();
  expect(() => store.changeExpense({ entityId: original.entityId, expectedRevision: original.revision, restoreRevision: null, reason: "Eski ekran" })).toThrow();
  const voided = store.changeExpense({ entityId: original.entityId, expectedRevision: changed, restoreRevision: null, reason: "İptal" });
  expect(expenses.query({ period: "2026-02" }).incurred).toBe("0");
  store.changeExpense({ entityId: original.entityId, expectedRevision: voided, restoreRevision: original.revision, reason: "Özgün sürüme dönüş" });
  expect(expenses.query({ period: "2026-01" }).incurred).toBe("50");
  expect(store.revisionHistory()).toHaveLength(4);
  expect(store.revisionHistory()[0]).toEqual(original);
  expect(store.readPinned(pin.pin)).toEqual(pin);
  store.close();
});
test("failed mid-batch write rolls back history and ledger; successful retry survives restart", async () => {
  const directory = mkdtempSync(join(tmpdir(), "expense-rollback-")), path = join(directory, "store.sqlite"); let fail = true;
  let store = openStore(path, { fault: boundary => { if (boundary === "expense-row" && fail) throw new Error("synthetic interruption"); } });
  try {
    const expenses = new Expenses(store), bytes = await workbook([row, ["ref-2", ...row.slice(1)]]), p = expenses.preview(bytes);
    expect(() => expenses.confirm({ previewId: p.previewId, keepCandidateRows: [3] })).toThrow();
    expect(store.revisionHistory()).toEqual([]); expect(store.expenseBatches()).toEqual([]);
    fail = false; expenses.confirm({ previewId: p.previewId, keepCandidateRows: [3] });
    const snapshot = store.readSnapshot(); store.close(); store = openStore(path);
    expect(store.readSnapshot()).toEqual(snapshot);
    expect(new Expenses(store).preview(bytes).alreadyImported).toBe(true);
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});
test("accepted results and expense completeness stay pinned across edits and source refresh", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store);
  const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
  store.importPackage(businessPackage(records));
  const p = expenses.preview(await workbook([[...row.slice(0, 1), "15.09.2025", "01.10.2025", ...row.slice(3)]]));
  expenses.confirm({ previewId: p.previewId, keepCandidateRows: [] });
  store.confirmExpensesComplete({ period: "2025-09", reviewedRevision: 1, complete: true, reason: "İncelendi" });
  const result = { status: "estimated", expenses: expenses.query({ period: "2025-09" }).rows.length };
  store.acceptReport({ id: "accepted-expense", pin: store.readSnapshot().pin, calculationVersion: "synthetic-v1", evidence: ["synthetic-acceptance"], output: { result } });
  const original = expenses.query({ period: "2025-09" }).rows[0];
  store.changeExpense({ entityId: original.entityId, expectedRevision: original.revision, replacement: { ...fields(original.value), date: "2025-10-15" }, reason: "Dönem değişti" });
  store.importPackage(businessPackage(records, { extractionId: "business-next" }));
  expect(store.readReport("accepted-expense").output).toEqual({ result: result });
  expect(expenses.query({ period: "2025-09" }).complete).toBe(false);
  store.close();
});
test("schema v4 legacy evidence migrates unchanged and remains an unsupported expense", () => {
  const directory = mkdtempSync(join(tmpdir(), "expense-v4-")), path = join(directory, "store.sqlite"); let store = openStore(path, { schemaVersion: 4 });
  try {
    store.appendRevision({ kind: "expense", entityId: "legacy", value: { date: "2026-01-01", net: "50", reason: "Legacy", evidence: "legacy" } });
    const original = store.readSnapshot(); store.close(); store = openStore(path);
    expect(store.readSnapshot()).toEqual(original);
    expect(isExpense(new Expenses(store).query({ period: "2026-01" }).rows[0].value)).toBe(false);
    expect(store.expenseBatches()).toEqual([]);
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});
test("every expense IPC checks sender and exact payload before service or native dialog", async () => {
  const service = vi.fn().mockResolvedValue({ status: "saved" }), availability = vi.fn();
  const operations: Record<string, unknown> = { saveExpenseTemplate: null, previewExpenses: null, confirmExpenses: { previewId: "preview", keepCandidateRows: [] }, queryExpenses: { period: "2026-01" }, correctExpense: {}, restoreExpense: { entityId: "record", expectedRevision: 1, restoreRevision: null, reason: "İptal" }, confirmExpenseCompleteness: { period: "2026-01", reviewedRevision: 0, complete: true, reason: "İncelendi" } };
  for (const [operation, payload] of Object.entries(operations)) {
    expect(await handleRequest(false, operation, payload, availability, undefined, service)).toMatchObject({ code: "UNTRUSTED_SENDER" });
    expect(await handleRequest(true, operation, { ...(payload ?? {}), sql: "SELECT 1" }, availability, undefined, service)).toMatchObject({ code: "INVALID_PAYLOAD" });
  }
  expect(service).not.toHaveBeenCalled();
  for (const [operation, payload] of Object.entries(operations).filter(([operation]) => operation !== "correctExpense")) expect(await handleRequest(true, operation, payload, availability, undefined, service)).toEqual({ status: "saved" });
});
test("loss evidence cannot be duplicated by correction or restoration across periods", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store);
  const loss = [...row]; loss[4] = "inventory-loss"; loss[12] = "loss-evidence"; loss[13] = "separate";
  const second = [...row]; second[0] = "ref-2"; second[1] = "15.02.2026";
  const p = expenses.preview(await workbook([loss, second])); expenses.confirm({ previewId: p.previewId, keepCandidateRows: [] });
  const first = expenses.query({ period: "2026-01" }).rows[0], other = expenses.query({ period: "2026-02" }).rows.find(record => record.entityId !== first.entityId)!;
  expect(() => store.changeExpense({ entityId: other.entityId, expectedRevision: other.revision, replacement: { ...fields(other.value), classification: "inventory-loss", loss: { evidence: "loss-evidence", recognition: "separate" } }, reason: "Tekrar kayıp" })).toThrow();
  const voided = store.changeExpense({ entityId: first.entityId, expectedRevision: first.revision, restoreRevision: null, reason: "İptal" });
  store.changeExpense({ entityId: other.entityId, expectedRevision: other.revision, replacement: { ...fields(other.value), classification: "inventory-loss", loss: { evidence: "loss-evidence", recognition: "separate" } }, reason: "Doğru dönem" });
  expect(() => store.changeExpense({ entityId: first.entityId, expectedRevision: voided, restoreRevision: first.revision, reason: "Eski döneme dönüş" })).toThrow();
  store.close();
});
