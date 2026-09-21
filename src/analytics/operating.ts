import { Exact, sum } from "../domain/money";
import type { GrossResult } from "./costs";
import type { AppRecord } from "../store/revisions";
import type { OperatingResult } from "../expenses/contracts";
import { isExpense } from "../expenses/validation";
export const OPERATING_CALCULATION_VERSION = "synthetic-operating-calc-v1";
export function calculateOperatingResult(input: { gross: GrossResult; salesReconciled: boolean; periodCoverageComplete: boolean; period: string; expenses: AppRecord[]; confirmation: AppRecord | null; expenseRevision: number }): OperatingResult {
  const reasons: string[] = [], amounts: string[] = [], payments: string[] = [], excluded: OperatingResult["excluded"] = [];
  const confirmation = input.confirmation;
  if (confirmation?.kind !== "confirmation" || !confirmation.value.complete || confirmation.value.period !== input.period || confirmation.value.reviewedRevision !== input.expenseRevision) reasons.push("EXPENSES_INCOMPLETE");
  if (input.gross.status !== "ready" || input.gross.excluded.length || !input.salesReconciled || !input.periodCoverageComplete) reasons.push("GROSS_INCOMPLETE");
  const losses = new Set<string>();
  for (const record of input.expenses) {
    if (record.kind !== "expense") continue;
    const v = record.value;
    if (!isExpense(v)) { if (v.date.startsWith(input.period)) reasons.push("LEGACY_EXPENSE"); continue; }
    if (v.voided) continue;
    if (v.paymentDate?.startsWith(input.period)) payments.push(v.gross);
    if (!v.date.startsWith(input.period)) continue;
    if (v.classification === "unclassified" && !new Exact(v.gross).isZero()) reasons.push("UNCLASSIFIED");
    if (!["operating-expense", "labour", "inventory-loss"].includes(v.classification)) { excluded.push({ entityId: record.entityId, classification: v.classification, amount: v.gross }); continue; }
    if (v.taxTreatment === "unknown" || !v.taxEvidence) { reasons.push("UNKNOWN_TAX"); continue; }
    if (v.classification === "inventory-loss") {
      if (!v.loss || losses.has(v.loss.evidence)) { reasons.push("LOSS_REVIEW"); continue; }
      losses.add(v.loss.evidence);
      if (v.loss.recognition === "already-in-cost") { excluded.push({ entityId: record.entityId, classification: "already-in-cost", amount: v.gross }); continue; }
    }
    amounts.push(v.taxTreatment === "recoverable" ? v.net : v.gross);
  }
  const expenses = sum(amounts), value = reasons.length ? null : new Exact(input.gross.coveredGrossProfit).minus(expenses).toFixed();
  return { status: value === null ? "unavailable" : "estimated", headline: reasons.includes("EXPENSES_INCOMPLETE") ? "Faaliyet kârı hesaplanamıyor — gider verileri eksik." : value === null ? "Faaliyet kârı hesaplanamıyor — hesaplama kanıtları eksik." : "Tahmini yönetim faaliyet kârı", value, expenses, payments: sum(payments), excluded, reasons: [...new Set(reasons)] };
}
