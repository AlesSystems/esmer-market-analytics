import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir, cpus } from "node:os";
import { expect, test } from "vitest";
import { prepareMonthlyEstimate } from "../../src/source/sql-package";
import { openStore } from "../../src/store/store";
import { createLiveSqlFixture } from "../helpers/live-sql-fixture";

// Opt-in measurement for #101 (docs/evidence/2026-10-22-monthly-data-path.md). Synthetic volume shaped like the
// recorded September 2025 window: 5,508 headers, 18,858 lines and 3,529 product IDs per month, six months.
const measured = test.skipIf(!process.env.ESMER_SQL_TEST_ADMIN || !process.env.ESMER_MONTHLY_VOLUME_OUT);
const cost = "BELGE_TARIHINDEKI_SON_ALIS_FIYATI";
const HEADERS = 5508, LINES = 18858, PRODUCTS = 3529;
const periods = ["2025-04", "2025-05", "2025-06", "2025-07", "2025-08", "2025-09"];

measured("realistic six-month synthetic volume: window, package size and import time", async () => {
  const fixture = await createLiveSqlFixture(process.env.ESMER_SQL_TEST_ADMIN!);
  const dir = await mkdtemp(join(tmpdir(), "esmer-monthly-volume-"));
  try {
    await fixture.execute(`ALTER TABLE dbo.FIS_DETAY ADD ${cost} decimal(24,8) NULL`);
    await fixture.execute(`GRANT SELECT (${cost}) ON dbo.FIS_DETAY TO [${fixture.reader}]`);
    await fixture.execute(`INSERT dbo.STOK_BIRIM VALUES(2,N'KG',1,1);
WITH n AS (SELECT TOP (39) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS i FROM sys.all_objects) INSERT dbo.STOK_GRUP SELECT i+1, CONCAT(N'Sentetik Reyon ', i+1), NULL FROM n;
WITH n AS (SELECT TOP (${PRODUCTS}) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS i FROM sys.all_objects a CROSS JOIN sys.all_objects b) INSERT dbo.STOK SELECT i, CONCAT(N'Sentetik Ürün ', i, N' 1 L Ambalaj'), 1 + i % 40, 1 + i % 2, NULL, NULL, NULL FROM n`);
    for (const [m, period] of periods.entries()) {
      await fixture.execute(`WITH n AS (SELECT TOP (${HEADERS}) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS i FROM sys.all_objects a CROSS JOIN sys.all_objects b)
INSERT dbo.FIS SELECT ${m * 10000} + i, 11, 1, 1, 1, 123.45000000, 0, 0, 9.87000000, 0, 0, 133.32000000, DATEADD(minute, i * 7 % 1440, DATEADD(day, i % 28, CONVERT(datetime, '${period}-01', 120))), NULL FROM n`);
      await fixture.execute(`WITH n AS (SELECT TOP (${LINES}) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS i FROM sys.all_objects a CROSS JOIN sys.all_objects b)
INSERT dbo.FIS_DETAY SELECT ${m * 100000} + i, ${m * 10000} + 1 + i % ${HEADERS}, 1 + i * 7 % ${PRODUCTS}, 11, 1.00000000, 1 + i % 5, 12.34567800 * (1 + i % 5), 0.98765400, 0, 0, CASE WHEN i % 50 = 0 THEN NULL ELSE 8.76543200 END FROM n`);
    }
    const results = [];
    for (const months of [1, 2, 3, 6]) {
      const started = performance.now();
      const prepared = await prepareMonthlyEstimate(fixture.config, "2025-09", months);
      const prepareMs = performance.now() - started;
      const store = openStore(join(dir, `store-${months}.sqlite`));
      try {
        const importStart = performance.now();
        const imported = store.importSourcePreview(prepared.bytes);
        const importMs = performance.now() - importStart;
        if (imported.status !== "preview-imported") throw Error("IMPORT_FAILED");
        const estimateStart = performance.now();
        const estimate = store.querySourceEstimate({hash: imported.hash, period: "2025-09", view: "summary", offset: 0, productId: null});
        const estimateMs = performance.now() - estimateStart;
        expect(estimate.status).toBe("source-estimate");
        results.push({requestedMonths: months, months: prepared.months, from: prepared.from, to: prepared.to, counts: prepared.counts, rows: prepared.counts.headers + prepared.counts.lines + prepared.counts.products, bytes: prepared.bytes.length, prepareMs: Math.round(prepareMs), importMs: Math.round(importMs), firstEstimateMs: Math.round(estimateMs)});
      } finally { store.close(); }
    }
    expect(results.at(-1)).toMatchObject({requestedMonths: 6, months: 3});
    await writeFile(process.env.ESMER_MONTHLY_VOLUME_OUT!, `${JSON.stringify({perMonth: {headers: HEADERS, lines: LINES, productPool: PRODUCTS}, node: process.version, platform: `${process.platform}-${process.arch}`, cpu: cpus()[0]?.model, results}, null, 2)}\n`);
  } finally { await fixture.close(); await rm(dir, {recursive: true, force: true}); }
}, 600_000);
