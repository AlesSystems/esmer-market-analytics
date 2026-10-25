import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { Expenses } from "../../src/expenses/import";
import type { ExpenseValue } from "../../src/expenses/contracts";
import { workbook, row } from "../helpers/expense-fixtures";

const change = (reference: string, fields: Record<number, string | null>) => Object.assign([...row], { 0: reference }, fields);

test("expense headlines use classified incurred costs, not gross cash movements", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store);
  try {
    const preview = expenses.preview(await workbook([
      change("rent", { 5: "50", 6: "10", 7: "60", 8: "recoverable" }),
      change("labour", { 3: "İşçilik", 4: "labour", 5: "20", 7: "20", 11: "2026-01" }),
      change("owner", { 4: "owner-contribution", 5: "500", 7: "500" }),
      change("included-loss", { 4: "inventory-loss", 5: "30", 7: "30", 12: "loss-1", 13: "already-in-cost" }),
      change("separate-loss", { 4: "inventory-loss", 5: "7", 7: "7", 12: "loss-2", 13: "separate" }),
    ]));
    expect(preview.rows.every(item => item.errors.length === 0)).toBe(true);
    expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
    expect(expenses.query({ period: "2026-01" })).toMatchObject({
      incurred: "617", payments: "0", complete: false,
      summary: { expenses: "77", coverage: "available", labour: "20", labourCoverage: "available", reasons: [] },
    });
    expect(expenses.query({ period: "2026-02" })).toMatchObject({
      incurred: "0", payments: "617", complete: false,
      summary: { expenses: null, coverage: "missing", labour: null, labourCoverage: "missing" },
    });
  } finally { store.close(); }
});

test("missing and uncertain expense evidence stays distinct from documented zero", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store);
  try {
    expect(expenses.query({ period: "2026-01" })).toMatchObject({ summary: { expenses: null, coverage: "missing", labour: null } });
    const preview = expenses.preview(await workbook([
      change("known-labour", { 4: "labour", 5: "20", 7: "20", 11: "2026-01" }),
      change("unknown-rent", { 8: "unknown", 9: null }),
    ]));
    expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
    expect(expenses.query({ period: "2026-01" })).toMatchObject({ summary: { expenses: null, coverage: "incomplete", labour: "20", labourCoverage: "available", reasons: ["UNKNOWN_TAX"] } });
    store.appendRevision({ kind: "confirmation", entityId: "expense-complete:2026-03", value: { period: "2026-03", reviewedRevision: 0, complete: true, reason: "Sentetik inceleme", evidence: "test" } });
    expect(expenses.query({ period: "2026-03" })).toMatchObject({ complete: true, summary: { expenses: "0", coverage: "available", labour: null } });
  } finally { store.close(); }
});

test("the period view groups counted expenses, names blocking lines and marks a stale confirmation", async () => {
  const store = openStore(":memory:"), expenses = new Expenses(store);
  try {
    const preview = expenses.preview(await workbook([
      change("rent", { 5: "50", 7: "50" }),
      change("power", { 3: "Elektrik", 5: "30", 7: "30" }),
      change("staff", { 3: "Personel", 4: "labour", 5: "20", 7: "20", 11: "2026-01" }),
    ]));
    expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
    let view = expenses.query({ period: "2026-01" });
    expect(view).toMatchObject({ confirmation: "none", attention: [], groups: [{ key: "staff", amount: "20", count: 1 }, { key: "rent", amount: "50", count: 1 }, { key: "utilities", amount: "30", count: 1 }, { key: "other", amount: "0", count: 0 }] });
    store.confirmExpensesComplete({ period: "2026-01", reviewedRevision: view.expenseRevision, complete: true, reason: "Bu ayın giderleri tamam" });
    expect(expenses.query({ period: "2026-01" })).toMatchObject({ confirmation: "current", complete: true });
    const power = view.rows.find(item => "category" in item.value && item.value.category === "Elektrik")!;
    const value = power.value as ExpenseValue;
    store.changeExpense({ entityId: power.entityId, expectedRevision: power.revision, reason: "KDV belirsiz", replacement: { date: value.date, paymentDate: value.paymentDate, category: value.category, classification: value.classification, net: value.net, tax: value.tax, gross: value.gross, taxTreatment: "unknown", taxEvidence: null, supportingReference: value.supportingReference, sourceReference: value.sourceReference, labourPeriod: null, loss: null } });
    view = expenses.query({ period: "2026-01" });
    expect(view).toMatchObject({ confirmation: "stale", complete: false, attention: [{ entityId: power.entityId, category: "Elektrik", reason: "unknownTax" }] });
    expect(view.groups.find(group => group.key === "utilities")).toEqual({ key: "utilities", amount: null, count: 1 });
  } finally { store.close(); }
});
