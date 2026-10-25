import { Connection, Request, TYPES, ISOLATION_LEVEL } from "tedious";
import { MAX_BYTES, MAX_ROWS } from "./package.ts";

export type SqlServerConfig = { server: string; port: number; database: string; user: string; password: string; trustServerCertificate: boolean; scope: "isolated-copy"; lineage: string; expectedDatabaseId: string; from: string; to: string };
export type SqlRow = Record<string, string | null>;
export type SqlSnapshot = { databaseId: string; engineVersion: string; capturedAt: string; from: string; to: string; headers: SqlRow[]; lines: SqlRow[]; products?: SqlRow[] };
const failure = (code = "SOURCE_REJECTED") => new Error(code);
export function parseSqlServerConfig(value: unknown): SqlServerConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw failure();
  const c = value as Record<string, unknown>;
  const required = ["server", "port", "database", "user", "password", "scope", "lineage", "expectedDatabaseId", "from", "to"];
  if (required.some(k => !Object.hasOwn(c, k)) || Object.keys(c).some(k => ![...required, "trustServerCertificate"].includes(k))) throw failure();
  for (const k of ["server", "database", "user", "password"]) if (typeof c[k] !== "string" || !c[k].length || c[k].length > 1024 || /[\x00-\x1f\x7f]/.test(c[k])) throw failure();
  if (!Number.isInteger(c.port) || Number(c.port) < 1 || Number(c.port) > 65535 || c.scope !== "isolated-copy" || /^(sa|dbo)$/i.test(String(c.user))) throw failure();
  if (typeof c.lineage !== "string" || !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(c.lineage) || typeof c.expectedDatabaseId !== "string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(c.expectedDatabaseId)) throw failure();
  for (const k of ["from", "to"]) {
    const d = c[k];
    if (typeof d !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(d) || d < "1900-01-01" || d > "9998-12-31" || !Number.isFinite(Date.parse(d)) || new Date(d).toISOString().slice(0, 10) !== d) throw failure();
  }
  if (String(c.from) > String(c.to) || (c.trustServerCertificate !== undefined && typeof c.trustServerCertificate !== "boolean")) throw failure();
  return { ...c, trustServerCertificate: c.trustServerCertificate ?? false } as SqlServerConfig;
}

const headerColumns = ["ID", "FIS_TURU", "DOVIZ_AD", "DURUM", "AKTIF", "SATIR_TOPLAM", "SATIR_ISKONTO_TOPLAM", "FIS_ISKONTO_TOPLAM", "KDV_TOPLAM", "OTV_TOPLAM", "TEFKIFAT_TOPLAM", "GENELTOPLAM"];
const lineColumns = ["ID", "FIS", "STOK", "FIS_TURU", "CARPAN", "MIKTAR_FIS", "TOPLAM_KDV_MATRAHI", "TOPLAM_KDV", "TOPLAM_OTV", "TOPLAM_TEVKIF"];
export const productColumns = ["ID", "NAME", "CATEGORY", "UNIT"] as const;
// Product catalogue physical names, checked against the restored source catalog on 2026-10-25. STOK has no unit column:
// a product's unit is its single VARSAYILAN link in STOK_STOK_BIRIM; none or several give no unit. A missing column fails closed (SOURCE_REJECTED).
// Only these columns may be selected (no STOK.CARI or other supplier/customer columns).
const catalog = {product: "STOK", name: "AD", group: "STOK_GRUP", groupName: "AD", unitLink: "STOK_STOK_BIRIM", unit: "STOK_BIRIM", unitName: "AD"} as const;
const unitName = `UPPER(LTRIM(RTRIM(u.[${catalog.unitName}])))`;
const productSql = `SELECT TOP (256) CONVERT(varchar(20),s.ID) AS ID, CASE WHEN LEN(LTRIM(RTRIM(s.[${catalog.name}])))<=160 THEN CONVERT(nvarchar(160),LTRIM(RTRIM(s.[${catalog.name}]))) END AS NAME, CASE WHEN LEN(LTRIM(RTRIM(g.[${catalog.groupName}])))<=160 THEN CONVERT(nvarchar(160),LTRIM(RTRIM(g.[${catalog.groupName}]))) END AS CATEGORY, CASE WHEN u.ID IS NULL THEN NULL WHEN NULLIF(LTRIM(RTRIM(u.[${catalog.unitName}])),N'') IS NULL THEN NULL WHEN ${unitName} IN (N'ADET',N'AD') THEN 'adet' WHEN ${unitName} IN (N'KG',N'KILO',N'KİLO',N'KILOGRAM',N'KİLOGRAM') THEN 'kg' ELSE 'other' END AS UNIT FROM dbo.${catalog.product} s LEFT JOIN dbo.${catalog.group} g ON g.ID=s.[${catalog.group}] LEFT JOIN dbo.${catalog.unit} u ON u.ID=(SELECT CASE WHEN COUNT(b.[${catalog.product}])=1 THEN MAX(b.[${catalog.unit}]) END FROM dbo.${catalog.unitLink} b WHERE b.[${catalog.product}]=s.ID AND b.VARSAYILAN=1) WHERE s.ID IN (SELECT l.STOK FROM dbo.FIS_DETAY l JOIN dbo.FIS f ON f.ID=l.FIS WHERE RANGE) AND (@cursor IS NULL OR s.ID>CONVERT(bigint,@cursor)) ORDER BY s.ID`;
const unsafeLabel = /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u2028\u2029\u202a-\u202e\u2066-\u2069]/;
const label = (v: string | null) => { const t = v?.trim(); return !t || t.length > 160 || unsafeLabel.test(t) ? null : t; };
const guardTables = ["FIS", "FIS_DETAY", "DOVIZ_AD", catalog.product, catalog.group, catalog.unitLink, catalog.unit];
const guard = `IF ISNULL(IS_SRVROLEMEMBER('sysadmin'),1) <> 0 OR ISNULL(IS_MEMBER('db_owner'),1) <> 0 OR ISNULL(HAS_PERMS_BY_NAME(NULL,NULL,'CONTROL SERVER'),1) <> 0 THROW 51000,'SOURCE_REJECTED',1;
${["CONTROL", "ALTER", "CREATE TABLE", "EXECUTE"].map(p => `IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(),'DATABASE','${p}'),1) <> 0 THROW 51000,'SOURCE_REJECTED',1;`).join("\n")}
${guardTables.map(t => `IF EXISTS (SELECT 1 FROM sys.fn_my_permissions('dbo.${t}','OBJECT') WHERE permission_name IN ('INSERT','UPDATE','DELETE','ALTER','CONTROL','TAKE OWNERSHIP')) THROW 51000,'SOURCE_REJECTED',1;`).join("\n")}
${guardTables.flatMap(t => ["CONTROL", "ALTER", "INSERT", "UPDATE", "DELETE", "TAKE OWNERSHIP"].map(p => `IF ISNULL(HAS_PERMS_BY_NAME('dbo.${t}','OBJECT','${p}'),1) <> 0 THROW 51000,'SOURCE_REJECTED',1;`)).join("\n")}`;
const range = "f.FIS_TARIHI >= CONVERT(datetime,REPLACE(@from,'-',''),112) AND f.FIS_TARIHI < DATEADD(day,1,CONVERT(datetime,REPLACE(@to,'-',''),112))";
const costColumn = "BELGE_TARIHINDEKI_SON_ALIS_FIYATI";
// Plans each page for its own window and cursor. A cached plan for `@cursor IS NULL OR ID > @cursor` cannot seek, so on the
// restored source (1.9M lines) every page rescanned FIS_DETAY and one month of pages overran the 60 s deadline.
const perPagePlan = " OPTION (RECOMPILE)";
export type ExtractOptions = { cost?: boolean };
/** The only SQL the extractor sends. `cost` adds exactly the approved historical-cost candidate for estimate packages. */
export function sourceQueries(options: ExtractOptions = {}) {
  const lineSelect = [...lineColumns, ...options.cost ? [costColumn] : []];
  return {
    guard,
    headers: `SELECT TOP (256) ${headerColumns.map(c => `CONVERT(varchar(80),f.[${c}]) AS [${c}]`).join(",")}, CONVERT(varchar(23),f.FIS_TARIHI,126) AS FIS_TARIHI, CASE WHEN d.AD='TRY' THEN 'TRY' WHEN d.AD='USD' THEN 'USD' WHEN d.ID IS NULL THEN NULL ELSE 'OTHER' END AS CURRENCY FROM dbo.FIS f LEFT JOIN dbo.DOVIZ_AD d ON d.ID=f.DOVIZ_AD WHERE ${range} AND (@cursor IS NULL OR f.ID>CONVERT(bigint,@cursor)) ORDER BY f.ID${perPagePlan}`,
    lines: `SELECT TOP (256) ${lineSelect.map(c => `CONVERT(varchar(80),l.[${c}]) AS [${c}]`).join(",")} FROM dbo.FIS_DETAY l JOIN dbo.FIS f ON f.ID=l.FIS WHERE ${range} AND (@cursor IS NULL OR l.ID>CONVERT(bigint,@cursor)) ORDER BY l.ID${perPagePlan}`,
    products: productSql.replace("RANGE", range) + perPagePlan,
  };
}

export async function extractSqlServer(input: SqlServerConfig, signal?: AbortSignal, options: ExtractOptions = {}): Promise<SqlSnapshot> {
  const config = parseSqlServerConfig(input);
  const queries = sourceQueries(options);
  let tooLarge = false;
  if (signal?.aborted) throw failure("CANCELLED");
  const connection = new Connection({ server: config.server, authentication: { type: "default", options: { userName: config.user, password: config.password } }, options: { port: config.port, database: config.database, encrypt: true, trustServerCertificate: config.trustServerCertificate, connectTimeout: 10_000, requestTimeout: 15_000, cancelTimeout: 1000, appName: "Esmer isolated source reader" } });
  let stopped: string | undefined;
  let rejectPending: ((error: Error) => void) | undefined;
  const closed = new Promise<void>(resolve => connection.once("end", resolve));
  const stop = (code: string) => { stopped ??= code; rejectPending?.(failure(stopped)); connection.close(); };
  const abort = () => stop("CANCELLED");
  signal?.addEventListener("abort", abort, { once: true });
  const deadline = setTimeout(() => stop("SOURCE_TIMEOUT"), 60_000);
  connection.on("error", () => stop("SOURCE_UNAVAILABLE"));
  let bytes = 0;
  function query(sql: string, cursor?: string | null): Promise<SqlRow[]> {
    if (stopped) return Promise.reject(failure(stopped));
    return new Promise((resolve, reject) => {
      rejectPending = reject;
      const rows: SqlRow[] = [];
      const request = new Request(`SET NOCOUNT ON; SET XACT_ABORT ON; SET LOCK_TIMEOUT 3000; ${sql}`, error => {
        rejectPending = undefined;
        if (stopped) reject(failure(stopped));
        else if (error) { const number = "number" in error ? error.number : undefined; reject(failure(("code" in error && error.code === "ETIMEOUT") || number === 1222 ? "SOURCE_TIMEOUT" : "SOURCE_REJECTED")); }
        else resolve(rows);
      });
      request.on("row", columns => {
        const row: SqlRow = {};
        for (const column of columns) {
          if (column.value !== null && typeof column.value !== "string") { stop("SOURCE_REJECTED"); return; }
          row[column.metadata.colName] = column.value;
        }
        bytes += Buffer.byteLength(JSON.stringify(row));
        if (bytes > MAX_BYTES || rows.length >= 256) { tooLarge ||= bytes > MAX_BYTES; stop("SOURCE_REJECTED"); return; }
        rows.push(row);
      });
      if (cursor !== undefined) {
        request.addParameter("from", TYPES.VarChar, config.from, { length: 10 });
        request.addParameter("to", TYPES.VarChar, config.to, { length: 10 });
        request.addParameter("cursor", TYPES.VarChar, cursor, { length: 20 });
      }
      connection.execSql(request);
    });
  }
  try {
    return await read();
  } catch (error) {
    // Size-bound failures keep the public SOURCE_REJECTED code; the cause lets monthly preparation choose a shorter window.
    throw tooLarge && error instanceof Error && error.message === "SOURCE_REJECTED" ? new Error("SOURCE_REJECTED", {cause: "SIZE_LIMIT"}) : error;
  } finally {
    clearTimeout(deadline); signal?.removeEventListener("abort", abort); connection.close(); await closed;
  }
  async function read(): Promise<SqlSnapshot> {
    await new Promise<void>((resolve, reject) => { rejectPending = reject; connection.connect(error => { rejectPending = undefined; if (stopped) reject(failure(stopped)); else if (error) reject(failure("SOURCE_UNAVAILABLE")); else resolve(); }); });
    await new Promise<void>((resolve, reject) => {
      rejectPending = reject;
      connection.beginTransaction(error => { rejectPending = undefined; if (stopped) reject(failure(stopped)); else if (error) reject(failure("SOURCE_REJECTED")); else resolve(); }, "esmer_snapshot", ISOLATION_LEVEL.SERIALIZABLE);
    });
    await query(queries.guard);
    const identities = await query("SELECT CONVERT(varchar(36),database_guid) AS databaseId, CONVERT(varchar(40),SERVERPROPERTY('ProductVersion')) AS engineVersion FROM sys.database_recovery_status WHERE database_id = DB_ID()");
    if (identities.length !== 1 || !identities[0].databaseId || identities[0].databaseId.toLowerCase() !== config.expectedDatabaseId.toLowerCase()) throw failure("SOURCE_CHANGED");
    const headers: SqlRow[] = []; const lines: SqlRow[] = []; const products: SqlRow[] = [];
    for (const stream of ["headers", "lines", "products"] as const) {
      let cursor: string | null = null;
      while (true) {
        const sql = queries[stream];
        const batch = await query(sql, cursor);
        if (headers.length + lines.length + products.length + batch.length > MAX_ROWS) { tooLarge = true; throw failure(); }
        for (const row of batch) { if (!row.ID || !/^-?\d{1,19}$/.test(row.ID) || (cursor !== null && BigInt(row.ID) <= BigInt(cursor))) throw failure(); cursor = row.ID; }
        (stream === "headers" ? headers : stream === "lines" ? lines : products).push(...stream === "products" ? batch.map(row => ({...row, NAME: label(row.NAME), CATEGORY: label(row.CATEGORY)})) : batch);
        if (batch.length < 256) break;
      }
    }
    const ids = new Set(headers.map(row => row.ID));
    if (lines.some(row => !ids.has(row.FIS))) throw failure();
    const stoks = new Set(lines.map(row => row.STOK));
    if (products.some(row => !stoks.has(row.ID))) throw failure();
    await new Promise<void>((resolve, reject) => {
      rejectPending = reject;
      connection.commitTransaction(error => { rejectPending = undefined; if (stopped) reject(failure(stopped)); else if (error) reject(failure("SOURCE_REJECTED")); else resolve(); });
    });
    return { databaseId: identities[0].databaseId, engineVersion: identities[0].engineVersion ?? "unknown", capturedAt: new Date().toISOString(), from: config.from, to: config.to, headers, lines, products };
  }
}
