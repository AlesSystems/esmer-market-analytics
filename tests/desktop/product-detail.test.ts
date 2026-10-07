import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readSheet } from "read-excel-file/node";
import { openStore } from "../../src/store/store";
import { businessPackage, productProfitRecords } from "../helpers/business-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("selected return month shows pinned daily amounts, original cost and complete product export", async ({}, testInfo) => {
  const root = await mkdtemp(join(tmpdir(), "esmer-selected-detail-"));
  const records = productProfitRecords();
  records.documents.find(row => row.id === "A1")!.date = "2025-08-31";
  const store = openStore(join(root, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(records, { coverage: { from: "2025-08-31", to: "2025-09-30", complete: true } })).status).toBe("active"); } finally { store.close(); }
  const reviewDirectory = process.env.ESMER_S02_REVIEW;
  if (reviewDirectory) test.setTimeout(90_000);
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${root}`], ...(reviewDirectory ? { recordVideo: { dir: reviewDirectory } } : {}) });
  try {
    const page = await app.firstWindow();
    await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Satışlar", exact: true }).click();
    await page.getByRole("button", { name: "Çay", exact: true }).click();
    const detail = page.getByRole("region", { name: "Seçili ürün özeti", exact: true });
    await expect(detail).toContainText("-100,00 ₺");
    await expect(detail).toContainText("-60,00 ₺");
    await expect(detail).toContainText("-40,00 ₺");
    await expect(detail).toContainText("Hesaplanamıyor");
    if (reviewDirectory) { await detail.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${reviewDirectory}/selected-summary.png` }); await page.waitForTimeout(6000); }
    await page.getByText("Seçili ürünün günlük tutarları", { exact: true }).click();
    await expect(page.getByRole("table", { name: "Seçili ürünün günlük tutarları", exact: true }).locator("tbody tr")).toHaveCount(30);
    if (reviewDirectory) { await page.getByRole("table", { name: "Seçili ürünün günlük tutarları", exact: true }).screenshot({ path: `${reviewDirectory}/daily.png` }); await page.waitForTimeout(6000); }
    await page.getByText("Seçili ürünün günlük tutarları", { exact: true }).click();
    await page.getByRole("button", { name: "Asıl satışı aç · A1", exact: true }).click();
    const original = page.getByRole("region", { name: "Asıl satış kanıtı", exact: true });
    await expect(original).toContainText("31.08.2025");
    await expect(original).toContainText("60,00 ₺");
    await expect(original).toContainText("Kaydedilen asıl miktar: 2 adet");
    await expect(original).toContainText("60,00 ₺ / adet · KDV hariç");
    await expect(original).toContainText("Seçili ayın toplamına eklenmez");
    await original.scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath("original-sale.png") });
    if (reviewDirectory) { await page.screenshot({ path: `${reviewDirectory}/original-sale.png` }); await page.waitForTimeout(6000); }
    await page.getByRole("button", { name: "İadeye dön", exact: true }).click();
    await expect(page.getByRole("button", { name: "Asıl satışı aç · A1", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Raporlar", exact: true }).click();
    await page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true }).fill("İçme");
    await page.getByRole("button", { name: "Satışlar", exact: true }).click();
    const output = join(root, "selected.xlsx");
    await app.evaluate(({ dialog }, filePath) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath }); }, output);
    await page.getByRole("button", { name: "Seçili ürünü Excel'e aktar", exact: true }).click();
    await expect(detail).toContainText("Seçili ürün dosyası kaydedildi");
    if (reviewDirectory) { await detail.scrollIntoViewIfNeeded(); await page.screenshot({ path: `${reviewDirectory}/product-export.png` }); await page.waitForTimeout(6000); }
    const sheets = await readSheet(output, 1);
    expect(JSON.stringify(sheets)).toContain("-40");
    const monthlyPath = join(root, "monthly.xlsx");
    await app.evaluate(({ dialog }, filePath) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath }); }, monthlyPath);
    if (reviewDirectory) {
      await page.getByRole("button", { name: "Raporlar", exact: true }).click();

      await page.getByRole("region", { name: "Seçili rapor", exact: true }).getByRole("button", { name: "Seçili aylık raporu Excel'e aktar", exact: true }).click();
      await expect(page.getByText("Seçili rapor Excel dosyasına kaydedildi.", { exact: true })).toBeVisible();
      await page.screenshot({ path: `${reviewDirectory}/monthly-export.png` }); await page.waitForTimeout(6000);
    }
    const report = await page.evaluate(() => window.esmer.openMonthly({ period: "2025-09" }));
    if (report.status !== "monthly") throw new Error("Expected monthly report");
    expect(await page.evaluate(reportId => window.esmer.exportReportVersion({ reportId }), report.report.id)).toEqual({ status: "saved" });
    const monthly = await readSheet(monthlyPath, 1);
    expect(monthly.find(row => row[0] === "Kapsanan tahmini brüt kâr")?.[1]).toBe(-20);
    await page.screenshot({ path: testInfo.outputPath("selected-summary.png"), fullPage: true });
  } finally { await app.close(); await rm(root, { recursive: true, force: true }); }
});

test("original-sale evidence preserves mixed and unknown quantity units and cost basis", async () => {
  const root = await mkdtemp(join(tmpdir(), "esmer-original-units-"));
  const records = productProfitRecords();
  const original = records.lines.find(row => row.id === "A1")!;
  records.documents.find(row => row.id === "A1")!.date = "2025-08-31";
  original.sales!.unit = "unknown";
  original.business!.historicalCost!.unit = "unknown";
  original.business!.historicalCost!.taxBasis = "unknown";
  for (const [id, unit, quantity] of [["kg-sibling", "kg", "1.25"], ["piece-sibling", "piece", "3"]] as const) {
    records.lines.push({ ...structuredClone(original), id, quantity, net: "0", sales: { ...original.sales!, productId: id, productName: id, unit, unitNet: "0", tax: "0", gross: "0" }, business: { historicalCost: null, inventory: null } });
  }
  const store = openStore(join(root, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(records, { coverage: { from: "2025-08-31", to: "2025-09-30", complete: true } })).status).toBe("active"); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${root}`] });
  try {
    const page = await app.firstWindow();
    await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Satışlar", exact: true }).click();
    await page.getByRole("button", { name: "Çay", exact: true }).click();
    await page.getByRole("button", { name: "Asıl satışı aç · A1", exact: true }).click();
    const evidence = page.getByRole("region", { name: "Asıl satış kanıtı", exact: true });
    await expect(evidence).toContainText("Kaydedilen asıl miktar: 2 birim bilinmiyor");
    await expect(evidence).toContainText("60,00 ₺ / birim bilinmiyor · KDV temeli bilinmiyor");
    await expect(evidence.locator("article").filter({ hasText: "kg-sibling" })).toContainText("Kaydedilen miktar: 1,25 kg");
    await expect(evidence.locator("article").filter({ hasText: "piece-sibling" })).toContainText("Kaydedilen miktar: 3 adet");
    await expect(evidence).toContainText("Bu kaydın varlığı tek başına iade maliyetini doğrulamaz");
  } finally { await app.close(); await rm(root, { recursive: true, force: true }); }
});
