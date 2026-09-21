import { chromium, expect } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import { openStore, Expenses, SalesReports } from './api.mjs';
const root = resolve('work/windows-phase-7/lifecycle');
const stage = process.argv[2];
assert.ok(['prepare', 'baseline', 'upgraded', 'seed', 'installed', 'portable', 'reinstalled'].includes(stage));
const legacy = stage === 'prepare' || stage === 'baseline' || stage === 'upgraded';
const profile = join(root, legacy ? 'legacy-profile' : 'expense-profile');
const expectedPath = join(root, legacy ? 'legacy-expected.json' : 'expense-expected.json');
const hash = value => createHash('sha256').update(value).digest('hex');
if (stage === 'prepare' || stage === 'seed') {
  await mkdir(profile);
  const store = openStore(join(profile, 'analytics.sqlite'), stage === 'prepare' ? { schemaVersion: 4 } : {});
  store.importPackage(await readFile('work/windows-phase-7/sentetik-İşçilik/sentetik-satis.json'));
  store.appendRevision({ kind: 'setting', entityId: 'synthetic-setting', value: { currency: 'TRY', reason: 'Sentetik yaşam döngüsü', evidence: 'sentetik-setting' } });
  if (stage === 'seed') {
    const expenses = new Expenses(store);
    const preview = expenses.preview(await readFile('work/windows-phase-7/sentetik-İşçilik/excel-kaydedildi.xlsx'));
    assert.deepEqual(preview.errors, []);
    expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
    store.confirmExpensesComplete({ period: '2026-01', reviewedRevision: expenses.query({ period: '2026-01' }).expenseRevision, complete: true, reason: 'Sentetik inceleme, gerçek sahip onayı değil' });
    const reports = new SalesReports(store), report = reports.open({ period: '2026-01' });
    const result = reports.operating({ context: report.view.context });
    assert.equal(result.result.value, '150');
    store.acceptReport({ id: 'sentetik-accepted', pin: store.readSnapshot().pin, calculationVersion: result.calculationVersion, evidence: ['sentetik-lifecycle'], output: result.result });
    const original = expenses.query({ period: '2026-01' }).rows.find(row => row.value.sourceReference === 'sentetik-kira');
    const voided = store.changeExpense({ entityId: original.entityId, expectedRevision: original.revision, restoreRevision: null, reason: 'Sentetik geri alma' });
    store.changeExpense({ entityId: original.entityId, expectedRevision: voided, restoreRevision: original.revision, reason: 'Sentetik geri yükleme' });
    assert.equal(expenses.query({ period: '2026-01' }).complete, false);
  } else {
    store.appendRevision({ kind: 'expense', entityId: 'sentetik-legacy', value: { date: '2026-04-01', net: '50', reason: 'Sentetik eski kayıt', evidence: 'sentetik-legacy' } });
    store.acceptReport({ id: 'sentetik-accepted', pin: store.readSnapshot().pin, calculationVersion: 'sentetik-preservation-v1', evidence: ['sentetik-lifecycle'], output: { label: 'Sentetik saklama kontrolü, gerçek sahip kabulü değil', net: '50' } });
  }
  const accepted = store.readReport('sentetik-accepted');
  const expected = { snapshot: store.readSnapshot(), accepted, pinned: store.readPinned(accepted.pin), batches: stage === 'seed' ? store.expenseBatches() : [] };
  store.close();
  await writeFile(expectedPath, JSON.stringify(expected, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ stage, profile }));
} else {
  const expected = JSON.parse(await readFile(expectedPath, 'utf8'));
  const executable = stage === 'portable' ? resolve('release/Esmer Market Analytics 0.1.0.exe') : join(root, 'installed/Esmer Market Analytics.exe');
  const results = [];
  for (let launch = 1; launch <= 2; launch++) {
    const port = 19870 + launch;
    const child = spawn(executable, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`], { stdio: 'ignore', env: { ...process.env, PATH: 'C:/Windows/System32;C:/Windows', NODE_PATH: '', NODE_OPTIONS: '' } });
    let browser;
    try {
      const deadline = Date.now() + 30000;
      while (!browser) {
        try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`); }
        catch { if (Date.now() > deadline) throw new Error('CONNECT_TIMEOUT'); await delay(200); }
      }
      const page = browser.contexts()[0].pages()[0];
      await expect(page.getByRole('button', { name: 'Veri paketi içe aktar', exact: true })).toBeVisible();
      const session = await browser.newBrowserCDPSession();
      const processes = (await session.send('SystemInfo.getProcessInfo')).processInfo;
      const pid = processes.find(p => p.type === 'browser').id;
      const path = execFileSync('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe', ['-NoProfile', '-Command', `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").ExecutablePath`], { encoding: 'utf8' }).trim();
      const archive = hash(await readFile(join(dirname(path), 'resources/app.asar')));
      assert.equal(archive, stage === 'baseline' ? 'bab372e4d8cfef9fa869c7ecf564504aab1fb62aebf38721b7f7dd086696bd0d' : hash(await readFile('release/win-unpacked/resources/app.asar')));
      const availability = await page.evaluate(() => window.esmer.getAvailability());
      assert.equal(availability.store, 'loaded');
      await page.context().setOffline(true);
      await page.reload();
      await expect(page.getByRole('button', { name: 'Veri paketi içe aktar', exact: true })).toBeVisible();
      if (!legacy) {
        const january = await page.evaluate(() => window.esmer.queryExpenses({ period: '2026-01' }));
        assert.equal(january.rows.length, 2); assert.equal(january.incurred, '550'); assert.equal(january.complete, false);
        assert.equal(january.history.length, 6); assert.equal(january.batches.length, 1);
        await page.getByRole('button', { name: 'Giderler', exact: true }).click();
      }
      await page.screenshot({ path: join(root, `${stage}-${launch}.png`), fullPage: true });
      await page.close();
      const exitDeadline = Date.now() + 15000;
      while (child.exitCode === null) { if (Date.now() > exitDeadline) throw new Error('EXIT_TIMEOUT'); await delay(100); }
      assert.equal(child.exitCode, 0);
      const db = new DatabaseSync(join(profile, 'analytics.sqlite'), { readOnly: true });
      const schema = db.prepare('PRAGMA user_version').get().user_version;
      db.close();
      assert.equal(schema, stage === 'baseline' ? 4 : 5);
      const store = openStore(join(profile, 'analytics.sqlite'), stage === 'baseline' ? { schemaVersion: 4 } : {});
      assert.deepEqual(store.readSnapshot(), expected.snapshot);
      assert.deepEqual(store.readReport('sentetik-accepted'), expected.accepted);
      assert.deepEqual(store.readPinned(expected.accepted.pin), expected.pinned);
      if (stage !== 'baseline') assert.deepEqual(store.expenseBatches(), expected.batches);
      store.close();
      results.push({ launch, schema, archive, profilePreserved: true, acceptedAndPinnedPreserved: true, offlineMode: 'Playwright network blocking, not physical disconnect', developerRuntimeInChildPath: false });
    } finally { if (browser) await browser.close(); if (child.exitCode === null) child.kill(); }
  }
  await writeFile(join(root, `${stage}-proof.json`), JSON.stringify({ stage, profile, results }, null, 2));
  console.log(JSON.stringify({ stage, results }));
}

