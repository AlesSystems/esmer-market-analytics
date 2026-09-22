import { chromium, expect } from '@playwright/test';
import { spawn, execFileSync } from 'node:child_process';
import { readFile, writeFile, mkdir, lstat } from 'node:fs/promises';
import { resolve, join, dirname, sep } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import { openStore, Expenses, SalesReports, ReportVersions, businessRecords, businessPackage, workbook, row } from './api.mjs';

const root = resolve('work/windows-phase-8/lifecycle');
const stage = process.argv[2];
const stages = {
  prepare: { seed: 'legacy' },
  baseline: { expected: 'legacy', prior: true },
  upgraded: { expected: 'legacy' },
  seed: { seed: 'monthly' },
  installed: { expected: 'monthly' },
  portable: { expected: 'monthly', portable: true },
  reinstalled: { expected: 'monthly' },
};
assert.ok(Object.hasOwn(stages, stage), 'Unknown lifecycle stage');
const selected = stages[stage];
const profile = join(root, 'synthetic-profile');
const database = join(profile, 'analytics.sqlite');
const period = '2025-09';
const legacyId = 'synthetic-phase-7-accepted';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const expectedPath = name => join(root, `${name}-expected.json`);
for (let path = root; path.startsWith(resolve('work') + sep); path = dirname(path)) {
  try { assert.equal((await lstat(path)).isSymbolicLink(), false, `Refuse linked lifecycle path ${path}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}
await mkdir(root, { recursive: true });
assert.equal((await lstat(root)).isSymbolicLink(), false);
const outputs = selected.seed ? [expectedPath(selected.seed)] : [join(root, `${stage}-proof.json`), ...[1, 2].map(launch => join(root, `${stage}-${launch}.png`))];
for (const output of outputs) {
  try { await lstat(output); assert.fail(`Preserve existing lifecycle evidence before repeating ${output}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
}

function capture(store, monthlyId = null) {
  const ids = monthlyId ? [legacyId, monthlyId] : [legacyId];
  return {
    snapshot: store.readSnapshot(),
    revisions: store.revisionHistory(),
    batches: store.expenseBatches(),
    expenses: new Expenses(store).query({ period }),
    reports: ids.map(id => { const accepted = store.readReport(id); return { accepted, pinned: store.readPinned(accepted.pin) }; }),
    monthlyId,
  };
}

if (selected.seed) {
  if (selected.seed === 'legacy') await mkdir(profile);
  else assert.equal((await lstat(profile)).isSymbolicLink(), false);
  const store = openStore(database);
  try {
    if (selected.seed === 'legacy') {
      const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
      store.importPackage(businessPackage(records, { lineage: 'synthetic-windows-phase-8-lifecycle' }));
      store.appendRevision({ kind: 'setting', entityId: 'synthetic-setting', value: { currency: 'TRY', reason: 'Sentetik yaşam döngüsü', evidence: 'synthetic-setting' } });
      const expenses = new Expenses(store);
      const preview = expenses.preview(await workbook([[row[0], '15.09.2025', '01.10.2025', ...row.slice(3)]]));
      assert.deepEqual(preview.errors, []);
      expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
      const original = expenses.query({ period }).rows[0];
      store.confirmExpensesComplete({ period, reviewedRevision: original.revision, complete: true, reason: 'Sentetik inceleme, gerçek sahip onayı değil' });
      const reports = new SalesReports(store), opened = reports.open({ period });
      assert.equal(opened.status, 'report');
      const result = reports.operating({ context: opened.view.context });
      assert.equal(result.result.value, '-10');
      store.acceptReport({ id: legacyId, pin: store.readSnapshot().pin, calculationVersion: result.calculationVersion, evidence: ['synthetic-lifecycle'], output: { result: result.result, label: 'Sentetik kabul, gerçek sahip kabulü değil' } });
      const keys = ['date', 'paymentDate', 'category', 'classification', 'net', 'tax', 'gross', 'taxTreatment', 'taxEvidence', 'supportingReference', 'sourceReference', 'labourPeriod', 'loss'];
      const replacement = Object.fromEntries(keys.map(key => [key, original.value[key]]));
      const corrected = store.changeExpense({ entityId: original.entityId, expectedRevision: original.revision, replacement: { ...replacement, net: '60', gross: '60' }, reason: 'Sentetik tutar düzeltmesi' });
      assert.equal(expenses.query({ period }).complete, false);
      const voided = store.changeExpense({ entityId: original.entityId, expectedRevision: corrected, restoreRevision: null, reason: 'Sentetik geri alma' });
      store.changeExpense({ entityId: original.entityId, expectedRevision: voided, restoreRevision: original.revision, reason: 'Sentetik geri yükleme' });
      const current = expenses.query({ period });
      assert.equal(current.incurred, '50');
      store.confirmExpensesComplete({ period, reviewedRevision: current.expenseRevision, complete: true, reason: 'Sentetik yeniden inceleme, gerçek sahip onayı değil' });
      await writeFile(expectedPath('legacy'), JSON.stringify(capture(store), null, 2), { flag: 'wx' });
    } else {
      const expected = JSON.parse(await readFile(expectedPath('legacy'), 'utf8'));
      assert.deepEqual(capture(store), expected);
      const versions = new ReportVersions(store, new SalesReports(store));
      const opened = versions.open({ period });
      assert.equal(opened.status, 'monthly');
      assert.equal(opened.report.operating.result.value, '-10');
      assert.equal(opened.report.operating.result.status, 'estimated');
      versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: 'Sentetik MONTHLY incelemesi, gerçek sahip kabulü değil' });
      assert.ok(versions.selected(opened.report.id).review);
      await writeFile(expectedPath('monthly'), JSON.stringify(capture(store, opened.report.id), null, 2), { flag: 'wx' });
    }
  } finally { store.close(); }
  console.log(JSON.stringify({ stage, profile, syntheticOnly: true }));
} else {
  assert.equal((await lstat(profile)).isSymbolicLink(), false);
  assert.equal((await lstat(database)).isSymbolicLink(), false);
  const expected = JSON.parse(await readFile(expectedPath(selected.expected), 'utf8'));
  const executable = selected.portable ? resolve('release/Esmer Market Analytics 0.1.0.exe') : join(root, 'installed/Esmer Market Analytics.exe');
  const executableHash = hash(await readFile(executable));
  const expectedArchive = selected.prior ? 'a1b29602e60fa2903da96efef91cd83d49a5ae9fa5d8b77fec4053534a46f973' : hash(await readFile('release/win-unpacked/resources/app.asar'));
  const results = [];
  for (let launch = 1; launch <= 2; launch++) {
    const port = 19880 + launch;
    const child = spawn(executable, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`], { stdio: 'ignore', windowsHide: true, env: { ...process.env, PATH: 'C:/Windows/System32;C:/Windows', NODE_PATH: '', NODE_OPTIONS: '' } });
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
      const pid = processes.find(process => process.type === 'browser').id;
      const processPath = execFileSync('C:/Windows/System32/WindowsPowerShell/v1.0/powershell.exe', ['-NoProfile', '-Command', `(Get-CimInstance Win32_Process -Filter "ProcessId=${pid}").ExecutablePath`], { encoding: 'utf8', windowsHide: true }).trim();
      const archive = hash(await readFile(join(dirname(processPath), 'resources/app.asar')));
      assert.equal(archive, expectedArchive);
      const runningExecutableHash = hash(await readFile(processPath));
      assert.equal((await page.evaluate(() => window.esmer.getAvailability())).store, 'loaded');
      await page.context().setOffline(true);
      await page.reload();
      await expect(page.getByRole('button', { name: 'Veri paketi içe aktar', exact: true })).toBeVisible();
      assert.deepEqual(await page.evaluate(period => window.esmer.queryExpenses({ period }), period), expected.expenses);
      if (expected.monthlyId) {
        const report = await page.evaluate(reportId => window.esmer.readReportVersion({ reportId }), expected.monthlyId);
        assert.equal(report.status, 'monthly');
        assert.deepEqual(report.report, expected.reports[1].accepted.output.report);
        assert.equal(report.report.operating.result.value, '-10');
      }
      await page.screenshot({ path: join(root, `${stage}-${launch}.png`), fullPage: true });
      await page.close();
      const exitDeadline = Date.now() + 15000;
      while (child.exitCode === null) { if (Date.now() > exitDeadline) throw new Error('EXIT_TIMEOUT'); await delay(100); }
      assert.equal(child.exitCode, 0);
      const db = new DatabaseSync(database, { readOnly: true });
      const schema = db.prepare('PRAGMA user_version').get().user_version;
      db.close();
      assert.equal(schema, 5);
      const store = openStore(database);
      try { assert.deepEqual(capture(store, expected.monthlyId), expected); }
      finally { store.close(); }
      results.push({ launch, schema, executable, executableHash, processPath, runningExecutableHash, archive, profilePreserved: true, acceptedAndPinnedPreserved: true, syntheticOnly: true, offlineMode: 'Playwright network blocking, not physical disconnect', developerRuntimeInChildPath: false });
    } finally { if (browser) await browser.close(); if (child.exitCode === null) child.kill(); }
  }
  await writeFile(join(root, `${stage}-proof.json`), JSON.stringify({ stage, profile, results }, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ stage, results }));
}
