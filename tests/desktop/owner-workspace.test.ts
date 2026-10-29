import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { richBusinessPackage, seedRichExpenses } from "../helpers/rich-business-fixture";
import { richEstimatePackage } from "../helpers/rich-estimate-fixture";
import { executablePath } from "../helpers/desktop-executable";
import { openSection, openWorkspace } from "../helpers/desktop-navigation";

// Welcome and the Özet desks were removed (#103/#105): routes are the four sections.
type Route = { name: string; nav: "Bu ay" | "Ürünler" | "Giderler" | "Rapor ve Excel" };
const routes: Route[] = [
  { name: "bu-ay", nav: "Bu ay" },
  { name: "urunler", nav: "Ürünler" },
  { name: "giderler", nav: "Giderler" },
  { name: "rapor-ve-excel", nav: "Rapor ve Excel" },
];
const sizes = [
  { name: "wide", width: 1440, height: 900, zoom: 1 },
  { name: "narrow", width: 680, height: 800, zoom: 1 },
  { name: "zoom200", width: 1440, height: 1000, zoom: 2 },
];

for (const source of [true]) test(`owner workspace renders ${source ? "source" : "financial"} routes with keyboard and zoom`, async ({}, testInfo) => {
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
    const capture = async (name: string, zoom: number) => {
      if (zoom === 2) {
        const png = await app.evaluate(async ({ BrowserWindow }) =>
          (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString("base64"));
        await writeFile(join(output, `${name}-native.png`), Buffer.from(png, "base64"));
      } else {
        await page.screenshot({ path: join(output, `${name}.png`), fullPage: true, animations: "disabled" });
      }
    };
    for (const size of sizes) {
      await app.evaluate(({ BrowserWindow }, size) => {
        const window = BrowserWindow.getAllWindows()[0];
        window.setContentSize(size.width, size.height);
        window.webContents.setZoomFactor(size.zoom);
      }, size);
      await openWorkspace(page);
      await openSection(page, "Bu ay");
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator(".workspace-content h1:visible").first()).toBeVisible();
      await expect(page.locator('[aria-busy="true"]:visible')).toHaveCount(0);
      await expect(page.getByText(/yükleniyor|hesaplanıyor/i).filter({ visible: true })).toHaveCount(0);
      await expect(page.getByRole("textbox", { name: "Dönem", exact: true })).toHaveValue(source ? "2025-10" : "2025-09");
      for (const { name, nav } of routes) {
        await openSection(page, nav);
        await expect(page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: nav, exact: true })).toHaveAttribute("aria-current", "page");
        await expect(page.locator(".workspace-content h1:visible").first()).toBeVisible();
        await expect(page.locator("h1:visible")).toHaveCount(1);
        await expect(page.locator("canvas:visible")).toHaveCount(0);
        await expect(page.locator('[aria-busy="true"]:visible')).toHaveCount(0);
        await expect(page.getByText(/yükleniyor|hesaplanıyor/i).filter({ visible: true })).toHaveCount(0);
        await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
        await expect(page.locator(".workspace")).toHaveCSS("background-color", "rgb(245, 247, 250)");
        await page.getByRole("button", { name: "İçeriğe geç", exact: true }).focus();
        await page.keyboard.press("Enter");
        await expect(page.locator(".app-body")).toBeFocused();
        await page.keyboard.press("Tab");
        expect(await page.evaluate(() => document.activeElement?.closest(".app-body") !== null)).toBe(true);
        await capture(`${name}-${size.name}`, size.zoom);
      }
      await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Ayarlar", exact: true, level: 1 })).toBeVisible();
      await expect(page.getByRole("radio", { name: "Normal", exact: true })).toBeEnabled();
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
      await capture(`settings-${size.name}`, size.zoom);
      await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
    }
    await page.emulateMedia({ reducedMotion: "reduce" });
    const home = page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Bu ay", exact: true });
    await expect(home).toHaveCSS("transition-duration", "0s");
    await home.click();
    await home.focus();
    await page.keyboard.press("Tab");
    await page.keyboard.press("Shift+Tab");
    await expect(home).toBeFocused();
    await capture("nav-keyboard-focus", 2);
    await page.emulateMedia({ forcedColors: "active" });
    await capture("forced-colors", 2);
    expect(errors).toEqual([]);
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});
