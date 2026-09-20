import { extractFile, listPackage, statFile } from '@electron/asar';
import { createHash } from 'node:crypto';
import { readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { relative, resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve(process.argv[2] ?? 'release');
const archive = join(root, 'win-unpacked/resources/app.asar');
const output = resolve(process.argv[3] ?? 'work/windows-phase-4/package-inventory.json');
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const normalize = value => value.replaceAll('\\', '/');
const issues = [];
const applicationFiles = new Set(['dist/desktop/main.cjs', 'dist/desktop/preload.cjs', 'dist/service/worker.cjs', 'dist/ui/app.js', 'dist/ui/index.html', 'dist/ui/style.css', 'package.json']);
const forbiddenPath = /(?:^|\/)(?:tests?|fixtures?|work|\.scratch|\.git|tools|src|credentials?)(?:\/|$)|(?:^|\/)\.env(?:\.|$)|\.(?:bak|sqlite|sqlite3|db|mdf|ldf|pfx|pem|key|map)$/i;
const forbiddenContent = /PRIVATE_(?:CUSTOMER|SUPPLIER|PAYROLL|PATH|DATABASE)_SENTINEL|SYNTHETIC_PRIVATE_SENTINEL|src\/source\/(?:extract|sqlite-reader|worker)|tools\/prepare-backup|mssql|tedious|SEQUNCES_DEGISIKLIK/;
const archiveFiles = [];
const bundleSources = {};
for (const entry of listPackage(archive)) {
  const nativePath = entry.slice(1);
  const path = normalize(nativePath);
  const info = statFile(archive, nativePath);
  if (!('size' in info)) continue;
  const bytes = extractFile(archive, nativePath);
  archiveFiles.push({ path, bytes: bytes.length, sha256: digest(bytes) });
  if (forbiddenPath.test(path)) issues.push({ path, reason: 'forbidden archive path' });
  if (!path.startsWith('node_modules/') && !applicationFiles.has(path)) issues.push({ path, reason: 'unexpected application file' });
  if (!path.startsWith('node_modules/') && /\.(?:js|cjs|json|html|css)$/.test(path)) {
    const text = bytes.toString('utf8');
    if (forbiddenContent.test(text)) issues.push({ path, reason: 'forbidden application content marker' });
    const sources = [...text.matchAll(/^\/\/ (src\/[^\r\n]+)/gm)].map(match => match[1]);
    if (sources.length) bundleSources[path] = [...new Set(sources)];
  }
}
for (const path of applicationFiles) if (!archiveFiles.some(file => file.path === path)) issues.push({ path, reason: 'required application file missing' });
async function walk(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile()) files.push(path);
    else issues.push({ path: normalize(relative(root, path)), reason: 'unexpected non-regular distribution entry' });
  }
  return files;
}
const releaseFiles = [];
for (const file of await walk(root)) {
  const path = normalize(relative(root, file));
  const bytes = await readFile(file);
  releaseFiles.push({ path, bytes: bytes.length, sha256: digest(bytes) });
  if (forbiddenPath.test(path)) issues.push({ path, reason: 'forbidden distribution path' });
}
const service = extractFile(archive, join('dist', 'service', 'worker.cjs')).toString('utf8');
for (const expected of ['src/store/store.ts', 'src/source/package.ts', 'node:sqlite']) {
  if (!service.includes(expected)) issues.push({ path: 'dist/service/worker.cjs', reason: `expected store/reader marker missing: ${expected}` });
}
let codeSha = 'unknown';
try { codeSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}
const result = {
  inspectedAt: new Date().toISOString(), platform: process.platform, arch: process.arch, developmentNode: process.version, observedHead: codeSha,
  archive: normalize(relative(process.cwd(), archive)), archiveSha256: digest(await readFile(archive)), archiveBytes: (await stat(archive)).size,
  archiveEntries: listPackage(archive).length, archiveFileCount: archiveFiles.length,
  applicationBundles: archiveFiles.filter(file => applicationFiles.has(file.path)), bundleSources,
  releaseFileCount: releaseFiles.length, archiveFiles, releaseFiles, issues,
  limitations: 'Current local artifacts only. Builder debug metadata is a local build file, not an installed application file. Inventory uses package paths, file types, allowlisted application entries and known synthetic/source markers; it does not certify unknown private content or real-source privacy. Rerun after final packaging. Dependency notices are checked separately by scripts/verify-package.mjs. Physical offline behavior and lifecycle require separate evidence.'
};
await writeFile(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ archiveSha256: result.archiveSha256, archiveEntries: result.archiveEntries, archiveFiles: archiveFiles.length, releaseFiles: releaseFiles.length, issues, output: normalize(relative(process.cwd(), output)) }));
if (issues.length) process.exitCode = 1;
