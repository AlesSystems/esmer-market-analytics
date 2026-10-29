import { validSelectedMonth } from "../domain/month";

/**
 * The month one step away, or null when the step would leave the data range. Without a range every valid month is reachable.
 * A month already outside the range (Giderler steps without one, and the month is remembered) steps toward the range and lands on its nearest covered month, never on a neighbour that is also outside.
 */
export function stepMonth(month: string, direction: -1 | 1, range: { from: string; to: string } | null): string | null {
  const date = new Date(`${month}-01T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + direction);
  const next = date.toISOString().slice(0, 7);
  if (!validSelectedMonth(next)) return null;
  if (!range) return next;
  const first = range.from.slice(0, 7), last = range.to.slice(0, 7);
  if (next < first) return direction === 1 ? first : null;
  if (next > last) return direction === -1 ? last : null;
  return next;
}
