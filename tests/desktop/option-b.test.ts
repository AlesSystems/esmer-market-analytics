import { executablePath } from "../helpers/desktop-executable";
import { importPackage, openReportView, openSection, openSettings, openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron, type Page } from "@playwright/test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { businessPackage } from "../helpers/business-fixtures";

// The sidebar owns the month picker; embedded workspaces keep a hidden copy, so only the visible one counts.
const period = (page: Page) => page.getByLabel("Dönem", { exact: true }).filter({ visible: true });

test("sidebar keeps the reporting period through analysis and recovery", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-option-b-"));
  const packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    const nav = page.getByRole("navigation", { name: "Ana gezinme" });
    await expect(nav.getByRole("button", { name: "Bu ay", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(period(page)).toHaveValue("2025-09");
    await openReportView(page, "Aylık rapor");
    await expect(nav.getByRole("button", { name: "Rapor ve Excel", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByText("Sentetik veri", { exact: true }).filter({ visible: true })).toBeVisible();
    await nav.getByRole("button", { name: "Giderler", exact: true }).click();
    await period(page).fill("2025-08");
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Giderler", exact: true })).toHaveAttribute("aria-current", "page");
    await openSettings(page);
    await page.getByRole("button", { name: "Yedekleme ve kurtarma", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yedekleme ve kurtarma", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await expect(period(page)).toHaveValue("2025-08");
    await page.setViewportSize({ width: 680, height: 720 });
    await expect(nav.getByRole("button", { name: "Rapor ve Excel", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("Option B visual evidence covers desktop, narrow and forced colors", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-option-b-visual-"));
  const packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  const directory = "test-results/option-b-evidence";
  await mkdir(directory, { recursive: true });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.getByRole("heading", { name: "Kâr tahmini için veri paketi gerekiyor", exact: true })).toBeVisible();
    await page.screenshot({ path: `${directory}/empty.png` });
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await page.getByRole("button", { name: "Bildirimi kapat" }).click();
    await openReportView(page, "Aylık rapor");
    const indicators = page.getByRole("region", { name: "Aylık göstergeler", exact: true });
    await expect(indicators).toContainText("40,00 ₺");
    await expect(indicators).toContainText("200,00 ₺");
    await page.screenshot({ path: `${directory}/overview-1440.png` });
    for (const [destination, heading, file] of [["Veri ve kaynak", "Satışlar", "sales"], ["Alış belgeleri", "Alışlar ve maliyet", "purchasing"], ["Giderler", "Giderler", "expenses"], ["Aylık rapor", "Raporlar", "reports"]] as const) {
      if (destination === "Giderler") await openSection(page, "Giderler"); else await openReportView(page, destination);
      await expect(page.getByRole("heading", { name: heading, exact: true, level: 1 })).toBeVisible();
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await page.screenshot({ path: `${directory}/${file}.png` });
    }
    await openSettings(page);
    await page.getByText("İçe aktarma geçmişi", { exact: true }).click();
    await expect(page.locator(".import-history")).toContainText("İçe aktarıldı");
    await page.screenshot({ path: `${directory}/settings.png` });
    await page.getByRole("button", { name: "Yedekleme ve kurtarma", exact: true }).click();
    await expect(page.getByText("Yedekleme henüz kurulmadı.", { exact: true })).toBeVisible();
    await page.screenshot({ path: `${directory}/recovery.png` });
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await openReportView(page, "Aylık rapor");
    await expect(indicators).toContainText("40,00 ₺");
    await expect(indicators).toContainText("200,00 ₺");
    for (const width of [680, 453]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `${directory}/overview-${width}.png`, fullPage: true });
    }
    await page.emulateMedia({ forcedColors: "active" });
    await page.screenshot({ path: `${directory}/forced-colors.png`, fullPage: true });
    await writeFile(`${directory}/environment.json`, JSON.stringify(await app.evaluate(({ app, screen }) => ({ packaged: app.isPackaged, platform: process.platform, electron: process.versions.electron, node: process.versions.node, display: screen.getPrimaryDisplay() })), null, 2));
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
