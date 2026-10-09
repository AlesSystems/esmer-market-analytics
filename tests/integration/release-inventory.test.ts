import { afterEach, expect, test } from "vitest";
import { mkdtemp, mkdir, writeFile, rm, rename, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { createPackage } from "@electron/asar";
import { inspectRelease, inspectMacRelease } from "../../tools/release-inventory";

const roots: string[] = [];
afterEach(async () => { for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true }); });

async function macFixture() {
  const release = await fixture();
  await mkdir(join(release, "Contents", "MacOS"), {recursive:true});
  await rename(join(release, "resources"), join(release, "Contents", "Resources"));
  await writeFile(join(release, "Contents", "Info.plist"), "synthetic plist");
  await writeFile(join(release, "Contents", "MacOS", "Esmer Market Analytics"), "synthetic executable");
  const framework = join(release, "Contents", "Frameworks", "Electron Framework.framework", "Versions", "A");
  await mkdir(framework, {recursive:true});
  await writeFile(join(framework, "Electron Framework"), "synthetic framework");
  await symlink("A", join(framework, "..", "Current"));
  return release;
}

test("Mac inventory hashes app content and admits internal framework links", async () => {
  const result = await inspectMacRelease(await macFixture());
  expect(result.violations).toEqual([]);
  expect(result.files.map(file => file.path)).toContain("Contents/MacOS/Esmer Market Analytics");
  expect(result.archiveFiles.map(file => file.path)).toContain("dist/desktop/main.cjs");
  expect(result.files.every(file => /^[a-f0-9]{64}$/.test(file.sha256))).toBe(true);
});

test("Mac inventory rejects nested data, unknown runtime files and escaping links", async () => {
  const release = await macFixture(), framework = "Contents/Frameworks/Electron Framework.framework/Versions/A";
  await writeFile(join(release, framework, "private.sqlite"), "synthetic");
  await writeFile(join(release, framework, "private.dat"), "synthetic");
  await writeFile(join(release, "Contents", "Info.plist"), "-----BEGIN PRIVATE KEY-----");
  await symlink("../../../../../../outside", join(release, framework, "escape"));
  const result = await inspectMacRelease(release);
  expect(result.violations).toContain(`distribution:${framework}/private.sqlite`);
  expect(result.violations).toContain(`distribution:${framework}/private.dat`);
  expect(result.violations).toContain(`link:${framework}/escape`);
  expect(result.violations).toContain("content:Contents/Info.plist");
});

async function fixture(extraPath?: string, content = "synthetic", currentBuild = false) {
  const root = await mkdtemp(join(tmpdir(), "esmer-release-")); roots.push(root);
  const app = join(root, "app"), release = join(root, "release");
  await mkdir(join(app, "dist", "desktop"), { recursive: true });
  await mkdir(join(release, "resources"), { recursive: true });
  await writeFile(join(app, "package.json"), JSON.stringify({ name: "esmer-market-analytics", version: "0.1.0" }));
  await writeFile(join(app, "dist", "desktop", "main.cjs"), "console.log('synthetic');");
  if (currentBuild) {
    for (const path of ["dist/ui/app.css", "dist/ui/assets/esmer-market-logo.png", "dist/ui/assets/manrope-latin-ext-wght-normal.woff2", "dist/ui/assets/manrope-latin-wght-normal.woff2"]) {
      await mkdir(join(app, path, ".."), { recursive: true });
      await writeFile(join(app, path), "synthetic build asset");
    }
    await mkdir(join(release, "resources", "licences"), { recursive: true });
    for (const name of ["LICENSE", "LICENSES.chromium.html", "shadcn-LICENSE", "tailwindcss-LICENSE", "three-LICENSE", "react-three-fiber-LICENSE", "manrope-LICENSE", "its-fine-LICENSE", "react-use-measure-LICENSE", "suspend-react-LICENSE", "zustand-LICENSE", "use-sync-external-store-LICENSE", "scheduler-LICENSE", "react-LICENSE"]) {
      await writeFile(join(release, "resources", "licences", name), "synthetic dependency notice");
    }
  }
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

test("SQL dependencies are allowed while unreviewed packages remain rejected", async () => {
  expect((await inspectRelease(await fixture("node_modules/tedious/LICENSE"))).violations).toEqual([]);
  expect((await inspectRelease(await fixture("node_modules/unreviewed-driver/index.js"))).violations).toEqual(["archive:node_modules/unreviewed-driver/index.js"]);
});

test("reviewed SQL library credential modules remain scanned for secrets and cannot admit credential data", async () => {
  for (const path of ["node_modules/@azure/identity/dist/commonjs/credentials/credentialPersistenceOptions.js", "node_modules/@azure/identity/dist/browser/msal/credentials.js", "node_modules/@azure/msal-common/src/cache/entities/CredentialEntity.ts", "node_modules/@typespec/ts-http-runtime/dist/commonjs/auth/credentials.js"]) {
    expect((await inspectRelease(await fixture(path, "export const credential = {};"))).violations).toEqual([]);
    expect((await inspectRelease(await fixture(path, "const privateKey = '-----BEGIN PRIVATE KEY-----';"))).violations).toContain(`content:${path}`);
  }
  for (const path of ["node_modules/@azure/identity/dist/commonjs/credentials.json", "node_modules/@azure/identity/dist/commonjs/.env", "node_modules/@azure/identity/dist/commonjs/data.bak", "node_modules/@azure/identity/dist/commonjs/credentials.js", "node_modules/unreviewed-driver/credentials.js"]) {
    expect((await inspectRelease(await fixture(path))).violations).toContain(`archive:${path}`);
  }
});


test("release inspection admits the current build assets and notices while inventorying their content", async () => {
  const result = await inspectRelease(await fixture(undefined, "synthetic", true));
  expect(result.archiveFiles.map(file => file.path)).toEqual([
    "dist/desktop/main.cjs", "dist/ui/app.css", "dist/ui/assets/esmer-market-logo.png", "dist/ui/assets/manrope-latin-ext-wght-normal.woff2", "dist/ui/assets/manrope-latin-wght-normal.woff2", "package.json",
  ]);
  expect(result.files).toHaveLength(15);
  expect(result.violations).toEqual([]);
});

test("build asset and notice admission stays exact and scans allowed files for secrets", async () => {
  const counterfeit = await fixture("dist/ui/assets/unreviewed-logo.png", "synthetic", true);
  await writeFile(join(counterfeit, "resources", "licences", "unreviewed-LICENSE"), "synthetic");
  expect((await inspectRelease(counterfeit)).violations).toEqual([
    "distribution:resources/licences/unreviewed-LICENSE", "archive:dist/ui/assets/unreviewed-logo.png",
  ]);
  const secret = await fixture("dist/ui/assets/esmer-market-logo.png", "-----BEGIN PRIVATE KEY-----", true);
  await writeFile(join(secret, "resources", "licences", "manrope-LICENSE"), "-----BEGIN PRIVATE KEY-----");
  expect((await inspectRelease(secret)).violations).toEqual([
    "content:resources/licences/manrope-LICENSE", "content:dist/ui/assets/esmer-market-logo.png",
  ]);
});
