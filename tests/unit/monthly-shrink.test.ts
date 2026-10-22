import { beforeEach, expect, test, vi } from "vitest";
import type { SqlServerConfig, SqlSnapshot } from "../../src/source/sql-server";
import { rawSnapshot } from "../helpers/raw-fixture";

const calls: {from: string; to: string}[] = [];
const wide = `${"9".repeat(40)}.${"9".repeat(30)}`;
// One header plus `lines` wide lines; more than one month produces a package over 32 MiB but under 100,000 rows.
function snapshot(from: string, to: string, lines: number): SqlSnapshot {
  const base = rawSnapshot(), line = base.lines[0];
  return {...base, from, to, headers: [{...base.headers[0], FIS_TARIHI: `${to}T12:00:00.000`}], lines: Array.from({length: lines}, (_, i) => ({...line, ID: String(i + 10), CARPAN: wide, MIKTAR_FIS: wide, TOPLAM_KDV_MATRAHI: wide, TOPLAM_KDV: wide, TOPLAM_OTV: wide, TOPLAM_TEVKIF: wide, BELGE_TARIHINDEKI_SON_ALIS_FIYATI: wide})), products: []};
}
vi.mock("../../src/source/sql-server", async original => ({
  ...await original<typeof import("../../src/source/sql-server")>(),
  extractSqlServer: async (config: SqlServerConfig) => { calls.push({from: config.from, to: config.to}); return snapshot(config.from, config.to, config.from.slice(0, 7) === config.to.slice(0, 7) ? 100 : 60_000); },
}));
const config = {server: "localhost", port: 14339, database: "Synthetic", user: "reader", password: "x", trustServerCertificate: true, scope: "isolated-copy", lineage: "fixture:monthly", expectedDatabaseId: "00000000-0000-4000-8000-000000000001", from: "2025-01-01", to: "2025-12-31"} as SqlServerConfig;
beforeEach(() => { calls.length = 0; });

test("a package over 32 MiB at write time drops the oldest month instead of failing", async () => {
  const {prepareMonthlyEstimate} = await import("../../src/source/sql-package");
  const result = await prepareMonthlyEstimate(config, "2025-09", 3);
  expect(result).toMatchObject({from: "2025-09-01", to: "2025-09-30", months: 1});
  expect(calls.map(c => c.from)).toEqual(["2025-07-01", "2025-08-01", "2025-09-01"]);
}, 120_000);

test("the month window must lie inside the declared connection bound", async () => {
  const {prepareMonthlyEstimate} = await import("../../src/source/sql-package");
  await expect(prepareMonthlyEstimate({...config, from: "2025-06-01"}, "2025-09", 6)).rejects.toThrow("WINDOW_OUTSIDE_CONFIG");
  await expect(prepareMonthlyEstimate({...config, to: "2025-09-29"}, "2025-09", 1)).rejects.toThrow("WINDOW_OUTSIDE_CONFIG");
  expect(calls).toEqual([]);
});
