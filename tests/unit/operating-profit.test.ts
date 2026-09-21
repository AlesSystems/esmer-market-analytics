import { expect, test } from "vitest";
import { calculateOperatingResult } from "../../src/analytics/operating";
import type { ExpenseValue } from "../../src/expenses/contracts";
import type { GrossResult } from "../../src/analytics/costs";
const expense: ExpenseValue = { format: "expense-v1", date: "2026-01-15", paymentDate: "2026-02-01", category: "Kira", classification: "operating-expense", net: "50", tax: "0", gross: "50", taxTreatment: "non-recoverable", taxEvidence: "tax-1", supportingReference: "bill-1", sourceReference: null, labourPeriod: null, loss: null, origin: { batchId: "batch-1", row: 2 }, reason: "İçe aktarıldı", evidence: "batch-1", replacesRevision: null, voided: false };
const gross: GrossResult = { status: "ready", confidence: "estimated", method: "historical-last-purchase-estimate", coveredSales: "300", coveredCost: "100", coveredGrossProfit: "200", coveredMarginPercent: null, costCoveragePercent: "100", covered: [], excluded: [], exposures: { coveredSales: "300", coveredReturns: "0", excludedSales: "0", excludedReturns: "0" }, warnings: [] };
const input = () => ({ gross, salesReconciled: true, periodCoverageComplete: true, period: "2026-01", expenses: [{ kind: "expense" as const, entityId: "expense-1", revision: 1, value: expense }], confirmation: { kind: "confirmation" as const, entityId: "complete-2026-01", revision: 2, value: { period: "2026-01", reviewedRevision: 1, complete: true, reason: "İncelendi", evidence: "owner" } }, expenseRevision: 1 });
test("literal oracle and G05 keep incurred expenses separate from payment cash", () => {
  const i = input();
  i.expenses.push({ kind: "expense", entityId: "owner", revision: 1, value: { ...expense, classification: "owner-contribution", net: "500", gross: "500" } });
  expect(calculateOperatingResult(i)).toMatchObject({ status: "estimated", value: "150", expenses: "50", payments: "0" });
  expect(calculateOperatingResult({ ...i, period: "2026-02" })).toMatchObject({ expenses: "0", payments: "550" });
});
test("G06 and unsupported prerequisite evidence withhold the headline", () => {
  const i = input();
  expect(calculateOperatingResult({ ...i, confirmation: null }).headline).toBe("Faaliyet kârı hesaplanamıyor — gider verileri eksik.");
  for (const patch of [{ salesReconciled: false }, { periodCoverageComplete: false }, { expenseRevision: 3 }, { gross: { ...gross, excluded: [{ net: "0.00001" } as GrossResult["excluded"][number]] } }]) expect(calculateOperatingResult({ ...i, ...patch }).value).toBeNull();
  for (const patch of [{ taxTreatment: "unknown" as const }, { classification: "unclassified" as const }]) expect(calculateOperatingResult({ ...i, expenses: [{ ...i.expenses[0], value: { ...expense, ...patch } }] }).value).toBeNull();
});
test("classifications, KDV basis, loss recognition and legacy evidence remain explicit", () => {
  const i = input();
  for (const classification of ["asset-purchase", "taxes", "financing-loan", "owner-contribution", "owner-withdrawal", "transfer"] as const) {
    const result = calculateOperatingResult({ ...i, expenses: [{ ...i.expenses[0], value: { ...expense, classification, net: "500", gross: "500" } }] });
    expect(result).toMatchObject({ status: "estimated", value: "200", expenses: "0", excluded: [{ classification, amount: "500" }] });
  }
  for (const [taxTreatment, expected] of [["recoverable", "150"], ["non-recoverable", "140"]] as const) {
    expect(calculateOperatingResult({ ...i, expenses: [{ ...i.expenses[0], value: { ...expense, tax: "10", gross: "60", taxTreatment } }] }).value).toBe(expected);
  }
  expect(calculateOperatingResult({ ...i, expenses: [{ ...i.expenses[0], value: { ...expense, classification: "labour", labourPeriod: "2026-01" } }] }).value).toBe("150");
  for (const [recognition, expected] of [["separate", "150"], ["already-in-cost", "200"]] as const) {
    const loss = { ...i.expenses[0], value: { ...expense, classification: "inventory-loss" as const, loss: { evidence: "loss-1", recognition } } };
    expect(calculateOperatingResult({ ...i, expenses: [loss] }).value).toBe(expected);
    expect(calculateOperatingResult({ ...i, expenses: [loss, { ...loss, entityId: "duplicate" }] }).value).toBeNull();
  }
  expect(calculateOperatingResult({ ...i, expenses: [{ ...i.expenses[0], value: { date: expense.date, net: "50", reason: "Legacy", evidence: "legacy" } }] }).reasons).toContain("LEGACY_EXPENSE");
  expect(calculateOperatingResult({ ...i, confirmation: { ...i.confirmation, value: { ...i.confirmation.value, complete: false } } }).value).toBeNull();
});
