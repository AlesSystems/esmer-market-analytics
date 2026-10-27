import { execFile } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { afterEach, beforeEach, expect, test } from "vitest";

const tool = fileURLToPath(new URL("../../tools/prepare-month.ts", import.meta.url));
let dir = "";
beforeEach(async () => { dir = await mkdtemp(join(tmpdir(), "prepare-month-")); });
afterEach(async () => { await rm(dir, {recursive: true, force: true}); });
// Port 9 on loopback is never contacted by these cases: each fails before extraction.
const config = {server: "127.0.0.1", port: 9, database: "Synthetic", user: "reader", password: "x", trustServerCertificate: true, scope: "isolated-copy", lineage: "fixture:monthly", expectedDatabaseId: "00000000-0000-4000-8000-000000000001", from: "2025-01-01", to: "2025-12-31"};
async function run(content: string, ...args: string[]) {
  const path = join(dir, "conn.json");
  await writeFile(path, content, {mode: 0o600});
  try { await promisify(execFile)(process.execPath, [tool, path, ...args]); return "OK"; }
  catch (error) { return String((error as {stderr: string}).stderr).trim(); }
}

test("invalid connection content is INVALID_CONFIG_FILE", async () => {
  expect(await run("{not json", "2025-09")).toBe("MONTHLY_ESTIMATE_PREPARATION_FAILED INVALID_CONFIG_FILE");
  expect(await run(JSON.stringify({...config, user: "sa"}), "2025-09")).toBe("MONTHLY_ESTIMATE_PREPARATION_FAILED INVALID_CONFIG_FILE");
});

test("an existing output fails before any source read", async () => {
  const output = join(dir, "out.json");
  await writeFile(output, "");
  expect(await run(JSON.stringify(config), "2025-09", "6", output)).toBe("MONTHLY_ESTIMATE_PREPARATION_FAILED OUTPUT_EXISTS");
  await writeFile(join(dir, "esmer-2025-09.json"), "");
  expect(await run(JSON.stringify(config), "2025-09")).toBe("MONTHLY_ESTIMATE_PREPARATION_FAILED OUTPUT_EXISTS");
});

test("a window outside the declared bound fails with WINDOW_OUTSIDE_CONFIG", async () => {
  expect(await run(JSON.stringify({...config, from: "2025-06-01"}), "2025-09")).toBe("MONTHLY_ESTIMATE_PREPARATION_FAILED WINDOW_OUTSIDE_CONFIG");
});
