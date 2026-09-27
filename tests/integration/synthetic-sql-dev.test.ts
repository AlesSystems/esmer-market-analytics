import { expect, test } from "vitest";
import { extractSqlServer } from "../../src/source/sql-server";
import { applyScenario, seedSyntheticDev, stopSyntheticDev } from "../helpers/live-sql-fixture";
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
