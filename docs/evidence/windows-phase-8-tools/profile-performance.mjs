import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { cpus, hostname, totalmem } from 'node:os';
import { join, resolve } from 'node:path';
import { _electron as electron } from '@playwright/test';
import { build } from 'esbuild';

const root = resolve('work/performance'), expectedHash = '902c301a65750541160e39374d0ba9572d00282d60a9bed94f0d92fe3b5bfaf8';
const executablePath = resolve(process.argv[2] ?? 'release/win-unpacked/Esmer Market Analytics.exe'), limitMs = 2_000;
await mkdir(root, { recursive: true });
const run = await mkdtemp(join(root, 'profile-fixed-')), receiptPath = join(run, 'profile.json');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const git = (...args) => execFileSync('git', args, { encoding: 'utf8' }).trim();
const receipt = { status: 'running', startedAt: new Date().toISOString(), commit: git('rev-parse', 'HEAD'), branch: git('branch', '--show-current'), run,
  runtime: { node: process.version, executablePath }, hardware: { hostname: hostname(), cpu: cpus()[0]?.model, logicalCpus: cpus().length, memoryBytes: totalmem(), platform: process.platform, arch: process.arch },
  retainedBaseline: ['work/performance/profile-kPEsqW/service-checkpoint.json', 'work/performance/profile-kPEsqW/profile.json'], assertions: [] };
let app;
const save = async () => { receipt.finishedAt = new Date().toISOString(); await writeFile(receiptPath, JSON.stringify(receipt, null, 2)); };

try {
  assert.equal(process.versions.node.split('.')[0], '24', 'Use the locked Node 24 runtime');
  const diff = execFileSync('git', ['diff', '--binary', 'HEAD'], { encoding: 'utf8' });
  receipt.sourceState = { dirty: git('status', '--short').length > 0, diffSha256: hash(Buffer.from(diff)), diffBytes: Buffer.byteLength(diff) };
  receipt.runtime.executableSha256 = hash(await readFile(executablePath));
  receipt.runtime.appAsarSha256 = hash(await readFile(resolve('release/win-unpacked/resources/app.asar')));
  const apiPath = join(run, 'profile-api.mjs');
  await build({ stdin: { contents: "export { openStore } from './src/store/store'; export { SalesReports } from './src/reports/query'; export { ReportVersions } from './src/reports/versions'; export { calculateSales } from './src/analytics/sales'; export { estimateGrossResult } from './src/analytics/costs'; export { calculatePurchasing } from './src/analytics/purchasing'; export { businessRecords, businessPackage } from './tests/helpers/business-fixtures';", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', packages: 'external', target: 'node24', outfile: apiPath });
  const api = await import(`${new URL(`file:///${apiPath.replaceAll('\\', '/')}`).href}?${Date.now()}`);

  const bulk = api.businessRecords(), document = bulk.documents[0], line = bulk.lines[0];
  bulk.documents = Array.from({ length: 25_000 }, (_, i) => ({ ...document, id: `bulk-${i}` }));
  bulk.lines = Array.from({ length: 25_000 }, (_, i) => ({ ...line, id: `bulk-line-${i}`, documentId: `bulk-${i}` }));
  const fixture = api.businessPackage(bulk, { extractionId: 'windows-8-bulk', extractedAt: '2025-10-04T00:00:00.000Z' });
  assert.equal(hash(fixture), expectedHash, 'Deterministic 25,000-document fixture changed');
  const fixturePath = join(run, 'sentetik-buyuk.json'); await writeFile(fixturePath, fixture);
  const corrected = structuredClone(bulk);
  corrected.documents[0].sales = { ...corrected.documents[0].sales, net: '120', tax: '6', gross: '126' };
  corrected.lines[0] = { ...corrected.lines[0], net: '120', sales: { ...corrected.lines[0].sales, unitNet: '120', tax: '6', gross: '126' } };
  const correctedBytes = api.businessPackage(corrected, { extractionId: 'windows-8-bulk-corrected', extractedAt: '2025-10-05T00:00:00.000Z' });
  const correctedPath = join(run, 'sentetik-buyuk-duzeltme.json'); await writeFile(correctedPath, correctedBytes);
  receipt.fixture = { path: fixturePath, sha256: expectedHash, bytes: fixture.length, documents: 25_000, lines: 25_000, correctedPath, correctedSha256: hash(correctedBytes) };

  const store = api.openStore(join(run, 'service.sqlite')); assert.equal(store.importPackage(fixture).status, 'active');
  const diagnostic = {}, timed = (name, fn) => { const started = performance.now(), value = fn(); diagnostic[name] = performance.now() - started; return value; };
  const snapshot = timed('databaseReadMs', () => store.readSnapshot());
  const scope = { mappingVersion: snapshot.metadata.mappingVersion, from: '2025-09-01', to: '2025-09-30', cutoff: snapshot.metadata.cutoff };
  const sales = timed('salesCalculationMs', () => api.calculateSales(snapshot.records, scope));
  const allSales = timed('wholeHistorySalesMs', () => api.calculateSales(snapshot.records, { ...scope, from: '1900-01-01', to: '9998-12-31' }));
  const gross = timed('grossCalculationMs', () => api.estimateGrossResult(snapshot.records, scope, { sales, allSales }));
  timed('purchasingCalculationMs', () => api.calculatePurchasing(snapshot.records, scope, { gross }));
  const reports = new api.SalesReports(store), opened = timed('reportOpenMs', () => reports.open({ period: '2025-09' })); assert.equal(opened.status, 'report');
  const monthly = timed('monthlyFirstAssemblyCloneMs', () => reports.monthly(opened.view.context)); assert.equal(monthly.status, 'monthly');
  const warm = timed('monthlyWarmCloneMs', () => reports.monthly(opened.view.context)); assert.equal(warm.status, 'monthly'); assert.equal(warm.report.id, monthly.report.id);
  timed('monthlyJsonMs', () => JSON.stringify(warm)); diagnostic.payloadBytes = { sales: Buffer.byteLength(JSON.stringify(opened)), monthly: Buffer.byteLength(JSON.stringify(warm)) };
  const versions = new api.ReportVersions(store, reports);
  const compact = timed('monthlyCompactProjectionCloneMs', () => versions.currentDisplay({ context: opened.view.context })); assert.equal(compact.status, 'monthly');
  timed('monthlyCompactJsonMs', () => JSON.stringify(compact)); diagnostic.payloadBytes.compactMonthly = Buffer.byteLength(JSON.stringify(compact));
  receipt.serviceDiagnostic = diagnostic; await writeFile(join(run, 'service-checkpoint.json'), JSON.stringify({ fixtureSha256: expectedHash, diagnostic }, null, 2)); store.close();

  async function seed(profile) {
    await mkdir(profile, { recursive: true }); const seeded = api.openStore(join(profile, 'analytics.sqlite')); assert.equal(seeded.importPackage(fixture).status, 'active');
    const versions = new api.ReportVersions(seeded, new api.SalesReports(seeded)), candidate = versions.open({ period: '2025-09' }); assert.equal(candidate.status, 'monthly');
    const saved = versions.accept({ candidateId: candidate.report.id, previousAcceptedId: null, reason: 'Sentetik performans kanıtı' }); assert.equal(saved.status, 'monthly'); seeded.close();
    return { id: saved.report.id, netSales: saved.report.sales.metrics.netSales };
  }
  const measure = (page, action, ready) => page.evaluate(({ action, ready }) => new Promise((resolveResult, reject) => {
    const button = [...document.querySelectorAll('button')].find(node => node.textContent?.trim() === action);
    if (!(button instanceof HTMLButtonElement)) return reject(new Error(`BUTTON_NOT_FOUND:${action}`));
    const started = performance.now(), deadline = started + 120_000;
    const check = () => {
      const heading = document.querySelector('h1')?.textContent?.trim() ?? '', rows = document.querySelectorAll('main tbody tr').length;
      const loading = [...document.querySelectorAll('[role="status"]')].some(node => /yükleniyor|hesaplanıyor/i.test(node.textContent ?? ''));
      const readyText = ready.text && [...document.querySelectorAll('[role="status"]')].some(node => node.textContent?.includes(ready.text));
      const readyBody = ready.body && document.body.textContent?.includes(ready.body);
      if (!loading && ((ready.heading && heading === ready.heading) || readyText || readyBody) && (ready.rows === undefined || rows === ready.rows)) requestAnimationFrame(() => requestAnimationFrame(() => resolveResult({ elapsedMs: performance.now() - started, rows, domNodes: document.getElementsByTagName('*').length })));
      else if (performance.now() > deadline) reject(new Error(`READY_TIMEOUT:${action}:${heading}:${rows}`)); else requestAnimationFrame(check);
    };
    button.click(); requestAnimationFrame(check);
  }), { action, ready });
  const memory = async (appValue, page) => ({ renderer: await page.evaluate(() => ({ usedJSHeapSize: performance.memory?.usedJSHeapSize ?? null, totalJSHeapSize: performance.memory?.totalJSHeapSize ?? null, domNodes: document.getElementsByTagName('*').length })),
    app: await appValue.evaluate(({ app }) => app.getAppMetrics().map(row => ({ type: row.type, workingSetSizeKb: row.memory.workingSetSize, peakWorkingSetSizeKb: row.memory.peakWorkingSetSize }))) });

  receipt.processProfiles = [];
  for (let index = 1; index <= 3; index++) {
    const profile = join(run, `electron-profile-${index}`), seeded = await seed(profile), sample = { process: index, seeded, ordinary: {} };
    receipt.processProfiles.push(sample);
    app = await electron.launch({ executablePath, args: [`--user-data-dir=${profile}`], timeout: 30_000 }); const page = await app.firstWindow();
    try {
      if (index === 1) receipt.packagedEnvironment = await app.evaluate(({ screen }) => { const display = screen.getPrimaryDisplay(); return { versions: process.versions, display: { scaleFactor: display.scaleFactor, size: display.size, workAreaSize: display.workAreaSize } }; });
      const startup = await page.evaluate(() => performance.now());
      await page.waitForFunction(() => document.querySelector('h1')?.textContent?.trim() === 'Aylık Market Özeti' && document.body.textContent?.includes('2.500.000') && ![...document.querySelectorAll('[role="status"]')].some(node => /yükleniyor|hesaplanıyor/i.test(node.textContent ?? '')), undefined, { timeout: 120_000 });
      sample.backgroundStartupMonthlyMs = (await page.evaluate(() => performance.now())) - startup; sample.memoryBefore = await memory(app, page);
      sample.ordinary.sales = await measure(page, 'Satış Özeti', { heading: 'Satış Özeti' });
      sample.ordinary.transactions = await measure(page, 'Tüm işlemleri göster', { heading: 'İşlemler', rows: 100 });
      if (index === 1) { await page.evaluate(() => document.querySelector('nav[aria-label="İşlemler sayfaları"]')?.scrollIntoView({ block: 'center' })); const path = join(run, 'synthetic-transactions-page.png'); await page.screenshot({ path, fullPage: false }); await page.evaluate(() => scrollTo(0, 0)); receipt.syntheticScreenshots = { transactions: path }; }
      sample.ordinary.nextPage = await measure(page, 'Sonraki 100', { text: 'Sayfa 2 / 250', rows: 100 });
      sample.ordinary.detail = await page.evaluate(() => new Promise((resolveResult, reject) => { const button = document.querySelector('main tbody .row-link'); if (!(button instanceof HTMLButtonElement)) return reject(new Error('DETAIL_NOT_FOUND')); const started = performance.now(), deadline = started + 30_000; const check = () => { if (document.querySelector('aside[aria-label="İşlem detayı"] h2')?.textContent?.trim() === 'İşlem Detayı') requestAnimationFrame(() => requestAnimationFrame(() => resolveResult({ elapsedMs: performance.now() - started, domNodes: document.getElementsByTagName('*').length }))); else if (performance.now() > deadline) reject(new Error('DETAIL_TIMEOUT')); else requestAnimationFrame(check); }; button.click(); requestAnimationFrame(check); }));
      sample.ordinary.monthly = await measure(page, 'Aylık Market Özeti', { heading: 'Aylık Market Özeti' });
      sample.ordinary.salesWarm = await measure(page, 'Satış Özeti', { heading: 'Satış Özeti' });
      sample.ordinary.transactionsWarm = await measure(page, 'Tüm işlemleri göster', { heading: 'İşlemler', rows: 100 });
      sample.ordinary.monthlyWarm = await measure(page, 'Aylık Market Özeti', { heading: 'Aylık Market Özeti' });
      sample.ordinary.purchasing = await measure(page, 'Maliyet ve Alışlar', { heading: 'Maliyet ve Alışlar' });
      sample.ordinary.purchasingDetail = await page.evaluate(() => new Promise((resolveResult, reject) => { const button = document.querySelector('main .source-link'); if (!(button instanceof HTMLButtonElement)) return reject(new Error('PURCHASING_DETAIL_NOT_FOUND')); const started = performance.now(), deadline = started + 30_000; const check = () => { if (document.querySelector('aside[aria-label="Alış kaynak detayı"] h2')?.textContent?.trim() === 'Maliyet ve alış kaynak detayı') requestAnimationFrame(() => requestAnimationFrame(() => resolveResult({ elapsedMs: performance.now() - started, domNodes: document.getElementsByTagName('*').length }))); else if (performance.now() > deadline) reject(new Error('PURCHASING_DETAIL_TIMEOUT')); else requestAnimationFrame(check); }; button.click(); requestAnimationFrame(check); }));
      sample.ordinary.monthlyAfterPurchasing = await measure(page, 'Aylık Market Özeti', { heading: 'Aylık Market Özeti' });
      sample.ordinary.evidence = await measure(page, 'Sabit rapor kanıtlarını göster', { text: 'Sayfa 1 / 250' });
      if (index === 1) { await page.evaluate(() => document.querySelector('.saved-evidence')?.scrollIntoView({ block: 'start' })); const path = join(run, 'synthetic-monthly-evidence.png'); await page.screenshot({ path, fullPage: false }); await page.evaluate(() => scrollTo(0, 0)); receipt.syntheticScreenshots.monthlyEvidence = path; }
      sample.ordinary.evidenceNext = await measure(page, 'Sonraki 100 satır', { text: 'Sayfa 2 / 250' });
      sample.ordinary.savedPurchasing = await page.evaluate(() => new Promise((resolveResult, reject) => { const summary = [...document.querySelectorAll('summary')].find(node => node.textContent?.trim() === 'Sabit maliyet ve alış kanıtları'); if (!(summary instanceof HTMLElement)) return reject(new Error('SAVED_PURCHASING_NOT_FOUND')); const started = performance.now(), deadline = started + 120_000; const check = () => { const heading = [...document.querySelectorAll('h1')].find(node => node.textContent?.trim() === 'Maliyet ve Alışlar'); const loading = [...document.querySelectorAll('[role="status"]')].some(node => /yükleniyor/i.test(node.textContent ?? '')); if (heading && !loading) requestAnimationFrame(() => requestAnimationFrame(() => resolveResult({ elapsedMs: performance.now() - started, domNodes: document.getElementsByTagName('*').length }))); else if (performance.now() > deadline) reject(new Error('SAVED_PURCHASING_TIMEOUT')); else requestAnimationFrame(check); }; summary.click(); requestAnimationFrame(check); }));
      sample.ordinary.versions = await measure(page, 'Rapor sürümleri', { heading: 'Rapor sürümleri' });
      sample.ordinary.saved = await measure(page, 'Kaydedilmiş sürümü aç', { body: 'Kaydedilmiş sürüm ·' });
      sample.namedIpcWarm = await page.evaluate(async () => {
        const opened = await window.esmer.openSales({ period: '2025-09' });
        if (opened.status !== 'report') return { status: opened.status, elapsedMs: null, bytes: null };
        await window.esmer.queryMonthly({ context: opened.view.context });
        const started = performance.now(), result = await window.esmer.queryMonthly({ context: opened.view.context });
        return { status: result.status, elapsedMs: performance.now() - started, bytes: new Blob([JSON.stringify(result)]).size };
      });
      assert.equal(sample.namedIpcWarm.status, 'monthly'); assert.ok(sample.namedIpcWarm.elapsedMs < limitMs, `named IPC warm monthly exceeded ${limitMs} ms`);
      sample.memoryAfter = await memory(app, page);
      for (const [name, value] of Object.entries(sample.ordinary)) assert.ok(value.elapsedMs < limitMs, `${name} exceeded ${limitMs} ms: ${value.elapsedMs}`);
    } finally { await app.close(); app = undefined; }
  }
  const integrityProfile = join(run, 'electron-profile-integrity'), integritySeed = await seed(integrityProfile);
  app = await electron.launch({ executablePath, args: [`--user-data-dir=${integrityProfile}`], timeout: 30_000 });
  const integrityPage = await app.firstWindow();
  try {
    await integrityPage.waitForFunction(() => document.querySelector('h1')?.textContent?.trim() === 'Aylık Market Özeti' && document.body.textContent?.includes('2.500.000'), undefined, { timeout: 120_000 });
    const before = await integrityPage.evaluate(async id => {
      const saved = await window.esmer.readReportVersion({ reportId: id });
      const evidence = await window.esmer.readReportEvidence({ reportId: id, section: 'components', offset: 0, search: '', range: 'current', documentId: null });
      return { status: saved.status, netSales: saved.status === 'monthly' ? saved.report.sales.metrics.netSales : null, firstNet: evidence.status === 'evidence' && evidence.section === 'components' ? evidence.rows[0]?.net : null };
    }, integritySeed.id);
    await app.evaluate(({ dialog }, selectedPath) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [selectedPath] }); }, correctedPath);
    const imported = await integrityPage.evaluate(async () => { const result = await window.esmer.importPackage(); return { status: result.status }; });
    assert.equal(imported.status, 'active');
    const after = await integrityPage.evaluate(async id => {
      const saved = await window.esmer.readReportVersion({ reportId: id });
      const evidence = await window.esmer.readReportEvidence({ reportId: id, section: 'components', offset: 0, search: '', range: 'current', documentId: null });
      const current = await window.esmer.openSales({ period: '2025-09' });
      return { savedStatus: saved.status, savedNet: saved.status === 'monthly' ? saved.report.sales.metrics.netSales : null, firstNet: evidence.status === 'evidence' && evidence.section === 'components' ? evidence.rows[0]?.net : null,
        currentStatus: current.status, currentNet: current.status === 'report' ? current.view.metrics.netSales : null, context: current.status === 'report' ? current.view.context : null };
    }, integritySeed.id);
    assert.deepEqual({ status: after.savedStatus, netSales: after.savedNet, firstNet: after.firstNet }, before);
    assert.equal(after.currentNet, '2500020');
    assert.ok(after.context);
    await integrityPage.evaluate(context => { globalThis.profilePending = window.esmer.queryMonthly({ context }); }, after.context);
    await integrityPage.waitForFunction(async () => (await window.esmer.getOperationStatus()).status === 'operation', undefined, { timeout: 30_000 });
    const navigation = await integrityPage.evaluate(() => new Promise((resolveResult, reject) => { const button = [...document.querySelectorAll('button')].find(node => node.textContent?.trim() === 'Giderler'); if (!(button instanceof HTMLButtonElement)) return reject(new Error('EXPENSES_BUTTON_NOT_FOUND')); const started = performance.now(), deadline = started + 30_000; const check = () => { if (document.querySelector('h1')?.textContent?.trim() === 'Giderler') requestAnimationFrame(() => requestAnimationFrame(() => resolveResult({ elapsedMs: performance.now() - started }))); else if (performance.now() > deadline) reject(new Error('EXPENSES_SHELL_TIMEOUT')); else requestAnimationFrame(check); }; button.click(); requestAnimationFrame(check); }));
    const cancellation = await integrityPage.evaluate(async () => {
      const state = await window.esmer.getOperationStatus();
      if (state.status !== 'operation') throw new Error('MONTHLY_FINISHED_BEFORE_CANCEL');
      const started = performance.now(); await window.esmer.cancelOperation({ id: state.id });
      const result = await globalThis.profilePending; delete globalThis.profilePending;
      return { phase: state.phase, latencyMs: performance.now() - started, status: result.status };
    });
    assert.equal(cancellation.status, 'cancelled');
    const retry = await integrityPage.evaluate(async context => { const started = performance.now(), result = await window.esmer.queryMonthly({ context }); return { elapsedMs: performance.now() - started, status: result.status, netSales: result.status === 'monthly' ? result.report.sales.metrics.netSales : null }; }, after.context);
    assert.deepEqual({ status: retry.status, netSales: retry.netSales }, { status: 'monthly', netSales: '2500020' });
    receipt.integrity = { acceptedBeforeAndAfter: before, correctedCurrentNet: after.currentNet, import: imported, cancellation: { ...cancellation, navigationMs: navigation.elapsedMs }, retry };
    receipt.assertions.push('Named IPC correction preserved accepted totals and evidence while the new candidate reflected corrected sales');
    receipt.assertions.push('Uncached monthly cancellation kept navigation responsive and retry produced corrected totals');
  } finally { await app.close(); app = undefined; }
  receipt.ordinarySummary = Object.fromEntries(Object.keys(receipt.processProfiles[0].ordinary).map(name => { const values = receipt.processProfiles.map(row => row.ordinary[name].elapsedMs).sort((a, b) => a - b); return [name, { samplesMs: values, medianMs: values[1], maxMs: values[2], limitMs, populationNote: 'Three fresh-process samples are insufficient for a robust p95 estimate' }]; }));
  receipt.assertions.push('Three fresh packaged processes passed every ordinary interaction below two seconds; background startup/monthly calculation is reported separately');
  receipt.status = 'passed';
} catch (error) { receipt.status = 'failed'; receipt.failure = error instanceof Error ? error.stack : String(error); process.exitCode = 1; }
finally { if (app) { try { await app.close(); } catch (error) { receipt.cleanupFailure = String(error); receipt.status = 'failed'; process.exitCode = 1; } } await save(); console.log(JSON.stringify({ status: receipt.status, run, receiptPath }, null, 2)); }
