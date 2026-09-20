import { chromium, expect } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import { readFile, writeFile, rename, readdir } from 'node:fs/promises';
import { resolve, join, dirname, relative } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { openStore } from './fixture-api.mjs';
const paths = JSON.parse(await readFile(new URL('./paths.json', import.meta.url), 'utf8'));
const { root } = paths;
const stage = process.argv[2];
if (!['baseline', 'upgraded', 'portable'].includes(stage)) throw new Error('INVALID_STAGE');
const portable = stage === 'portable';
const profileName = portable ? 'portable-profile' : 'installed-profile';
const profile = join(root, profileName);
const expected = JSON.parse(await readFile(join(root, `${profileName}-expected.json`), 'utf8'));
const executable = portable ? resolve('release/Esmer Market Analytics 0.1.0.exe') : join(root, 'nsis-app/Esmer Market Analytics.exe');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const results = [];
for (let launch = 1; launch <= 2; launch++) {
  const port = 19840 + launch;
  const child = spawn(executable, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`], { stdio: 'ignore', env: { ...process.env, APPDATA: join(root, 'installer-appdata'), PATH: 'C:/Windows/System32;C:/Windows', NODE_PATH: '', NODE_OPTIONS: '' } });
  let browser;
  try {
    const deadline = Date.now() + 30000;
    while (!browser) {
      try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); }
      catch { if (Date.now() > deadline) throw new Error('CONNECT_TIMEOUT'); await delay(250); }
    }
    const session = await browser.newBrowserCDPSession();
    const { processInfo } = await session.send('SystemInfo.getProcessInfo');
    const browserPid = processInfo.find(value => value.type === 'browser').id;
    const processes = JSON.parse(execFileSync('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe', ['-NoProfile', '-Command', 'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,ExecutablePath | ConvertTo-Json -Compress'], { encoding: 'utf8' }));
    let ancestor = browserPid;
    const visited = new Set();
    while (ancestor !== child.pid && !visited.has(ancestor)) { visited.add(ancestor); ancestor = processes.find(value => value.ProcessId === ancestor)?.ParentProcessId; }
    expect(ancestor).toBe(child.pid);
    const appRoot = dirname(processes.find(value => value.ProcessId === browserPid).ExecutablePath);
    const archiveHash = hash(await readFile(join(appRoot, 'resources/app.asar')));
    expect(archiveHash).toBe(stage === 'baseline' ? paths.baselineAsarSha256 : hash(await readFile('release/win-unpacked/resources/app.asar')));
    const runtimeFiles = [];
    async function inventory(directory) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) await inventory(path);
        else { const bytes = await readFile(path); runtimeFiles.push({ path: relative(appRoot, path).replaceAll('\\', '/'), bytes: bytes.length, sha256: hash(bytes) }); }
      }
    }
    if (launch === 1) { await inventory(appRoot); await writeFile(join(root, `${stage}-inventory.json`), JSON.stringify(runtimeFiles, null, 2)); }
    const page = browser.contexts()[0].pages().find(value => value.url().startsWith('esmer:')) ?? browser.contexts()[0].pages()[0];
    await expect(page.getByRole('heading', { name: 'Verileriniz bu bilgisayarda hazır' })).toBeVisible();
    await page.context().setOffline(true);
    await page.reload();
    await expect(page.getByText('Eksik maliyet sıfır kabul edilmez.', { exact: false })).toBeVisible();
    const availability = await page.evaluate(() => window.esmer.getAvailability());
    expect(availability).toEqual(expected.availability);
    expect(await page.evaluate(() => ({ node: typeof window.require, process: typeof window.process, api: Object.keys(window.esmer).sort() }))).toEqual({ node: 'undefined', process: 'undefined', api: stage === 'baseline' ? ['getAvailability', 'importPackage', 'inspectSales', 'openSales', 'querySales'] : ['getAvailability', 'importPackage', 'inspectSales', 'openSales', 'queryPurchasing', 'querySales'] });
    expect(await page.evaluate(() => window.esmer.openSales({ period: null }))).toMatchObject({ status: 'unavailable', code: 'UNSUPPORTED_ADJUSTMENTS' });
    await page.screenshot({ path: join(root, `${stage}-${launch}.png`) });
    await page.close();
    const exitDeadline = Date.now() + 15000;
    while (child.exitCode === null) { if (Date.now() > exitDeadline) throw new Error('EXIT_TIMEOUT'); await delay(100); }
    expect(child.exitCode).toBe(0);
    const databasePath = join(profile, 'analytics.sqlite');
    const db = new DatabaseSync(databasePath, { readOnly: true });
    try {
      expect(db.prepare('PRAGMA user_version').get()).toEqual({ user_version: stage === 'baseline' ? 3 : 4 });
      expect(db.prepare('PRAGMA integrity_check').get()).toEqual({ integrity_check: 'ok' });
      expect(db.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
      for (const [table, original] of Object.entries(expected.tables)) {
        const rows = db.prepare(`SELECT ${original.columns.map(column => `"${column}"`).join(',')} FROM "${table}" ORDER BY rowid`).all();
        expect(rows).toEqual(original.rows);
        expect(hash(JSON.stringify(rows))).toBe(original.sha256);
      }
      if (stage !== 'baseline') {
        for (const [table, column] of [['source_documents', 'purchasing_json'], ['source_lines', 'business_json'], ['source_suppliers', 'name']]) {
          expect(db.prepare(`SELECT COUNT(*) AS count FROM "${table}" WHERE "${column}" IS NOT NULL`).get().count).toBe(0);
        }
      }
    }
    finally { db.close(); }
    const store = openStore(databasePath, { schemaVersion: stage === 'baseline' ? 3 : 4 });
    try { expect(store.readSnapshot()).toEqual(expected.current); expect(store.readPinned(expected.accepted.pin)).toEqual(expected.accepted); expect(store.readReport('accepted')).toEqual(expected.report); }
    finally { store.close(); }
    await rename(databasePath, `${databasePath}.released`); await rename(`${databasePath}.released`, databasePath);
    results.push({ stage, launch, executable, browserPid, appRoot, profile, archiveHash, exitCode: child.exitCode, availability, developerRuntimeInPath: false, processOwnershipVerified: true, browserOfflineReload: true, physicalDisconnect: false, schemaVersion: stage === 'baseline' ? 3 : 4, integrity: 'ok', sourceAppRevisionsEvidenceReportPinsPreserved: true, originalTableHashesPreserved: true, acceptedSnapshotHash: expected.hashes.accepted, currentSnapshotHash: expected.hashes.current, reportHash: expected.hashes.report, activeAdjustmentBlocksReport: true, databaseRenameAfterShutdown: true });
    console.log(`${stage} launch ${launch} PASS`);
  } finally { await browser?.close(); if (child.exitCode === null) child.kill(); }
}
await writeFile(join(root, `${stage}-results.json`), JSON.stringify(results, null, 2));
