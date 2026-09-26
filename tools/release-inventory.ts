import { createHash } from "node:crypto";
import { lstat, readdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { extractFile, listPackage, statFile } from "@electron/asar";

type FileIdentity = { path: string; bytes: number; sha256: string };
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const bundles = new Set(["dist/desktop/main.cjs", "dist/desktop/preload.cjs", "dist/service/worker.cjs", "dist/ui/app.js", "dist/ui/index.html", "dist/ui/style.css", "package.json"]);
const prohibited = /(?:^|\/)(?:\.env[^/]*|credentials?[^/]*|[^/]+\.(?:bak|sqlite(?:-wal|-shm)?|db|mdf|ldf|esmerbackup|pem|pfx|csv|xlsx))$/i;
const secrets = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}|(?:AKIA|ASIA)[A-Z0-9]{16}/;
const runtimeFiles = new Set(["Esmer Market Analytics.exe", "LICENSE.electron.txt", "LICENSES.chromium.html", "chrome_100_percent.pak", "chrome_200_percent.pak", "d3dcompiler_47.dll", "dxcompiler.dll", "dxil.dll", "ffmpeg.dll", "icudtl.dat", "resources.pak", "snapshot_blob.bin", "v8_context_snapshot.bin", "vk_swiftshader_icd.json", "vk_swiftshader.dll", "vulkan-1.dll", "resources/app.asar", "resources/app-update.yml", "resources/elevate.exe", "resources/licences/LICENSE", "resources/licences/LICENSES.chromium.html", "resources/licences/shadcn-LICENSE", "resources/licences/tailwindcss-LICENSE"]);
const dependencyFile = /^node_modules\/(?:decimal\.js|fflate|react|react-dom|scheduler|saxen|write-excel-file|clsx|tailwind-merge|class-variance-authority)\//;

export async function inspectRelease(directory: string) {
  const files: FileIdentity[] = [], archiveFiles: FileIdentity[] = [], violations: string[] = [];
  async function walk(relative: string) {
    for (const name of (await readdir(join(directory, relative))).sort()) {
      const path = relative ? `${relative}/${name}` : name;
      const metadata = await lstat(join(directory, path));
      if (metadata.isSymbolicLink()) { violations.push(`link:${path}`); continue; }
      if (metadata.isDirectory()) { await walk(path); continue; }
      const bytes = await readFile(join(directory, path));
      files.push({ path, bytes: bytes.length, sha256: hash(bytes) });
      if ((!runtimeFiles.has(path) && !/^locales\/[a-zA-Z0-9-]+\.pak$/.test(path)) || prohibited.test(path)) violations.push(`distribution:${path}`);
      const runtimeBinary = runtimeFiles.has(path) && /\.(?:exe|dll|pak|bin|dat)$/.test(path);
      if (path !== "resources/app.asar" && !runtimeBinary && secrets.test(bytes.toString("utf8"))) violations.push(`content:${path}`);
    }
  }
  await walk("");
  const archive = join(directory, "resources/app.asar");
  for (const raw of listPackage(archive, { isPack: false })) {
    const path = raw.replaceAll("\\", "/").replace(/^\//, "");
    const metadata = statFile(archive, raw.slice(1), false);
    if ("files" in metadata) continue;
    if ("link" in metadata || ("unpacked" in metadata && metadata.unpacked)) { violations.push(`archive-link:${path}`); continue; }
    const bytes = extractFile(archive, raw.slice(1));
    archiveFiles.push({ path, bytes: bytes.length, sha256: hash(bytes) });
    if ((!bundles.has(path) && !dependencyFile.test(path)) || prohibited.test(path)) violations.push(`archive:${path}`);
    if (secrets.test(bytes.toString("utf8"))) violations.push(`content:${path}`);
  }
  return { format: "esmer-release-inventory-v1", files, archiveFiles, violations };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [directory, output] = process.argv.slice(2);
  if (!directory || !output || process.argv.length !== 4) throw new Error("Usage: node tools/release-inventory.ts <unpacked-directory> <inventory.json>");
  const inventory = await inspectRelease(directory);
  await writeFile(output, `${JSON.stringify(inventory, null, 2)}\n`);
  console.log(JSON.stringify({ files: inventory.files.length, archiveFiles: inventory.archiveFiles.length, violations: inventory.violations }));
  if (inventory.violations.length) process.exitCode = 1;
}
