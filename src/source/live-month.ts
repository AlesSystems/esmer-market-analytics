const dateText = /^(\d{4})-(\d{2})-(\d{2})$/;
const valid = (value: string) => { const m = dateText.exec(value); return !!m && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value; };

/** Local calendar date as YYYY-MM-DD. */
export function localDate(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/**
 * The newest calendar month a live refresh prepares: the month of the earlier of the connection's `to` and `today`.
 * A connection that starts after that date has nothing to read.
 */
export function latestLiveMonth(bound: {from: string; to: string}, today: string): string {
  if (![bound.from, bound.to, today].every(valid)) throw new Error("INVALID_ARGUMENTS");
  const end = bound.to < today ? bound.to : today;
  if (bound.from > end) throw new Error("WINDOW_OUTSIDE_CONFIG");
  return end.slice(0, 7);
}
