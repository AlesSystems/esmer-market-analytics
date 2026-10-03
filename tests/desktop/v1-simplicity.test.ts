import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";
import { writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

for (const mode of ["financial", "source"] as const) {
  test(`v1 ${mode} workspaces keep tasks and evidence without decorative renderers`, async ({}, testInfo) => {
    const userData = await mkdtemp(join(tmpdir(), `esmer-v1-${mode}-`));
    const capture = process.env.ESMER_UI_EVIDENCE_DIR;
    if (capture) await mkdir(capture, { recursive: true });
    const store = openStore(join(userData, "analytics.sqlite"));
    try {
      expect(store.importPackage(businessPackage()).status).toBe("active");
      if (mode === "source") expect(store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:v1-simplicity", "v1-simplicity-source")).status).toBe("preview-imported");
    } finally { store.close(); }
    const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    try {
      const page = await app.firstWindow();
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      const canvases: Record<string, number> = {};
      for (const name of ["Özet", "Satışlar", "Alışlar ve maliyet", "Giderler", "Raporlar", "Ayarlar"]) {
        await page.getByRole("button", { name, exact: true }).first().press("Enter");
        await expect(page.locator("h1:visible")).toHaveCount(1);
        await page.evaluate(() => document.fonts.ready);
        for (const width of [1440, 1120, 680, 390]) {
          await page.setViewportSize({ width, height: 1000 });
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          if (capture) await page.screenshot({ path: join(capture, `${mode}-${name}-${width}.png`), fullPage: true });
        }
        canvases[name] = await page.locator("canvas:visible").count();
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
      await page.getByRole("button", { name: "Giderler", exact: true }).first().press("Enter");
      await page.getByRole("button", { name: "Excel’den gider ekle", exact: true }).press("Enter");
      await expect(page.getByRole("button", { name: "Excel seç", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).press("Enter");
      await page.getByRole("button", { name: "Giderlerin eksiksizliğini incele", exact: true }).press("Enter");
      await expect(page.getByRole("checkbox")).toBeVisible();
      await page.getByRole("button", { name: "Özet", exact: true }).press("Enter");
      if (mode === "financial") {
        await expect(page.getByRole("region", { name: "Aylık performans", exact: true })).toContainText("40,00 ₺");
        await expect(page.getByRole("complementary", { name: "Veri kapsamı ve yöntem" })).toContainText("%50");
      } else {
        await expect(page.getByRole("region", { name: "Kaynak kayıt göstergeleri" })).toContainText("Belge kaydı");
        await expect(page.getByRole("complementary", { name: "Kaynak kapsamı ve yöntem" })).toContainText("Mali sonuçlar doğrulanmadı");
      }
      await testInfo.attach("decorative-renderer-counts", { body: JSON.stringify(canvases), contentType: "application/json" });
      expect(errors).toEqual([]);
      expect(canvases).toEqual({ "Özet": 0, "Satışlar": 0, "Alışlar ve maliyet": 0, "Giderler": 0, "Raporlar": 0, "Ayarlar": 0 });
    } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
  });
}
