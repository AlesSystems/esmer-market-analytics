import { expect, test } from "vitest";
import { extractSqlServer } from "../../src/source/sql-server";
import { createLiveSqlFixture, syntheticHeader, syntheticLine } from "../helpers/live-sql-fixture";

const isolated = test.skipIf(!process.env.ESMER_SQL_TEST_ADMIN);
isolated("real SQL rescans preserve bigint and decimals while reconciling late low IDs, corrections and deletion", async () => {
  const fixture = await createLiveSqlFixture(process.env.ESMER_SQL_TEST_ADMIN!);
  try {
    const later = await fixture.connectWriter();
    const allocated = await later.query("BEGIN TRANSACTION; SELECT CONVERT(varchar(20),NEXT VALUE FOR dbo.FixtureIds) AS id");
    expect(allocated).toEqual([{id: "1"}]);
    await fixture.execute(`${syntheticHeader("9007199254740993")}; ${syntheticLine("9007199254740995", "9007199254740993")}`);
    const first = await extractSqlServer(fixture.config);
    expect(first.headers.map(row => row.ID)).toEqual(["9007199254740993"]);
    expect(first.headers[0].SATIR_TOPLAM).toBe("123.12345678");
    expect(first.lines[0]).toMatchObject({ID: "9007199254740995", STOK: "9007199254740997", MIKTAR_FIS: "2.12345678"});
    expect(JSON.stringify(first)).not.toContain("SYNTHETIC_PRIVATE_SENTINEL");
    await later.query(syntheticHeader("1", "2025-01-01"));
    const cancellation = new AbortController();
    const extraction = extractSqlServer(fixture.config, cancellation.signal);
    void extraction.catch(() => {});
    let second;
    try {
      await fixture.waitForReaderLock();
      await later.query(`${syntheticLine("1", "1")}; COMMIT TRANSACTION`);
      second = await extraction;
    } finally {cancellation.abort(); await extraction.catch(() => {});}
    expect(second.headers.map(row => row.ID)).toEqual(["1", "9007199254740993"]);
    expect(second.lines.map(row => row.FIS)).toEqual(["1", "9007199254740993"]);
    await fixture.execute("UPDATE dbo.FIS SET FIS_TARIHI='2025-02-01',SATIR_TOPLAM=7.00000001 WHERE ID=9007199254740993; UPDATE dbo.FIS_DETAY SET TOPLAM_KDV_MATRAHI=7.00000001 WHERE FIS=9007199254740993; DELETE dbo.FIS_DETAY WHERE ID=1; DELETE dbo.FIS WHERE ID=1");
    const corrected = await extractSqlServer(fixture.config);
    expect(corrected.headers.map(row => row.ID)).toEqual(["9007199254740993"]);
    expect(corrected.headers[0]).toMatchObject({FIS_TARIHI: "2025-02-01T00:00:00", SATIR_TOPLAM: "7.00000001"});
    expect(corrected.lines[0].TOPLAM_KDV_MATRAHI).toBe("7.00000001");
    expect((await extractSqlServer(fixture.config)).headers).toEqual(corrected.headers);
    await fixture.execute(syntheticHeader("2"));
    const incomplete = await extractSqlServer(fixture.config);
    expect(incomplete.headers.some(row => row.ID === "2")).toBe(true);
    expect(incomplete.lines.some(row => row.FIS === "2")).toBe(false);
    expect(incomplete).not.toHaveProperty("sourceReconciled");
  } finally {await fixture.close();}
}, 120_000);

isolated("projected reader rejects customer reads, writes, administration, wrong identity and revoked permissions", async () => {
  const fixture = await createLiveSqlFixture(process.env.ESMER_SQL_TEST_ADMIN!);
  try {
    await fixture.execute(`${syntheticHeader("1")}; ${syntheticLine("1", "1")}`);
    expect((await extractSqlServer(fixture.config)).headers).toHaveLength(1);
    for (const sql of ["SELECT MUSTERI_AD FROM dbo.FIS", "UPDATE dbo.FIS SET AKTIF=AKTIF WHERE 1=0", "DELETE dbo.FIS_DETAY WHERE 1=0", "INSERT dbo.DOVIZ_AD(ID,AD) SELECT 2,'TRY' WHERE 1=0", "CREATE TABLE dbo.ForbiddenFixture(ID int)"]) await expect(fixture.readerQuery(sql)).rejects.toThrow(/^FIXTURE_QUERY_REJECTED$/);
    await expect(extractSqlServer({...fixture.config, password: "DeliberatelyWrong!123"})).rejects.toThrow(/^SOURCE_UNAVAILABLE$/);
    await expect(extractSqlServer({...fixture.config, expectedDatabaseId: "00000000-0000-0000-0000-000000000000"})).rejects.toThrow(/^SOURCE_CHANGED$/);
    await fixture.execute(`REVOKE SELECT ON dbo.FIS_DETAY FROM [${fixture.config.user}]; DENY SELECT ON dbo.FIS_DETAY TO [${fixture.config.user}]`);
    await expect(extractSqlServer(fixture.config)).rejects.toThrow(/^SOURCE_REJECTED$/);
  } finally {await fixture.close();}
}, 120_000);

isolated("reader lock timeout and cancellation close the transaction and permit later writes", async () => {
  const fixture = await createLiveSqlFixture(process.env.ESMER_SQL_TEST_ADMIN!);
  try {
    await fixture.execute(`${syntheticHeader("1")}; ${syntheticLine("1", "1")}`);
    const writer = await fixture.connectWriter();
    await writer.query("BEGIN TRANSACTION; UPDATE dbo.FIS WITH (TABLOCKX) SET AKTIF=AKTIF WHERE ID=1");
    await expect(extractSqlServer(fixture.config)).rejects.toThrow(/^SOURCE_TIMEOUT$/);
    const cancellation = new AbortController();
    const pending = extractSqlServer(fixture.config, cancellation.signal);
    const timer = setTimeout(() => cancellation.abort(), 150);
    try {await expect(pending).rejects.toThrow(/^CANCELLED$/);} finally {clearTimeout(timer);}
    await writer.query("ROLLBACK TRANSACTION");
    await fixture.execute("UPDATE dbo.FIS SET AKTIF=1 WHERE ID=1");
    expect((await extractSqlServer(fixture.config)).headers).toHaveLength(1);
  } finally {await fixture.close();}
}, 120_000);
