import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { richBusinessPackage, seedRichExpenses } from "../helpers/rich-business-fixture";
import { richEstimatePackage } from "../helpers/rich-estimate-fixture";
import { executablePath } from "../helpers/desktop-executable";

const routes = ["Özet", "Satışlar", "Alışlar ve maliyet", "Giderler", "Raporlar"];
const sizes = [
  { name: "wide", width: 1440, height: 900, zoom: 1 },
  { name: "narrow", width: 680, height: 800, zoom: 1 },
  { name: "zoom200", width: 1440, height: 1000, zoom: 2 },
];

for (const source of [false, true]) test(`owner workspace renders ${source ? "source" : "financial"} routes with keyboard and zoom`, async ({}, testInfo) => {
  test.setTimeout(120_000);
  const userData = await mkdtemp(join(tmpdir(), "esmer-owner-workspace-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try {
    store.importPackage(richBusinessPackage());
    seedRichExpenses(store);
    if (source) store.importSourcePreview(richEstimatePackage());
  } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  const output = process.env.ESMER_CAPTURE_OWNER
    ? resolve(process.env.ESMER_CAPTURE_OWNER, source ? "source" : "financial")
    : testInfo.outputPath("screenshots");
  await mkdir(output, { recursive: true });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const size of sizes) {
      await app.evaluate(({ BrowserWindow }, size) => {
        const window = BrowserWindow.getAllWindows()[0];
        window.setContentSize(size.width, size.height);
        window.webContents.setZoomFactor(size.zoom);
      }, size);
      if (await page.getByRole("button", { name: "Karşılama", exact: true }).isVisible()) {
        await page.getByRole("button", { name: "Karşılama", exact: true }).click();
      }
      await expect(page.getByRole("heading", { name: "Marketinize bir bütün olarak bakın." })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
      await page.screenshot({ path: join(output, `welcome-${size.name}.png`), fullPage: true });
      await page.getByRole("button", { name: "Özeti aç", exact: true }).click();
      await page.getByLabel("Dönem", { exact: true }).fill(source ? "2025-10" : "2025-09");
      for (const name of routes) {
        await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name, exact: true }).click();
        await expect(page.locator(".workspace-content h1:visible").first()).toBeVisible();
        await expect(page.locator('[aria-busy="true"]:visible')).toHaveCount(0);
        await expect(page.getByText(/yükleniyor|hesaplanıyor/i).filter({ visible: true })).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
        await expect(page.locator(".workspace")).toHaveCSS("background-color", "rgb(247, 245, 237)");
        await page.getByRole("button", { name: "İçeriğe geç", exact: true }).focus();
        await page.keyboard.press("Enter");
        await expect(page.locator(".app-body")).toBeFocused();
        await page.keyboard.press("Tab");
        expect(await page.evaluate(() => document.activeElement?.closest(".app-body") !== null)).toBe(true);
        if (source && name === "Özet") {
          await expect(page.getByText("katkıya dahil değil — sonucu yüksek gösterebilir", { exact: true })).toBeVisible();
        }
        await page.screenshot({ path: join(output, `${name}-${size.name}.png`), fullPage: true });
      }
      await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Ayarlar", exact: true, level: 1 })).toBeVisible();
      await expect(page.getByRole("radio", { name: "Normal", exact: true })).toBeEnabled();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
      await page.screenshot({ path: join(output, `settings-${size.name}.png`), fullPage: true });
      await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(page.getByRole("button", { name: "Özet", exact: true })).toHaveCSS("transition-duration", "0s");
    await page.getByRole("button", { name: "Özet", exact: true }).click();
    if (!source) {
      const metric = page.locator(".c-matrix > button").first();
      await metric.focus();
      await expect(metric).toBeFocused();
      await expect(metric).toHaveCSS("outline-offset", "-3px");
      await page.screenshot({ path: join(output, "metric-keyboard-focus.png"), fullPage: true });
    }
    await page.emulateMedia({ forcedColors: "active" });
    await page.screenshot({ path: join(output, "forced-colors.png"), fullPage: true });
    expect(errors).toEqual([]);
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});
