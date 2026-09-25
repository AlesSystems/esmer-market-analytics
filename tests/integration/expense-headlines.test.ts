import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { Expenses } from "../../src/expenses/import";
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
