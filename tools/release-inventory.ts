import { createHash } from "node:crypto";
import { lstat, readdir, readFile, readlink, realpath, writeFile } from "node:fs/promises";
import { join, relative as relativePath, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import { extractFile, listPackage, statFile } from "@electron/asar";

type FileIdentity = { path: string; bytes: number; sha256: string };
const hash = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex");
const bundles = new Set(["dist/desktop/main.cjs", "dist/desktop/preload.cjs", "dist/service/worker.cjs", "dist/ui/app.js", "dist/ui/index.html", "dist/ui/style.css", "dist/ui/app.css", "dist/ui/assets/esmer-market-logo.png", "dist/ui/assets/manrope-latin-ext-wght-normal.woff2", "dist/ui/assets/manrope-latin-wght-normal.woff2", "package.json"]);
const prohibited = /(?:^|\/)(?:\.env[^/]*|credentials?[^/]*|[^/]+\.(?:bak|sqlite(?:-wal|-shm)?|db|mdf|ldf|esmerbackup|pem|pfx|csv|xlsx))$/i;
const reviewedCredentialModule = /^node_modules\/(?:@azure\/identity\/dist\/(?:(?:browser|commonjs|esm|workerd)\/credentials\/credentialPersistenceOptions\.js|browser\/msal\/credentials\.js)|@azure\/msal-common\/src\/cache\/entities\/CredentialEntity\.ts|@typespec\/ts-http-runtime\/dist\/(?:browser|commonjs|esm|react-native)\/auth\/credentials\.js)$/;
const secrets = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:ghp_|github_pat_)[A-Za-z0-9_]{20,}|(?:AKIA|ASIA)[A-Z0-9]{16}/;
const runtimeFiles = new Set(["Esmer Market Analytics.exe", "LICENSE.electron.txt", "LICENSES.chromium.html", "chrome_100_percent.pak", "chrome_200_percent.pak", "d3dcompiler_47.dll", "dxcompiler.dll", "dxil.dll", "ffmpeg.dll", "icudtl.dat", "resources.pak", "snapshot_blob.bin", "v8_context_snapshot.bin", "vk_swiftshader_icd.json", "vk_swiftshader.dll", "vulkan-1.dll", "resources/app.asar", "resources/app-update.yml", "resources/elevate.exe", "resources/licences/LICENSE", "resources/licences/LICENSES.chromium.html", "resources/licences/shadcn-LICENSE", "resources/licences/tailwindcss-LICENSE", "resources/licences/three-LICENSE", "resources/licences/react-three-fiber-LICENSE", "resources/licences/manrope-LICENSE", "resources/licences/its-fine-LICENSE", "resources/licences/react-use-measure-LICENSE", "resources/licences/suspend-react-LICENSE", "resources/licences/zustand-LICENSE", "resources/licences/use-sync-external-store-LICENSE", "resources/licences/scheduler-LICENSE", "resources/licences/react-LICENSE"]);
const dependencyFile = /^node_modules\/(?:@azure\-rest\/core\-client|@azure\/abort\-controller|@azure\/core\-auth|@azure\/core\-client|@azure\/core\-lro|@azure\/core\-paging|@azure\/core\-process|@azure\/core\-rest\-pipeline|@azure\/core\-tracing|@azure\/core\-util|@azure\/identity|@azure\/keyvault\-common|@azure\/keyvault\-keys|@azure\/logger|@azure\/msal\-browser|@azure\/msal\-common|@azure\/msal\-node|@js\-joda\/core|@types\/node|@types\/readable\-stream|@typespec\/ts\-http\-runtime|abort\-controller|agent\-base|base64\-js|bl|buffer|buffer\-equal\-constant\-time|bundle\-name|class\-variance\-authority|clsx|debug|decimal\.js|default\-browser|default\-browser\-id|define\-lazy\-prop|ecdsa\-sig\-formatter|event\-target\-shim|events|fflate|http\-proxy\-agent|https\-proxy\-agent|iconv\-lite|ieee754|inherits|is\-docker|is\-inside\-container|is\-wsl|js\-md4|jsonwebtoken|jwa|jws|lodash\.includes|lodash\.isboolean|lodash\.isinteger|lodash\.isnumber|lodash\.isplainobject|lodash\.isstring|lodash\.once|ms|native\-duplexpair|open|process|react|react\-dom|readable\-stream|run\-applescript|safe\-buffer|safer\-buffer|saxen|scheduler|semver|sprintf\-js|string_decoder|tailwind\-merge|tedious|tslib|undici\-types|write\-excel\-file|wsl\-utils)\//;

function macLink(path: string) {
  return /^Contents\/Frameworks\/(Electron Framework|ReactiveObjC|Squirrel|Mantle)\.framework\/(?:Versions\/Current|Electron Framework|ReactiveObjC|Squirrel|Mantle|Resources|Libraries|Helpers)$/.test(path);
}
function macFile(path: string) {
  if (["Contents/Info.plist", "Contents/PkgInfo", "Contents/MacOS/Esmer Market Analytics", "Contents/Resources/app.asar", "Contents/Resources/electron.icns"].includes(path)) return true;
  if (path.startsWith("Contents/Resources/licences/")) return runtimeFiles.has(path.replace("Contents/Resources/", "resources/"));
  if (/^Contents\/Resources\/[a-zA-Z0-9_-]+\.lproj\/locale.pak$/.test(path)) return true;
  if (/^Contents\/Frameworks\/Esmer Market Analytics Helper(?: \((?:Renderer|Plugin|GPU)\))?\.app\/Contents\/(?:Info.plist|PkgInfo|MacOS\/Esmer Market Analytics Helper(?: \((?:Renderer|Plugin|GPU)\))?)$/.test(path)) return true;
  const framework = path.match(/^Contents\/Frameworks\/(Electron Framework|ReactiveObjC|Squirrel|Mantle)\.framework\/Versions\/A\/(.+)$/);
  if (!framework) return false;
  const [, name, file] = framework;
  if (file === name || file === "Resources/Info.plist") return true;
  if (name === "Squirrel" && file === "Resources/ShipIt") return true;
  return name === "Electron Framework" && (/^Resources\/[a-zA-Z0-9_-]+\.lproj\/locale.pak$/.test(file) || ["Resources/chrome_100_percent.pak", "Resources/chrome_200_percent.pak", "Resources/icudtl.dat", "Resources/MainMenu.nib", "Resources/v8_context_snapshot.arm64.bin", "Resources/resources.pak", "Libraries/vk_swiftshader_icd.json", "Libraries/libvk_swiftshader.dylib", "Libraries/libffmpeg.dylib", "Helpers/chrome_crashpad_handler"].includes(file));
}

async function inspectDistribution(directory: string, platform: "win" | "mac") {
  const files: FileIdentity[] = [], archiveFiles: FileIdentity[] = [], violations: string[] = [];
  const root = await realpath(directory);
  async function walk(relative: string) {
    for (const name of (await readdir(join(directory, relative))).sort()) {
      const path = relative ? `${relative}/${name}` : name;
      const metadata = await lstat(join(directory, path));
      if (metadata.isSymbolicLink()) {
        const target = await realpath(join(directory, path)).catch(() => null);
        const distance = target === null ? null : relativePath(root, target);
        const outside = distance === null || distance === ".." || distance.startsWith(`..${sep}`);
        if (platform !== "mac" || outside || !macLink(path)) violations.push(`link:${path}`);
        const bytes = Buffer.from(await readlink(join(directory, path)));
        files.push({path, bytes:bytes.length, sha256:hash(bytes)});
        continue;
      }
      if (metadata.isDirectory()) { await walk(path); continue; }
      const bytes = await readFile(join(directory, path));
      files.push({ path, bytes: bytes.length, sha256: hash(bytes) });
      if ((platform === "mac" ? !macFile(path) : !runtimeFiles.has(path) && !/^locales\/[a-zA-Z0-9-]+\.pak$/.test(path)) || prohibited.test(path)) violations.push(`distribution:${path}`);
      const runtimeBinary = runtimeFiles.has(path) && /\.(?:exe|dll|pak|bin|dat)$/.test(path);
      if (path !== (platform === "mac" ? "Contents/Resources/app.asar" : "resources/app.asar") && (platform === "mac" || !runtimeBinary) && secrets.test(bytes.toString("utf8"))) violations.push(`content:${path}`);
    }
  }
  await walk("");
  const archive = join(directory, platform === "mac" ? "Contents/Resources/app.asar" : "resources/app.asar");
  for (const raw of listPackage(archive, { isPack: false })) {
    const path = raw.replaceAll("\\", "/").replace(/^\//, "");
    const metadata = statFile(archive, raw.slice(1), false);
    if ("files" in metadata) continue;
    if ("link" in metadata || ("unpacked" in metadata && metadata.unpacked)) { violations.push(`archive-link:${path}`); continue; }
    const bytes = extractFile(archive, raw.slice(1));
    archiveFiles.push({ path, bytes: bytes.length, sha256: hash(bytes) });
    if ((!bundles.has(path) && !dependencyFile.test(path)) || (prohibited.test(path) && !reviewedCredentialModule.test(path))) violations.push(`archive:${path}`);
    if (secrets.test(bytes.toString("utf8"))) violations.push(`content:${path}`);
  }
  return { format: "esmer-release-inventory-v1", files, archiveFiles, violations };
}

export const inspectRelease = (directory: string) => inspectDistribution(directory, "win");
export const inspectMacRelease = (directory: string) => inspectDistribution(directory, "mac");

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [directory, output, platform] = process.argv.slice(2);
  if (!directory || !output || (platform !== undefined && platform !== "mac" || process.argv.length < 4 || process.argv.length > 5)) throw new Error("Usage: node tools/release-inventory.ts <unpacked-directory> <inventory.json> [mac]");
  const inventory = await (platform === "mac" ? inspectMacRelease(directory) : inspectRelease(directory));
  await writeFile(output, `${JSON.stringify(inventory, null, 2)}\n`);
  console.log(JSON.stringify({ files: inventory.files.length, archiveFiles: inventory.archiveFiles.length, violations: inventory.violations }));
  if (inventory.violations.length) process.exitCode = 1;
}
