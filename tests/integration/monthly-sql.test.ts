import { expect, test } from "vitest";
import { prepareMonthlyEstimate } from "../../src/source/sql-package";
import { readRawPackage } from "../../src/source/raw-package";
import { extractSqlServer } from "../../src/source/sql-server";
import { createLiveSqlFixture } from "../helpers/live-sql-fixture";

const isolated = test.skipIf(!process.env.ESMER_SQL_TEST_ADMIN);
const cost = "BELGE_TARIHINDEKI_SON_ALIS_FIYATI";

isolated("monthly preparation writes a six-month estimate package with catalogue and cost only from allowlisted columns", async () => {
  const fixture = await createLiveSqlFixture(process.env.ESMER_SQL_TEST_ADMIN!);
  try {
    await fixture.execute(`ALTER TABLE dbo.FIS_DETAY ADD ${cost} decimal(24,8) NULL, BIRIM_MALIYET decimal(24,8) NULL`);
    const dates = ["2025-03-31", "2025-04-01", "2025-06-15", "2025-09-30T23:59:59", "2025-10-01"];
    await fixture.execute(dates.map((date, i) => `INSERT dbo.FIS VALUES(${i + 1},11,1,1,1,10.00000000,0,0,0,0,0,10.00000000,'${date}',N'SYNTHETIC_PRIVATE_SENTINEL'); INSERT dbo.FIS_DETAY VALUES(${i + 11},${i + 1},9007199254740997,11,1.00000000,1.00000000,10.00000000,0,0,0,${i === 2 ? "NULL" : "4.00000000"},77.00000000)`).join(";\n"));
    await expect(prepareMonthlyEstimate(fixture.config, "2025-09", 6)).rejects.toThrow("SOURCE_REJECTED");
    await fixture.execute(`GRANT SELECT (${cost}) ON dbo.FIS_DETAY TO [${fixture.reader}]`);
    const result = await prepareMonthlyEstimate(fixture.config, "2025-09", 6);
    expect(result).toMatchObject({from: "2025-04-01", to: "2025-09-30", months: 6, counts: {headers: 3, lines: 3, products: 1}});
    const parsed = readRawPackage(result.bytes)!;
    expect(parsed.schemaVersion).toBe("sql-backup-estimate-v2");
    expect(parsed.snapshot.lines.map(row => [row.ID, row[cost]])).toEqual([["12", "4.00000000"], ["13", null], ["14", "4.00000000"]]);
    expect(parsed.snapshot.products).toEqual([{ID: "9007199254740997", NAME: "Sentetik Ürün", CATEGORY: "Sentetik Grup", UNIT: "adet"}]);
    const text = Buffer.from(result.bytes).toString();
    for (const secret of ["SYNTHETIC_PRIVATE_SENTINEL", "77.00000000", "770077007", fixture.config.password, fixture.config.user, fixture.config.server]) expect(text).not.toContain(secret);
    const live = await extractSqlServer(fixture.config);
    expect(Object.hasOwn(live.lines[0], cost)).toBe(false);
  } finally { await fixture.close(); }
});

isolated("monthly preparation shrinks to the newest months that fit the package bounds", async () => {
  const fixture = await createLiveSqlFixture(process.env.ESMER_SQL_TEST_ADMIN!);
  try {
    await fixture.execute(`ALTER TABLE dbo.FIS_DETAY ADD ${cost} decimal(24,8) NULL`);
    await fixture.execute(`GRANT SELECT (${cost}) ON dbo.FIS_DETAY TO [${fixture.reader}]`);
    await fixture.execute(`INSERT dbo.FIS VALUES(1,11,1,1,1,1,0,0,0,0,0,1,'2025-09-02',NULL); INSERT dbo.FIS VALUES(2,11,1,1,1,1,0,0,0,0,0,1,'2025-08-02',NULL);
WITH n AS (SELECT TOP (120000) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS i FROM sys.all_objects a CROSS JOIN sys.all_objects b)
INSERT dbo.FIS_DETAY SELECT i, CASE WHEN i <= 60000 THEN 1 ELSE 2 END, 9007199254740997, 11, 1, 1, 1, 0, 0, 0, 1 FROM n`);
    const result = await prepareMonthlyEstimate(fixture.config, "2025-09", 6);
    expect(result).toMatchObject({from: "2025-09-01", to: "2025-09-30", months: 1, counts: {headers: 1, lines: 60000, products: 1}});
  } finally { await fixture.close(); }
}, 120_000);
