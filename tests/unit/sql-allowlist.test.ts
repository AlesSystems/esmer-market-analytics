import { expect, test } from "vitest";
import { sourceQueries } from "../../src/source/sql-server";

// A01/A05 on the monthly path: the generated SQL may only reference allowlisted source columns.
const allowed: Record<string, Record<string, string[]>> = {
  f: {FIS: ["ID", "FIS_TURU", "DOVIZ_AD", "DURUM", "AKTIF", "SATIR_TOPLAM", "SATIR_ISKONTO_TOPLAM", "FIS_ISKONTO_TOPLAM", "KDV_TOPLAM", "OTV_TOPLAM", "TEFKIFAT_TOPLAM", "GENELTOPLAM", "FIS_TARIHI"]},
  l: {FIS_DETAY: ["ID", "FIS", "STOK", "FIS_TURU", "CARPAN", "MIKTAR_FIS", "TOPLAM_KDV_MATRAHI", "TOPLAM_KDV", "TOPLAM_OTV", "TOPLAM_TEVKIF"]},
  d: {DOVIZ_AD: ["ID", "AD"]},
  s: {STOK: ["ID", "AD", "STOK_GRUP"]},
  b: {STOK_STOK_BIRIM: ["STOK", "STOK_BIRIM", "VARSAYILAN"]},
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

const outputs = {
  headers: ["ID", "FIS_TURU", "DOVIZ_AD", "DURUM", "AKTIF", "SATIR_TOPLAM", "SATIR_ISKONTO_TOPLAM", "FIS_ISKONTO_TOPLAM", "KDV_TOPLAM", "OTV_TOPLAM", "TEFKIFAT_TOPLAM", "GENELTOPLAM", "FIS_TARIHI", "CURRENCY"],
  lines: ["ID", "FIS", "STOK", "FIS_TURU", "CARPAN", "MIKTAR_FIS", "TOPLAM_KDV_MATRAHI", "TOPLAM_KDV", "TOPLAM_OTV", "TOPLAM_TEVKIF"],
  products: ["ID", "NAME", "CATEGORY", "UNIT"],
};
// SQL syntax and fixed literals allowed in a select list; any other bare identifier (an unprefixed column) fails.
const syntax = new Set(["CONVERT", "VARCHAR", "NVARCHAR", "CASE", "WHEN", "THEN", "ELSE", "END", "AS", "NULL", "IS", "IN", "LEN", "LTRIM", "RTRIM", "UPPER", "NULLIF", "N", "TRY", "USD", "OTHER", "ADET", "AD", "KG", "KILO", "KİLO", "KILOGRAM", "KİLOGRAM"]);
function selectList(sql: string) {
  const match = /^SELECT TOP \(256\) (.*?) FROM dbo\./s.exec(sql);
  if (!match) throw Error("no select list");
  const list = match[1];
  const names = [...list.matchAll(/ AS \[?([A-Z_]+)\]?(?=,|$)/g)].map(m => m[1]);
  const bare = list.replace(/'[^']*'/g, "").replace(/\b[a-z]\.\[?[A-Z_]+\]?/g, "").replace(/ AS \[?[A-Z_]+\]?(?=,|$)/g, "").match(/[A-ZİÜ_]{2,}|\bN\b/gu) ?? [];
  return {names, bare: bare.filter(word => !syntax.has(word))};
}

for (const withCost of [false, true]) test(`${withCost ? "estimate" : "preview"} select lists are exactly the allowlisted outputs`, () => {
  const queries = sourceQueries({cost: withCost});
  for (const stream of ["headers", "lines", "products"] as const) {
    const {names, bare} = selectList(queries[stream]);
    expect(names).toEqual([...outputs[stream], ...withCost && stream === "lines" ? [cost] : []]);
    expect(bare).toEqual([]);
  }
});

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
  for (const table of ["FIS", "FIS_DETAY", "DOVIZ_AD", "STOK", "STOK_GRUP", "STOK_STOK_BIRIM", "STOK_BIRIM"]) for (const permission of ["INSERT", "UPDATE", "DELETE", "ALTER", "CONTROL"]) expect(guard).toContain(`HAS_PERMS_BY_NAME('dbo.${table}','OBJECT','${permission}')`);
});

test("every paged query is planned for its own cursor", () => {
  const queries = sourceQueries({cost: true});
  for (const stream of ["headers", "lines", "products"] as const) expect(queries[stream]).toMatch(/ ORDER BY [a-z]\.ID OPTION \(RECOMPILE\)$/);
});
