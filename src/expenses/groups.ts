import { Exact } from "../domain/money";
import type { AppRecord } from "../store/revisions";
import type { Classification } from "./contracts";
import { isExpense } from "./validation";

export const expenseGroupKeys = ["staff", "rent", "utilities", "other"] as const;
export type ExpenseGroupKey = typeof expenseGroupKeys[number];
/** A display group of the month's counted expenses. `amount` is null when a line in the group blocks the total (unknown KDV or loss review). */
export type ExpenseGroup = { key: ExpenseGroupKey; amount: string | null; count: number };
/** A line that blocks net profit and needs the owner's attention. */
export type ExpenseAttention = { entityId: string; category: string; date: string; reason: "unknownTax" | "unclassified" | "lossReview" | "legacy" };

const fold = (text: string) => text.toLocaleLowerCase("tr").replace(/ı/g, "i").replace(/ç/g, "c").replace(/ş/g, "s").replace(/ğ/g, "g").replace(/ö/g, "o").replace(/ü/g, "u");
const words = (text: string) => fold(text).split(/[^a-z]+/u).filter(Boolean);
/**
 * Display-only mapping onto the stored model. Labour is aggregate staff cost. The model has no rent or utility class:
 * those are operating expenses, told apart by the category text the owner wrote ("Kira", "Elektrik", "Su").
 * Classes that stay out of the expense total return null.
 */
export function displayGroup(classification: Classification, category: string): ExpenseGroupKey | null {
  if (classification === "labour") return "staff";
  if (classification === "inventory-loss") return "other";
  if (classification !== "operating-expense") return null;
  const tokens = words(category);
  if (tokens.includes("kira")) return "rent";
  if (tokens.includes("elektrik") || tokens.includes("su")) return "utilities";
  return "other";
}

/** Mirrors calculateExpenseComponents: same lines, same net/gross rule, same blockers. */
export function groupExpenses(period: string, app: AppRecord[]): { groups: ExpenseGroup[]; attention: ExpenseAttention[] } {
  const totals = new Map<ExpenseGroupKey, { amount: InstanceType<typeof Exact> | null; count: number }>(expenseGroupKeys.map(key => [key, { amount: new Exact(0), count: 0 }]));
  const attention: ExpenseAttention[] = [], losses = new Set<string>();
  for (const record of app) {
    if (record.kind !== "expense") continue;
    if (!isExpense(record.value)) {
      const legacy = record.value as { date: string; category?: string; voided?: boolean };
      if (legacy.date.startsWith(period) && !legacy.voided) attention.push({ entityId: record.entityId, category: legacy.category ?? "Eski kayıt", date: legacy.date, reason: "legacy" });
      continue;
    }
    const v = record.value;
    if (v.voided || !v.date.startsWith(period)) continue;
    const line = { entityId: record.entityId, category: v.category, date: v.date };
    if (v.classification === "unclassified" && !new Exact(v.gross).isZero()) { attention.push({ ...line, reason: "unclassified" }); continue; }
    const key = displayGroup(v.classification, v.category);
    if (!key) continue;
    const group = totals.get(key)!;
    if (v.taxTreatment === "unknown" || !v.taxEvidence) { attention.push({ ...line, reason: "unknownTax" }); group.count++; group.amount = null; continue; }
    if (v.classification === "inventory-loss") {
      if (!v.loss || losses.has(v.loss.evidence)) { attention.push({ ...line, reason: "lossReview" }); group.count++; group.amount = null; continue; }
      losses.add(v.loss.evidence);
      if (v.loss.recognition === "already-in-cost") continue;
    }
    group.count++;
    group.amount = group.amount?.plus(v.taxTreatment === "recoverable" ? v.net : v.gross) ?? null;
  }
  return { groups: expenseGroupKeys.map(key => { const group = totals.get(key)!; return { key, amount: group.amount?.toFixed() ?? null, count: group.count }; }), attention };
}
