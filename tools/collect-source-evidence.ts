import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { link, open, unlink } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const columns = [
  ["FIS", "ID", "bigint", "19", "0"], ["FIS", "FIS_TURU", "int", "10", "0"], ["FIS", "FIS_TARIHI", "datetime", "23", "3"],
  ["FIS", "DOVIZ_AD", "bigint", "19", "0"], ["FIS", "DURUM", "bit", "1", "0"], ["FIS", "AKTIF", "bit", "1", "0"],
  ["FIS_DETAY", "ID", "bigint", "19", "0"], ["FIS_DETAY", "FIS", "bigint", "19", "0"], ["FIS_DETAY", "STOK", "bigint", "19", "0"],
  ["FIS_DETAY", "BELGE_TARIHINDEKI_SON_ALIS_FIYATI", "decimal", "18", "8"], ["FIS_DETAY", "CARPAN", "decimal", "18", "8"],
  ["FIS_DETAY", "MIKTAR_FIS", "decimal", "18", "3"], ["FIS_DETAY", "TOPLAM_KDV_MATRAHI", "decimal", "18", "8"], ["FIS_DETAY", "TOPLAM_KDV", "decimal", "18", "8"],
  ["STOK", "ID", "bigint", "19", "0"], ["DOVIZ_AD", "ID", "bigint", "19", "0"], ["DOVIZ_AD", "AD", "nvarchar", "0", "0"],
];
const maxBytes = 131072;
const maxGroups = 128;
const query = `SET NOCOUNT ON;
SET XACT_ABORT ON;
IF ISNULL(IS_SRVROLEMEMBER('sysadmin'), 1) <> 0 OR ISNULL(IS_MEMBER('db_owner'), 1) <> 0
 OR ISNULL(HAS_PERMS_BY_NAME(NULL, NULL, 'CONTROL SERVER'), 1) <> 0
 THROW 51000, 'EVIDENCE_ACCOUNT_REJECTED', 1;
IF ISNULL(CONVERT(nvarchar(60), DATABASEPROPERTYEX(DB_NAME(), 'Updateability')), '') <> 'READ_ONLY'
 THROW 51000, 'EVIDENCE_READONLY_REQUIRED', 1;
SELECT 'STATE|before|1';
SELECT CONCAT('ENGINE|', CONVERT(varchar(40), SERVERPROPERTY('ProductVersion')), '|', CONVERT(varchar(10), SERVERPROPERTY('EngineEdition')), '|', CONVERT(varchar(10), compatibility_level)) FROM sys.databases WHERE database_id = DB_ID();
SELECT CONCAT('SCHEMA|', t.name, '|', c.name, '|', ty.name, '|', CONVERT(varchar(3), c.precision), '|', CONVERT(varchar(3), c.scale))
FROM sys.tables t JOIN sys.schemas s ON s.schema_id = t.schema_id
JOIN sys.columns c ON c.object_id = t.object_id JOIN sys.types ty ON ty.user_type_id = c.user_type_id
WHERE s.name = 'dbo' AND (${columns.map(([table, column]) => `(t.name = '${table}' AND c.name = '${column}')`).join(" OR ")})
ORDER BY t.name, c.name;
SELECT CONCAT('COUNT|FIS|', CONVERT(varchar(20), COUNT_BIG(ID))) FROM dbo.FIS;
SELECT CONCAT('COUNT|FIS_DETAY|', CONVERT(varchar(20), COUNT_BIG(ID))) FROM dbo.FIS_DETAY;
SELECT CONCAT('COUNT|STOK|', CONVERT(varchar(20), COUNT_BIG(ID))) FROM dbo.STOK;
IF EXISTS (SELECT ID FROM dbo.DOVIZ_AD GROUP BY ID HAVING COUNT_BIG(ID) > 1)
 THROW 51000, 'EVIDENCE_DICTIONARY_REJECTED', 1;
SELECT TOP (${maxGroups + 1}) CONCAT('GROUP|', COALESCE(CONVERT(varchar(11), f.FIS_TURU), 'NULL'), '|',
 CASE WHEN f.DOVIZ_AD IS NULL THEN 'NULL' WHEN d.AD = 'TRY' THEN 'TRY' WHEN d.AD = 'USD' THEN 'USD' ELSE 'OTHER' END, '|',
 CONVERT(varchar(20), COUNT_BIG(f.ID)), '|', COALESCE(CONVERT(varchar(23), MIN(f.FIS_TARIHI), 126), 'NULL'), '|', COALESCE(CONVERT(varchar(23), MAX(f.FIS_TARIHI), 126), 'NULL'))
FROM dbo.FIS f LEFT JOIN dbo.DOVIZ_AD d ON d.ID = f.DOVIZ_AD
GROUP BY f.FIS_TURU, CASE WHEN f.DOVIZ_AD IS NULL THEN 'NULL' WHEN d.AD = 'TRY' THEN 'TRY' WHEN d.AD = 'USD' THEN 'USD' ELSE 'OTHER' END
ORDER BY f.FIS_TURU, 1;
IF ISNULL(CONVERT(nvarchar(60), DATABASEPROPERTYEX(DB_NAME(), 'Updateability')), '') <> 'READ_ONLY'
 THROW 51000, 'EVIDENCE_READONLY_REQUIRED', 1;
SELECT 'STATE|after|1';
GO
:EXIT
`;

type Config = { scope: "isolated-copy"; server: string; database: string; user: string; sqlcmdPath?: string; trustServerCertificate?: boolean };
type SchemaColumn = { table: string; column: string; type: string; precision: string; scale: string };
export type SourceEvidenceV1 = {
  format: "source-evidence-v1"; querySet: "r1-metadata-aggregates-v1"; sourceBatch: string; collectedAt: string;
  engine: { productVersion: string; engineEdition: string; compatibilityLevel: string };
  readOnly: { before: true; after: true }; schema: SchemaColumn[]; schemaFingerprint: string;
  populations: { FIS: string; FIS_DETAY: string; STOK: string };
  groups: { documentType: string | null; currency: "TRY" | "USD" | "OTHER" | null; count: string; minDate: string | null; maxDate: string | null }[];
  limits: { elapsedMs: number; stdoutBytes: number };
  limitations: string[];
};

function parseConfig(value: unknown): Config {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error();
  const c = value as Record<string, unknown>;
  if (Object.keys(c).some(k => !["scope", "server", "database", "user", "sqlcmdPath", "trustServerCertificate"].includes(k)) || c.scope !== "isolated-copy") throw new Error();
  for (const key of ["server", "database", "user", ...(c.sqlcmdPath === undefined ? [] : ["sqlcmdPath"])]) {
    if (typeof c[key] !== "string" || c[key].length < 1 || c[key].length > 1024 || /[\x00-\x1f\x7f]/.test(c[key]) || c[key].startsWith("-")) throw new Error();
  }
  if (/^(sa|dbo)$/i.test(c.user as string) || (c.trustServerCertificate !== undefined && typeof c.trustServerCertificate !== "boolean")) throw new Error();
  return c as Config;
}

function parseOutput(output: Buffer) {
  const lines = new TextDecoder("utf-8", { fatal: true }).decode(output).split(/\r?\n/).filter(line => line !== "");
  if (lines.length > columns.length + maxGroups + 6 || lines.shift() !== "STATE|before|1" || lines.pop() !== "STATE|after|1") throw new Error();
  const schema: SchemaColumn[] = []; const groups: SourceEvidenceV1["groups"] = [];
  const populations: Partial<SourceEvidenceV1["populations"]> = {};
  const seen = new Set<string>(); let engine: SourceEvidenceV1["engine"] | undefined;
  const count = (s: string) => /^(0|[1-9][0-9]{0,18})$/.test(s) && BigInt(s) <= 9223372036854775807n;
  const date = (s: string) => s === "NULL" || /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?$/.test(s);
  for (const line of lines) {
    const [tag, ...p] = line.split("|");
    if (tag === "ENGINE" && p.length === 3 && !engine && /^\d{1,3}\.\d{1,3}\.\d{1,6}\.\d{1,6}$/.test(p[0]) && /^\d{1,2}$/.test(p[1]) && /^\d{2,3}$/.test(p[2])) {
      engine = { productVersion: p[0], engineEdition: p[1], compatibilityLevel: p[2] };
    } else if (tag === "SCHEMA" && p.length === 5) {
      const expected = columns.find(c => c[0] === p[0] && c[1] === p[1]); const key = p.slice(0, 2).join("|");
      if (!expected || seen.has(key) || p.slice(3).join("|") !== expected.slice(3).join("|") || (p[2] !== expected[2] && !(key === "DOVIZ_AD|AD" && ["varchar", "char", "nchar"].includes(p[2])))) throw new Error();
      seen.add(key); schema.push({ table: p[0], column: p[1], type: p[2], precision: p[3], scale: p[4] });
    } else if (tag === "COUNT" && p.length === 2 && ["FIS", "FIS_DETAY", "STOK"].includes(p[0]) && count(p[1])) {
      const key = p[0] as keyof typeof populations;
      if (populations[key] !== undefined) throw new Error(); populations[key] = p[1];
    } else if (tag === "GROUP" && p.length === 5 && (p[0] === "NULL" || /^-?(0|[1-9]\d{0,9})$/.test(p[0])) && ["TRY", "USD", "OTHER", "NULL"].includes(p[1]) && count(p[2]) && date(p[3]) && date(p[4])) {
      const key = `GROUP|${p[0]}|${p[1]}`;
      if (seen.has(key) || groups.length >= maxGroups || (p[0] !== "NULL" && (BigInt(p[0]) < -2147483648n || BigInt(p[0]) > 2147483647n)) || (p[3] === "NULL") !== (p[4] === "NULL") || p[3] > p[4]) throw new Error();
      seen.add(key); groups.push({ documentType: p[0] === "NULL" ? null : p[0], currency: p[1] === "NULL" ? null : p[1] as "TRY" | "USD" | "OTHER", count: p[2], minDate: p[3] === "NULL" ? null : p[3], maxDate: p[4] === "NULL" ? null : p[4] });
    } else { throw new Error(); }
  }
  if (!engine || schema.length !== columns.length || populations.FIS === undefined || populations.FIS_DETAY === undefined || populations.STOK === undefined || groups.reduce((sum, g) => sum + BigInt(g.count), 0n) !== BigInt(populations.FIS)) throw new Error();
  schema.sort((a, b) => `${a.table}.${a.column}`.localeCompare(`${b.table}.${b.column}`, "en"));
  return { engine, schema, populations: populations as SourceEvidenceV1["populations"], groups };
}

async function runSqlcmd(config: Config, password: string, timeoutMs: number, signal?: AbortSignal): Promise<Buffer> {
  if (signal?.aborted) throw new Error();
  return new Promise((resolve, reject) => {
    const args = ["-S", config.server, "-d", config.database, "-U", config.user, "-N", "-b", "-r1", "-h", "-1", "-W", "-w", "65535", "-l", "15", "-t", "30", "-x", ...(config.trustServerCertificate ? ["-C"] : [])];
    const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.toUpperCase().startsWith("SQLCMD")));
    const child = spawn(config.sqlcmdPath ?? "sqlcmd", args, { env: { ...env, SQLCMDPASSWORD: password }, stdio: ["pipe", "pipe", "pipe"], detached: process.platform !== "win32" });
    const chunks: Buffer[] = []; let bytes = 0; let failed = false; let escalation: Promise<void> | undefined;
    function kill(signal: NodeJS.Signals) {
      try { if (process.platform !== "win32" && child.pid) process.kill(-child.pid, signal); else child.kill(signal); } catch { }
    }
    function stop() { if (!failed) { failed = true; kill("SIGTERM"); escalation = new Promise(resolve => setTimeout(() => { kill("SIGKILL"); resolve(); }, 250)); } }
    const timer = setTimeout(stop, timeoutMs);
    signal?.addEventListener("abort", stop, { once: true });
    child.stdout.on("data", (data: Buffer) => { bytes += data.length; if (bytes > maxBytes) stop(); else if (!failed) chunks.push(data); });
    child.stderr.on("data", (data: Buffer) => { bytes += data.length; if (bytes > maxBytes) stop(); });
    child.on("error", stop); child.stdin.on("error", stop);
    child.on("close", async code => {
      clearTimeout(timer); signal?.removeEventListener("abort", stop);
      if (code !== 0) stop();
      await escalation;
      if (failed || code !== 0 || signal?.aborted) reject(new Error()); else resolve(Buffer.concat(chunks));
    });
    child.stdin.end(query);
  });
}

export async function collectSourceEvidence(options: { configPath: string; destination: string; batch: string; password?: string; signal?: AbortSignal; timeoutMs?: number }): Promise<{ ok: true } | { ok: false; code: "EVIDENCE_FAILED" }> {
  let temporary: string | undefined;
  try {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(options.batch)) throw new Error();
    const timeoutMs = options.timeoutMs ?? 45000;
    if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 45000) throw new Error();
    const file = await open(options.configPath, "r"); let config: Config;
    try { if ((await file.stat()).size > 8192) throw new Error(); config = parseConfig(JSON.parse(await file.readFile("utf8"))); } finally { await file.close(); }
    const password = options.password ?? process.env.SQLCMDPASSWORD;
    if (!password || password.length > 4096 || /[\x00\r\n]/.test(password)) throw new Error();
    const start = Date.now(); const output = await runSqlcmd(config, password, timeoutMs, options.signal);
    const observations = parseOutput(output);
    const evidence: SourceEvidenceV1 = {
      format: "source-evidence-v1", querySet: "r1-metadata-aggregates-v1", sourceBatch: options.batch, collectedAt: new Date().toISOString(),
      ...observations, schemaFingerprint: createHash("sha256").update(JSON.stringify(observations.schema)).digest("hex"),
      readOnly: { before: true, after: true }, limits: { elapsedMs: Date.now() - start, stdoutBytes: output.length },
      limitations: ["isolated-copy-only", "operator-attested-frozen-clone", "no-financial-semantics", "not-a-source-reconciliation", ...(config.trustServerCertificate ? ["server-certificate-not-validated"] : [])],
    };
    if (options.signal?.aborted) throw new Error();
    temporary = `${options.destination}.${randomUUID()}.partial`;
    const target = await open(temporary, "wx", 0o600);
    try { await target.writeFile(JSON.stringify(evidence, null, 2) + "\n"); await target.sync(); } finally { await target.close(); }
    if (options.signal?.aborted) throw new Error();
    await link(temporary, options.destination);
    return { ok: true };
  } catch { return { ok: false, code: "EVIDENCE_FAILED" }; }
  finally { if (temporary) await unlink(temporary).catch(() => undefined); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [configPath, destination, batch] = process.argv.slice(2);
  const controller = new AbortController(); const cancel = () => controller.abort();
  process.once("SIGINT", cancel); process.once("SIGTERM", cancel);
  const result = process.argv.length === 5 && configPath && destination && batch
    ? await collectSourceEvidence({ configPath, destination, batch, signal: controller.signal }) : { ok: false, code: "EVIDENCE_FAILED" };
  process.removeListener("SIGINT", cancel); process.removeListener("SIGTERM", cancel);
  console.log(result.ok ? "EVIDENCE_COLLECTED" : "EVIDENCE_FAILED"); process.exitCode = result.ok ? 0 : 1;
}
