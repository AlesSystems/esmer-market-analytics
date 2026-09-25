import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { test, expect, _electron as electron, type Page } from "@playwright/test";
import { importPackage } from "../helpers/desktop-navigation";
import { workbook, row } from "../helpers/expense-fixtures";
import { monthlyUiExpected, representativeMonthPackage } from "../helpers/shadcn-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? resolve("release/win-unpacked/Esmer Market Analytics.exe");

async function importedApp() {
  const userData = await mkdtemp(join(tmpdir(), "esmer-shadcn-ui-"));
  const packagePath = join(userData, "representative-month.json");
  const bytes = representativeMonthPackage();
  await writeFile(packagePath, bytes);
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  return { app, userData, packagePath, fixtureHash: createHash("sha256").update(bytes).digest("hex") };
}

async function capture(page: Page, path: string, fullPage = false) {
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await page.screenshot({ path, fullPage, animations: "disabled" });
}

test("a representative month exposes the trend, gaps, cost exposure and evidence in the first desktop view", async ({}, testInfo) => {
  test.skip(process.platform !== "win32", "Packaged Windows layout contract");
  const { app, userData, packagePath } = await importedApp();
  try {
    const page = await app.firstWindow();
    await page.setViewportSize({ width: 1440, height: 900 });
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
    await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2025-09");
    await expect(page.locator(".data-status")).toContainText("30.09.2025");
    const overview = page.getByRole("region", { name: "Aylık göstergeler" });
    await expect(overview).toContainText(monthlyUiExpected.netSales);
    await expect(overview).toContainText(monthlyUiExpected.coveredCost);
    await expect(overview).toContainText(monthlyUiExpected.coveredGross);
    await expect(overview.getByText("Karşılaştırılamıyor", { exact: true })).toBeVisible();
    await expect(overview.getByText(/Dönem veya uzlaşma kanıtı karşılaştırma için eksik/)).toBeVisible();
    await expect(overview.getByRole("heading", { name: /Faaliyet kârı hesaplanamıyor.*gider verileri eksik/ })).toBeVisible();
    await expect(overview.getByRole("button", { name: "Giderleri incele", exact: true })).toBeVisible();
    await expect(overview.getByText(monthlyUiExpected.coveredCost, { exact: true }).first()).toBeVisible();
    await expect(overview.getByText("1.500,00 ₺", { exact: false }).filter({ visible: true }).first(), "covered sales exposure stays visible").toBeVisible();
    await expect(overview.getByText("1.400,00 ₺", { exact: false }).filter({ visible: true }).first(), "excluded sale exposure stays visible").toBeVisible();
    await expect(overview.getByText("-25,00 ₺", { exact: false }).filter({ visible: true }).first(), "excluded return exposure stays visible").toBeVisible();
    const trend = overview.getByRole("img", { name: "Günlük net satış grafiği" });
    await expect(trend).toBeVisible();
    const bounds = await trend.boundingBox();
    expect(bounds, "daily trend has a rendered box").not.toBeNull();
    expect(bounds!.y + bounds!.height, "daily trend fits in the first 900 CSS pixels").toBeLessThanOrEqual(900);
    await expect(trend.getByText("15.09.2025: -25,00 ₺")).toHaveCount(1);
    await expect(trend.getByText(/30\.09\.2025: 100,00 ₺/)).toHaveCount(1);
    await capture(page, testInfo.outputPath("representative-month-1440.png"));
    const evidence = overview.getByText("Günlük tutarlar", { exact: true });
    await evidence.focus();
    await evidence.press("Enter");
    await expect(overview.getByText("15.09.2025: -25,00 ₺").last()).toBeVisible();
    await evidence.press("Enter");
    await expect(evidence).toBeFocused();
    await overview.getByRole("button", { name: "Giderleri incele", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Özet", exact: true }).click();
    await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2025-09");
    await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText(monthlyUiExpected.netSales);
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});

test("packaged visual journey retains every destination and important desktop state", async ({}, testInfo) => {
  test.skip(process.platform !== "win32", "Packaged Windows visual evidence");
  const { app, userData, packagePath, fixtureHash } = await importedApp();
  try {
    const page = await app.firstWindow();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole("heading", { name: "Henüz veri yok" })).toBeVisible();
    await capture(page, testInfo.outputPath("empty-1440.png"));
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText(monthlyUiExpected.netSales);
    const dismiss = page.getByRole("button", { name: "Bildirimi kapat" });
    if (await dismiss.isVisible()) await dismiss.click();
    await capture(page, testInfo.outputPath("overview-1440.png"));

    const nav = page.getByRole("navigation", { name: "Ana gezinme" });
    await nav.getByRole("button", { name: "Satışlar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Satış Özeti", exact: true })).toBeVisible();
    await capture(page, testInfo.outputPath("sales-summary.png"));
    await page.getByRole("button", { name: "Tüm ürünler", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Kategori / Ürün Detayı", exact: true })).toBeVisible();
    await capture(page, testInfo.outputPath("sales-products.png"));
    await page.getByRole("button", { name: "Satış özetine dön", exact: true }).click();
    await page.getByRole("button", { name: "Tüm işlemleri göster", exact: true }).click();
    await expect(page.getByRole("heading", { name: "İşlemler", exact: true })).toBeVisible();
    await capture(page, testInfo.outputPath("sales-transactions.png"));
    await page.getByRole("button", { name: "UI01", exact: true }).click();
    await expect(page.getByRole("complementary", { name: "İşlem detayı" })).toBeVisible();
    await capture(page, testInfo.outputPath("sales-receipt.png"));
    await page.getByRole("complementary", { name: "İşlem detayı" }).getByRole("button", { name: "Kaynak detayını göster" }).click();
    await expect(page.getByRole("complementary", { name: "Kaynak detayı" })).toBeVisible();
    await capture(page, testInfo.outputPath("sales-source.png"));
    await page.getByRole("button", { name: "Kapat", exact: true }).click();
    await expect(page.getByRole("button", { name: "UI01", exact: true })).toBeFocused();

    await nav.getByRole("button", { name: "Alışlar ve maliyet", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Alışlar ve maliyet", exact: true })).toBeVisible();
    await capture(page, testInfo.outputPath("purchasing-history.png"));
    for (const [label, file] of [["Tedarikçi iadeleri", "purchasing-returns.png"], ["İkame maliyeti", "purchasing-replacement.png"], ["Stok ve fire", "purchasing-stock.png"]] as const) {
      await page.getByRole("navigation", { name: "Alış ve maliyet görünümleri" }).getByRole("button", { name: label, exact: true }).click();
      await expect(page.getByRole("region", { name: label, exact: true })).toBeVisible();
      await capture(page, testInfo.outputPath(file));
    }

    await nav.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await capture(page, testInfo.outputPath("expenses-records.png"));
    await page.getByRole("button", { name: "Gider tamlığını onayla", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Dönem eksiksizlik incelemesi", exact: true })).toBeVisible();
    await capture(page, testInfo.outputPath("expenses-completeness.png"));
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
    const expensePath = join(userData, "synthetic-expense.xlsx");
    await writeFile(expensePath, await workbook([["ui-rent-1", "15.09.2025", "01.10.2025", ...row.slice(3)]]));
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, expensePath);
    await page.getByRole("button", { name: "Gider içe aktar", exact: true }).click();
    await capture(page, testInfo.outputPath("expenses-import.png"));
    await page.getByRole("button", { name: "Excel seç", exact: true }).click();
    await expect(page.getByRole("region", { name: "Excel önizlemesi" })).toBeVisible();
    await capture(page, testInfo.outputPath("expenses-preview.png"));

    await nav.getByRole("button", { name: "Raporlar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Rapor sürümleri", exact: true })).toBeVisible();
    await capture(page, testInfo.outputPath("reports-list.png"));
    await page.getByRole("button", { name: "Aday raporu aç", exact: true }).click();
    await expect(page.getByRole("region", { name: "Seçili rapor" })).toBeVisible();
    await capture(page, testInfo.outputPath("reports-candidate.png"));

    await page.getByText("İşlemler", { exact: true }).click();
    await page.getByText("İçe aktarma geçmişi", { exact: true }).click();
    await capture(page, testInfo.outputPath("operations-history.png"));
    await page.getByRole("button", { name: "Yedekleme ve kurtarma", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yedekleme ve kurtarma", exact: true })).toBeFocused();
    await capture(page, testInfo.outputPath("recovery.png"));
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await nav.getByRole("button", { name: "Özet", exact: true }).click();

    for (const width of [680, 453]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `document overflow at ${width}px`).toBe(true);
      await expect(page.getByRole("button", { name: "Giderleri incele", exact: true })).toBeVisible();
      await capture(page, testInfo.outputPath(`overview-${width}.png`), true);
    }
    await nav.getByRole("button", { name: "Satışlar", exact: true }).click();
    await page.getByRole("button", { name: "Tüm işlemleri göster", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "document overflow around the narrow transaction table").toBe(true);
    await capture(page, testInfo.outputPath("sales-transactions-453.png"), true);
    await nav.getByRole("button", { name: "Özet", exact: true }).click();
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    await capture(page, testInfo.outputPath("forced-colors-reduced-motion.png"), true);
    await page.emulateMedia({ forcedColors: "none", reducedMotion: "no-preference" });
    const externalRequests: string[] = [];
    await page.route(/^https?:\/\//, route => { externalRequests.push(route.request().url()); return route.abort(); });
    await page.context().setOffline(true);
    await page.reload();
    await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText(monthlyUiExpected.netSales);
    expect(externalRequests).toEqual([]);
    await capture(page, testInfo.outputPath("offline-reload.png"), true);
    await writeFile(testInfo.outputPath("environment.json"), JSON.stringify({
      fixtureSha256: fixtureHash, fixture: "synthetic representative 30-day September month",
      runtime: await app.evaluate(({ app, screen }) => ({ packaged: app.isPackaged, platform: process.platform, versions: process.versions, display: screen.getPrimaryDisplay() })),
      viewport: { width: 453, height: 900 }, forcedColors: "emulated", reducedMotion: "emulated", offline: "Playwright browser context",
    }, null, 2));
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});
