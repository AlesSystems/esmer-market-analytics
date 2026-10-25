import { openWorkspace, openReportView } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";
import { executablePath } from "../helpers/desktop-executable";

test("source filters keep fields stable and actions grouped when expanded at desktop widths", async ({}, testInfo) => {
    test.skip(true, "old UI, removed in P5");
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
    const page = await app.firstWindow();await openWorkspace(page);
    for (const destination of ["Satışlar", "Alışlar ve maliyet"]) {
      // Satışlar: Veri ve kaynak → all source documents narrowed to sales type codes; Alışlar ve maliyet: Alış belgeleri.
      if (destination === "Satışlar") {
        await openReportView(page, "Veri ve kaynak");
        await page.getByRole("button", { name: "Tüm kaynak belgeleri", exact: true }).click();
        await page.getByLabel("Kayıt kapsamı").selectOption("sales");
      } else await openReportView(page, "Alış belgeleri");
      await expect(page.getByRole("heading", { name: destination, exact: true })).toBeVisible();
      for (const { width, zoom } of [{ width: 1440, zoom: 1 }, { width: 1120, zoom: 1 }, { width: 680, zoom: 1 }, { width: 390, zoom: 1 }, { width: 680, zoom: 1.3 }]) {
        await app.evaluate(({ BrowserWindow }, size) => {
          const window = BrowserWindow.getAllWindows()[0];
          window.setMinimumSize(390, 520);
          window.setContentSize(size.width, 1000);
          window.webContents.setZoomFactor(size.zoom);
        }, { width, zoom });
        await expect.poll(() => page.evaluate(() => window.innerWidth)).toBe(Math.round(width / zoom));
        const disclosure = page.getByText("Gelişmiş filtreler", { exact: true });
        const product = page.getByLabel("Ürün kayıt ID’si", { exact: true });
        if (await product.isVisible()) await disclosure.press("Enter");
        const scope = page.getByLabel("Kayıt kapsamı");
        const type = page.getByLabel("Belge türü (kaynak kodu)");
        const collapsedScope = await scope.evaluate(node => ({ top: node.getBoundingClientRect().top + window.scrollY, width: node.getBoundingClientRect().width }));
        const collapsedType = await type.evaluate(node => ({ top: node.getBoundingClientRect().top + window.scrollY, width: node.getBoundingClientRect().width }));
        await disclosure.focus();
        await disclosure.press("Enter");
        await expect(disclosure).toBeFocused();
        await expect(product).toBeVisible();
        await expect(product).toHaveAccessibleDescription("Bu yedekte ürün adı yok.");
        await scope.scrollIntoViewIfNeeded();
        const expandedScope = await scope.evaluate(node => ({ top: node.getBoundingClientRect().top + window.scrollY, width: node.getBoundingClientRect().width }));
        const expandedType = await type.evaluate(node => ({ top: node.getBoundingClientRect().top + window.scrollY, width: node.getBoundingClientRect().width }));
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
        expect(expandedScope.width).toBeCloseTo(collapsedScope.width, 0);
        expect(expandedType.width).toBeCloseTo(collapsedType.width, 0);
        expect(expandedScope.top, "opening advanced filters keeps the scope field in place").toBeCloseTo(collapsedScope.top, 0);
        expect(expandedType.top, "opening advanced filters keeps the type field in place").toBeCloseTo(collapsedType.top, 0);
        const capturePath = join(captureDir, `${destination === "Satışlar" ? "sales" : "purchasing"}-${width}-${zoom}.png`);
        if (zoom === 1) await page.screenshot({ path: capturePath, fullPage: true });
        else {
          const capture = await app.evaluate(async ({ BrowserWindow }) => (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString("base64"));
          await writeFile(capturePath, Buffer.from(capture, "base64"));
        }
        await page.getByText("Gelişmiş filtreler", { exact: true }).click();
      }
      await app.evaluate(({ BrowserWindow }) => {
        const window = BrowserWindow.getAllWindows()[0];
        window.webContents.setZoomFactor(1);
        window.setContentSize(1440, 1000);
      });
      await page.getByText("Gelişmiş filtreler", { exact: true }).click();
      const product = page.getByLabel("Ürün kayıt ID’si", { exact: true });
      await product.fill("invalid");
      await expect(page.getByRole("button", { name: "Filtreleri uygula", exact: true })).toBeDisabled();
      await product.fill("-9999999999999999999");
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
