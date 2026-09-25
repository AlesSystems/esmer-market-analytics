import { importPackage } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { businessPackage } from "../helpers/business-fixtures";
const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("monthly overview combines pinned sales, covered cost and honest missing expenses", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-monthly-")), packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
    const overview = page.getByRole("region", { name: "Aylık göstergeler", exact: true });
    await expect(overview).toContainText("200,00 ₺");
    await expect(overview).toContainText("60,00 ₺");
    await expect(overview).toContainText("40,00 ₺");
    await expect(overview).toContainText("%50");
    await expect(overview).toContainText("İşçilik");
    await expect(overview).toContainText("Faaliyet kârı hesaplanamıyor — gider verileri eksik.");
    await expect(page.getByText("Sentetik veri", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Satışlar", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "Satış Özeti", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Özet", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/phase-8-monthly-overview.png", fullPage: true });
    await page.setViewportSize({ width: 680, height: 720 });
    await expect(page.getByRole("button", { name: "Raporlar", exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/phase-8-monthly-small.png", fullPage: true });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("reviewed monthly values and source explanations survive refresh and export selection", async () => {
  const { businessRecords } = await import("../helpers/business-fixtures");
  const { stat } = await import("node:fs/promises");
  const userData = await mkdtemp(join(tmpdir(), "esmer-monthly-history-")), packagePath = join(userData, "synthetic.json"), exportPath = join(userData, "report.xlsx");
  const initial = businessRecords(); initial.lines[1].sales!.productName = "Çay"; initial.lines[1].sales!.productId = "tea";
  await writeFile(packagePath, businessPackage(initial));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await app.evaluate(({ dialog }, paths) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [paths.packagePath] }); dialog.showSaveDialog = async () => ({ canceled: false, filePath: paths.exportPath }); }, { packagePath, exportPath });
    await importPackage(page);
    await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Raporlar", exact: true }).press("Enter");
    await page.getByLabel("Rapor inceleme açıklaması").fill("Eylül sentetik kontrolü");
    await page.getByRole("button", { name: "İncelenen raporu kaydet" }).click();
    await expect(page.getByRole("region", { name: "Seçili rapor", exact: true })).toContainText("Kaydedilmiş sürüm");
    await expect(page.getByText("Geçici", { exact: true })).toBeVisible();
    const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
    await writeFile(packagePath, businessPackage(records, { extractionId: "business-2", extractedAt: "2025-10-02T00:00:00.000Z" }));
    await importPackage(page);
    await expect(page.getByText("Yeni veri sürümü hazır", { exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/shadcn-stale-source.png", fullPage: true });
    await page.getByRole("button", { name: "Raporu yenile", exact: true }).click();
    await page.getByRole("button", { name: "Raporlar", exact: true }).click();
    await page.getByRole("button", { name: "Adayla karşılaştır", exact: true }).click();
    await expect(page.getByRole("region", { name: "Sürüm farkları" })).toContainText("Net satış");
    await page.getByRole("button", { name: "Kaydedilmiş sürümü aç", exact: true }).click();
    await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText("200,00 ₺");
    await page.screenshot({ path: "test-results/shadcn-saved-report.png", fullPage: true });
    await page.getByText("Rapor kanıtı", { exact: true }).click();
    await page.getByRole("button", { name: "Sabit rapor kanıtlarını göster" }).click();
    const sourceRows = page.locator(".saved-evidence > details > summary").filter({ hasText: "100,00 ₺" });
    await expect(sourceRows).toHaveCount(2);
    await expect(sourceRows.nth(0)).toContainText("Çay");
    await expect(sourceRows.nth(1)).toContainText("İçme suyu");
    await sourceRows.nth(0).press("Enter");
    await expect(page.locator(".saved-evidence")).toContainText("S2 / L2");
    await page.getByLabel("Kanıtlarda ürün ara").fill("İÇ");
    await expect(sourceRows).toHaveCount(1);
    await expect(sourceRows.first()).toContainText("İçme suyu");
    await expect(page.locator(".saved-evidence")).toContainText("Türkçe sıralama");
    await page.getByRole("button", { name: "Seçili aylık raporu Excel'e aktar", exact: true }).click();
    await expect(page.getByText("Seçili rapor Excel dosyasına kaydedildi.", { exact: true })).toBeVisible();
    expect((await stat(exportPath)).size).toBeGreaterThan(0);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ path: "test-results/phase-8-report-history.png" });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
