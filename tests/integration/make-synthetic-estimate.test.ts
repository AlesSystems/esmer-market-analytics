import { expect, test } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { makeSyntheticEstimate } from "../../tools/make-synthetic-estimate";
import { readRawPackage } from "../../src/source/raw-package";

test("the handoff tool writes a synthetic estimate package that readRawPackage accepts", async () => {
  const dir = await mkdtemp(join(tmpdir(), "synthetic-estimate-"));
  try {
    const file = join(dir, "synthetic-estimate.json");
    await makeSyntheticEstimate(file);
    expect(readRawPackage(await readFile(file))).not.toBeNull();
    await expect(makeSyntheticEstimate(file)).rejects.toThrow();
  } finally { await rm(dir, { recursive: true, force: true, maxRetries: 5 }); }
});
