import { validSelectedMonth } from "../domain/month";

/** The month one step away, or null when the step would leave the data range. Without a range every valid month is reachable. */
export function stepMonth(month: string, direction: -1 | 1, range: { from: string; to: string } | null): string | null {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + direction);
  const next = date.toISOString().slice(0, 7);
  if (!validSelectedMonth(next)) return null;
  if (range && (next < range.from.slice(0, 7) || next > range.to.slice(0, 7))) return null;
  return next;
}
