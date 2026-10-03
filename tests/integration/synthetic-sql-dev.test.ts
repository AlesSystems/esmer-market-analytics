import * as fs from "node:fs/promises";
import { mkdtemp, rm, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, afterAll, expect, test, vi } from "vitest";
import { extractSqlServer } from "../../src/source/sql-server";
import { appendSyntheticDev, applyScenario, openSyntheticDev, seedSyntheticDev, startSyntheticDev, resetSyntheticDev, stopSyntheticDev } from "../helpers/live-sql-fixture";
import { baselineExpected, checkExpected, scenarioExpected } from "../../tools/synthetic-sql/observations";

vi.mock("node:fs/promises", {spy: true});

let privateDirectory: string;
let ownsFixture = false;
async function seedOwned(adminPath: string) {
  const config = await seedSyntheticDev(adminPath);
  ownsFixture = true;
  return config;
}
async function cleanupOwned(adminPath: string) {
  if (ownsFixture) {await stopSyntheticDev(adminPath); ownsFixture = false;}
}
const previousConfigPath = process.env.ESMER_SQL_DEV_CONFIG;
beforeAll(async () => {
  if (!process.env.ESMER_SQL_TEST_ADMIN) return;
  privateDirectory = await mkdtemp(join(tmpdir(), "esmer-synthetic-contract-"));
  process.env.ESMER_SQL_DEV_CONFIG = join(privateDirectory, "reader.json");
});
afterAll(async () => {
  if (previousConfigPath === undefined) delete process.env.ESMER_SQL_DEV_CONFIG;
  else process.env.ESMER_SQL_DEV_CONFIG = previousConfigPath;
  if (privateDirectory) await rm(privateDirectory, {recursive: true});
});
const isolated = test.skipIf(!process.env.ESMER_SQL_TEST_ADMIN);

isolated("synthetic dev database matches the baseline observation after seed", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  try {
    const config = await seedOwned(adminPath);
    expect(config.user).not.toMatch(/^sa$/i);
    expect(config.database).toBe("EsmerSyntheticDev");
    expect(config.scope).toBe("isolated-copy");
    const snapshot = await extractSqlServer(config);
    expect(checkExpected(snapshot.headers, snapshot.lines, baselineExpected())).toEqual({ok: true});
    await applyScenario(adminPath, "correct");
    const corrected = await extractSqlServer(config);
    expect(checkExpected(corrected.headers, corrected.lines, scenarioExpected("correct"))).toEqual({ok: true});
  } finally {
    await cleanupOwned(adminPath);
  }
}, 120_000);

isolated("reseed preserves the reader configuration already held by an app", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  try {
    const config = await seedOwned(adminPath);
    await applyScenario(adminPath, "insert");
    const reseeded = await seedOwned(adminPath);
    expect(reseeded.password === config.password).toBe(true);
    expect(reseeded.expectedDatabaseId).toBe(config.expectedDatabaseId);
    const snapshot = await extractSqlServer(config);
    expect(checkExpected(snapshot.headers, snapshot.lines, baselineExpected())).toEqual({ok: true});
  } finally {await cleanupOwned(adminPath);}
}, 120_000);

isolated("permission outage lasts across row scenarios until explicit recovery", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  try {
    const config = await seedOwned(adminPath);
    await applyScenario(adminPath, "permission-loss");
    await applyScenario(adminPath, "correct");
    await expect(extractSqlServer(config)).rejects.toThrow("SOURCE_REJECTED");
    await applyScenario(adminPath, "recover");
    await expect(extractSqlServer(config)).resolves.toHaveProperty("headers");
  } finally {await cleanupOwned(adminPath);}
}, 120_000);

isolated("connection outage affects the configured reader until explicit recovery", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  try {
    const config = await seedOwned(adminPath);
    await applyScenario(adminPath, "connection-loss");
    const handle = await openSyntheticDev(adminPath); await handle.close();
    await expect(extractSqlServer(config)).rejects.toThrow("SOURCE_UNAVAILABLE");
    await applyScenario(adminPath, "recover");
    await expect(extractSqlServer(config)).resolves.toHaveProperty("headers");
  } finally {await cleanupOwned(adminPath);}
}, 120_000);

isolated("append adds a complete distinct document on every tick", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  try {
    const config = await seedOwned(adminPath);
    await appendSyntheticDev(adminPath); await appendSyntheticDev(adminPath);
    const snapshot = await extractSqlServer(config);
    expect(snapshot.headers).toHaveLength(4);
    expect(snapshot.lines).toHaveLength(4);
    expect(new Set(snapshot.headers.map(row => row.ID)).size).toBe(4);
    expect(snapshot.lines.every(line => snapshot.headers.some(header => header.ID === line.FIS))).toBe(true);
  } finally {await cleanupOwned(adminPath);}
}, 120_000);

isolated("repeated start preserves rows and reset changes the protected identity", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  try {
    await startSyntheticDev(adminPath);
    ownsFixture = true;
    const config = await seedOwned(adminPath);
    await appendSyntheticDev(adminPath); await startSyntheticDev(adminPath);
    expect((await extractSqlServer(config)).headers).toHaveLength(3);
    const reset = await resetSyntheticDev(adminPath);
    expect(reset.expectedDatabaseId === config.expectedDatabaseId).toBe(false);
    await expect(extractSqlServer(config)).rejects.toThrow("SOURCE_CHANGED");
  } finally {await cleanupOwned(adminPath);}
}, 120_000);

isolated("missing config refuses a preexisting dev database without deleting it", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  const ownedPath = process.env.ESMER_SQL_DEV_CONFIG!;
  try {
    const config = await seedOwned(adminPath);
    await appendSyntheticDev(adminPath);
    process.env.ESMER_SQL_DEV_CONFIG = join(privateDirectory, "unowned.json");
    await expect(seedSyntheticDev(adminPath)).rejects.toThrow("MISSING_DEV_CONFIG");
    expect((await extractSqlServer(config)).headers).toHaveLength(3);
  } finally {
    process.env.ESMER_SQL_DEV_CONFIG = ownedPath;
    await cleanupOwned(adminPath);
  }
}, 120_000);

isolated("wrong saved password refuses reset before deleting the populated database", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  const path = process.env.ESMER_SQL_DEV_CONFIG!;
  let original: string | undefined;
  try {
    const config = await seedOwned(adminPath);
    await appendSyntheticDev(adminPath);
    original = await readFile(path, "utf8");
    await writeFile(path, JSON.stringify({...config, password: "WrongFixturePassword!"}));
    await expect(resetSyntheticDev(adminPath)).rejects.toThrow("SOURCE_UNAVAILABLE");
    const preserved = await extractSqlServer(config);
    expect(preserved.headers).toHaveLength(3);
    expect(preserved.databaseId).toBe(config.expectedDatabaseId);
  } finally {
    if (original) await writeFile(path, original);
    await cleanupOwned(adminPath);
  }
}, 120_000);

isolated("failed initial config publication compensates only newly created fixture resources", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  const spy = vi.spyOn(fs, "writeFile").mockRejectedValueOnce(new Error("INJECTED_CONFIG_WRITE"));
  try {
    await expect(seedSyntheticDev(adminPath)).rejects.toThrow("INJECTED_CONFIG_WRITE");
  } finally {spy.mockRestore();}
  try {
    const config = await seedOwned(adminPath);
    expect((await extractSqlServer(config)).headers).toHaveLength(2);
  } finally {await cleanupOwned(adminPath);}
}, 120_000);

isolated("config publication failure never compensates a preexisting fixture", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  try {
    const config = await seedOwned(adminPath);
    const spy = vi.spyOn(fs, "writeFile").mockRejectedValueOnce(new Error("INJECTED_CONFIG_WRITE"));
    try {await expect(seedSyntheticDev(adminPath)).rejects.toThrow("INJECTED_CONFIG_WRITE");}
    finally {spy.mockRestore();}
    const preserved = await extractSqlServer(config);
    expect(preserved.databaseId).toBe(config.expectedDatabaseId);
    expect(preserved.headers).toHaveLength(2);
  } finally {await cleanupOwned(adminPath);}
}, 120_000);
