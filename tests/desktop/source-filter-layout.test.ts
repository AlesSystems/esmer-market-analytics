import { test, expect, _electron as electron } from "@playwright/test";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";
import { executablePath } from "../helpers/desktop-executable";

test("source filters keep fields stable and actions grouped when expanded at desktop widths", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "source-filter-layout-"));
  const snapshot = rawSnapshot();
  snapshot.headers.push({ ...snapshot.headers[0], ID: "4", FIS_TURU: "1" });
  snapshot.lines.push({ ...snapshot.lines[0], ID: "5", FIS: "4", FIS_TURU: "1" });
  const store = openStore(join(userData, "analytics.sqlite"));
  store.importSourcePreview(writeRawPackage(snapshot, "fixture:filter-layout", "filter-layout-v1"));
  store.close();
  const captureDir = process.env.ESMER_FILTER_CAPTURE ?? testInfo.outputPath("screenshots");
  await mkdir(captureDir, { recursive: true });
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
    for (const destination of ["Satışlar", "Alışlar ve maliyet"]) {
      await page.getByRole("button", { name: destination, exact: true }).click();
      await expect(page.getByRole("heading", { name: destination, exact: true })).toBeVisible();
      for (const width of [1440, 1120, 680, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        const scope = page.getByLabel("Kayıt kapsamı");
        const type = page.getByLabel("Belge türü (kaynak kodu)");
        const collapsedScope = await scope.boundingBox();
        const collapsedType = await type.boundingBox();
        await page.getByText("Gelişmiş filtreler", { exact: true }).click();
        const product = page.getByLabel("Ürün kayıt ID’si", { exact: true });
        await expect(product).toBeVisible();
        await scope.scrollIntoViewIfNeeded();
        await page.screenshot({ path: join(captureDir, `${destination === "Satışlar" ? "sales" : "purchasing"}-${width}.png`), fullPage: true });
        const expandedScope = await scope.boundingBox();
        const expandedType = await type.boundingBox();
        expect(collapsedScope).not.toBeNull();
        expect(collapsedType).not.toBeNull();
        expect(expandedScope).not.toBeNull();
        expect(expandedType).not.toBeNull();
        const positions = await page.evaluate(() => {
          const labels = Array.from(document.querySelectorAll("label"));
          const bounds = (text: string) => labels.find(label => label.textContent?.startsWith(text))!.getBoundingClientRect();
          const scope = bounds("Kayıt kapsamı"), type = bounds("Belge türü (kaynak kodu)");
          const summary = Array.from(document.querySelectorAll("summary")).find(node => node.textContent === "Gelişmiş filtreler")!.getBoundingClientRect();
          const helper = Array.from(document.querySelectorAll("p")).find(node => node.textContent === "Bu yedekte ürün adı yok.")!.getBoundingClientRect();
          const buttons = Array.from(document.querySelectorAll("button")).filter(node => ["Filtreleri uygula", "Filtreleri temizle", "Ürün kimliklerini göster", "Belgeleri göster"].includes(node.textContent!));
          return { fieldsBottom: Math.max(scope.bottom, type.bottom), summaryTop: summary.top, helperBottom: helper.bottom, actionTop: Math.min(...buttons.map(button => button.getBoundingClientRect().top)), overflow: document.documentElement.scrollWidth > window.innerWidth };
        });
        expect(positions.summaryTop, "advanced filters follow both main fields").toBeGreaterThanOrEqual(positions.fieldsBottom);
        expect(positions.actionTop, "actions follow the expanded field and hint").toBeGreaterThanOrEqual(positions.helperBottom);
        expect(positions.overflow, "filter layout does not widen the page").toBe(false);
        expect(expandedScope!.width).toBeCloseTo(collapsedScope!.width, 0);
        expect(expandedType!.width).toBeCloseTo(collapsedType!.width, 0);
        await page.getByText("Gelişmiş filtreler", { exact: true }).click();
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      await page.getByText("Gelişmiş filtreler", { exact: true }).click();
      const product = page.getByLabel("Ürün kayıt ID’si", { exact: true });
      await product.fill("invalid");
      await expect(page.getByRole("button", { name: "Filtreleri uygula", exact: true })).toBeDisabled();
      await product.fill("999");
      await page.getByRole("button", { name: "Filtreleri uygula", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "Eşleşen kayıt yok" }).first()).toBeVisible();
      await page.getByRole("button", { name: "Filtreleri temizle", exact: true }).click();
      await expect(page.getByRole("status").filter({ hasText: "1–1 / 1" }).first()).toBeVisible();
      await page.getByRole("button", { name: "Ürün kimliklerini göster", exact: true }).click();
      await expect(page.getByRole("button", { name: "3", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Belgeleri göster", exact: true }).click();
    }
  } finally {
    await app.close();
    await rm(userData, { recursive: true, force: true });
  }
});
