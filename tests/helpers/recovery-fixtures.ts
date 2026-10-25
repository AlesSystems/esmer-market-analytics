import { expect } from "vitest";
import type { openStore } from "../../src/store/store";
import { Expenses } from "../../src/expenses/import";
import { fieldKeys } from "../../src/expenses/validation";
import type { ExpenseFields } from "../../src/expenses/contracts";
import { businessPackage, businessRecords } from "./business-fixtures";
import { workbook, row } from "./expense-fixtures";

export async function populateRecoveryStore(store: ReturnType<typeof openStore>) {
  const records = businessRecords();
  records.documents = [records.documents[0]];
  records.lines = [records.lines[0]];
  expect(store.importPackage(businessPackage(records)).status).toBe("active");
  const expenses = new Expenses(store);
  const preview = expenses.preview(await workbook([[row[0], "15.09.2025", "01.10.2025", ...row.slice(3)]]));
  expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
  const original = expenses.query({ period: "2025-09" }).rows[0];
  if (!("format" in original.value)) throw new Error("Expected imported expense");
  const value = original.value;
  const fields = Object.fromEntries(fieldKeys.map(key => [key, value[key as keyof typeof value]])) as ExpenseFields;
  store.changeExpense({ entityId: original.entityId, expectedRevision: original.revision, replacement: { ...fields, net: "60", gross: "60" }, reason: "Sentetik kira düzeltmesi" });
  store.confirmExpensesComplete({ period: "2025-09", reviewedRevision: store.readPin().appRevision, complete: true, reason: "Sentetik tamlık onayı" });
  store.appendRevision({ kind: "setting", entityId: "currency", value: { currency: "TRY", evidence: "fixture:recovery", reason: "Sentetik ayar" } });
  const target = { datasetId: store.readPin().datasetId!, kind: "line" as const, sourceId: records.lines[0].id };
  store.appendRevision({ kind: "adjustment", entityId: "adjustment-1", value: { net: "5", target, reversed: false, evidence: "fixture:adjustment", reason: "Sentetik düzeltme" } });
  store.appendRevision({ kind: "adjustment", entityId: "adjustment-1", value: { net: "5", target, reversed: true, evidence: "fixture:adjustment", reason: "Sentetik geri alma" } });
  expect(expenses.query({ period: "2025-09" }).rows).toHaveLength(1);
  const changed = businessRecords(); changed.documents = []; changed.lines = [];
  expect(store.importPackage(businessPackage(changed, { extractionId: "recovery-deletion" })).status).toBe("active");
  const pin = store.readPin();
  return { datasetId: pin.datasetId!, appRevision: pin.appRevision, expenses: expenses.query({ period: "2025-09" }) };
}
