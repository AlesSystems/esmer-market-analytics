import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { durableWrite, syncDirectory } from "../../src/recovery/files";

test("recovery metadata is published and replaced on the supported host filesystem", async () => {
  const directory = await mkdtemp(join(tmpdir(), "esmer-files-"));
  const path = join(directory, "kurtarma.json");
  try {
    await durableWrite(path, "first verified record");
    expect(await readFile(path, "utf8")).toBe("first verified record");
    await durableWrite(path, "replacement verified record");
    expect(await readFile(path, "utf8")).toBe("replacement verified record");
    expect(await readdir(directory)).toEqual(["kurtarma.json"]);
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("failed publication retains existing destination contents and cleans the partial file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "esmer-files-"));
  const destination = join(directory, "occupied");
  try {
    await mkdir(destination);
    await writeFile(join(destination, "retained"), "last valid record");
    await expect(durableWrite(destination, "replacement")).rejects.toThrow();
    expect(await readFile(join(destination, "retained"), "utf8")).toBe("last valid record");
    expect(await readdir(directory)).toEqual(["occupied"]);
    await expect(syncDirectory(join(directory, "missing"))).rejects.toThrow();
  } finally { await rm(directory, { recursive: true, force: true }); }
});
