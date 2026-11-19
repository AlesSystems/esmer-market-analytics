import { expensePeriod } from "./validation";
import type { AppRecord } from "../store/revisions";
export function relevantExpenseRevision(history: AppRecord[], period: string): number {
  const previous = new Map<string, string>(); let revision = 0;
  for (const row of history) if (row.kind === "expense") {
    if (expensePeriod(row.value) === period || previous.get(row.entityId) === period) revision = row.revision;
    previous.set(row.entityId, expensePeriod(row.value));
  }
  return revision;
}
