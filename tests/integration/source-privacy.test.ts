import { expect, test } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createSyntheticSource, collect, metadata } from "../helpers/synthetic-source";
import { extract } from "../../src/source/extract";
import { writePackage } from "../../src/source/package";
import { preparePackage } from "../../tools/prepare-backup";

test("private sentinels never enter extraction, package, or failure diagnostics", async () => {
  const dir = await mkdtemp(join(tmpdir(), "source-privacy-")); const path = join(dir, "PRIVATE_PATH_SENTINEL.sqlite");
  try {
    createSyntheticSource(path);
    const batches = await collect(extract({ path, mappingVersion: "synthetic-relational-v1" }));
    const diagnostic = await preparePackage({ path, destination: join(dir, "missing", "out"), mappingVersion: "synthetic-relational-v1", metadata });
    for (const value of [JSON.stringify(batches), writePackage(batches, metadata).toString(), JSON.stringify(diagnostic)]) {
      expect(value).not.toContain("PRIVATE_"); expect(value).not.toContain("customer-only");
    }
    expect(diagnostic).toEqual({ ok: false, code: "PREPARATION_FAILED" });
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test("real preparation CLI emits fixed diagnostics without sentinel paths or private values", async () => {
  const { spawn } = await import("node:child_process");
  const { fileURLToPath } = await import("node:url");
  const dir = await mkdtemp(join(tmpdir(), "PRIVATE_PATH_SENTINEL-"));
  const path = join(dir, "PRIVATE_DATABASE_SENTINEL.sqlite"); const destination = join(dir, "package.json");
  const cli = fileURLToPath(new URL("../../tools/prepare-backup.ts", import.meta.url));
  function run(mode: string) {
    return new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve, reject) => {
      const child = spawn(process.execPath, [cli, mode, path, destination, "synthetic-test", "synthetic-batch-1", "2026-01-03T00:00:00.000Z", "2026-01-01", "2026-01-02", "partial"]);
      let stdout = ""; let stderr = "";
      child.stdout.on("data", data => { stdout += data; }); child.stderr.on("data", data => { stderr += data; });
      child.on("error", reject); child.on("close", code => resolve({ code, stdout, stderr }));
    });
  }
  try {
    createSyntheticSource(path);
    const success = await run("synthetic-relational-v1");
    const failure = await run("synthetic-relational-v1");
    const unsupported = await run("real-source");
    expect(success).toEqual({ code: 0, stdout: "PACKAGE_PREPARED\n", stderr: "" });
    expect(failure).toEqual({ code: 1, stdout: "PREPARATION_FAILED\n", stderr: "" });
    expect(unsupported).toEqual({ code: 1, stdout: "", stderr: "PREPARATION_ARGUMENTS_INVALID\n" });
    for (const result of [success, failure, unsupported]) {
      expect(result.stdout + result.stderr).not.toContain("PRIVATE_");
      expect(result.stdout + result.stderr).not.toContain(dir);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});
