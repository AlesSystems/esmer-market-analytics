import { afterEach, expect, test } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createPackage } from "@electron/asar";
import { inspectRelease } from "../../tools/release-inventory";

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });

async function fixture(extraPath?: string, content = "synthetic") {
  const root = await mkdtemp(join(tmpdir(), "esmer-release-")); roots.push(root);
  const app = join(root, "app"), release = join(root, "release");
  await mkdir(join(app, "dist", "desktop"), { recursive: true });
  await mkdir(join(release, "resources"), { recursive: true });
  await writeFile(join(app, "package.json"), JSON.stringify({ name: "esmer-market-analytics", version: "0.1.0" }));
  await writeFile(join(app, "dist", "desktop", "main.cjs"), "console.log('synthetic');");
  if (extraPath) {
    await mkdir(join(app, extraPath, ".."), { recursive: true });
    await writeFile(join(app, extraPath), content);
  }
  await createPackage(app, join(release, "resources", "app.asar"));
  return release;
}

test("release inventory hashes every file and rejects data inside an archive", async () => {
  const clean = await inspectRelease(await fixture());
  expect(clean.violations).toEqual([]);
  expect(clean.files).toHaveLength(1);
  expect(clean.archiveFiles.map(file => file.path)).toContain("dist/desktop/main.cjs");
  expect(clean.files[0].sha256).toMatch(/^[a-f0-9]{64}$/);
  const dirty = await inspectRelease(await fixture("dist/private.sqlite"));
  expect(dirty.violations).toContain("archive:dist/private.sqlite");
});

test("release inspection rejects unexpected outer files and credential sentinels in bundles", async () => {
  const release = await fixture("dist/desktop/preload.cjs", "const secret = '-----BEGIN PRIVATE KEY-----';");
  await writeFile(join(release, "customer-export.csv"), "synthetic");
  await writeFile(join(release, "private.dat"), "synthetic");
  const result = await inspectRelease(release);
  expect(result.violations).toContain("content:dist/desktop/preload.cjs");
  expect(result.violations).toContain("distribution:customer-export.csv");
  expect(result.violations).toContain("distribution:private.dat");
});
