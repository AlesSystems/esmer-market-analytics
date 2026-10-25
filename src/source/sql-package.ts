import { randomUUID } from "node:crypto";
import { extractSqlServer, type SqlServerConfig } from "./sql-server.ts";
import { writeRawEstimatePackage } from "./raw-package.ts";
import { latestLiveMonth, localDate } from "./live-month.ts";

export const MAX_MONTHS = 6;
const iso = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);

/** Inclusive source dates for the selected calendar month and the `months - 1` months before it. */
export function monthWindow(month: string, months = MAX_MONTHS): {from: string; to: string; months: number} {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match || !Number.isInteger(months) || months < 1 || months > MAX_MONTHS) throw new Error("INVALID_ARGUMENTS");
  const year = Number(match[1]), index = Number(match[2]) - 1;
  if (index < 0 || index > 11 || year > 9998) throw new Error("INVALID_ARGUMENTS");
  const window = {from: iso(year, index - months + 1, 1), to: iso(year, index + 1, 0), months};
  if (window.from < "1900-01-01") throw new Error("INVALID_ARGUMENTS");
  return window;
}

export type MonthlyEstimate = {bytes: Buffer; from: string; to: string; months: number; counts: {headers: number; lines: number; products: number}};
const sizeLimit = (error: unknown) => error instanceof Error && error.cause === "SIZE_LIMIT";

/**
 * Writes an `sql-backup-estimate-v2` package for the selected month plus up to `months - 1` previous months.
 * The connection file's from/to is the declared outer bound: the requested window must lie inside it.
 * The package bounds (100,000 rows, 32 MiB) stay fixed: when a window exceeds them during extraction or when the
 * package is written, the oldest month is dropped and the extraction repeats, down to the selected month alone.
 * Every other failure is final.
 * With `clamp` the window is cut to the connection's from/to (live refresh, where the bound is a configured
 * range rather than a chosen month); it is still an error when nothing of the selected month lies inside it.
 */
export async function prepareMonthlyEstimate(config: SqlServerConfig, month: string, months = MAX_MONTHS, signal?: AbortSignal, options: {clamp?: boolean} = {}): Promise<MonthlyEstimate> {
  const requested = monthWindow(month, months);
  const fit = (window: {from: string; to: string; months: number}) => options.clamp ? {...window, from: window.from < config.from ? config.from : window.from, to: window.to > config.to ? config.to : window.to} : window;
  const outer = fit(requested);
  if (outer.from < config.from || outer.to > config.to || outer.from > outer.to) throw new Error("WINDOW_OUTSIDE_CONFIG");
  for (let span = requested.months; ; span--) {
    const window = fit(monthWindow(month, span));
    try {
      const snapshot = await extractSqlServer({...config, from: window.from, to: window.to}, signal, {cost: true});
      const bytes = writeRawEstimatePackage(snapshot, config.lineage, randomUUID());
      return {bytes, ...window, counts: {headers: snapshot.headers.length, lines: snapshot.lines.length, products: snapshot.products?.length ?? 0}};
    } catch (error) {
      if (!sizeLimit(error)) throw error;
      if (span === 1) throw options.clamp ? new Error("SOURCE_TOO_LARGE") : error;
    }
  }
}

// The window span (months) the last live refresh managed to read, per connection. A refresh starts from it instead of retrying sizes that already exceeded the package bounds.
let remembered: {key: string; span: number} | undefined;
const connectionKey = (config: SqlServerConfig) => JSON.stringify([config.server, config.port, config.database, config.user, config.password, config.trustServerCertificate, config.scope, config.lineage, config.expectedDatabaseId, config.from, config.to]);

/**
 * Live refresh: the same estimate package `npm run prepare:month` writes, for the newest month inside the
 * connection's bound that is not after today (local date). The window ends no later than today, so the current
 * month is a partial month. Starts from the span that worked last time for this connection.
 */
export async function prepareLiveEstimate(config: SqlServerConfig, signal?: AbortSignal, today = localDate()): Promise<Uint8Array> {
  const month = latestLiveMonth(config, today);
  const bound = {...config, to: config.to < today ? config.to : today};
  const key = connectionKey(config);
  const start = remembered?.key === key ? remembered.span : MAX_MONTHS;
  const prepared = await prepareMonthlyEstimate(bound, month, start, signal, {clamp: true});
  remembered = {key, span: prepared.months};
  return prepared.bytes;
}
