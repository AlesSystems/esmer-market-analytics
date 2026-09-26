import { syncBuiltinESMExports } from "node:module";
import filesystem from "node:fs/promises";
import { afterEach, expect, test, vi } from "vitest";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readPackageFile } from "../../src/desktop/package-file";
import { MAX_BYTES } from "../../src/source/package";
const directories: string[] = [];
afterEach(async () => { vi.restoreAllMocks(); syncBuiltinESMExports(); await Promise.all(directories.splice(0).map(path => rm(path, { recursive: true, force: true }))); });
test("native selection reads only bounded regular files and preserves exact bytes", async () => {
  const dir = await mkdtemp(join(tmpdir(), "package-file-")); directories.push(dir); const path = join(dir, "package.json");
  await writeFile(path, "synthetic bytes"); expect(Buffer.from(await readPackageFile(path)).toString()).toBe("synthetic bytes");
  await writeFile(path, Buffer.alloc(MAX_BYTES + 1)); await expect(readPackageFile(path)).rejects.toThrow("INVALID_PACKAGE");
  await expect(readPackageFile(dir)).rejects.toThrow("INVALID_PACKAGE");
});

test("small files retain exactly their bytes and honor explicit limits", async () => {
  const dir = await mkdtemp(join(tmpdir(), "package-file-")); directories.push(dir); const path = join(dir, "package.json");
  await writeFile(path, "1234");
  const bytes = await readPackageFile(path);
  expect(Buffer.from(bytes).toString()).toBe("1234");
  expect(bytes.buffer.byteLength).toBe(4);
  expect(Array.from(await readPackageFile(path, 4))).toEqual([49, 50, 51, 52]);
  await expect(readPackageFile(path, 3)).rejects.toThrow("INVALID_PACKAGE");
  await writeFile(path, "");
  expect((await readPackageFile(path, 0)).byteLength).toBe(0);
  for (const maximum of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) await expect(readPackageFile(path, maximum)).rejects.toThrow("INVALID_PACKAGE");
});


test.each(["1", "12345"])("rejects file size changes after stat and closes the handle (%s)", async changed => {
  const dir = await mkdtemp(join(tmpdir(), "package-file-")); directories.push(dir); const path = join(dir, "package.json");
  await writeFile(path, "1234");
  const originalOpen = filesystem.open;
  let selected: Awaited<ReturnType<typeof originalOpen>> | undefined;
  vi.spyOn(filesystem, "open").mockImplementationOnce(async (...args) => {
    selected = await originalOpen(...args);
    const originalStat = selected.stat.bind(selected);
    vi.spyOn(selected, "stat").mockImplementationOnce(async () => {
      const before = await originalStat();
      await writeFile(path, changed);
      return before;
    });
    return selected;
  });
  syncBuiltinESMExports();
  await expect(readPackageFile(path)).rejects.toThrow("INVALID_PACKAGE");
  expect(selected?.fd).toBe(-1);
});
