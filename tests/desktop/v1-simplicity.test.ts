import { openWorkspace } from "../helpers/desktop-navigation";
// Routes are the four sections, the three Rapor ve Excel views and Ayarlar (#103/#105), all entered by keyboard.
// Rapor ve Excel hosts the older workspaces, which keep their own h1 under the page h1 until #107.
import { executablePath } from "../helpers/desktop-executable";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";
import { writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";


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
      const page = await app.firstWindow();await openWorkspace(page);
      const errors: string[] = [];
      page.on("pageerror", error => errors.push(error.message));
      const canvases: Record<string, number> = {};
      const nav = page.getByRole("navigation", { name: "Ana gezinme" }), views = page.getByRole("navigation", { name: "Rapor bölümleri" });
      const routes: [string, string, string?][] = [["Bu ay", "Bu ay"], ["Ürünler", "Ürünler"], ["Veri ve kaynak", "Rapor ve Excel", "Veri ve kaynak"], ["Alış belgeleri", "Rapor ve Excel", "Alış belgeleri"], ["Giderler", "Giderler"], ["Aylık rapor", "Rapor ve Excel", "Aylık rapor"], ["Ayarlar", "Ayarlar"]];
      for (const [name, section, view] of routes) {
        if (section === "Ayarlar") await page.getByRole("button", { name: "Ayarlar", exact: true }).press("Enter");
        else await nav.getByRole("button", { name: section, exact: true }).press("Enter");
        if (view) await views.getByRole("button", { name: view, exact: true }).press("Enter");
        if (view) {
          await expect(page.locator(".workspace-content h1:visible").first()).toHaveText("Rapor ve Excel");
          await expect(page.locator("h1:visible")).toHaveCount(2);
        } else await expect(page.locator("h1:visible")).toHaveCount(1);
        await page.evaluate(() => document.fonts.ready);
        for (const width of [1440, 1120, 680, 390]) {
          await page.setViewportSize({ width, height: 1000 });
          expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
          if (capture) await page.screenshot({ path: join(capture, `${mode}-${name}-${width}.png`), fullPage: true });
        }
        canvases[name] = await page.locator("canvas:visible").count();
        await page.setViewportSize({ width: 1440, height: 1000 });
      }
      await nav.getByRole("button", { name: "Giderler", exact: true }).press("Enter");
      await page.getByRole("button", { name: "Excel’den aktar", exact: true }).press("Enter");
      await expect(page.getByRole("button", { name: "Excel seç", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).press("Enter");
      await page.getByRole("button", { name: "Giderlerin eksiksizliğini incele", exact: true }).press("Enter");
      await expect(page.getByRole("checkbox")).toBeVisible();
      await nav.getByRole("button", { name: "Rapor ve Excel", exact: true }).press("Enter");
      if (mode === "financial") {
        await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("40,00 ₺");
        await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("%50");
      } else {
        await views.getByRole("button", { name: "Veri ve kaynak", exact: true }).press("Enter");
        await expect(page.getByRole("region", { name: "Kaynak kayıt göstergeleri" })).toContainText("Belge kaydı");
        await expect(page.getByRole("complementary", { name: "Kaynak kapsamı ve yöntem" })).toContainText("Mali sonuçlar doğrulanmadı");
      }
      await testInfo.attach("decorative-renderer-counts", { body: JSON.stringify(canvases), contentType: "application/json" });
      expect(errors).toEqual([]);
      expect(canvases).toEqual({ "Bu ay": 0, "Ürünler": 0, "Veri ve kaynak": 0, "Alış belgeleri": 0, "Giderler": 0, "Aylık rapor": 0, "Ayarlar": 0 });
    } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
  });
}
