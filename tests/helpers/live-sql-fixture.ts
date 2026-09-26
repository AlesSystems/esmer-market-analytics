import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { Connection, Request } from "tedious";
import type { SqlServerConfig } from "../../src/source/sql-server";

type Admin = {server: string; port: number; user: string; password: string; scope: "isolated-test-setup"};
type Row = Record<string, unknown>;
export type SqlTestConnection = {query: (sql: string) => Promise<Row[]>; close: () => Promise<void>};
async function connect(config: Admin, database: string): Promise<SqlTestConnection> {
  const connection = new Connection({server: config.server, authentication: {type: "default", options: {userName: config.user, password: config.password}}, options: {port: config.port, database, encrypt: true, trustServerCertificate: true, connectTimeout: 10_000, requestTimeout: 10_000, cancelTimeout: 1000, appName: "Esmer disposable synthetic tests"}});
  connection.on("error", () => {});
  const ended = new Promise<void>(resolve => connection.once("end", resolve));
  try {await new Promise<void>((resolve, reject) => connection.connect(error => error ? reject(new Error("FIXTURE_CONNECTION_FAILED")) : resolve()));}
  catch (error) {connection.close(); await ended; throw error;}
  return {
    query: sql => new Promise((resolve, reject) => {
      const rows: Row[] = [];
      const request = new Request(sql, error => error ? reject(new Error("FIXTURE_QUERY_REJECTED")) : resolve(rows));
      request.on("row", (columns: {metadata: {colName: string}; value: unknown}[]) => {rows.push(Object.fromEntries(columns.map(column => [column.metadata.colName, column.value])));});
      connection.execSqlBatch(request);
    }),
    close: async () => {connection.close(); await ended;},
  };
}
export async function createLiveSqlFixture(path: string) {
  const admin: Admin = JSON.parse(await readFile(path, "utf8"));
  if (!admin || typeof admin !== "object" || Object.keys(admin).sort().join() !== ["server", "port", "user", "password", "scope"].sort().join() || !["localhost", "127.0.0.1", "::1"].includes(admin.server) || !Number.isInteger(admin.port) || admin.port < 1024 || admin.port > 65535 || admin.port === 1433 || admin.scope !== "isolated-test-setup" || admin.user !== "sa" || typeof admin.password !== "string" || !admin.password) throw new Error("UNSAFE_FIXTURE_TARGET");
  const suffix = randomBytes(8).toString("hex");
  const database = `EsmerLiveFixture_${suffix}`, user = `EsmerFixtureReader_${suffix}`, password = `Fixture!${randomBytes(24).toString("hex")}`;
  const master = await connect(admin, "master");
  let createdDatabase = false, createdLogin = false;
  const connections = new Set<SqlTestConnection>();
  const open = async (credentials = admin) => {const result = await connect(credentials, database); connections.add(result); return result;};
  const close = async () => {
    await Promise.all([...connections].map(connection => connection.close())); connections.clear();
    try {
      if (createdDatabase) await master.query(`ALTER DATABASE [${database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${database}]`);
      if (createdLogin) await master.query(`DROP LOGIN [${user}]`);
    } finally {await master.close();}
  };
  try {
    await master.query(`CREATE DATABASE [${database}]`); createdDatabase = true;
    await master.query(`CREATE LOGIN [${user}] WITH PASSWORD=N'${password}', CHECK_POLICY=OFF, DEFAULT_DATABASE=[${database}]`); createdLogin = true;
    const writer = await open();
    await writer.query(`CREATE TABLE dbo.DOVIZ_AD(ID bigint PRIMARY KEY, AD varchar(10));
CREATE SEQUENCE dbo.FixtureIds AS bigint START WITH 1 INCREMENT BY 1;
CREATE TABLE dbo.FIS(ID bigint PRIMARY KEY, FIS_TURU int, DOVIZ_AD bigint, DURUM int, AKTIF int, SATIR_TOPLAM decimal(24,8), SATIR_ISKONTO_TOPLAM decimal(24,8), FIS_ISKONTO_TOPLAM decimal(24,8), KDV_TOPLAM decimal(24,8), OTV_TOPLAM decimal(24,8), TEFKIFAT_TOPLAM decimal(24,8), GENELTOPLAM decimal(24,8), FIS_TARIHI datetime, MUSTERI_AD nvarchar(100));
CREATE TABLE dbo.FIS_DETAY(ID bigint PRIMARY KEY, FIS bigint REFERENCES dbo.FIS(ID), STOK bigint, FIS_TURU int, CARPAN decimal(24,8), MIKTAR_FIS decimal(24,8), TOPLAM_KDV_MATRAHI decimal(24,8), TOPLAM_KDV decimal(24,8), TOPLAM_OTV decimal(24,8), TOPLAM_TEVKIF decimal(24,8));
INSERT dbo.DOVIZ_AD VALUES(1,'TRY');
CREATE USER [${user}] FOR LOGIN [${user}];
GRANT SELECT (ID,FIS_TURU,DOVIZ_AD,DURUM,AKTIF,SATIR_TOPLAM,SATIR_ISKONTO_TOPLAM,FIS_ISKONTO_TOPLAM,KDV_TOPLAM,OTV_TOPLAM,TEFKIFAT_TOPLAM,GENELTOPLAM,FIS_TARIHI) ON dbo.FIS TO [${user}];
GRANT SELECT (ID,FIS,STOK,FIS_TURU,CARPAN,MIKTAR_FIS,TOPLAM_KDV_MATRAHI,TOPLAM_KDV,TOPLAM_OTV,TOPLAM_TEVKIF) ON dbo.FIS_DETAY TO [${user}];
GRANT SELECT (ID,AD) ON dbo.DOVIZ_AD TO [${user}];`);
    const identity = await writer.query("SELECT CONVERT(varchar(36),database_guid) AS id FROM sys.database_recovery_status WHERE database_id=DB_ID()");
    const config: SqlServerConfig = {server: admin.server, port: admin.port, database, user, password, trustServerCertificate: true, scope: "isolated-copy", lineage: database, expectedDatabaseId: String(identity[0].id), from: "2025-01-01", to: "2025-12-31"};
    const waitForReaderLock = async () => {
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        const waiting = await writer.query("SELECT r.session_id FROM sys.dm_exec_requests r JOIN sys.dm_exec_sessions s ON s.session_id=r.session_id WHERE r.database_id=DB_ID() AND s.program_name=N'Esmer isolated source reader' AND r.wait_type LIKE N'LCK_M_%' AND r.blocking_session_id>0");
        if (waiting.length) return;
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      throw new Error("READER_LOCK_BARRIER_TIMEOUT");
    };
    return {config, execute: writer.query, waitForReaderLock, connectWriter: () => open(), readerQuery: async (sql: string) => {const reader = await open({...admin, user, password}); try {return await reader.query(sql);} finally {await reader.close(); connections.delete(reader);}}, close};
  } catch (error) {await close(); throw error;}
}
export function syntheticHeader(id: string, date = "2025-09-10") {
  if (!/^\d+$/.test(id) || !/^2025-\d{2}-\d{2}$/.test(date)) throw new Error("INVALID_SYNTHETIC_VALUE");
  return `INSERT dbo.FIS VALUES(${id},11,1,1,1,123.12345678,0,0,0,0,0,123.12345678,'${date}',N'SYNTHETIC_PRIVATE_SENTINEL')`;
}
export function syntheticLine(id: string, header: string) {
  if (!/^\d+$/.test(id) || !/^\d+$/.test(header)) throw new Error("INVALID_SYNTHETIC_VALUE");
  return `INSERT dbo.FIS_DETAY VALUES(${id},${header},9007199254740997,11,1.00000000,2.12345678,123.12345678,0,0,0)`;
}
