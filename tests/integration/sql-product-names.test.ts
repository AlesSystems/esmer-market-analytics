import { expect, test } from "vitest";
import { extractSqlServer, type SqlSnapshot } from "../../src/source/sql-server";
import { prepareLiveEstimate } from "../../src/source/sql-package";
import { readRawPackage, writeRawEstimatePackage, writeRawPackage } from "../../src/source/raw-package";
import { openStore } from "../../src/store/store";
import { createLiveSqlFixture, syntheticHeader } from "../helpers/live-sql-fixture";

const isolated = test.skipIf(!process.env.ESMER_SQL_TEST_ADMIN);

const line = (id: number, stok: number) => `INSERT dbo.FIS_DETAY VALUES(${id},1,${stok},11,1.00000000,2.00000000,20.00000000,0,0,0)`;

const expectedProducts = [
  {ID: "101", NAME: "Elma", CATEGORY: "Meyve", UNIT: "adet"},
  {ID: "102", NAME: "Peynir", CATEGORY: "Süt Ürünleri", UNIT: "kg"},
  {ID: "103", NAME: "Su", CATEGORY: "Meyve", UNIT: "other"},
  {ID: "104", NAME: "Grupsuz", CATEGORY: null, UNIT: null},
  {ID: "105", NAME: null, CATEGORY: "Meyve", UNIT: "adet"},
  {ID: "106", NAME: null, CATEGORY: "Meyve", UNIT: "adet"},
  {ID: "107", NAME: null, CATEGORY: "Meyve", UNIT: "adet"},
  {ID: "110", NAME: "Kilo1", CATEGORY: "Meyve", UNIT: "kg"},
  {ID: "111", NAME: "Kilo2", CATEGORY: "Meyve", UNIT: "kg"},
  {ID: "112", NAME: "Adet1", CATEGORY: "Meyve", UNIT: "adet"},
  {ID: "113", NAME: "Birimsiz", CATEGORY: "Meyve", UNIT: null},
  {ID: "114", NAME: null, CATEGORY: "Meyve", UNIT: "adet"},
];

const seed = `INSERT dbo.STOK_GRUP VALUES(10,N'Meyve',N'SYNTHETIC_PRIVATE_SENTINEL'),(11,N'  Süt Ürünleri ',N'SYNTHETIC_PRIVATE_SENTINEL');
INSERT dbo.STOK_BIRIM VALUES(10,N'ADET',1,0),(11,N'kg',1,1),(12,N'LITRE',1,1),(13,N'kilo',1,1),(14,N'Kİlo',1,1),(15,N'Adet',1,0),(16,NULL,1,0);
INSERT dbo.STOK VALUES
 (101,N'Elma',10,10,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (102,N'  Peynir  ',11,11,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (103,N'Su',10,12,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (104,N'Grupsuz',NULL,NULL,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (105,REPLICATE(N'x',161),10,10,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (106,N'Tab'+CHAR(9)+N'x',10,10,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (107,N'Satir'+CHAR(10)+N'x',10,10,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (109,N'Kullanilmayan',10,10,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (110,N'Kilo1',10,13,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (111,N'Kilo2',10,14,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (112,N'Adet1',10,15,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (113,N'Birimsiz',10,16,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (114,REPLICATE(N'x',300),10,10,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL'),
 (115,N'Pencere_Disi',10,10,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL');
${syntheticHeader("1", "2025-09-10")};
INSERT dbo.FIS VALUES(2,11,1,1,1,1.00000000,0,0,0,0,0,1.00000000,'2024-06-01',N'SYNTHETIC_PRIVATE_SENTINEL');
${[101, 102, 103, 104, 105, 106, 107, 108, 110, 111, 112, 113, 114].map((stok, index) => line(index + 1, stok)).join(";\n")};
INSERT dbo.FIS_DETAY VALUES(14,2,115,11,1.00000000,2.00000000,20.00000000,0,0,0)`;

function estimateProducts(snapshot: SqlSnapshot) {
  const withCost: SqlSnapshot = {...snapshot, lines: snapshot.lines.map(row => ({...row, BELGE_TARIHINDEKI_SON_ALIS_FIYATI: "1"}))};
  const store = openStore(":memory:");
  try {
    const imported = store.importSourcePreview(writeRawEstimatePackage(withCost, "fixture:names", "names-1"));
    if (imported.status !== "preview-imported") throw new Error("IMPORT_FAILED");
    const result = store.querySourceEstimate({hash: imported.hash, period: "2025-09", view: "products", offset: 0, productId: null});
    if (result.status !== "source-estimate") throw new Error("ESTIMATE_FAILED");
    return result;
  } finally {store.close();}
}

isolated("product names, categories and classified units come only from granted stock columns of referenced products", async () => {
  const fixture = await createLiveSqlFixture(process.env.ESMER_SQL_TEST_ADMIN!);
  try {
    await fixture.execute(seed);
    const snapshot = await extractSqlServer(fixture.config);
    expect(snapshot.lines).toHaveLength(13);
    expect(snapshot.products).toEqual(expectedProducts);
    for (const row of snapshot.products!) expect(Object.keys(row).sort()).toEqual(["CATEGORY", "ID", "NAME", "UNIT"]);
    const json = JSON.stringify(snapshot);
    expect(json).not.toContain("SYNTHETIC_PRIVATE_SENTINEL");
    expect(json).not.toContain("880088008");
    expect(json).not.toContain("770077007");
    expect(json).not.toContain("Kullanilmayan");
    expect(json).not.toContain("Pencere_Disi");

    for (const sql of ["SELECT CARI FROM dbo.STOK", "SELECT TEDARIKCI_AD FROM dbo.STOK", "SELECT ORTALAMA_MALIYET FROM dbo.STOK", "SELECT SORUMLU FROM dbo.STOK_GRUP", "SELECT CARPAN FROM dbo.STOK_BIRIM", "UPDATE dbo.STOK SET AD=AD WHERE 1=0"]) await expect(fixture.readerQuery(sql)).rejects.toThrow(/^FIXTURE_QUERY_REJECTED$/);
    expect(await fixture.readerQuery("SELECT ID,AD,STOK_GRUP,STOK_BIRIM FROM dbo.STOK WHERE ID=101")).toHaveLength(1);

    expect(readRawPackage(await prepareLiveEstimate(fixture.config, undefined, fixture.config.to))?.schemaVersion).toBe("sql-backup-estimate-v2");

    const byId = new Map(expectedProducts.map(row => [row.ID, row]));
    const current = estimateProducts(snapshot);
    expect(current.products.map(row => row.productId).sort()).toEqual(["101", "102", "103", "104", "105", "106", "107", "108", "110", "111", "112", "113", "114"]);
    for (const row of [...current.products, ...current.ranking]) {
      const expected = byId.get(row.productId);
      expect(row).toMatchObject({productName: expected?.NAME ?? null, categoryName: expected?.CATEGORY ?? null, unit: expected?.UNIT ?? null});
    }
    expect(current.ranking.length).toBeGreaterThan(0);

    const legacy: SqlSnapshot = {...snapshot};
    delete legacy.products;
    expect(readRawPackage(writeRawPackage(legacy, "fixture:names", "names-1"))?.schemaVersion).toBe("sql-backup-preview-v1");
    const old = estimateProducts(legacy);
    expect(old.products).toHaveLength(13);
    for (const row of [...old.products, ...old.ranking]) expect(row).toMatchObject({productName: null, categoryName: null, unit: null});
  } finally {await fixture.close();}
}, 120_000);

isolated("product extraction pages past the batch size in ID order", async () => {
  const fixture = await createLiveSqlFixture(process.env.ESMER_SQL_TEST_ADMIN!);
  try {
    await fixture.execute(`${syntheticHeader("1", "2025-09-10")};
WITH n AS (SELECT TOP (300) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS i FROM sys.all_objects a CROSS JOIN sys.all_objects b)
INSERT dbo.STOK SELECT 1000+i,N'Urun'+CONVERT(nvarchar(10),i),NULL,NULL,880088008,1,N'SYNTHETIC_PRIVATE_SENTINEL' FROM n;
WITH n AS (SELECT TOP (300) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS i FROM sys.all_objects a CROSS JOIN sys.all_objects b)
INSERT dbo.FIS_DETAY SELECT 5000+i,1,1000+i,11,1.00000000,2.00000000,20.00000000,0,0,0 FROM n`);
    const snapshot = await extractSqlServer(fixture.config);
    expect(snapshot.products!.map(row => row.ID)).toEqual(Array.from({length: 300}, (_, i) => String(1001 + i)));
    expect(snapshot.products![299]).toEqual({ID: "1300", NAME: "Urun300", CATEGORY: null, UNIT: null});
  } finally {await fixture.close();}
}, 120_000);

isolated("product extraction fails closed when the stock grant is revoked", async () => {
  const fixture = await createLiveSqlFixture(process.env.ESMER_SQL_TEST_ADMIN!);
  try {
    await fixture.execute(`${seed};\nREVOKE SELECT ON dbo.STOK FROM [${fixture.reader}]`);
    await expect(extractSqlServer(fixture.config)).rejects.toThrow(/^SOURCE_REJECTED$/);
  } finally {await fixture.close();}
}, 120_000);
