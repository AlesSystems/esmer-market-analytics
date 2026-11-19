import { expensePeriod, isManualBill } from "./validation";
import type { AppRecord } from "../store/revisions";
export function relevantExpenseRevision(history: AppRecord[], period: string): number {
  const previous = new Map<string, string>(); let revision = 0;
  for (const row of history) if (row.kind === "expense") {
    if (expensePeriod(row.value) === period || previous.get(row.entityId) === period) revision = row.revision;
    previous.set(row.entityId, expensePeriod(row.value));
  }
  return revision;
}

export function manualBillNumbers(history: readonly AppRecord[]): Map<string, number> {
  const numbers = new Map<string, number>();
  for (const row of history) {
    if (row.kind !== "expense" || !isManualBill(row.value)) continue;
    const first = numbers.get(row.entityId);
    if (first === undefined || row.revision < first) numbers.set(row.entityId, row.revision);
  }
  return numbers;
}
