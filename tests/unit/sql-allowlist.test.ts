import { expect, test } from "vitest";
import { sourceQueries } from "../../src/source/sql-server";

// A01/A05 on the monthly path: the generated SQL may only reference allowlisted source columns.
const allowed: Record<string, Record<string, string[]>> = {
  f: {FIS: ["ID", "FIS_TURU", "DOVIZ_AD", "DURUM", "AKTIF", "SATIR_TOPLAM", "SATIR_ISKONTO_TOPLAM", "FIS_ISKONTO_TOPLAM", "KDV_TOPLAM", "OTV_TOPLAM", "TEFKIFAT_TOPLAM", "GENELTOPLAM", "FIS_TARIHI"]},
  l: {FIS_DETAY: ["ID", "FIS", "STOK", "FIS_TURU", "CARPAN", "MIKTAR_FIS", "TOPLAM_KDV_MATRAHI", "TOPLAM_KDV", "TOPLAM_OTV", "TOPLAM_TEVKIF"]},
  d: {DOVIZ_AD: ["ID", "AD"]},
  s: {STOK: ["ID", "AD", "STOK_GRUP", "STOK_BIRIM"]},
  g: {STOK_GRUP: ["ID", "AD"]},
  u: {STOK_BIRIM: ["ID", "AD"]},
};
const cost = "BELGE_TARIHINDEKI_SON_ALIS_FIYATI";

function references(sql: string) {
  const aliases = new Map<string, string>();
  for (const [, table, alias] of sql.matchAll(/\bdbo\.([A-Z_]+)\s+([a-z])\b/g)) aliases.set(alias, table);
  const columns = [...sql.matchAll(/\b([a-z])\.\[?([A-Z_]+)\]?/g)].map(([, alias, column]) => ({alias, table: aliases.get(alias), column}));
  return {aliases, columns};
}

for (const withCost of [false, true]) test(`${withCost ? "estimate" : "preview"} extraction selects only allowlisted columns`, () => {
  const queries = sourceQueries({cost: withCost});
  for (const sql of [queries.headers, queries.lines, queries.products]) {
    expect(sql).toMatch(/^SELECT TOP \(256\) /);
    expect(sql).not.toMatch(/\*|\b(INSERT|UPDATE|DELETE|MERGE|EXEC|EXECUTE|DROP|ALTER|CREATE|GRANT|INTO|OPENROWSET|OPENQUERY)\b/i);
    const {aliases, columns} = references(sql);
    for (const [alias, table] of aliases) expect(Object.keys(allowed[alias] ?? {})).toEqual([table]);
    for (const {alias, table, column} of columns) {
      const permitted = [...allowed[alias][table!], ...withCost && alias === "l" ? [cost] : []];
      expect(permitted, `${alias}.${column}`).toContain(column);
    }
    expect(sql).not.toMatch(/CARI|MUSTERI|TEDARIK|PERSONEL|ADRES|VERGI|EMAIL|TELEFON|ORTALAMA_MALIYET|SORUMLU|KULLANICI/);
  }
  expect(queries.lines.includes(cost)).toBe(withCost);
  expect(queries.headers.includes(cost) || queries.products.includes(cost)).toBe(false);
});

test("reader guard rejects privileged or writable accounts on every read table", () => {
  const {guard} = sourceQueries({cost: true});
  expect(guard).toContain("IS_SRVROLEMEMBER('sysadmin')");
  expect(guard).toContain("IS_MEMBER('db_owner')");
  for (const table of ["FIS", "FIS_DETAY", "DOVIZ_AD", "STOK", "STOK_GRUP", "STOK_BIRIM"]) for (const permission of ["INSERT", "UPDATE", "DELETE", "ALTER", "CONTROL"]) expect(guard).toContain(`HAS_PERMS_BY_NAME('dbo.${table}','OBJECT','${permission}')`);
});
