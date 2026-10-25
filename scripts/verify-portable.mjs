import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, realpath, lstat, mkdir, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { resolve, join, dirname, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { DatabaseSync } from 'node:sqlite';
import { chromium, expect } from '@playwright/test';

assert.equal(process.platform, 'win32', 'Windows portable verification only');
const repo = resolve('.');
const release = join(repo, 'release');
const allowedProfiles = [join(repo, 'work/windows-phase-8/lifecycle'), join(repo, 'work/phase-10-lifecycle')];
const args = new Map();
for (let index = 2; index < process.argv.length; index += 2) {
  const flag = process.argv[index];
  assert.ok(['--exe', '--profile'].includes(flag) && process.argv[index + 1] && !args.has(flag), 'Expected unique --exe and --profile paths');
  args.set(flag, process.argv[index + 1]);
}
assert.equal(args.size, 2, 'Expected --exe and --profile');
const exe = resolve(args.get('--exe'));
const profile = resolve(args.get('--profile'));
const realExe = await realpath(exe);
const realProfile = await realpath(profile);
assert.equal(realExe, exe, 'Refuse linked portable executable');
assert.equal(realProfile, profile, 'Refuse linked profile');
assert.equal(dirname(exe), release, 'Portable executable must be in this repository release directory');
assert.match(exe, /Esmer Market Analytics 0\.2\.0\.exe$/);
assert.ok(allowedProfiles.some(root => profile.startsWith(root + sep)), 'Profile must be inside a disposable Phase 8 or Phase 10 work directory');
for (let path = profile; path.startsWith(repo + sep); path = dirname(path)) {
  assert.equal((await lstat(path)).isSymbolicLink(), false, `Refuse linked path: ${path}`);
}
const expectedArchive = createHash('sha256').update(await readFile(join(release, 'win-unpacked/resources/app.asar'))).digest('hex');
const wrapperHash = createHash('sha256').update(await readFile(exe)).digest('hex');
const database = join(profile, 'analytics.sqlite');
// report_versions and evidence_references are omitted: the app no longer creates accepted reports, so they are always empty here.
const tables = ['datasets', 'package_history', 'import_batches', 'source_suppliers', 'source_documents', 'source_lines', 'active_dataset', 'rollback_dataset', 'app_revisions', 'adjustment_targets', 'expense_batches'];
const hash = value => createHash('sha256').update(value).digest('hex');
function capture() {
  const db = new DatabaseSync(database, { readOnly: true });
  try {
    const schema = db.prepare('PRAGMA user_version').get().user_version;
    const businessHash = hash(JSON.stringify(tables.map(table => [table, db.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all()])));
    return { schema, businessHash };
  } finally { db.close(); }
}
const baseline = capture();
assert.equal(baseline.schema, 6, 'Portable verification requires migrated schema 6 profile');
const receipt = join(repo, 'work/phase-10/portable-proof.json');
await mkdir(dirname(receipt), { recursive: true });
try { await lstat(receipt); assert.fail('Preserve existing portable proof before repeating'); }
catch (error) { if (error.code !== 'ENOENT') throw error; }

async function freePort() {
  const server = createServer();
  await new Promise((done, fail) => { server.once('error', fail); server.listen(0, '127.0.0.1', done); });
  const port = server.address().port;
  await new Promise((done, fail) => server.close(error => error ? fail(error) : done()));
  return port;
}

const runs = [];
for (let launch = 1; launch <= 2; launch++) {
  const port = await freePort();
  const child = spawn(exe, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`], {
    stdio: 'ignore', windowsHide: true,
    env: { ...process.env, PATH: `${process.env.SystemRoot ?? 'C:\\Windows'}\\System32;${process.env.SystemRoot ?? 'C:\\Windows'}`, NODE_PATH: '', NODE_OPTIONS: '' },
  });
  let browser;
  try {
    const connectDeadline = Date.now() + 30_000;
    while (!browser) {
      try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); }
      catch (error) {
        if (child.exitCode !== null || Date.now() >= connectDeadline) throw new Error(`Portable CDP startup failed: ${error.message}`);
        await delay(200);
      }
    }
    const page = browser.contexts()[0].pages()[0];
    await expect(page.getByRole('button', { name: 'Raporlar', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Ayarlar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Veri paketi içe aktar', exact: true })).toBeVisible();
    const session = await browser.newBrowserCDPSession();
    const processes = (await session.send('SystemInfo.getProcessInfo')).processInfo;
    const pid = processes.find(process => process.type === 'browser')?.id;
    assert.ok(Number.isInteger(pid), 'Portable browser process not found');
    const processPath = execFileSync('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe', ['-NoProfile', '-Command', `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").ExecutablePath`], { encoding: 'utf8', windowsHide: true }).trim();
    const runningArchiveHash = hash(await readFile(join(dirname(processPath), 'resources/app.asar')));
    assert.equal(runningArchiveHash, expectedArchive, 'Portable process did not load the candidate archive');
    assert.equal((await page.evaluate(() => window.esmer.getAvailability())).store, 'loaded');
    await page.context().setOffline(true);
    await page.reload();
    await expect(page.getByRole('button', { name: 'Raporlar', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Ayarlar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Veri paketi içe aktar', exact: true })).toBeVisible();
    const expenses = await page.evaluate(() => window.esmer.queryExpenses({ period: '2025-09' }));
    assert.ok(Array.isArray(expenses.rows) && expenses.rows.length > 0, 'Expected the retained synthetic expenses');
    await page.close();
    const exitDeadline = Date.now() + 15_000;
    while (child.exitCode === null) {
      if (Date.now() >= exitDeadline) throw new Error('Portable process did not exit after window close');
      await delay(100);
    }
    assert.equal(child.exitCode, 0);
    assert.deepEqual(capture(), baseline, 'Portable launch changed accepted or app-owned records');
    runs.push({ launch, processPath, runningArchiveHash, exitCode: child.exitCode, profilePreserved: true, appRecordsPreserved: true, developerRuntimeInChildPath: false });
  } finally {
    if (browser) for (const context of browser.contexts()) for (const page of context.pages()) await page.close().catch(() => undefined);
    if (browser) await browser.close().catch(() => undefined);
    if (child.exitCode === null) child.kill();
  }
}
await writeFile(receipt, JSON.stringify({ executable: exe, wrapperHash, expectedArchive, profile, baseline, runs, syntheticOnly: true, offlineMode: 'Playwright network blocking, not physical disconnection' }, null, 2), { flag: 'wx' });
console.log('PORTABLE_PROOF_PASSED');
