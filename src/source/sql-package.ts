import { randomUUID } from "node:crypto";
import { extractSqlServer, type SqlServerConfig } from "./sql-server.ts";
import { writeRawEstimatePackage, writeRawPackage } from "./raw-package.ts";

export async function prepareSqlCandidate(config: SqlServerConfig, signal?: AbortSignal): Promise<Uint8Array> {
  const snapshot = await extractSqlServer(config, signal);
  return writeRawPackage(snapshot, config.lineage, randomUUID());
}

export const MAX_MONTHS = 6;
const iso = (year: number, month: number, day: number) => new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);

/** Inclusive source dates for the selected calendar month and the `months - 1` months before it. */
export function monthWindow(month: string, months = MAX_MONTHS): {from: string; to: string; months: number} {
  const match = /^(\d{4})-(\d{2})$/.exec(month);
  if (!match || !Number.isInteger(months) || months < 1 || months > MAX_MONTHS) throw new Error("INVALID_ARGUMENTS");
  const year = Number(match[1]), index = Number(match[2]) - 1;
  if (index < 0 || index > 11 || year < 1900 || year > 9998) throw new Error("INVALID_ARGUMENTS");
  return {from: iso(year, index - months + 1, 1), to: iso(year, index + 1, 0), months};
}

export type MonthlyEstimate = {bytes: Buffer; from: string; to: string; months: number; counts: {headers: number; lines: number; products: number}};

/**
 * Writes an `sql-backup-estimate-v2` package for the selected month plus up to `months - 1` previous months.
 * The package bounds (100,000 rows, 32 MiB) stay fixed: when a window exceeds them, the oldest month is dropped and the
 * extraction repeats, down to the selected month alone. Every other failure is final.
 */
export async function prepareMonthlyEstimate(config: SqlServerConfig, month: string, months = MAX_MONTHS, signal?: AbortSignal): Promise<MonthlyEstimate> {
  for (let span = monthWindow(month, months).months; ; span--) {
    const window = monthWindow(month, span);
    try {
      const snapshot = await extractSqlServer({...config, from: window.from, to: window.to}, signal, {cost: true});
      const bytes = writeRawEstimatePackage(snapshot, config.lineage, randomUUID());
      return {bytes, ...window, counts: {headers: snapshot.headers.length, lines: snapshot.lines.length, products: snapshot.products?.length ?? 0}};
    } catch (error) {
      if (span === 1 || !(error instanceof Error && error.cause === "SIZE_LIMIT")) throw error;
    }
  }
}
