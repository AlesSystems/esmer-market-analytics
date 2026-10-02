import { importPackage, openSettings } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { businessPackage } from "../helpers/business-fixtures";

test("sidebar keeps the reporting period through analysis and recovery", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-option-b-"));
  const packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage());
  const app = await electron.launch({ executablePath: process.env.ESMER_EXECUTABLE ?? resolve("release/win-unpacked/Esmer Market Analytics.exe"), args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    const nav = page.getByRole("navigation", { name: "Ana gezinme" });
    await expect(nav.getByRole("button", { name: "Özet", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2025-09");
    await expect(page.getByText("Sentetik veri", { exact: true })).toBeVisible();
    await nav.getByRole("button", { name: "Giderler", exact: true }).click();
    await page.getByLabel("Dönem", { exact: true }).fill("2025-08");
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Giderler", exact: true })).toHaveAttribute("aria-current", "page");
    await openSettings(page);
    await page.getByRole("button", { name: "Yedekleme ve kurtarma", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yedekleme ve kurtarma", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2025-08");
    await page.setViewportSize({ width: 680, height: 720 });
    await expect(nav.getByRole("button", { name: "Raporlar", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("Option B visual evidence covers desktop, narrow and forced colors", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-option-b-visual-"));
  const packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage());
  const app = await electron.launch({ executablePath: process.env.ESMER_EXECUTABLE ?? resolve("release/win-unpacked/Esmer Market Analytics.exe"), args: [`--user-data-dir=${userData}`] });
  const directory = "test-results/option-b-evidence";
  await mkdir(directory, { recursive: true });
  try {
    const page = await app.firstWindow();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await expect(page.getByRole("heading", { name: "Henüz mali rapor verisi yok" })).toBeVisible();
    await page.screenshot({ path: `${directory}/empty.png` });
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await expect(page.locator(".monthly-amount")).toHaveText("40,00 ₺");
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("200,00 ₺");
    await page.getByRole("button", { name: "Bildirimi kapat" }).click();
    await page.screenshot({ path: `${directory}/overview-1440.png` });
    for (const destination of ["Satışlar", "Alışlar ve maliyet", "Giderler", "Raporlar"]) {
      await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: destination, exact: true }).click();
      await expect(page.locator(".workspace h1").first()).toBeVisible();
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await page.screenshot({ path: `${directory}/${destination === "Satışlar" ? "sales" : destination === "Alışlar ve maliyet" ? "purchasing" : destination === "Giderler" ? "expenses" : "reports"}.png` });
    }
    await openSettings(page);
    await page.getByText("İçe aktarma geçmişi", { exact: true }).click();
    await expect(page.locator(".import-history")).toContainText("İçe aktarıldı");
    await page.screenshot({ path: `${directory}/settings.png` });
    await page.getByRole("button", { name: "Yedekleme ve kurtarma", exact: true }).click();
    await expect(page.getByText("Yedekleme henüz kurulmadı.", { exact: true })).toBeVisible();
    await page.screenshot({ path: `${directory}/recovery.png` });
    await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Özet", exact: true }).click();
    await expect(page.locator(".monthly-amount")).toHaveText("40,00 ₺");
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("200,00 ₺");
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
