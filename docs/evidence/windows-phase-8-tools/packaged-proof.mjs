import { _electron as electron, expect } from '@playwright/test';
import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import readSheets from 'read-excel-file/node';
import { unzipSync, strFromU8 } from 'fflate';
import { openStore, Expenses, businessPackage, businessRecords, workbook, row } from './api.mjs';

const scale = Number(process.argv[2] ?? '1.25');
assert.ok([1, 1.25, 1.5].includes(scale), 'Pass the actual Windows scale, 1, 1.25 or 1.5');
const root = resolve('work/windows-phase-8');
await mkdir(root, { recursive: true });
const run = await mkdtemp(join(root, `packaged-${scale}-`));
const profile = join(run, 'profile');
await mkdir(profile);
const executablePath = resolve('release/win-unpacked/Esmer Market Analytics.exe');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const proof = {
  status: 'running', startedAt: new Date().toISOString(), run, profile, scale,
  commit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  archiveSha256: hash(await readFile('release/win-unpacked/resources/app.asar')),
  substitutions: ['Native open and save dialog results are substituted. Deferred save verifies the packaged export boundary.'],
  limitations: ['Synthetic fixtures only.', 'Cold means a new app process with warm OS filesystem caches.', 'Timings do not establish full-dataset acceptance.', 'No native spreadsheet round-trip, physical disconnect or installer lifecycle in this script.'],
  fixtures: [], assertions: [], timings: { cold: [], warm: [], shutdown: [] },
};
async function fixture(name, bytes, counts) {
  const path = join(run, name);
  await writeFile(path, bytes, { flag: 'wx' });
  proof.fixtures.push({ name, path, bytes: bytes.length, sha256: hash(bytes), counts });
  return path;
}
const initial = businessRecords();
initial.lines[1].sales.productName = 'Çay İşçilik I ı İ i ş ğ ü ö ç';
initial.lines[1].sales.productId = 'tea';
const originalPath = await fixture('sentetik-başlangıç.json', businessPackage(initial), { documents: 2, lines: 2 });
const expensePath = await fixture('sentetik-gider.xlsx', await workbook([[row[0], '15.09.2025', '01.10.2025', ...row.slice(3)]]), { expenseRows: 1 });
const seed = openStore(join(profile, 'analytics.sqlite'));
try {
  assert.equal(seed.importPackage(await readFile(originalPath)).status, 'active');
  const expenses = new Expenses(seed), preview = expenses.preview(await readFile(expensePath));
  assert.deepEqual(preview.errors, []);
  expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
  assert.equal(expenses.query({ period: '2025-09' }).incurred, '50');
} finally { seed.close(); }

let app, page, saved;
async function launch() {
  const started = performance.now();
  app = await electron.launch({ executablePath, args: [`--user-data-dir=${profile}`], timeout: 30_000 });
  page = await app.firstWindow();
  await expect(page.getByRole('heading', { name: 'Aylık Market Özeti', exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('region', { name: 'Aylık göstergeler' })).toContainText('200,00 ₺');
  if (!proof.overviewScreenshot) {
    proof.overviewScreenshot = join(run, 'monthly-overview.png');
    await page.screenshot({ path: proof.overviewScreenshot });
  }
  proof.timings.cold.push({ processStartToMonthlyMs: performance.now() - started });
  const display = await app.evaluate(({ screen, BrowserWindow }) => screen.getDisplayMatching(BrowserWindow.getAllWindows()[0].getBounds()).scaleFactor);
  assert.equal(display, scale, 'Actual OS scale differs from requested scale');
  proof.observedScale = display;
  proof.runtime = await app.evaluate(({ screen, BrowserWindow }) => ({ versions: process.versions, window: BrowserWindow.getAllWindows()[0].getBounds(), displays: screen.getAllDisplays().map(display => ({ bounds: display.bounds, scaleFactor: display.scaleFactor })) }));
  await expect.poll(() => page.evaluate(() => window.esmer.getOperationStatus()).then(value => value.status)).toBe('idle');
}
async function close() {
  const started = performance.now(), closing = app;
  app = undefined;
  let timer, completed = false;
  try {
    await Promise.race([closing.close(), new Promise((_resolve, reject) => {
      timer = setTimeout(() => { closing.process().kill(); reject(new Error('PACKAGED_CLOSE_TIMEOUT_30000_MS')); }, 30_000);
    })]);
    completed = true;
  } finally { clearTimeout(timer); proof.timings.shutdown.push({ elapsedMs: performance.now() - started, completed }); }
}
async function choose(path) {
  await app.evaluate(({ dialog }, value) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [value] }); }, path);
}
async function readSaved() {
  const result = await page.evaluate(reportId => window.esmer.readReportVersion({ reportId }), saved.id);
  assert.equal(result.status, 'monthly');
  assert.deepEqual(result.report, saved);
}
try {
  await launch();
  await page.getByRole('button', { name: 'Rapor sürümleri', exact: true }).press('Enter');
  await page.getByLabel('Rapor inceleme açıklaması').fill('Sentetik Windows incelemesi; gerçek sahip kabulü değildir.');
  await page.getByRole('button', { name: 'İncelenen raporu kaydet', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Seçili rapor', exact: true })).toContainText('Kaydedilmiş sürüm');
  const history = await page.evaluate(() => window.esmer.listReportVersions({ period: '2025-09' }));
  assert.equal(history.status, 'history'); assert.equal(history.reports.length, 1);
  const selected = await page.evaluate(reportId => window.esmer.readReportVersion({ reportId }), history.reports[0].id);
  assert.equal(selected.status, 'monthly'); saved = selected.report;
  assert.equal(saved.sales.metrics.netSales, '200');
  assert.equal(saved.purchasing.gross.coveredCost, '60');
  assert.equal(saved.purchasing.gross.coveredGrossProfit, '40');
  assert.equal(saved.operating.result.expenses, '50');
  assert.equal(saved.operating.result.value, null);
  assert.equal(saved.state, 'provisional');
  proof.saved = { id: saved.id, datasetId: saved.context.datasetId, appRevision: saved.context.appRevision, sha256: hash(JSON.stringify(saved)) };
  await writeFile(join(run, 'accepted-report.json'), JSON.stringify(saved, null, 2));
  proof.assertions.push('UI review retains net 200, covered cost 60, gross estimate 40, expense 50 and unavailable operating profit');
  await close();

  for (let repetition = 0; repetition < 3; repetition++) {
    await launch();
    await readSaved();
    await page.getByRole('button', { name: 'Rapor sürümleri', exact: true }).click();
    await page.getByRole('button', { name: 'Kaydedilmiş sürümü aç', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Aylık göstergeler' })).toContainText('200,00 ₺');
    const timed = await page.evaluate(async () => {
      const began = performance.now();
      const sales = await window.esmer.openSales({ period: '2025-09' });
      if (sales.status !== 'report') throw new Error('SALES_UNAVAILABLE');
      const opened = await window.esmer.queryMonthly({ context: sales.view.context });
      const monthlyMs = performance.now() - began;
      if (opened.status !== 'monthly') throw new Error('MONTHLY_UNAVAILABLE');
      const drillStart = performance.now();
      const detail = await window.esmer.inspectSales({ context: opened.report.context, filters: opened.report.sales.filters, documentId: 'S1' });
      return { monthlyMs, drillMs: performance.now() - drillStart, net: opened.report.sales.metrics.netSales, detailStatus: detail.status };
    });
    assert.equal(timed.net, '200'); assert.equal(timed.detailStatus, 'detail');
    proof.timings.warm.push(timed);
    if (repetition < 2) await close();
  }
  proof.assertions.push('Reviewed monthly object and literal net 200 survive three packaged process restarts');

  const changed = structuredClone(initial);
  changed.documents = [changed.documents[0]]; changed.lines = [changed.lines[0]];
  Object.assign(changed.documents[0].sales, { net: '120', tax: '6', gross: '126' });
  changed.lines[0].net = '120'; Object.assign(changed.lines[0].sales, { unitNet: '120', tax: '6', gross: '126' });
  const correctedPath = await fixture('sentetik-düzeltme.json', businessPackage(changed, { extractionId: 'windows-8-corrected', extractedAt: '2025-10-02T00:00:00.000Z' }), { documents: 1, lines: 1 });
  await choose(correctedPath);
  await page.getByRole('button', { name: 'Veri paketi içe aktar', exact: true }).click();
  await expect(page.getByText('Yeni veri sürümü hazır', { exact: true })).toBeVisible();
  const expense = await page.evaluate(() => window.esmer.queryExpenses({ period: '2025-09' }));
  const currentExpense = expense.rows[0];
  const fields = Object.fromEntries(['date', 'paymentDate', 'category', 'classification', 'net', 'tax', 'gross', 'taxTreatment', 'taxEvidence', 'supportingReference', 'sourceReference', 'labourPeriod', 'loss'].map(key => [key, currentExpense.value[key]]));
  const correction = await page.evaluate(request => window.esmer.correctExpense(request), { entityId: currentExpense.entityId, expectedRevision: currentExpense.revision, replacement: { ...fields, net: '60', gross: '60' }, reason: 'Sentetik gider düzeltmesi' });
  assert.equal(correction.status, 'saved');
  await page.getByRole('button', { name: 'Raporu yenile', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Aylık göstergeler' })).toContainText('120,00 ₺');
  await page.getByRole('button', { name: 'Rapor sürümleri', exact: true }).click();
  await page.getByRole('button', { name: 'Adayla karşılaştır', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Sürüm farkları' })).toContainText('Net satış');
  for (let index = 0; index < 10 && !(await page.getByRole('region', { name: 'Sürüm farkları' }).innerText()).includes('Hesaba alınan gider'); index++) {
    const next = page.getByRole('button', { name: 'Sonraki 100 fark', exact: true });
    assert.equal(await next.isEnabled(), true, 'Expense difference missing from all comparison pages');
    await next.click();
  }
  await expect(page.getByRole('region', { name: 'Sürüm farkları' })).toContainText('Hesaba alınan gider');
  await page.getByRole('button', { name: 'Kaydedilmiş sürümü aç', exact: true }).click();
  await readSaved();
  await page.getByRole('button', { name: 'Sabit rapor kanıtlarını göster' }).click();
  await expect(page.locator('.saved-evidence')).toContainText('Çay İşçilik I ı İ i ş ğ ü ö ç');
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(680, 520));
  const table = page.getByRole('region', { name: 'Sürüm farkları' }).locator('.table-scroll').first();
  proof.minimum = { table: await table.evaluate(element => ({ clientWidth: element.clientWidth, scrollWidth: element.scrollWidth })) };
  if (proof.minimum.table.scrollWidth > proof.minimum.table.clientWidth) {
    await table.scrollIntoViewIfNeeded(); await table.hover(); await page.mouse.wheel(900, 0);
    await expect.poll(() => table.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
    proof.minimum.horizontalWheel = 'passed';
  } else proof.minimum.horizontalWheel = 'no overflow at this scale';
  const evidenceSummary = page.locator('.saved-evidence > details > summary').first();
  await evidenceSummary.focus(); await expect(evidenceSummary).toBeFocused();
  await evidenceSummary.press('Enter');
  assert.equal(await evidenceSummary.evaluate(element => element.parentElement.open), true);
  proof.minimum.keyboardEvidence = 'Enter opens focused retained evidence';
  await page.screenshot({ path: join(run, 'report-minimum-viewport.png') });
  await page.screenshot({ path: join(run, 'report-minimum.png'), fullPage: true });
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(1120, 760));
  await page.getByRole('region', { name: 'Seçili rapor', exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: join(run, 'report-history-viewport.png') });
  proof.assertions.push('Source correction 100 to 120, deletion of S2 and expense correction 50 to 60 leave the accepted report and deleted Turkish evidence unchanged');

  const exportPath = join(run, 'Seçili-İşçilik-raporu.xlsx');
  await app.evaluate(({ dialog }) => { dialog.showSaveDialog = () => new Promise(resolveDialog => { globalThis.phase8Save = resolveDialog; }); });
  await page.getByRole('button', { name: "Seçili aylık raporu Excel'e aktar", exact: true }).click();
  await expect.poll(() => app.evaluate(() => typeof globalThis.phase8Save)).toBe('function');
  const deleted = businessRecords(); deleted.documents = []; deleted.lines = [];
  const deletedPath = await fixture('sentetik-silinmiş.json', businessPackage(deleted, { extractionId: 'windows-8-deleted', extractedAt: '2025-10-03T00:00:00.000Z' }), { documents: 0, lines: 0 });
  await choose(deletedPath);
  assert.equal((await page.evaluate(() => window.esmer.importPackage())).status, 'active');
  await app.evaluate((_electron, path) => { globalThis.phase8Save({ canceled: false, filePath: path }); delete globalThis.phase8Save; }, exportPath);
  await expect(page.getByText('Seçili rapor Excel dosyasına kaydedildi.', { exact: true })).toBeVisible();
  const bytes = await readFile(exportPath), sheets = await readSheets(bytes);
  for (const sheet of sheets) {
    assert.deepEqual(sheet.data[0].slice(0, 2), ['Rapor sürümü', saved.id]);
    assert.deepEqual(sheet.data[1].slice(0, 2), ['Dönem', '2025-09']);
    assert.deepEqual(sheet.data[2].slice(0, 2), ['Veri kesimi', '2025-09-30']);
    assert.deepEqual(sheet.data[3].slice(0, 2), ['Kaynak veri kümesi', saved.context.datasetId]);
    assert.ok(sheet.data.flat().includes('SYNTHETIC_ONLY'));
  }
  const summary = sheets.find(sheet => sheet.sheet === 'Özet' || sheet.name === 'Özet') ?? sheets[0];
  for (const [title, value] of [['Net satış', 200], ['Tahmini maliyet', 60], ['Kapsanan tahmini brüt kâr', 40], ['Hesaba alınan giderler', 50]]) assert.equal(summary.data.find(cells => cells[0] === title)?.[1], value);
  assert.ok(sheets.some(sheet => sheet.data.flat().includes('Çay İşçilik I ı İ i ş ğ ü ö ç')));
  for (const [name, xml] of Object.entries(unzipSync(bytes))) if (/^xl\/worksheets\/sheet\d+\.xml$/.test(name)) assert.doesNotMatch(strFromU8(xml), /<f[ >]/);
  proof.workbook = { path: exportPath, sha256: hash(bytes), sheets: sheets.length, frozenAfterRefresh: true };
  proof.assertions.push('Deferred substituted save exports original 200/60/40/50 and original report metadata on every sheet after a deletion refresh');

  const bulk = businessRecords(), document = bulk.documents[0], line = bulk.lines[0];
  bulk.documents = Array.from({ length: 25_000 }, (_, i) => ({ ...document, id: `bulk-${i}` }));
  bulk.lines = Array.from({ length: 25_000 }, (_, i) => ({ ...line, id: `bulk-line-${i}`, documentId: `bulk-${i}` }));
  const bulkPath = await fixture('sentetik-büyük.json', businessPackage(bulk, { extractionId: 'windows-8-bulk', extractedAt: '2025-10-04T00:00:00.000Z' }), { documents: 25_000, lines: 25_000 });
  await choose(bulkPath);
  const before = await page.evaluate(() => window.esmer.getAvailability());
  await page.evaluate(() => { globalThis.phase8Pending = window.esmer.importPackage(); });
  await expect.poll(() => page.evaluate(() => window.esmer.getOperationStatus()).then(value => value.status)).toBe('operation');
  const navigationStart = performance.now();
  await page.getByRole('button', { name: 'Giderler', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Giderler', exact: true })).toBeVisible();
  const navigationMs = performance.now() - navigationStart;
  const cancelled = await page.evaluate(async () => {
    const state = await window.esmer.getOperationStatus(), start = performance.now();
    if (state.status !== 'operation') throw new Error('IMPORT_FINISHED_BEFORE_CANCEL');
    await window.esmer.cancelOperation({ id: state.id });
    const result = await globalThis.phase8Pending; delete globalThis.phase8Pending;
    return { phase: state.phase, latencyMs: performance.now() - start, result };
  });
  assert.equal(cancelled.result.status, 'cancelled');
  assert.deepEqual(await page.evaluate(() => window.esmer.getAvailability()), before);
  await readSaved();
  assert.equal((await page.evaluate(() => window.esmer.queryExpenses({ period: '2025-09' }))).incurred, '60');
  proof.timings.importCancellation = { ...cancelled, navigationMs };
  const importRetryStarted = performance.now();
  assert.equal((await page.evaluate(() => window.esmer.importPackage())).status, 'active');
  proof.timings.importRetryMs = performance.now() - importRetryStarted;
  const largeSalesStarted = performance.now();
  const sales = await page.evaluate(() => window.esmer.openSales({ period: '2025-09' }));
  proof.timings.largeSalesMs = performance.now() - largeSalesStarted;
  assert.equal(sales.status, 'report'); assert.equal(sales.view.metrics.netSales, '2500000');
  await page.getByRole('button', { name: 'Aylık Market Özeti', exact: true }).click();
  await expect.poll(() => page.evaluate(() => window.esmer.getOperationStatus()).then(value => value.status)).toBe('idle');
  await page.evaluate(context => { globalThis.phase8Pending = window.esmer.queryMonthly({ context }); }, sales.view.context);
  await expect.poll(() => page.evaluate(() => window.esmer.getOperationStatus()).then(value => value.status), { intervals: [5], timeout: 30_000 }).toBe('operation');
  const calculationNavigationStart = performance.now();
  await page.getByRole('button', { name: 'Giderler', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Giderler', exact: true })).toBeVisible();
  const calculationNavigationMs = performance.now() - calculationNavigationStart;
  const calculation = await page.evaluate(async () => {
    const state = await window.esmer.getOperationStatus(), start = performance.now();
    if (state.status !== 'operation') throw new Error('CALCULATION_FINISHED_BEFORE_CANCEL');
    await window.esmer.cancelOperation({ id: state.id });
    const result = await globalThis.phase8Pending; delete globalThis.phase8Pending;
    return { phase: state.phase, latencyMs: performance.now() - start, status: result.status };
  });
  assert.equal(calculation.status, 'cancelled');
  proof.timings.calculationCancellation = { ...calculation, navigationMs: calculationNavigationMs };
  const calculationRetryStarted = performance.now();
  const retry = await page.evaluate(context => window.esmer.queryMonthly({ context }), sales.view.context);
  proof.timings.calculationRetryMs = performance.now() - calculationRetryStarted;
  proof.memoryAfterLargeCalculation = await app.evaluate(({ app }) => app.getAppMetrics().map(({ type, memory }) => ({ type, memory })));
  assert.equal(retry.status, 'monthly'); assert.equal(retry.report.sales.metrics.netSales, '2500000');
  await readSaved();
  proof.assertions.push('Cancelled 25,000-document import preserves active data, expense 60 and accepted report; import and monthly calculation retry successfully');
  await page.screenshot({ path: join(run, 'cancel-retry.png'), fullPage: true });
  await close();
  proof.status = 'passed';
} catch (error) {
  proof.status = 'failed'; proof.failure = error instanceof Error ? error.stack : String(error);
  throw error;
} finally {
  if (app) {
    try { await close(); }
    catch (error) { proof.status = 'failed'; proof.cleanupFailure = String(error); process.exitCode = 1; }
  }
  proof.finishedAt = new Date().toISOString();
  await writeFile(join(run, 'proof.json'), JSON.stringify(proof, null, 2));
  console.log(JSON.stringify({ run, status: proof.status, assertions: proof.assertions, timings: proof.timings }));
}
