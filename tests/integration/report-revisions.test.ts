import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { ReportVersions } from "../../src/reports/versions";
import { businessPackage, businessRecords } from "../helpers/business-fixtures";

test("accepted monthly output preserves deleted source facts, app revisions and version explanations", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const first = versions.open({ period: "2025-09" });
    if (first.status !== "monthly") throw new Error("Expected monthly report");
    expect(first.report.purchasing.gross.coveredGrossProfit).toBe("40");
    expect(first.report.operating.result.value).toBeNull();
    versions.accept({ candidateId: first.report.id, previousAcceptedId: null, reason: "İlk inceleme" });
    const saved = versions.selected(first.report.id);
    const records = businessRecords(); records.documents = []; records.lines = [];
    store.appendRevision({ kind: "expense", entityId: "expense", value: { net: "50", date: "2025-09-01", reason: "Düzeltme", evidence: "synthetic-expense" } });
    store.importPackage(businessPackage(records, { extractionId: "deleted" }));
    const next = versions.open({ period: "2025-09" });
    if (next.status !== "monthly") throw new Error("Expected candidate");
    expect(versions.compare({ candidateId: next.report.id, acceptedId: saved.id }).changes.length).toBeGreaterThan(0);
    store.prune(versions.protectedDatasetIds());
    expect(versions.selected(saved.id)).toEqual(saved);
    expect(store.readPinned({ datasetId: saved.context.datasetId, appRevision: saved.context.appRevision }).records.lines.length).toBeGreaterThan(0);
    const restarted = new ReportVersions(store, new SalesReports(store));
    expect(restarted.selected(saved.id)).toEqual(saved);
    expect(restarted.list({ period: "2025-09" }).reports).toHaveLength(1);
  } finally { store.close(); }
});

test("cancellation during row persistence and before activation preserves the active pin without import failure", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage()); const before = store.readSnapshot();
    let checks = 0;
    expect(store.importPackage(businessPackage(undefined, { extractionId: "cancelled" }), { checkCancelled: () => { if (++checks === 4) throw new Error("CANCELLED"); } })).toEqual({ status: "cancelled" });
    expect(store.readSnapshot()).toEqual(before);
    expect(store.availability()).not.toHaveProperty("lastImportError");
    const stage = store.stage(businessPackage(undefined, { extractionId: "cancel-activation" }));
    if (stage.status !== "validated") throw new Error("Expected staged package");
    expect(store.activate(stage.id, { checkCancelled: () => { throw new Error("CANCELLED"); } })).toEqual({ status: "cancelled" });
    expect(store.readSnapshot()).toEqual(before);
  } finally { store.close(); }
});

test("accepted version survives disk reopen and compares expense corrections, source changes and retained older rules", async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { Expenses } = await import("../../src/expenses/import");
  const { workbook, row } = await import("../helpers/expense-fixtures");
  const directory = mkdtempSync(join(tmpdir(), "report-revisions-")), path = join(directory, "analytics.sqlite");
  let store = openStore(path);
  try {
    const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
    store.importPackage(businessPackage(records));
    const expenses = new Expenses(store), preview = expenses.preview(await workbook([[...row.slice(0, 1), "15.09.2025", "01.10.2025", ...row.slice(3)]]));
    expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
    store.confirmExpensesComplete({ period: "2025-09", reviewedRevision: 1, complete: true, reason: "Sentetik inceleme" });
    let versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" }); if (opened.status !== "monthly") throw new Error("Expected monthly");
    expect(opened.report.operating.result).toMatchObject({ value: "-10", expenses: "50", breakdown: { operatingExpense: "50", labour: "0" }, breakdownCoverage: { operatingExpense: "available", labour: "missing" } });
    versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Kayıt" });
    const saved = versions.selected(opened.report.id);
    expect(saved.appEvidence).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "confirmation", entityId: "expense-complete:2025-09" })]));
    const expense = expenses.query({ period: "2025-09" }).rows[0];
    if (!("format" in expense.value)) throw new Error("Expected expense-v1");
    const { fieldKeys } = await import("../../src/expenses/validation");
    const value = expense.value;
    const fields = Object.fromEntries(fieldKeys.map(key => [key, value[key as keyof typeof value]])) as import("../../src/expenses/contracts").ExpenseFields;
    store.changeExpense({ entityId: expense.entityId, expectedRevision: expense.revision, replacement: { ...fields, net: "60", gross: "60" }, reason: "Gider düzeltildi" });
    let candidate = versions.open({ period: "2025-09" }); if (candidate.status !== "monthly") throw new Error("Expected candidate");
    expect(candidate.report.operating.result).toMatchObject({ value: null, expenses: "60", reasons: ["EXPENSES_INCOMPLETE"] });
    expect(versions.compare({ candidateId: candidate.report.id, acceptedId: saved.id }).changes).toEqual(expect.arrayContaining([expect.objectContaining({ path: "operating.result.expenses", before: "50", after: "60", delta: "10" })]));
    records.documents[0].sales = { ...records.documents[0].sales!, net: "120", tax: "6", gross: "126" };
    records.lines[0].net = "120"; records.lines[0].sales = { ...records.lines[0].sales!, unitNet: "120", tax: "6", gross: "126" };
    store.importPackage(businessPackage(records, { extractionId: "corrected" }));
    candidate = versions.open({ period: "2025-09" }); if (candidate.status !== "monthly") throw new Error("Expected candidate");
    expect(candidate.report.sales.metrics.netSales).toBe("120");
    expect(versions.compare({ candidateId: candidate.report.id, acceptedId: saved.id }).changes).toEqual(expect.arrayContaining([expect.objectContaining({ path: "sales.metrics.netSales", before: "100", after: "120", delta: "20" })]));
    const older = structuredClone(saved); older.id = "archived-rule-v0"; older.calculations.sales = "synthetic-sales-calc-v0"; older.rules.artifact = "synthetic-rule-v0"; older.rules.conventions = ["Synthetic old rule: fixed test net-sales result 90"]; older.sales.metrics.netSales = "90";
    store.acceptReport({ id: older.id, pin: { datasetId: older.context.datasetId, appRevision: older.context.appRevision }, calculationVersion: "monthly-calc-v0", evidence: [older.rules.artifact], output: { report: older } });
    expect(versions.compare({ candidateId: candidate.report.id, acceptedId: older.id }).changes).toEqual(expect.arrayContaining([expect.objectContaining({ path: "calculations.sales", before: "synthetic-sales-calc-v0" }), expect.objectContaining({ path: "sales.metrics.netSales", before: "90", after: "120" })]));
    store.close(); store = openStore(path); versions = new ReportVersions(store, new SalesReports(store));
    expect(versions.selected(saved.id)).toEqual(saved);
    expect(versions.selected(older.id)).toEqual(older);
    expect(versions.list({ period: "2025-09" }).reports).toHaveLength(2);
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("selectable candidate survives pruning, mismatched periods cannot compare, and snapshots above 1 MiB are retained", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage()); const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" }); if (opened.status !== "monthly") throw new Error("Expected monthly");
    for (const extractionId of ["next-1", "next-2", "next-3"]) { store.prune(versions.protectedDatasetIds()); store.importPackage(businessPackage(undefined, { extractionId })); }
    expect(versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Eski aday incelendi" }).status).toBe("monthly");
    expect(versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Eski aday incelendi" }).status).toBe("monthly");
    const other = versions.open({ period: "2025-10" }); if (other.status !== "monthly") throw new Error("Expected monthly");
    expect(() => versions.compare({ candidateId: other.report.id, acceptedId: opened.report.id })).toThrow("INCOMPARABLE_REPORTS");
    const output = { evidence: "x".repeat(1024 * 1024 + 1) };
    store.acceptReport({ id: "large-output", pin: store.readPin(), calculationVersion: "fixture-v1", evidence: ["synthetic-large"], output });
    expect(store.readReport("large-output").output).toEqual(output);
  } finally { store.close(); }
});

test("acceptance rejects a stale predecessor without replacing review history", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const first = versions.open({ period: "2025-09" }); if (first.status !== "monthly") throw new Error("Expected report");
    versions.accept({ candidateId: first.report.id, previousAcceptedId: null, reason: "Birinci" });
    const next = versions.open({ period: "2025-09" }); if (next.status !== "monthly") throw new Error("Expected report");
    expect(() => versions.accept({ candidateId: next.report.id, previousAcceptedId: null, reason: "Eski inceleme" })).toThrow("REVIEW_CONFLICT");
    expect(versions.accept({ candidateId: next.report.id, previousAcceptedId: first.report.id, reason: "İkinci" }).status).toBe("monthly");
    expect(versions.list({ period: "2025-09" }).reports).toHaveLength(2);
  } finally { store.close(); }
});
