import { lstat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { prepareMonthlyEstimate, MAX_MONTHS } from "../src/source/sql-package.ts";
import { readConnectionFile, writeNewPrivateFile } from "./private-files.ts";

// npm run prepare:month -- <connection.json> <YYYY-MM> [months=6] [output.json]
// Default output: esmer-<YYYY-MM>.json next to the connection file, which already lives outside the repository.
const codes = new Set(["INVALID_ARGUMENTS", "INVALID_CONFIG_FILE", "INVALID_PACKAGE", "WINDOW_OUTSIDE_CONFIG", "SOURCE_REJECTED", "SOURCE_UNAVAILABLE", "SOURCE_TIMEOUT", "SOURCE_CHANGED"]);
const exists = Object.assign(new Error("OUTPUT_EXISTS"), {code: "EEXIST"});
try {
  const [configPath, month, monthsArg, outputArg, ...extra] = process.argv.slice(2);
  if (!configPath || !month || extra.length || monthsArg !== undefined && !/^[1-9]$/.test(monthsArg)) throw Error("INVALID_ARGUMENTS");
  const months = monthsArg === undefined ? MAX_MONTHS : Number(monthsArg);
  const config = await readConnectionFile(configPath);
  const output = resolve(outputArg ?? join(dirname(resolve(configPath)), `esmer-${month}.json`));
  // Fail before reading the source; writeNewPrivateFile still refuses a file that appears meanwhile.
  if (await lstat(output).then(() => true, () => false)) throw exists;
  const started = performance.now();
  const result = await prepareMonthlyEstimate(config, month, months);
  await writeNewPrivateFile(output, result.bytes);
  const {headers, lines, products} = result.counts;
  process.stdout.write(`MONTHLY_ESTIMATE_PREPARED ${result.from}..${result.to} months=${result.months}/${months} headers=${headers} lines=${lines} products=${products} bytes=${result.bytes.length} ms=${Math.round(performance.now() - started)}\n${output}\n`);
} catch (error) {
  const code = error instanceof Error && "code" in error && error.code === "EEXIST" ? "OUTPUT_EXISTS" : error instanceof Error && codes.has(error.message) ? error.message : "FAILED";
  process.stderr.write(`MONTHLY_ESTIMATE_PREPARATION_FAILED ${code}\n`);
  process.exitCode = 1;
}
