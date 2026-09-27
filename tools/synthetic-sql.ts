import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { applyScenario, openSyntheticDev, resetSyntheticDev, seedSyntheticDev, stopSyntheticDev } from "../tests/helpers/live-sql-fixture.ts";
import { assertConfigOutsideRepo, isScenarioName, SYNTHETIC_DEV_DATABASE } from "./synthetic-sql/observations.ts";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));

function adminPath(): string {
  const path = process.env.ESMER_SQL_TEST_ADMIN;
  if (!path) throw new Error("MISSING_ADMIN");
  return path;
}

async function requireDevConfigPath(): Promise<string> {
  const path = process.env.ESMER_SQL_DEV_CONFIG;
  if (!path) throw new Error("MISSING_DEV_CONFIG");
  await assertConfigOutsideRepo(path, repoRoot);
  return resolve(path);
}

function announce(): void {
  process.stdout.write(`SYNTHETIC ${SYNTHETIC_DEV_DATABASE}\n`);
}

const [command, scenario, ...extra] = process.argv.slice(2);
try {
  if (extra.length) throw new Error("INVALID_ARGUMENTS");
  switch (command) {
    case "start":
      await (await openSyntheticDev(adminPath())).close();
      announce();
      break;
    case "seed":
      await requireDevConfigPath();
      await seedSyntheticDev(adminPath());
      announce();
      break;
    case "reset":
      await requireDevConfigPath();
      await resetSyntheticDev(adminPath());
      announce();
      break;
    case "scenario":
      if (!scenario || !isScenarioName(scenario)) throw new Error("UNKNOWN_SCENARIO");
      if (scenario === "permission-loss" || scenario === "connection-loss" || scenario === "rejected-candidate") await requireDevConfigPath();
      await applyScenario(adminPath(), scenario);
      announce();
      break;
    case "stop":
      await stopSyntheticDev(adminPath());
      announce();
      break;
    default:
      throw new Error("INVALID_ARGUMENTS");
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "SYNTHETIC_SQL_FAILED";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
