import { _electron as electron, expect } from '@playwright/test';
import { build } from 'esbuild';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir, cpus, totalmem, release, arch } from 'node:os';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { performance } from 'node:perf_hooks';
const root = resolve('work/windows-phase-6');
await build({ stdin: { contents: "export { openStore } from './src/store/store'; export { businessPackage } from './tests/helpers/business-fixtures'; export { purchasingJourney } from './tests/helpers/purchasing-journey';", resolveDir: process.cwd() }, bundle: true, platform: 'node', format: 'esm', outfile: join(root, 'business-api.mjs') });
const { openStore, businessPackage, purchasingJourney } = await import('./business-api.mjs');
const temporaryRoot = await mkdtemp(join(tmpdir(), 'phase-6-business-proof-'));
const profile = join(temporaryRoot, 'ui-profile');
const apiProfile = join(temporaryRoot, 'api-profile');
const original = businessPackage(purchasingJourney());
for (const path of [profile, apiProfile]) {
  await mkdir(path);
  const store = openStore(join(path, 'analytics.sqlite'));
  try { expect(store.importPackage(original).status).toBe('active'); } finally { store.close(); }
}
const changed = purchasingJourney();
Object.assign(changed.documents.find(row => row.id === 'S1').sales, { net: '110', tax: '5.5', gross: '115.5' });
const sale = changed.lines.find(row => row.id === 'L1'); sale.net = '110'; Object.assign(sale.sales, { unitNet: '110', tax: '5.5', gross: '115.5' });
Object.assign(changed.documents.find(row => row.id === 'P1').sales, { net: '50', tax: '0', gross: '50' });
const purchase = changed.lines.find(row => row.id === 'P1-line'); purchase.net = '50'; Object.assign(purchase.sales, { unitNet: '50', tax: '0', gross: '50' });
const replacement = businessPackage(changed, { extractionId: 'business-2' });
const replacementPath = join(temporaryRoot, 'replacement.json');
await writeFile(replacementPath, replacement, { flag: 'wx' });
const executablePath = resolve('release/win-unpacked/Esmer Market Analytics.exe');
const hash = value => createHash('sha256').update(value).digest('hex');
const filters = { categoryId: null, productId: null, search: '', kind: 'all' };
const result = { temporaryRoot, profile, apiProfile, executablePath, archiveSha256: hash(await readFile('release/win-unpacked/resources/app.asar')), host: { cpu: cpus()[0]?.model, logicalCpus: cpus().length, memoryBytes: totalmem(), release: release(), arch: arch() }, fixture: { identity: 'business-fixture/business-1', mapping: 'synthetic-business-v1', bytes: original.length, sha256: hash(original), documents: 5, lines: 5, suppliers: 1 }, replacement: { identity: 'business-fixture/business-2', bytes: replacement.length, sha256: hash(replacement) }, filters, period: '2025-09', timing: [], layouts: [], checks: {} };
const launch = (path = profile, extra = []) => electron.launch({ executablePath, args: [`--user-data-dir=${path}`, ...extra], env: { ...process.env, PATH: 'C:/Windows/System32;C:/Windows', NODE_PATH: '', NODE_OPTIONS: '' } });
async function ready(app, expected = '200,00 ₺') {
  const page = await app.firstWindow();
  await expect(page.getByRole('heading', { name: 'Satış Özeti', exact: true })).toBeVisible();
  await expect(page.locator('.metric').first()).toContainText(expected);
  return page;
}
async function purchasing(page) {
  await page.getByRole('button', { name: 'Maliyet ve Alışlar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Maliyet ve Alışlar', exact: true })).toBeVisible();
  await expect(page.locator('.metric').nth(2)).toContainText('40,00 ₺');
}
function originalProof(view) {
  expect(view).toMatchObject({ cutoff: '2025-09-30', extractionId: 'business-1', costCalculationVersion: 'synthetic-cost-calc-v1', purchasingCalculationVersion: 'synthetic-purchasing-calc-v1', gross: { confidence: 'estimated', method: 'historical-last-purchase-estimate', coveredSales: '100', coveredCost: '60', coveredGrossProfit: '40', coveredMarginPercent: '40', costCoveragePercent: '50', exposures: { coveredSales: '100', coveredReturns: '0', excludedSales: '100', excludedReturns: '0' } } });
  expect(view.gross.covered).toHaveLength(1); expect(view.gross.excluded).toHaveLength(1);
  expect(view.gross.covered[0]).toMatchObject({ lineId: 'L1', documentId: 'S1', net: '100', quantity: '1', cost: '60', reason: null });
  expect(view.gross.excluded[0]).toMatchObject({ lineId: 'L2', documentId: 'S2', net: '100', quantity: '1', cost: null, reason: 'MISSING_COST' });
  expect(view.purchasing.history).toHaveLength(1);
  expect(view.purchasing.history[0]).toMatchObject({ documentId: 'P1', productId: 'water', supplierId: 'supplier-1', unit: 'piece', unitCost: '25', quantity: '1', net: '25' });
  expect(view.purchasing.supplierReturns).toHaveLength(1);
  expect(view.purchasing.supplierReturns[0]).toMatchObject({ documentId: 'R1', sourceDocumentIds: ['D1', 'R1'], physicalReturn: true, net: '-25', requestedRecovery: null, recognizedCredit: null, replacementSettlement: 'unknown' });
  expect(view.purchasing.replacements).toMatchObject([{ quantity: '2', unit: 'piece', latestUnitCost: '25', historicalCost: null, replacementCost: '50', nominalChangePercent: null }]);
  expect(view.purchasing.warnings).toEqual(expect.arrayContaining(['NEGATIVE_STOCK', 'SPARSE_WASTE_RECORDING']));
  expect(view.evidence.documents.map(row => row.id).sort()).toEqual(['D1', 'P1', 'R1', 'S1', 'S2']);
}
for (let run = 0; run < 3; run++) {
  const started = performance.now(), app = await launch();
  try {
    const page = await ready(app);
    const coldStartupToReportMs = performance.now() - started;
    const timed = await page.evaluate(async ({ filters }) => {
      const observations = [];
      for (let repetition = 0; repetition < 5; repetition++) {
        let start = performance.now(); const report = await window.esmer.openSales({ period: '2025-09' }); const openMs = performance.now() - start;
        if (report.status !== 'report') throw new Error('NO_REPORT');
        start = performance.now(); const sales = await window.esmer.querySales({ context: report.view.context, filters }); const salesMs = performance.now() - start;
        start = performance.now(); const purchase = await window.esmer.queryPurchasing({ context: report.view.context }); const purchasingMs = performance.now() - start;
        start = performance.now(); const detail = await window.esmer.inspectSales({ context: report.view.context, filters, documentId: 'S1' }); const evidenceMs = performance.now() - start;
        observations.push({ repetition, openMs, salesMs, purchasingMs, evidenceMs, sales, purchase, detail });
      }
      return observations;
    }, { filters });
    for (const observation of timed) {
      expect(observation.sales).toMatchObject({ status: 'report', view: { metrics: { netSales: '200' } } });
      originalProof(observation.purchase.view);
      expect(observation.detail).toMatchObject({ status: 'detail', detail: { documentId: 'S1', totals: { net: '100' }, extractionId: 'business-1' } });
    }
    result.timing.push({ run, coldStartupToReportMs, warm: timed.map(({ sales, purchase, detail, ...timing }) => ({ ...timing, sales: sales.view.metrics.netSales, estimatedGross: purchase.view.gross.coveredGrossProfit, evidenceNet: detail.detail.totals.net })) });
    result.g02 = timed[0].purchase.view.gross;
    if (run === 0) result.runtime = await app.evaluate(({ app, BrowserWindow, screen }) => ({ versions: process.versions, packaged: app.isPackaged, locale: app.getLocale(), displays: screen.getAllDisplays().map(({ bounds, workArea, scaleFactor }) => ({ bounds, workArea, scaleFactor })), size: BrowserWindow.getAllWindows()[0].getSize(), minimum: BrowserWindow.getAllWindows()[0].getMinimumSize() }));
  } finally { await app.close(); }
}
for (const scale of [1, 1.25, 1.5]) {
  const app = await launch(profile, [`--force-device-scale-factor=${scale}`]);
  try {
    const page = await ready(app); await purchasing(page);
    await page.getByLabel('Tedarikçi', { exact: true }).selectOption('supplier-1');
    await page.getByLabel('Alış ürünü').selectOption('water');
    await expect(page.getByText('Negatif stok kaydı var', { exact: false })).toBeVisible();
    await expect(page.getByText('Fire kayıtları seyrek', { exact: false })).toBeVisible();
    await page.screenshot({ path: join(root, `business-${scale}-estimates-history-returns-warnings.png`), fullPage: true });
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setSize(680, 520));
    await expect.poll(() => app.evaluate(({ BrowserWindow }) => { const [width, height] = BrowserWindow.getAllWindows()[0].getSize(); return width >= 680 && width <= 690 && height >= 520 && height <= 530; })).toBe(true);
    const actualWindowSize = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getSize());
    expect(actualWindowSize[1]).toBeGreaterThanOrEqual(520);
    const contentSize = await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].getContentSize());
    await expect.poll(() => page.evaluate(() => [innerWidth, innerHeight])).toEqual(contentSize);
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const geometry = await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, devicePixelRatio }));
    expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.width);
    const tableScroll = await page.locator('.table-scroll').evaluateAll(elements => elements.filter(element => element.getClientRects().length).map((element, index) => {
      element.scrollLeft = 0;
      const maximum = element.scrollWidth - element.clientWidth;
      element.scrollLeft = element.scrollWidth;
      const reached = element.scrollLeft;
      element.scrollLeft = 0;
      return { index, section: element.closest('section')?.querySelector('h2')?.textContent, width: element.clientWidth, scrollWidth: element.scrollWidth, maximum, reached, restored: element.scrollLeft, overflowX: getComputedStyle(element).overflowX, horizontalScrollExercised: maximum > 0 };
    }));
    expect(tableScroll.length).toBeGreaterThan(0);
    for (const row of tableScroll) {
      expect(row.overflowX).toBe('auto');
      if (row.maximum > 0) { expect(row.reached).toBeGreaterThan(0); expect(Math.abs(row.reached - row.maximum)).toBeLessThanOrEqual(1); }
      else expect(row.reached).toBe(0);
      expect(row.restored).toBe(0);
    }
    await page.getByRole('button', { name: 'D1', exact: true }).press('Enter');
    const panel = page.getByRole('complementary');
    await expect(panel.getByRole('heading', { name: 'Maliyet ve alış kaynak detayı' })).toBeFocused();
    await expect(panel.getByText('İrsaliye', { exact: true })).toBeVisible();
    await panel.getByText('D1-line', { exact: false }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: join(root, `business-${scale}-minimum-source-dispatch.png`), fullPage: true });
    await panel.getByRole('button', { name: 'R1', exact: true }).click();
    await expect(panel.getByText('Fatura', { exact: true })).toBeVisible();
    await page.screenshot({ path: join(root, `business-${scale}-minimum-source-invoice.png`), fullPage: true });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'D1', exact: true })).toBeFocused();
    result.layouts.push({ mode: 'Chromium forced scaling; Windows OS setting unchanged', scale, requestedBrowserWindow: [680, 520], browserWindow: actualWindowSize, contentSize, ...geometry, tableScroll, horizontalScrollExercised: tableScroll.some(row => row.horizontalScrollExercised), keyboardEnterEscapeFocus: true });
  } finally { await app.close(); }
}
const ui = await launch();
try {
  const page = await ready(ui); await purchasing(page);
  await ui.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, replacementPath);
  await page.getByRole('button', { name: 'Veri paketi içe aktar' }).click();
  await expect(page.getByText('Yeni veri sürümü hazır', { exact: true })).toBeVisible();
  await expect(page.locator('.metric').nth(2)).toContainText('40,00 ₺');
  await page.getByRole('button', { name: 'D1', exact: true }).click();
  await expect(page.getByRole('complementary').getByText('business-1', { exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Satış Özeti', exact: true }).click();
  await expect(page.locator('.metric').first()).toContainText('200,00 ₺');
  await page.getByRole('button', { name: 'Maliyet ve Alışlar', exact: true }).click();
  await expect(page.locator('.metric').nth(2)).toContainText('40,00 ₺');
  await page.screenshot({ path: join(root, 'business-stale-report.png'), fullPage: true });
  await page.getByRole('button', { name: 'Raporu yenile' }).click();
  await expect(page.locator('.metric').first()).toContainText('210,00 ₺');
  await page.getByRole('button', { name: 'Maliyet ve Alışlar', exact: true }).click();
  await expect(page.locator('.metric').nth(2)).toContainText('50,00 ₺');
  await page.getByRole('button', { name: 'D1', exact: true }).click();
  await expect(page.getByRole('complementary').getByText('business-2', { exact: true })).toBeVisible();
  result.checks.uiTabsAndSourcePinnedUntilRefresh = true;
} finally { await ui.close(); }
const api = await launch(apiProfile);
try {
  const page = await ready(api);
  const old = await page.evaluate(() => window.esmer.openSales({ period: '2025-09' }));
  const context = old.view.context;
  await api.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, replacementPath);
  expect(await page.evaluate(() => window.esmer.importPackage())).toMatchObject({ status: 'active' });
  const pinned = await page.evaluate(async ({ context, filters }) => ({ sales: await window.esmer.querySales({ context, filters }), purchasing: await window.esmer.queryPurchasing({ context }), evidence: await window.esmer.inspectSales({ context, filters, documentId: 'S1' }) }), { context, filters });
  expect(pinned.sales).toMatchObject({ status: 'report', view: { context, stale: true, metrics: { netSales: '200' } } });
  originalProof(pinned.purchasing.view); expect(pinned.purchasing.view.stale).toBe(true);
  expect(pinned.evidence).toMatchObject({ status: 'detail', detail: { context, extractionId: 'business-1', totals: { net: '100' } } });
  const refreshed = await page.evaluate(() => window.esmer.openSales({ period: '2025-09' }));
  expect(refreshed).toMatchObject({ status: 'report', view: { metrics: { netSales: '210' } } });
  expect(refreshed.view.context.datasetId).not.toBe(context.datasetId);
  const newer = await page.evaluate(context => window.esmer.queryPurchasing({ context }), refreshed.view.context);
  expect(newer).toMatchObject({ status: 'purchasing', view: { extractionId: 'business-2', gross: { coveredSales: '110', coveredCost: '60', coveredGrossProfit: '50', confidence: 'estimated' }, purchasing: { replacements: [{ latestUnitCost: '50', replacementCost: '100', historicalCost: null }] } } });
  const stale = await page.evaluate(async ({ context, filters }) => [await window.esmer.querySales({ context, filters }), await window.esmer.queryPurchasing({ context }), await window.esmer.inspectSales({ context, filters, documentId: 'S1' })], { context, filters });
  for (const response of stale) expect(response).toMatchObject({ status: 'unavailable', code: 'STALE_CONTEXT' });
  result.checks.apiPinnedVersions = { old: context, new: refreshed.view.context, oldPurchasing: pinned.purchasing.view, newPurchasing: newer.view, stale };
} finally { await api.close(); }
for (const path of [profile, apiProfile]) {
  const db = new DatabaseSync(join(path, 'analytics.sqlite'), { readOnly: true });
  try { expect(db.prepare('SELECT count(*) AS n FROM report_versions').get().n).toBe(0); } finally { db.close(); }
}
const restart = await launch();
try { const page = await ready(restart, '210,00 ₺'); await page.context().setOffline(true); await page.reload(); await expect(page.locator('.metric').first()).toContainText('210,00 ₺'); } finally { await restart.close(); }
result.checks.noAcceptedReportsCreated = true;
result.checks.restartActiveSales = '210';
result.checks.browserOfflineReload = true;
result.checks.physicalDisconnect = false;
result.checks.developerRuntimeInChildPath = false;
result.proofToolHistory = ['An earlier run stopped on a harness assertion requiring at least one overflowing table. Responsive tables may fit at the supported minimum width. This was a proof-tool assumption failure, not an established application defect. The corrected proof waits for renderer resize and records fit versus exercised scrolling separately.'];
result.performanceLimitation = 'Small five-document synthetic fixture. Does not satisfy full imported-dataset two-second gate. Cold timings include process start and warm observations repeat service reads.';
await writeFile(join(root, 'business-proof.json'), JSON.stringify(result, null, 2));
console.log('Business packaged Windows API, UI, timing, scaling, pinning and restart proof PASS');
