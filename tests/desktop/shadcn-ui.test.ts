import { executablePath } from "../helpers/desktop-executable";
import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, expect, _electron as electron, type Page } from "@playwright/test";
import { importPackage, openReportView, openSection, openSettings, openWorkspace } from "../helpers/desktop-navigation";
import { workbook, row } from "../helpers/expense-fixtures";
import { monthlyUiExpected, representativeMonthPackage, stressMonthPackage } from "../helpers/shadcn-fixtures";


test("forced colors keeps a keyboard focus outline on actions and period input", async ({}, testInfo) => {
  const { app, userData, packagePath } = await importedApp();
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await expect(page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Bu ay", exact: true })).toHaveAttribute("aria-current", "page");
    await page.emulateMedia({ forcedColors: "active" });
    for (const control of [page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Giderler", exact: true }), page.getByLabel("Dönem", { exact: true }).filter({ visible: true })]) {
      await control.focus();
      await control.press("Tab");
      await page.keyboard.press("Shift+Tab");
      await expect(control).toBeFocused();
      const outline = await control.evaluate(node => {
        const style = getComputedStyle(node);
        return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
      });
      expect(outline.style).not.toBe("none");
      expect(outline.width).toBeGreaterThanOrEqual(2);
    }
    await capture(page, testInfo.outputPath("forced-colors-keyboard-focus.png"));
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});

async function importedApp(bytes = representativeMonthPackage()) {
  const userData = await mkdtemp(join(tmpdir(), "esmer-shadcn-ui-"));
  const packagePath = join(userData, "representative-month.json");
  await writeFile(packagePath, bytes);
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  return { app, userData, packagePath, fixtureHash: createHash("sha256").update(bytes).digest("hex") };
}

async function capture(page: Page, path: string, fullPage = false) {
  await expect(page.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0);
  await page.screenshot({ path, fullPage, animations: "disabled" });
}

async function checkContrast(page: Page) {
  const ratios = await page.evaluate(() => {
    function channels(value: string) {
      const parts = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return parts.length >= 3 ? { rgb: parts.slice(0, 3), alpha: parts[3] ?? 1 } : null;
    }
    function background(element: Element) {
      for (let current: Element | null = element; current; current = current.parentElement) {
        const color = channels(getComputedStyle(current).backgroundColor);
        if (color && color.alpha > 0) return color.rgb;
      }
      return [255, 255, 255];
    }
    function luminance(rgb: number[]) {
      const linear = rgb.map(value => {
        const channel = value / 255;
        return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    }
    function ratio(element: Element) {
      const foreground = channels(getComputedStyle(element).color)?.rgb;
      if (!foreground) throw new Error("Text color unavailable");
      const values = [luminance(foreground), luminance(background(element))].sort((a, b) => b - a);
      return (values[0] + 0.05) / (values[1] + 0.05);
    }
    const heading = document.querySelector(".monthly-overview h1");
    const action = [...document.querySelectorAll("button")].find(node => node.textContent?.trim() === "Giderler");
    const period = document.querySelector('input[type="month"]');
    if (!heading || !action || !period) throw new Error("Representative text, action or period control missing");
    return { heading: ratio(heading), action: ratio(action), period: ratio(period) };
  });
  for (const [name, ratio] of Object.entries(ratios)) expect(ratio, `${name} text contrast`).toBeGreaterThanOrEqual(4.5);
  return ratios;
}

test("a representative month exposes profit, gaps, cost exposure and evidence on one scrolling page", async ({}, testInfo) => {
  test.skip(process.platform !== "win32", "Packaged Windows layout contract");
  const { app, userData, packagePath } = await importedApp();
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await openReportView(page, "Aylık rapor");
    await expect(page.getByRole("heading", { name: "Aylık Ürün Kârlılığı", exact: true })).toBeVisible();
    await expect(page.getByLabel("Dönem", { exact: true }).filter({ visible: true })).toHaveValue("2025-09");
    await expect(page.locator(".data-status")).toContainText("30.09.2025");
    const overview = page.getByRole("region", { name: "Aylık göstergeler" });
    await expect(overview).toContainText(monthlyUiExpected.netSales);
    await expect(overview).toContainText(monthlyUiExpected.coveredCost);
    await expect(overview).toContainText(monthlyUiExpected.coveredGross);
    await expect(overview).toContainText("Tüm market kârı belirlenemiyor");
    await page.getByText("Giderler ve faaliyet sonucu", { exact: true }).click();
    await expect(overview.getByRole("heading", { name: /Faaliyet kârı hesaplanamıyor.*gider verileri eksik/ })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Giderler", exact: true })).toBeVisible();
    await expect(overview.getByText(monthlyUiExpected.coveredCost, { exact: true }).first()).toBeVisible();
    await expect(overview.getByText("1.500,00 ₺", { exact: false }).filter({ visible: true }).first(), "covered sales exposure stays visible").toBeVisible();
    await expect(overview.getByText("1.400,00 ₺", { exact: false }).filter({ visible: true }).first(), "excluded sale exposure stays visible").toBeVisible();
    await expect(overview.getByText("-25,00 ₺", { exact: false }).filter({ visible: true }).first(), "excluded return exposure stays visible").toBeVisible();
    const trend = page.getByRole("group", { name: "Günlük tahmini brüt kâr grafiği" });
    await trend.scrollIntoViewIfNeeded();
    await expect(trend).toBeVisible();
    const bounds = await trend.boundingBox();
    expect(bounds, "daily trend has a rendered box").not.toBeNull();
    // The 900 px viewport limit gets one pixel of tolerance: boundingBox() reports fractional CSS pixels, so a plot that
    // ends at 900.4 after fractional layout is still fully inside the 900 px viewport once rounded to device pixels.
    expect(bounds!.y + bounds!.height, "daily trend fits after scrolling").toBeLessThanOrEqual(901);
    await expect(page.locator('.monthly-trend g[data-date="2025-09-15"]').filter({ visible: true }).locator('[data-state="value"], .viz-zero-marker')).toHaveCount(0);
    await expect(page.locator('.monthly-trend g[data-date="2025-09-30"] [data-state="value"]').filter({ visible: true })).toHaveCount(1);
    await capture(page, testInfo.outputPath("representative-month-1440.png"));
    const evidence = page.locator(".monthly-trend").filter({ visible: true }).getByRole("button", { name: "Tablo", exact: true });
    await evidence.focus();
    await evidence.press("Enter");
    await expect(page.locator(".monthly-trend tbody tr").filter({ hasText: "15.09.2025" })).toContainText("Hesaplanamıyor");
    await expect(page.locator(".monthly-trend tbody tr").filter({ hasText: "30.09.2025" })).toContainText("60,00 ₺");
    await expect(evidence).toBeFocused();
    await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await openSection(page, "Bu ay");
    await expect(page.getByLabel("Dönem", { exact: true }).filter({ visible: true })).toHaveValue("2025-09");
    await openReportView(page, "Aylık rapor");
    await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText(monthlyUiExpected.netSales);
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});

test("long Turkish labels and a large amount remain usable in a paginated narrow table", async ({}, testInfo) => {
  test.skip(process.platform !== "win32", "Packaged Windows visual stress check");
  const { app, userData, packagePath, fixtureHash } = await importedApp(stressMonthPackage());
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.setViewportSize({ width: 453, height: 900 });
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await openReportView(page, "Veri ve kaynak");
    await page.getByText("İşlemler ve satış dağılımı", { exact: true }).click();
    await expect(page.getByRole("heading", { name: "Satış Özeti", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tüm ürünler", exact: true }).click();
    await expect(page.getByRole("button", { name: "Uzun ömürlü çamaşır deterjanı", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(page, testInfo.outputPath("stress-long-category-453.png"), true);
    await page.getByRole("button", { name: "Satış özetine dön", exact: true }).click();
    await page.getByRole("button", { name: "Tüm işlemleri göster", exact: true }).click();
    await expect(page.locator("main tbody tr")).toHaveCount(100);
    await expect(page.getByRole("row").filter({ has: page.getByRole("button", { name: "UIS001", exact: true }) })).toContainText("123.456.789,12 ₺");
    await page.getByRole("button", { name: "Sonraki 100", exact: true }).click();
    await expect(page.locator("main tbody tr")).toHaveCount(100);
    await expect(page.getByRole("navigation", { name: "İşlemler sayfaları" })).toContainText("Sayfa 2 / 3");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture(page, testInfo.outputPath("stress-transactions-453.png"), true);
    await writeFile(testInfo.outputPath("stress-fixture.json"), JSON.stringify({ sha256: fixtureHash, documents: 204, lines: 204, synthetic: true }, null, 2));
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});

test("packaged visual journey retains every destination and important desktop state", async ({}, testInfo) => {
  test.skip(process.platform !== "win32", "Packaged Windows visual evidence");
  const { app, userData, packagePath, fixtureHash } = await importedApp();
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.getByRole("heading", { name: "Kâr tahmini için veri paketi gerekiyor", exact: true })).toBeVisible();
    await capture(page, testInfo.outputPath("empty-1440.png"));
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await openReportView(page, "Aylık rapor");
    await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText(monthlyUiExpected.netSales);
    const dismiss = page.getByRole("button", { name: "Bildirimi kapat" });
    if (await dismiss.isVisible()) await dismiss.click();
    await capture(page, testInfo.outputPath("overview-1440.png"));
    const contrast = await checkContrast(page);
    await page.getByText("Giderler ve faaliyet sonucu", { exact: true }).click();
    const gapAction = page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Giderler", exact: true });
    await gapAction.focus();
    await page.keyboard.press("Shift+Tab");
    await page.keyboard.press("Tab");
    await expect(gapAction).toBeFocused();
    const focus = await gapAction.evaluate(element => {
      const style = getComputedStyle(element);
      return { width: Number.parseFloat(style.outlineWidth), kind: style.outlineStyle, shadow: style.boxShadow };
    });
    expect((focus.kind !== "none" && focus.width >= 2) || /\b3px\b/.test(focus.shadow), "keyboard focus has a visible outline or ring").toBe(true);

    const nav = page.getByRole("navigation", { name: "Ana gezinme" });
    await openReportView(page, "Veri ve kaynak");
    await page.getByText("İşlemler ve satış dağılımı", { exact: true }).click();
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
    await expect(page.getByRole("region", { name: "İşlem detayı" })).toBeVisible();
    await capture(page, testInfo.outputPath("sales-receipt.png"));
    await page.getByRole("region", { name: "İşlem detayı" }).getByRole("button", { name: "Kaynak detayını göster" }).click();
    await expect(page.getByRole("region", { name: "Kaynak detayı" })).toBeVisible();
    await capture(page, testInfo.outputPath("sales-source.png"));
    await page.getByRole("button", { name: "Satışlara dön", exact: true }).click();
    await expect(page.getByRole("button", { name: "UI01", exact: true })).toBeFocused();

    await openReportView(page, "Alış belgeleri");
    await page.getByText("Maliyet kapsamı, alış geçmişi ve diğer araçlar", { exact: true }).click();
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
    await page.getByRole("button", { name: "Giderlerin eksiksizliğini incele", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Dönem eksiksizlik incelemesi", exact: true })).toBeVisible();
    await capture(page, testInfo.outputPath("expenses-completeness.png"));
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
    const expensePath = join(userData, "synthetic-expense.xlsx");
    await writeFile(expensePath, await workbook([["ui-rent-1", "15.09.2025", "01.10.2025", ...row.slice(3)]]));
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, expensePath);
    await page.getByRole("button", { name: "Excel’den aktar", exact: true }).click();
    await capture(page, testInfo.outputPath("expenses-import.png"));
    await page.getByRole("button", { name: "Excel seç", exact: true }).click();
    await expect(page.getByRole("region", { name: "Excel önizlemesi" })).toBeVisible();
    await capture(page, testInfo.outputPath("expenses-preview.png"));

    await openReportView(page, "Aylık rapor");
    await expect(page.getByRole("heading", { name: "Raporlar", exact: true })).toBeVisible();
    await capture(page, testInfo.outputPath("reports-list.png"));

    await expect(page.getByRole("region", { name: "Seçili rapor" })).toBeVisible();
    await capture(page, testInfo.outputPath("reports-candidate.png"));

    await openSettings(page);
    await capture(page, testInfo.outputPath("settings.png"));
    await page.getByText("İçe aktarma geçmişi", { exact: true }).click();
    await capture(page, testInfo.outputPath("settings-history.png"));
    await page.getByRole("button", { name: "Yedekleme ve kurtarma", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yedekleme ve kurtarma", exact: true })).toBeFocused();
    await capture(page, testInfo.outputPath("recovery.png"));
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await openSection(page, "Bu ay");

    for (const width of [680, 453]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `document overflow at ${width}px`).toBe(true);
      await expect(page.getByRole("heading", { name: "Kâr tahmini için veri paketi gerekiyor", exact: true })).toBeVisible();
      await capture(page, testInfo.outputPath(`overview-${width}.png`), true);
    }
    for (const [destination, file] of [["Veri ve kaynak", "sales-summary-453.png"], ["Alış belgeleri", "purchasing-history-453.png"], ["Giderler", "expenses-records-453.png"], ["Aylık rapor", "reports-list-453.png"]] as const) {
      if (destination === "Giderler") await openSection(page, "Giderler"); else await openReportView(page, destination);
      await expect(page.locator('[aria-busy="true"]').filter({ visible: true })).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `document overflow in ${destination} at 453px`).toBe(true);
      await capture(page, testInfo.outputPath(file), true);
    }
    await openReportView(page, "Veri ve kaynak");
    await page.getByText("İşlemler ve satış dağılımı", { exact: true }).click();
    await page.getByRole("button", { name: "Tüm işlemleri göster", exact: true }).click();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "document overflow around the narrow transaction table").toBe(true);
    await capture(page, testInfo.outputPath("sales-transactions-453.png"), true);
    await openSection(page, "Bu ay");
    await page.emulateMedia({ forcedColors: "active", reducedMotion: "reduce" });
    await capture(page, testInfo.outputPath("forced-colors-reduced-motion.png"), true);
    await page.emulateMedia({ forcedColors: "none", reducedMotion: "no-preference" });
    const externalRequests: string[] = [];
    await page.route(/^https?:\/\//, route => { externalRequests.push(route.request().url()); return route.abort(); });
    await page.context().setOffline(true);
    await page.reload();await openWorkspace(page);
    await openReportView(page, "Aylık rapor");
    await expect(page.getByRole("heading", { name: "Aylık Ürün Kârlılığı", exact: true })).toBeVisible();
    await openReportView(page, "Aylık rapor");
    await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText(monthlyUiExpected.netSales);
    expect(externalRequests).toEqual([]);
    await capture(page, testInfo.outputPath("offline-reload.png"), true);
    await writeFile(testInfo.outputPath("environment.json"), JSON.stringify({
      fixtureSha256: fixtureHash, fixture: "synthetic representative 30-day September month",
      contrast,
      runtime: await app.evaluate(({ app, screen }) => ({ packaged: app.isPackaged, platform: process.platform, versions: process.versions, display: screen.getPrimaryDisplay() })),
      viewport: { width: 453, height: 900 }, forcedColors: "emulated", reducedMotion: "emulated", offline: "Playwright browser context",
    }, null, 2));
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});
