import { openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from '@playwright/test';
import { mkdtemp, rm, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { unzipSync, strFromU8 } from 'fflate';
import { openStore } from '../../src/store/store';
import { SalesReports } from '../../src/reports/query';
import { ReportVersions } from '../../src/reports/versions';
import { businessPackage, businessRecords } from '../helpers/business-fixtures';
import { writeRawPackage } from '../../src/source/raw-package';
import { rawSnapshot } from '../helpers/raw-fixture';
const executablePath = process.env.ESMER_EXECUTABLE ?? resolve('release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics');
async function fixture(source: boolean) {
  const userData = await mkdtemp(join(tmpdir(), 'esmer-archive-')); const store = openStore(join(userData, 'analytics.sqlite')); let firstId: string, secondId: string;
  try { store.importPackage(businessPackage()); const versions = new ReportVersions(store, new SalesReports(store)); const result = versions.open({ period: '2025-09' }); if(result.status !== 'monthly') throw Error('Expected report'); firstId = result.report.id; versions.accept({ candidateId: firstId, previousAcceptedId: null, reason: 'İlk arşiv incelemesi' }); const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]]; store.importPackage(businessPackage(records, { extractionId: 'archive-second' })); const second = versions.open({ period: '2025-09' }); if(second.status !== 'monthly') throw Error('Expected second'); secondId = second.report.id; versions.accept({ candidateId: secondId, previousAcceptedId: firstId, reason: 'İkinci arşiv incelemesi' }); if(source) store.importSourcePreview(writeRawPackage(rawSnapshot(), 'fixture:archive', 'archive-source')); } finally { store.close(); } return { userData, firstId, secondId };
}
for(const mode of ['financial', 'source'] as const) test(`archive ${mode}: immutable selection, keyboard, export and failure preservation`, async ({ }, testInfo) => {
  const { userData, firstId, secondId } = await fixture(mode === 'source'); const captureDir = process.env.ESMER_CAPTURE_EVIDENCE ? 'workstreams/page-control-desks/reports' : testInfo.outputPath('screenshots'); await mkdir(captureDir, { recursive: true }); const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page); await page.getByRole('button', { name: 'Raporlar', exact: true }).click(); if(mode === "source") await page.getByRole("button", {name: "Önceki kaydedilmiş raporlar", exact: true}).click(); if(mode === "financial") { await page.getByRole("button", { name: "Sürüm listesine dön", exact: true }).click(); await expect(page.getByRole("button", { name: "Aday raporu aç", exact: true })).toBeFocused(); } if(mode === 'source') await page.getByLabel('Dönem', { exact: true }).fill('2025-09'); await expect(page.getByLabel('Arşivde ara')).toBeVisible(); const first = page.getByRole('row').filter({ hasText: firstId }).getByRole('button', { name: 'Sürümü incele', exact: true }); const inspector = page.getByRole('region', { name: 'Seçili sürüm inceleyicisi' }); await first.press('Enter'); await expect(inspector).toContainText(firstId); await expect(page.getByRole('row').filter({ hasText: firstId })).toHaveAttribute('aria-selected', 'true'); await expect(page.getByRole('heading', { name: 'Kaydedilmiş raporlar', exact: true })).toBeVisible(); await expect(page.locator('canvas')).toHaveCount(0);
    const db = new DatabaseSync(join(userData, 'analytics.sqlite')); db.exec('ALTER TABLE report_versions RENAME TO report_versions_unavailable'); db.close(); await page.getByRole('row').filter({ hasText: secondId }).getByRole('button', { name: 'Sürümü incele', exact: true }).click(); await expect(page.getByText('Yerel hizmet başlatılamadı. Uygulamayı yeniden açın.', { exact: true })).toBeVisible(); await expect(inspector).toContainText(firstId); await expect(page.getByRole('row').filter({ hasText: firstId })).toHaveAttribute('aria-selected', 'true'); const restored = new DatabaseSync(join(userData, 'analytics.sqlite')); restored.exec('ALTER TABLE report_versions_unavailable RENAME TO report_versions'); restored.close();
    const exported = join(userData, 'selected.xlsx'); await app.evaluate(({ dialog }, path) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: path }); }, exported); await inspector.getByRole('button', { name: "Seçili aylık raporu Excel'e aktar", exact: true }).click(); await expect(page.getByText(/Excel.*kaydedildi|Excel.*aktarıldı/)).toBeVisible(); const sheets = Object.entries(unzipSync(await readFile(exported))).filter(([name]) => name.endsWith('.xml')).map(([, bytes]) => strFromU8(bytes)).join('\n'); expect(sheets).toContain(firstId);
    await page.getByLabel('Arşivde ara').fill('bulunmayan'); await expect(page.getByText('Aramanıza uyan sürüm yok.')).toBeVisible(); await expect(inspector).toContainText(firstId); await page.getByLabel('Arşivde ara').fill(''); await page.getByLabel('Sıralama', { exact: true }).selectOption('oldest');
    await page.getByRole('row').filter({ hasText: secondId }).getByRole('button', { name: 'Sürümü incele', exact: true }).press('Enter'); await expect(inspector).toContainText(secondId);
    await first.press('Enter'); await expect(inspector).toContainText(firstId);
    const table = page.getByRole('region', { name: 'Rapor arşivi tablosu', exact: true });
    await table.focus(); await expect(table).toBeFocused(); await table.press('End');
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${captureDir}/${mode}-${width}.png`, fullPage: true });
    }
    if(mode === 'source') { await expect(page.getByRole('main')).toHaveCount(1); await expect(page.getByRole('button', { name: 'İncelenen raporu kaydet', exact: true })).toHaveCount(0); }
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
test('archive pages real saved versions without losing the selected inspector', async () => {
  const { userData, firstId, secondId } = await fixture(false); const store = openStore(join(userData, 'analytics.sqlite')); let previous = secondId; try { const versions = new ReportVersions(store, new SalesReports(store)); for(let index = 0; index < 10; index++) { store.importPackage(businessPackage(businessRecords(), { extractionId: `archive-page-${index}` })); const result = versions.open({ period: '2025-09' }); if(result.status !== 'monthly') throw Error('Missing pagination fixture'); versions.accept({ candidateId: result.report.id, previousAcceptedId: previous, reason: `Sayfalı kayıt ${index}` }); previous = result.report.id; } } finally { store.close(); } const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] }); try { const page = await app.firstWindow();await openWorkspace(page); await page.getByRole('button', { name: 'Raporlar', exact: true }).click(); await page.getByRole("button", { name: "Sürüm listesine dön", exact: true }).click(); await page.getByRole('button', { name: 'Sonraki sürümler', exact: true }).click(); await expect(page.getByText('Sayfa 2 / 2', { exact: true })).toBeVisible(); await page.getByRole('row').filter({ hasText: firstId }).getByRole('button', { name: 'Sürümü incele', exact: true }).click(); const inspector = page.getByRole('region', { name: 'Seçili sürüm inceleyicisi' }); await expect(inspector).toContainText(firstId); await page.getByRole('button', { name: 'Önceki sürümler', exact: true }).click(); await expect(inspector).toContainText(firstId); await page.getByLabel('Arşivde ara').fill('İlk arşiv'); await expect(page.getByRole('row').filter({ hasText: firstId })).toBeVisible(); await expect(page.getByRole('button', { name: 'Sonraki sürümler', exact: true })).toHaveCount(0); } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

for (const state of ['unavailable', 'partial', 'incomplete'] as const) test(`saved inspector qualifies ${state} sales coverage`, async () => {
  const userData = await mkdtemp(join(tmpdir(), `esmer-archive-${state}-`));
  const store = openStore(join(userData, 'analytics.sqlite'));
  const period = state === 'unavailable' ? '2025-08' : '2025-09';
  let reportId: string;
  try {
    const records = businessRecords();
    if (state === 'incomplete') records.documents[0].sales!.net = '99';
    store.importPackage(businessPackage(records, state === 'partial' ? { coverage: { from: '2025-09-01', to: '2025-09-15', complete: true } } : {}));
    const versions = new ReportVersions(store, new SalesReports(store));
    const result = versions.open({ period });
    if (result.status !== 'monthly') throw Error('Missing coverage fixture');
    expect(result.report.sales.coverage).toBe(state === 'incomplete' ? 'complete' : state);
    expect(result.report.sales.complete).toBe(state === 'partial');
    reportId = result.report.id;
    versions.accept({ candidateId: reportId, previousAcceptedId: null, reason: `${state} kapsam incelemesi` });
    store.importSourcePreview(writeRawPackage(rawSnapshot(), 'fixture:archive-coverage', state));
  } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole('button', { name: 'Raporlar', exact: true }).click();
    await page.getByLabel('Dönem', { exact: true }).fill(period);
    await page.getByRole('button', { name: 'Önceki kaydedilmiş raporlar', exact: true }).click();
    await page.getByRole('button', { name: 'Sürümü incele', exact: true }).click();
    const inspector = page.getByRole('region', { name: 'Seçili sürüm inceleyicisi' });
    await expect(inspector).toContainText(reportId);
    if (state === 'unavailable') {
      await expect(inspector.locator('.report-inspector-value')).toContainText('Hesaplanamıyor');
      await expect(inspector.locator('.report-inspector-value')).not.toContainText('0,00 ₺');
      await expect(inspector).toContainText('Kaynak kapsamı dışındaki dönem sıfır faaliyet anlamına gelmez.');
      await expect(inspector).toContainText('01.08.2025 – 31.08.2025');
    } else {
      await expect(inspector).toContainText(state === 'partial' ? 'Kısmi dönem' : 'Kanıt eksik');
      await expect(inspector).toContainText(state === 'partial' ? '01.09.2025 – 15.09.2025' : '01.09.2025 – 30.09.2025');
      await expect(inspector.locator('.report-inspector-value')).toContainText('200,00 ₺');
    }
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test('latest accepted row opens its own report after inspecting an older saved version', async () => {
  const userData = await mkdtemp(join(tmpdir(), 'esmer-archive-accepted-'));
  const store = openStore(join(userData, 'analytics.sqlite'));
  let olderId: string;
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const first = versions.open({ period: '2025-09' });
    if (first.status !== 'monthly') throw Error('Missing predecessor');
    olderId = first.report.id;
    versions.accept({ candidateId: olderId, previousAcceptedId: null, reason: 'Önceki kaydedilmiş sürüm' });
    const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
    store.importPackage(businessPackage(records, { extractionId: 'archive-ui-accept' }));
  } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole('button', { name: 'Raporlar', exact: true }).click(); await page.getByRole("button", { name: "Sürüm listesine dön", exact: true }).click();
    await page.getByRole('row').filter({ hasText: olderId }).getByRole('button', { name: 'Adayla karşılaştır', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Sürüm farkları' })).toBeVisible();
    await page.getByLabel('Rapor inceleme açıklaması').fill('Yeni sürümü arşive kaydet');
    await page.getByRole('button', { name: 'İncelenen raporu kaydet', exact: true }).click();
    const detail = page.getByRole('region', { name: 'Seçili rapor', exact: true });
    await expect(detail).toContainText('Yeni sürümü arşive kaydet');
    await detail.getByText("Veri ve hesaplama ayrıntıları", { exact: true }).click();
    const acceptedId = (await detail.locator("details p").textContent())!.match(/^Rapor (\S+) ·/)![1];
    expect(acceptedId).not.toBe(olderId);
    await page.getByRole('button', { name: 'Sürüm listesine dön', exact: true }).click();
    await page.getByRole('row').filter({ hasText: olderId }).getByRole('button', { name: 'Sürümü incele', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Seçili sürüm inceleyicisi' })).toContainText(olderId);
    await page.getByRole('row').filter({ hasText: acceptedId }).getByRole('button', { name: 'Kaydedilmiş sürümü aç', exact: true }).click();
    await expect(detail).toContainText(acceptedId);
    await expect(detail).not.toContainText(olderId);
    await expect(page.getByRole('region', { name: 'Aylık göstergeler' })).toContainText('100,00 ₺');
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
