import { afterEach, expect, test } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readPackageFile } from "../../src/desktop/package-file";
import { MAX_BYTES } from "../../src/source/package";
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
test("native selection reads only bounded regular files and preserves exact bytes", async () => {
  const dir = await mkdtemp(join(tmpdir(), "package-file-")); directories.push(dir); const path = join(dir, "package.json");
  await writeFile(path, "synthetic bytes"); expect(Buffer.from(await readPackageFile(path)).toString()).toBe("synthetic bytes");
  await writeFile(path, Buffer.alloc(MAX_BYTES + 1)); await expect(readPackageFile(path)).rejects.toThrow("INVALID_PACKAGE");
  await expect(readPackageFile(dir)).rejects.toThrow("INVALID_PACKAGE");
});
