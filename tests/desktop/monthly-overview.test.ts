import { importPackage, openReportView, openWorkspace, pressReportView } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { businessPackage } from "../helpers/business-fixtures";
import { executablePath } from "../helpers/desktop-executable";

test("monthly overview combines pinned sales, covered cost and honest missing expenses", async () => {
    test.skip(true, "old UI, removed in P5");
  const userData = await mkdtemp(join(tmpdir(), "esmer-monthly-")), packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    const nav = page.getByRole("navigation", { name: "Ana gezinme" });
    await expect(nav.getByRole("button", { name: "Bu ay", exact: true })).toHaveAttribute("aria-current", "page");
    await openReportView(page, "Aylık rapor");
    const overview = page.getByRole("region", { name: "Aylık göstergeler", exact: true });
    await expect(overview).toContainText("200,00 ₺");
    await expect(overview).toContainText("60,00 ₺");
    await expect(overview).toContainText("40,00 ₺");
    await expect(overview).toContainText("%50");
    await expect(overview).toContainText("İşçilik");
    await expect(overview).toContainText("Faaliyet kârı hesaplanamıyor — gider verileri eksik.");
    await expect(page.getByText("Sentetik veri", { exact: true }).filter({ visible: true })).toBeVisible();
    await pressReportView(page, "Veri ve kaynak");
    await expect(page.getByRole("heading", { name: "Satışlar", exact: true })).toBeVisible();
    await nav.getByRole("button", { name: "Bu ay", exact: true }).press("Enter");
    await expect(nav.getByRole("button", { name: "Bu ay", exact: true })).toHaveAttribute("aria-current", "page");
    // A financial-only dataset has no estimate package: Bu ay says so instead of inventing a profit figure.
    await expect(page.getByRole("heading", { name: "Kâr tahmini için veri paketi gerekiyor", exact: true })).toBeVisible();
    await pressReportView(page, "Aylık rapor");
    await expect(overview).toContainText("200,00 ₺");
    await page.screenshot({ path: "test-results/phase-8-monthly-overview.png", fullPage: true });
    await page.setViewportSize({ width: 680, height: 720 });
    await expect(nav.getByRole("button", { name: "Rapor ve Excel", exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/phase-8-monthly-small.png", fullPage: true });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("reviewed monthly values and source explanations survive refresh and export selection", async () => {
    test.skip(true, "old UI, removed in P5");
  const { businessRecords } = await import("../helpers/business-fixtures");
  const { stat } = await import("node:fs/promises");
  const userData = await mkdtemp(join(tmpdir(), "esmer-monthly-history-")), packagePath = join(userData, "synthetic.json"), exportPath = join(userData, "report.xlsx");
  const initial = businessRecords(); initial.lines[1].sales!.productName = "Çay"; initial.lines[1].sales!.productId = "tea";
  await writeFile(packagePath, businessPackage(initial));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ dialog }, paths) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [paths.packagePath] }); dialog.showSaveDialog = async () => ({ canceled: false, filePath: paths.exportPath }); }, { packagePath, exportPath });
    await importPackage(page);
    await expect(page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Bu ay", exact: true })).toHaveAttribute("aria-current", "page");
    await pressReportView(page, "Aylık rapor"); await page.getByRole("button", { name: "Sürüm listesine dön", exact: true }).click();
    await page.getByLabel("Rapor inceleme açıklaması").fill("Eylül sentetik kontrolü");
    await page.getByRole("button", { name: "İncelenen raporu kaydet" }).click();
    await expect(page.getByRole("region", { name: "Seçili rapor", exact: true })).toContainText("Kaydedilmiş sürüm");
    await expect(page.getByText("Geçici", { exact: true }).filter({ visible: true })).toBeVisible();
    const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
    await writeFile(packagePath, businessPackage(records, { extractionId: "business-2", extractedAt: "2025-10-02T00:00:00.000Z" }));
    await importPackage(page);
    await openReportView(page, "Veri ve kaynak");
    // Rapor ve Excel reopens on the newly imported dataset (one remaining sale), not the previously opened one.
    await expect(page.getByRole("heading", { name: "Satışlar", exact: true })).toBeVisible();
    await expect(page.getByText("Kapsanan net satış", { exact: true }).filter({ visible: true }).locator("xpath=..")).toContainText("100,00 ₺");
    await page.screenshot({ path: "test-results/shadcn-stale-source.png", fullPage: true });
    await openReportView(page, "Aylık rapor"); await page.getByRole("button", { name: "Sürüm listesine dön", exact: true }).click();
    await page.getByRole("button", { name: "Adayla karşılaştır", exact: true }).click();
    await expect(page.getByRole("region", { name: "Sürüm farkları" })).toContainText("Net satış");
    await page.getByRole("button", { name: "Kaydedilmiş sürümü aç", exact: true }).click();
    await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText("200,00 ₺");
    await page.screenshot({ path: "test-results/shadcn-saved-report.png", fullPage: true });
    await page.locator(".report-proof > summary").filter({ visible: true }).click();
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
