import type { AppRecord } from "../store/revisions";
export function relevantExpenseRevision(history: AppRecord[], period: string): number {
  const previous = new Map<string, string>(); let revision = 0;
  for (const row of history) if (row.kind === "expense") {
    if (row.value.date.slice(0, 7) === period || previous.get(row.entityId) === period) revision = row.revision;
    previous.set(row.entityId, row.value.date.slice(0, 7));
  }
  return revision;
}
