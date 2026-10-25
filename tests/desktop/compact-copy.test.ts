import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "../helpers/desktop-executable";
import {openReportView, openSection, openSettings, openWorkspace } from "../helpers/desktop-navigation";
// The Özet desks were removed (#103): source counts live in Rapor ve Excel › Veri ve kaynak, financial coverage in Aylık rapor.
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";
import { writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";

for (const mode of ["financial", "source"] as const) {
  test(`compact ${mode} copy keeps actions and financial qualifications`, async ({}, testInfo) => {
    test.skip(true, "old UI, removed in P5");
    const userData = await mkdtemp(join(tmpdir(), `esmer-compact-${mode}-`));
    const store = openStore(join(userData, "analytics.sqlite"));
    try {
      expect(store.importPackage(businessPackage()).status).toBe("active");
      if (mode === "source") expect(store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:compact-copy", "compact-copy-source")).status).toBe("preview-imported");
    } finally { store.close(); }
    const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    try {
      const page = await app.firstWindow();await openWorkspace(page);
      if (mode === "source") {
        await openReportView(page, "Veri ve kaynak");
        const indicators = page.getByRole("region", { name: "Kaynak kayıt göstergeleri" });
        await expect(indicators).toContainText("Tüm durum ve türler");
        await expect(indicators.getByRole("button", { name: /Belge kaydı/ })).toContainText("1");
        await expect(page.getByRole("complementary", { name: "Kaynak kapsamı ve yöntem" })).toContainText("Mali sonuçlar doğrulanmadı");
        await expect(indicators).not.toContainText("Kayıtları aç");
        await indicators.getByRole("button", { name: /Belge kaydı/ }).click();
        await expect(page.getByRole("button", { name: "1", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "Ürün kimliklerini göster", exact: true })).toBeVisible();
        await expect(page.locator(".source-results-toolbar")).not.toContainText("belge kaydı");
        await openReportView(page, "Aylık rapor");
        await expect(page.getByRole("region", {name: "Kaynak tahmini"})).toContainText("maliyet adayı içeren veri paketi seçin");
        await page.getByRole("button", {name: "Önceki kaydedilmiş raporlar", exact: true}).click();
        await expect(page.locator(".report-workspace")).toContainText("kendi kaynak sürümlerine aittir");
        await expect(page.locator(".report-workspace")).toContainText("buradan yeni mali rapor oluşturulamaz");
      } else {
        await openReportView(page, "Aylık rapor");
        await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true }).locator("dt", { hasText: "Maliyet kapsamı (mutlak net tutar)" }).locator("xpath=following-sibling::dd[1]")).toHaveText("%50");
        const selected = page.getByRole("region", { name: "Seçili rapor", exact: true });
        await expect(selected).toContainText("30.09.2025");
        await expect(selected).not.toContainText("Seçili veri sonu");
        await expect(selected.getByRole("button", { name: "Seçili aylık raporu Excel'e aktar", exact: true })).toBeVisible();
        await selected.getByText("Veri ve hesaplama ayrıntıları", { exact: true }).click();
        await expect(selected).toContainText("business-fixture");
        await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("gider verileri eksik");
      }
      await openSection(page, "Giderler");
      await expect(page.getByText("Kayıt bulunmaması, gider olmadığı anlamına gelmez.", { exact: true })).toBeVisible();
      await page.locator("#expense-manual").click();
      await expect(page.getByLabel("Gider tarihi", { exact: true })).toBeVisible();
      await expect(page.getByLabel("KDV tutarı (TRY)", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
      await openSettings(page);
      await expect(page.getByRole("region", { name: "Etkin veriler", exact: true })).toContainText("Sentetik veri gerçek market verisi değildir.");
      await expect(page.getByRole("radio", { name: "Normal", exact: true })).toBeVisible();
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: testInfo.outputPath(`${mode}-settings-${width}.png`), fullPage: true });
      }
    } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
  });
}
