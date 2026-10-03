import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("Kontrol masası presents the pinned month with real navigation and offline branding", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-control-desk-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage()).status).toBe("active"); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await expect(page.getByRole("heading", { name: "Ay bir bakışta", exact: true })).toBeVisible();
    const matrix = page.getByRole("region", { name: "Aylık performans", exact: true });
    await expect(matrix).toContainText("200,00 ₺");
    await expect(matrix).toContainText("60,00 ₺");
    await expect(matrix).toContainText("40,00 ₺");
    await expect(matrix).toContainText("Hesaplanamıyor");
    await expect(matrix).toContainText("Karşılaştırılamıyor");
    await expect(page.getByRole("complementary", { name: "Veri kapsamı ve yöntem" })).toContainText("%50");
    const logo = page.getByRole("img", { name: "Esmer Market", exact: true });
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBe(459);
    expect(await logo.getAttribute("src")).not.toMatch(/^https?:/);
    await expect(page.getByRole("img", { name: "Günlük net satış grafiği", exact: true })).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: testInfo.outputPath("control-desk-desktop.png"), fullPage: true });
    await matrix.getByRole("button", { name: /Net satış/ }).press("Enter");
    await expect(page.getByRole("heading", { name: "Satış Özeti", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Özet", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ay bir bakışta", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Giderler", exact: true }).first().click();
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Özet", exact: true }).click();
    for (const width of [680, 390]) {
      await page.setViewportSize({ width, height: 900 });
      await expect(page.getByRole("heading", { name: "Ay bir bakışta", exact: true })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`control-desk-${width}.png`), fullPage: true });
    }
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
