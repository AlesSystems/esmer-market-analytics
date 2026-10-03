import { expect, test } from "vitest";
import { extractSqlServer } from "../../src/source/sql-server";
import { applyScenario, openSyntheticDev, seedSyntheticDev, stopSyntheticDev } from "../helpers/live-sql-fixture";
import { baselineExpected, checkExpected, scenarioExpected } from "../../tools/synthetic-sql/observations";

const isolated = test.skipIf(!process.env.ESMER_SQL_TEST_ADMIN);

isolated("synthetic dev database matches the baseline observation after seed", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  try {
    const config = await seedSyntheticDev(adminPath);
    expect(config.user).not.toMatch(/^sa$/i);
    expect(config.database).toBe("EsmerSyntheticDev");
    expect(config.scope).toBe("isolated-copy");
    const snapshot = await extractSqlServer(config);
    expect(checkExpected(snapshot.headers, snapshot.lines, baselineExpected())).toEqual({ok: true});
    await applyScenario(adminPath, "correct");
    const corrected = await extractSqlServer(config);
    expect(checkExpected(corrected.headers, corrected.lines, scenarioExpected("correct"))).toEqual({ok: true});
  } finally {
    await stopSyntheticDev(adminPath);
  }
}, 120_000);

isolated("reseed preserves the reader configuration already held by an app", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  try {
    const config = await seedSyntheticDev(adminPath);
    await applyScenario(adminPath, "insert");
    const reseeded = await seedSyntheticDev(adminPath);
    expect(reseeded.password === config.password).toBe(true);
    expect(reseeded.expectedDatabaseId).toBe(config.expectedDatabaseId);
    const snapshot = await extractSqlServer(config);
    expect(checkExpected(snapshot.headers, snapshot.lines, baselineExpected())).toEqual({ok: true});
  } finally {await stopSyntheticDev(adminPath);}
}, 120_000);

isolated("permission outage lasts across row scenarios until explicit recovery", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  try {
    const config = await seedSyntheticDev(adminPath);
    await applyScenario(adminPath, "permission-loss");
    await applyScenario(adminPath, "correct");
    await expect(extractSqlServer(config)).rejects.toThrow("SOURCE_REJECTED");
    await applyScenario(adminPath, "recover");
    await expect(extractSqlServer(config)).resolves.toHaveProperty("headers");
  } finally {await stopSyntheticDev(adminPath);}
}, 120_000);

isolated("connection outage affects the configured reader until explicit recovery", async () => {
  const adminPath = process.env.ESMER_SQL_TEST_ADMIN!;
  try {
    const config = await seedSyntheticDev(adminPath);
    await applyScenario(adminPath, "connection-loss");
    const handle = await openSyntheticDev(adminPath); await handle.close();
    await expect(extractSqlServer(config)).rejects.toThrow("SOURCE_UNAVAILABLE");
    await applyScenario(adminPath, "recover");
    await expect(extractSqlServer(config)).resolves.toHaveProperty("headers");
  } finally {await stopSyntheticDev(adminPath);}
}, 120_000);
