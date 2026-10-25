import { readFile, writeFile, rm } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Connection, Request } from "tedious";
import { extractSqlServer, parseSqlServerConfig, type SqlServerConfig } from "../../src/source/sql-server.ts";
import {
  assertConfigOutsideRepo,
  assertDropTarget,
  baselineExpected,
  checkExpected,
  isScenarioName,
  scenarioExpected,
  SYNTHETIC_DEV_DATABASE,
  SYNTHETIC_DEV_READER,
} from "../../tools/synthetic-sql/observations.ts";

const repoRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

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

function parseAdmin(raw: unknown): Admin {
  const admin = raw as Admin;
  if (!admin || typeof admin !== "object" || Object.keys(admin).sort().join() !== ["server", "port", "user", "password", "scope"].sort().join() || !["localhost", "127.0.0.1", "::1"].includes(admin.server) || !Number.isInteger(admin.port) || admin.port < 1024 || admin.port > 65535 || admin.port === 1433 || admin.scope !== "isolated-test-setup" || admin.user !== "sa" || typeof admin.password !== "string" || !admin.password) throw new Error("UNSAFE_FIXTURE_TARGET");
  return admin;
}

async function loadAdmin(path: string): Promise<Admin> {
  return parseAdmin(JSON.parse(await readFile(path, "utf8")));
}

function provisionSql(reader: string): string {
  return `IF OBJECT_ID(N'dbo.FIS') IS NULL
BEGIN
CREATE TABLE dbo.DOVIZ_AD(ID bigint PRIMARY KEY, AD varchar(10));
CREATE SEQUENCE dbo.FixtureIds AS bigint START WITH 1 INCREMENT BY 1;
CREATE TABLE dbo.FIS(ID bigint PRIMARY KEY, FIS_TURU int, DOVIZ_AD bigint, DURUM int, AKTIF int, SATIR_TOPLAM decimal(24,8), SATIR_ISKONTO_TOPLAM decimal(24,8), FIS_ISKONTO_TOPLAM decimal(24,8), KDV_TOPLAM decimal(24,8), OTV_TOPLAM decimal(24,8), TEFKIFAT_TOPLAM decimal(24,8), GENELTOPLAM decimal(24,8), FIS_TARIHI datetime, MUSTERI_AD nvarchar(100));
CREATE TABLE dbo.FIS_DETAY(ID bigint PRIMARY KEY, FIS bigint REFERENCES dbo.FIS(ID), STOK bigint, FIS_TURU int, CARPAN decimal(24,8), MIKTAR_FIS decimal(24,8), TOPLAM_KDV_MATRAHI decimal(24,8), TOPLAM_KDV decimal(24,8), TOPLAM_OTV decimal(24,8), TOPLAM_TEVKIF decimal(24,8), BELGE_TARIHINDEKI_SON_ALIS_FIYATI decimal(24,8));
INSERT dbo.DOVIZ_AD VALUES(1,'TRY');
END
IF OBJECT_ID(N'dbo.STOK') IS NULL
BEGIN
CREATE TABLE dbo.STOK_GRUP(ID bigint PRIMARY KEY, AD nvarchar(100), SORUMLU nvarchar(100));
CREATE TABLE dbo.STOK_BIRIM(ID bigint PRIMARY KEY, AD nvarchar(50), CARPAN decimal(24,8), NOKTALI bit);
CREATE TABLE dbo.STOK(ID bigint PRIMARY KEY, AD nvarchar(400), STOK_GRUP bigint, CARI bigint, ORTALAMA_MALIYET decimal(24,8), TEDARIKCI_AD nvarchar(100));
INSERT dbo.STOK_GRUP VALUES(1,N'Sentetik Grup',N'SYNTHETIC_PRIVATE_SENTINEL');
INSERT dbo.STOK_BIRIM VALUES(1,N'ADET',1,0);
INSERT dbo.STOK VALUES(9007199254740997,N'Sentetik Ürün',1,770077007,1.00000000,N'SYNTHETIC_PRIVATE_SENTINEL');
END
-- The real source has no STOK unit column: each product links to its units here, one marked VARSAYILAN.
IF OBJECT_ID(N'dbo.STOK_STOK_BIRIM') IS NULL
BEGIN
CREATE TABLE dbo.STOK_STOK_BIRIM(ID bigint IDENTITY PRIMARY KEY, STOK bigint, STOK_BIRIM bigint, CARPAN decimal(24,8), VARSAYILAN bit, AGIRLIK decimal(24,8));
INSERT dbo.STOK_STOK_BIRIM(STOK,STOK_BIRIM,CARPAN,VARSAYILAN,AGIRLIK) VALUES(9007199254740997,1,1,1,770.077);
END
IF COL_LENGTH(N'dbo.FIS_DETAY',N'BELGE_TARIHINDEKI_SON_ALIS_FIYATI') IS NULL ALTER TABLE dbo.FIS_DETAY ADD BELGE_TARIHINDEKI_SON_ALIS_FIYATI decimal(24,8);
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name=N'${reader}') CREATE USER [${reader}] FOR LOGIN [${reader}];
REVOKE SELECT ON dbo.FIS_DETAY FROM [${reader}];
GRANT SELECT (ID,FIS_TURU,DOVIZ_AD,DURUM,AKTIF,SATIR_TOPLAM,SATIR_ISKONTO_TOPLAM,FIS_ISKONTO_TOPLAM,KDV_TOPLAM,OTV_TOPLAM,TEFKIFAT_TOPLAM,GENELTOPLAM,FIS_TARIHI) ON dbo.FIS TO [${reader}];
GRANT SELECT (ID,FIS,STOK,FIS_TURU,CARPAN,MIKTAR_FIS,TOPLAM_KDV_MATRAHI,TOPLAM_KDV,TOPLAM_OTV,TOPLAM_TEVKIF,BELGE_TARIHINDEKI_SON_ALIS_FIYATI) ON dbo.FIS_DETAY TO [${reader}];
GRANT SELECT (ID,AD) ON dbo.DOVIZ_AD TO [${reader}];
GRANT SELECT (ID,AD,STOK_GRUP) ON dbo.STOK TO [${reader}];
GRANT SELECT (STOK,STOK_BIRIM,VARSAYILAN) ON dbo.STOK_STOK_BIRIM TO [${reader}];
GRANT SELECT (ID,AD) ON dbo.STOK_GRUP TO [${reader}];
GRANT SELECT (ID,AD) ON dbo.STOK_BIRIM TO [${reader}];`;
}

function readerPassword(): string {
  return `Fixture!${randomBytes(24).toString("hex")}`;
}

async function writeReaderConfig(config: SqlServerConfig): Promise<void> {
  const path = process.env.ESMER_SQL_DEV_CONFIG;
  if (!path) return;
  await assertConfigOutsideRepo(path, repoRoot);
  await writeFile(path, `${JSON.stringify(config)}\n`, {mode: 0o600});
}

async function readerConfigFor(admin: Admin, password: string): Promise<SqlServerConfig> {
  const writer = await connect(admin, SYNTHETIC_DEV_DATABASE);
  try {
    const identity = await writer.query("SELECT CONVERT(varchar(36),database_guid) AS id FROM sys.database_recovery_status WHERE database_id=DB_ID()");
    return {server: admin.server, port: admin.port, database: SYNTHETIC_DEV_DATABASE, user: SYNTHETIC_DEV_READER, password, trustServerCertificate: true, scope: "isolated-copy", lineage: SYNTHETIC_DEV_DATABASE, expectedDatabaseId: String(identity[0].id), from: "2025-01-01", to: "2025-12-31"};
  } finally {await writer.close();}
}

async function setReaderLogin(master: SqlTestConnection, password: string): Promise<void> {
  await master.query(`IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name=N'${SYNTHETIC_DEV_READER}') CREATE LOGIN [${SYNTHETIC_DEV_READER}] WITH PASSWORD=N'${password}', CHECK_POLICY=OFF, DEFAULT_DATABASE=[${SYNTHETIC_DEV_DATABASE}];
ELSE ALTER LOGIN [${SYNTHETIC_DEV_READER}] WITH PASSWORD=N'${password}', CHECK_POLICY=OFF, DEFAULT_DATABASE=[${SYNTHETIC_DEV_DATABASE}]`);
}

type CreatedResources = {database: boolean; login: boolean};
async function cleanupCreatedResources(admin: Admin, created: CreatedResources): Promise<void> {
  const master = await connect(admin, "master");
  try {
    if (created.database) await master.query(`ALTER DATABASE [${SYNTHETIC_DEV_DATABASE}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${SYNTHETIC_DEV_DATABASE}]`);
    if (created.login) await master.query(`DROP LOGIN [${SYNTHETIC_DEV_READER}]`);
  } finally {await master.close();}
}

async function ensureSyntheticDatabase(admin: Admin, password: string, rotatePassword: boolean): Promise<CreatedResources> {
  const master = await connect(admin, "master");
  const created = {database: false, login: false};
  try {
    const existing = await master.query(`SELECT name FROM sys.databases WHERE name=N'${SYNTHETIC_DEV_DATABASE}'`);
    if (!existing.length) {await master.query(`CREATE DATABASE [${SYNTHETIC_DEV_DATABASE}]`); created.database = true;}
    const login = await master.query(`SELECT name FROM sys.server_principals WHERE name=N'${SYNTHETIC_DEV_READER}'`);
    if (!login.length || rotatePassword) {await setReaderLogin(master, password); created.login = !login.length;}
    const writer = await connect(admin, SYNTHETIC_DEV_DATABASE);
    try {if (!existing.length || rotatePassword) await writer.query(provisionSql(SYNTHETIC_DEV_READER));}
    finally {await writer.close();}
    return created;
  } catch (error) {
    await cleanupCreatedResources(admin, created);
    throw error;
  } finally {await master.close();}
}

export async function createLiveSqlFixture(path: string) {
  const admin = await loadAdmin(path);
  const suffix = randomBytes(8).toString("hex");
  const database = `EsmerLiveFixture_${suffix}`, user = `EsmerFixtureReader_${suffix}`, password = readerPassword();
  const master = await connect(admin, "master");
  let createdDatabase = false, createdLogin = false;
  const connections = new Set<SqlTestConnection>();
  const open = async (credentials = admin) => {const result = await connect(credentials, database); connections.add(result); return result;};
  const close = async () => {
    await Promise.all([...connections].map(connection => connection.close())); connections.clear();
    try {
      if (createdDatabase) {
      assertDropTarget(database, new Set([database]));
      await master.query(`ALTER DATABASE [${database}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${database}]`);
    }
      if (createdLogin) await master.query(`DROP LOGIN [${user}]`);
    } finally {await master.close();}
  };
  try {
    await master.query(`CREATE DATABASE [${database}]`); createdDatabase = true;
    await master.query(`CREATE LOGIN [${user}] WITH PASSWORD=N'${password}', CHECK_POLICY=OFF, DEFAULT_DATABASE=[${database}]`); createdLogin = true;
    const writer = await open();
    await writer.query(provisionSql(user));
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
    return {config, reader: user, execute: writer.query, waitForReaderLock, connectWriter: () => open(), readerQuery: async (sql: string) => {const reader = await open({...admin, user, password}); try {return await reader.query(sql);} finally {await reader.close(); connections.delete(reader);}}, close};
  } catch (error) {await close(); throw error;}
}

export async function openSyntheticDev(adminPath: string, rotatePassword = false) {
  const admin = await loadAdmin(adminPath);
  const password = readerPassword();
  const created = await ensureSyntheticDatabase(admin, password, rotatePassword);
  const connections = new Set<SqlTestConnection>();
  const open = async () => {const result = await connect(admin, SYNTHETIC_DEV_DATABASE); connections.add(result); return result;};
  let writer: SqlTestConnection;
  try {writer = await open();}
  catch (error) {await cleanupCreatedResources(admin, created); throw error;}
  return {
    created,
    password: rotatePassword ? password : undefined,
    execute: writer.query,
    connectWriter: () => open(),
    close: async () => {
      await Promise.all([...connections].map(connection => connection.close()));
      connections.clear();
    },
  };
}

export async function seedSyntheticDev(adminPath: string): Promise<SqlServerConfig> {
  const admin = await loadAdmin(adminPath);
  if (!process.env.ESMER_SQL_DEV_CONFIG) throw new Error("MISSING_DEV_CONFIG");
  const saved = await validateSavedConfig(admin);
  const master = await connect(admin, "master");
  try {
    const exists = (await master.query(`SELECT name FROM sys.databases WHERE name=N'${SYNTHETIC_DEV_DATABASE}'`)).length > 0;
    const loginExists = (await master.query(`SELECT name FROM sys.server_principals WHERE name=N'${SYNTHETIC_DEV_READER}'`)).length > 0;
    if (!saved && (exists || loginExists)) throw new Error("MISSING_DEV_CONFIG");
    if (saved && !exists) throw new Error("SOURCE_CHANGED");
  } finally {await master.close();}
  const handle = await openSyntheticDev(adminPath, !saved);
  try {
    const config = await readerConfigFor(admin, saved?.password ?? handle.password!);
    if (saved && saved.expectedDatabaseId !== config.expectedDatabaseId) throw new Error("SOURCE_CHANGED");
    await applyScenario(adminPath, "recover");
    if (saved) await extractSqlServer(saved);
    const baseline = baselineExpected();
    const inserts = [
      ...baseline.headers.map(header => syntheticHeader(header.id, header.date, header.fisTuru, header.genelToplam)),
      ...baseline.lines.map(line => syntheticLine(line.id, line.header, baseline.headers.find(header => header.id === line.header)?.fisTuru ?? 11)),
    ];
    await handle.execute("SET XACT_ABORT ON; BEGIN TRANSACTION; DELETE dbo.FIS_DETAY; DELETE dbo.FIS; " + inserts.join("; ") + "; COMMIT TRANSACTION");
    const snapshot = await extractSqlServer(config);
    const verdict = checkExpected(snapshot.headers, snapshot.lines, baseline);
    if (!verdict.ok) throw new Error("OBSERVATION_MISMATCH");
    await writeReaderConfig(config);
    return config;
  } catch (error) {
    await handle.close();
    await cleanupCreatedResources(admin, handle.created);
    if (!saved) await rm(process.env.ESMER_SQL_DEV_CONFIG!, {force: true});
    throw error;
  } finally {await handle.close();}
}

export async function resetSyntheticDev(adminPath: string): Promise<SqlServerConfig> {
  assertDropTarget(SYNTHETIC_DEV_DATABASE, new Set());
  const admin = await loadAdmin(adminPath);
  const saved = await validateSavedConfig(admin);
  if (saved) {
    await applyScenario(adminPath, "recover");
    await extractSqlServer(saved);
  }
  const master = await connect(admin, "master");
  try {
    const existing = await master.query(`SELECT name FROM sys.databases WHERE name=N'${SYNTHETIC_DEV_DATABASE}'`);
    if (existing.length) {
      await master.query(`ALTER DATABASE [${SYNTHETIC_DEV_DATABASE}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${SYNTHETIC_DEV_DATABASE}]`);
    }
  } finally {await master.close();}
  const configPath = process.env.ESMER_SQL_DEV_CONFIG;
  if (configPath) {await assertConfigOutsideRepo(configPath, repoRoot); await rm(configPath, {force: true});}
  const handle = await openSyntheticDev(adminPath, !saved);
  try {const config = await readerConfigFor(admin, saved?.password ?? handle.password!); await writeReaderConfig(config);}
  finally {await handle.close();}
  return seedSyntheticDev(adminPath);
}

export async function stopSyntheticDev(adminPath: string): Promise<void> {
  assertDropTarget(SYNTHETIC_DEV_DATABASE, new Set());
  const admin = await loadAdmin(adminPath);
  await validateSavedConfig(admin);
  const master = await connect(admin, "master");
  try {
    const existing = await master.query(`SELECT name FROM sys.databases WHERE name=N'${SYNTHETIC_DEV_DATABASE}'`);
    if (existing.length) await master.query(`ALTER DATABASE [${SYNTHETIC_DEV_DATABASE}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [${SYNTHETIC_DEV_DATABASE}]`);
    const login = await master.query(`SELECT name FROM sys.server_principals WHERE name=N'${SYNTHETIC_DEV_READER}'`);
    if (login.length) await master.query(`DROP LOGIN [${SYNTHETIC_DEV_READER}]`);
    const configPath = process.env.ESMER_SQL_DEV_CONFIG;
    if (configPath) {await assertConfigOutsideRepo(configPath, repoRoot); await rm(configPath, {force: true});}
  } finally {await master.close();}
}

async function validateSavedConfig(admin: Admin): Promise<SqlServerConfig | undefined> {
  const path = process.env.ESMER_SQL_DEV_CONFIG;
  if (!path) return;
  await assertConfigOutsideRepo(path, repoRoot);
  let config: SqlServerConfig;
  try {config = await readReaderConfig();}
  catch (error) {if ((error as {code?: string}).code === "ENOENT") return; throw new Error("INVALID_DEV_CONFIG");}
  if (config.server !== admin.server || config.port !== admin.port || config.database !== SYNTHETIC_DEV_DATABASE || config.user !== SYNTHETIC_DEV_READER || config.lineage !== SYNTHETIC_DEV_DATABASE) throw new Error("UNSAFE_FIXTURE_TARGET");
  return config;
}

async function readReaderConfig(): Promise<SqlServerConfig> {
  const path = process.env.ESMER_SQL_DEV_CONFIG;
  if (!path) throw new Error("MISSING_DEV_CONFIG");
  return parseSqlServerConfig(JSON.parse(await readFile(path, "utf8")));
}

async function expectExtract(config: SqlServerConfig, code: string): Promise<void> {
  try {await extractSqlServer(config);}
  catch (error) {
    if (error instanceof Error && error.message === code) return;
    throw error;
  }
  throw new Error("EXPECTED_REJECTION");
}

export async function applyScenario(adminPath: string, name: string): Promise<void> {
  if (!isScenarioName(name)) throw new Error("UNKNOWN_SCENARIO");
  const scenario = name;
  if (scenario === "connection-loss") {
    const admin = await loadAdmin(adminPath);
    const config = await validateSavedConfig(admin);
    if (!config) throw new Error("MISSING_DEV_CONFIG");
    const master = await connect(admin, "master");
    try {await master.query(`ALTER LOGIN [${SYNTHETIC_DEV_READER}] DISABLE`);} finally {await master.close();}
    await expectExtract(config, "SOURCE_UNAVAILABLE");
    return;
  }
  if (scenario === "rejected-candidate") {
    const config = await validateSavedConfig(await loadAdmin(adminPath));
    if (!config) throw new Error("MISSING_DEV_CONFIG");
    await expectExtract({...config, expectedDatabaseId: "00000000-0000-0000-0000-000000000000"}, "SOURCE_CHANGED");
    return;
  }
  const handle = await openSyntheticDev(adminPath);
  try {
    const mutate = (sql: string) => handle.execute(`SET XACT_ABORT ON; BEGIN TRANSACTION; ${sql}; COMMIT TRANSACTION`);
    switch (scenario) {
      case "recover": {
        const admin = await loadAdmin(adminPath);
        const master = await connect(admin, "master");
        try {await master.query(`ALTER LOGIN [${SYNTHETIC_DEV_READER}] ENABLE`);} finally {await master.close();}
        await handle.execute(provisionSql(SYNTHETIC_DEV_READER));
        return;
      }
      case "insert": {
        const expected = scenarioExpected("insert");
        const added = expected.headers.find(header => header.id === "1003")!;
        await mutate(`${syntheticHeader(added.id, added.date, added.fisTuru, added.genelToplam)}; ${syntheticLine("2003", "1003")}`);
        return;
      }
      case "correct":
        await mutate("UPDATE dbo.FIS SET SATIR_TOPLAM=50.00000000,GENELTOPLAM=50.00000000 WHERE ID=1001");
        return;
      case "delete":
        await mutate("DELETE dbo.FIS_DETAY WHERE ID=2002; DELETE dbo.FIS WHERE ID=1002");
        return;
      case "backdate":
        await mutate("UPDATE dbo.FIS SET FIS_TARIHI='2025-08-01' WHERE ID=1001");
        return;
      case "source-reset":
        await mutate("DELETE dbo.FIS_DETAY; DELETE dbo.FIS");
        return;
      case "incomplete":
        await mutate(syntheticHeader("1004"));
        return;
      case "late-low-id": {
        const later = await handle.connectWriter();
        await later.query(`BEGIN TRANSACTION; ${syntheticHeader("1005")}; ${syntheticLine("2005", "1005")}`);
        await handle.execute(`${syntheticHeader("1006")}; ${syntheticLine("2006", "1006")}`);
        await later.query("COMMIT TRANSACTION");
        return;
      }
      case "permission-loss":
        await handle.execute(`REVOKE SELECT ON dbo.FIS_DETAY FROM [${SYNTHETIC_DEV_READER}]; DENY SELECT ON dbo.FIS_DETAY TO [${SYNTHETIC_DEV_READER}]`);
        const config = await validateSavedConfig(await loadAdmin(adminPath));
        if (!config) throw new Error("MISSING_DEV_CONFIG");
        await expectExtract(config, "SOURCE_REJECTED");
        return;
    }
  } finally {await handle.close();}
}

export async function startSyntheticDev(adminPath: string): Promise<void> {
  const admin = await loadAdmin(adminPath);
  if (!process.env.ESMER_SQL_DEV_CONFIG) throw new Error("MISSING_DEV_CONFIG");
  const saved = await validateSavedConfig(admin);
  if (!saved) {await seedSyntheticDev(adminPath); return;}
  const actual = await readerConfigFor(admin, saved.password);
  if (actual.expectedDatabaseId !== saved.expectedDatabaseId) throw new Error("SOURCE_CHANGED");
}

export async function appendSyntheticDev(adminPath: string): Promise<void> {
  const handle = await openSyntheticDev(adminPath);
  try {
    await handle.execute(`SET XACT_ABORT ON; BEGIN TRANSACTION;
DECLARE @id bigint=NEXT VALUE FOR dbo.FixtureIds;
SET @id=@id+100000;
INSERT dbo.FIS VALUES(@id,11,1,1,1,10,0,0,0,0,0,10,'2025-09-10',N'SYNTHETIC_PRIVATE_SENTINEL');
INSERT dbo.FIS_DETAY VALUES(@id,@id,9007199254740997,11,1,2,10,0,0,0,4);
COMMIT TRANSACTION`);
  } finally {await handle.close();}
}

export async function checkSyntheticDev(adminPath: string, name: string): Promise<void> {
  const expected = name === "baseline" ? baselineExpected() : isScenarioName(name) ? scenarioExpected(name) : undefined;
  if (!expected) throw new Error("UNKNOWN_SCENARIO");
  const config = await validateSavedConfig(await loadAdmin(adminPath));
  if (!config) throw new Error("MISSING_DEV_CONFIG");
  if (expected.error) {await expectExtract(config, expected.error); return;}
  const snapshot = await extractSqlServer(config);
  if (!checkExpected(snapshot.headers, snapshot.lines, expected).ok) throw new Error("OBSERVATION_MISMATCH");
}

export function syntheticHeader(id: string, date = "2025-09-10", fisTuru: 11 | 12 = 11, genelToplam = "123.12345678") {
  if (!/^\d+$/.test(id) || !/^2025-\d{2}-\d{2}$/.test(date) || (fisTuru !== 11 && fisTuru !== 12) || !/^\d+\.\d{8}$/.test(genelToplam)) throw new Error("INVALID_SYNTHETIC_VALUE");
  return `INSERT dbo.FIS VALUES(${id},${fisTuru},1,1,1,${genelToplam},0,0,0,0,0,${genelToplam},'${date}',N'SYNTHETIC_PRIVATE_SENTINEL')`;
}
export function syntheticLine(id: string, header: string, fisTuru: 11 | 12 = 11) {
  if (!/^\d+$/.test(id) || !/^\d+$/.test(header) || (fisTuru !== 11 && fisTuru !== 12)) throw new Error("INVALID_SYNTHETIC_VALUE");
  return `INSERT dbo.FIS_DETAY VALUES(${id},${header},9007199254740997,${fisTuru},1.00000000,2.12345678,123.12345678,0,0,0,40.00000000)`;
}
