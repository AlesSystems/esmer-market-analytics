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
