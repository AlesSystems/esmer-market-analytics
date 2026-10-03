import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { salesPackage, journeyRecords } from "../helpers/sales-fixtures";
import { writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

for (const mode of ["financial", "source"] as const) {
  test(`packaged ${mode} Sales desk preserves real data and provides receipt navigation`, async ({}, testInfo) => {
    const captureDir = process.env.ESMER_CAPTURE_EVIDENCE ? "workstreams/page-control-desks/sales" : testInfo.outputPath("screenshots");
    await mkdir(captureDir, { recursive: true });
    const userData = await mkdtemp(join(tmpdir(), `sales-desk-${mode}-`));
    const store = openStore(join(userData, "analytics.sqlite"));
    try {
      if (mode === "financial") expect(store.importPackage(salesPackage(journeyRecords())).status).toBe("active");
      else store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:sales-desk", "sales-desk-source"));
    } finally { store.close(); }
    const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    try {
      const page = await app.firstWindow();
      await page.addInitScript(() => {
        const counters = { calls: 0, triangles: 0 };
        Object.assign(window, { salesDraws: counters });
        for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
          for (const method of ["drawElements", "drawArrays"] as const) {
            const original = prototype[method];
            Object.defineProperty(prototype, method, { value: function (...args: number[]) {
              counters.calls++;
              counters.triangles += (method === "drawElements" ? args[1] : args[2]) / 3;
              return Reflect.apply(original, this, args);
            } });
          }
        }
      });
      await page.reload();
      if (mode === "source") {
        const summary = page.getByText("Kaynak ve kapsam ayrıntıları", { exact: true });
        await expect(summary).toBeVisible();
        await page.getByRole("button", { name: "Ayarlar", exact: true }).focus();
        await page.keyboard.press("Tab");
        await expect(summary).toBeFocused();
        await page.keyboard.press("Enter");
        await expect(summary.locator("..")).toHaveAttribute("open", "");
        await page.keyboard.press("Enter");
      }
      await page.getByRole("button", { name: "Satışlar", exact: true }).click();
      await expect(page.getByRole("heading", { name: mode === "financial" ? "Satış Özeti" : "Satışlar", exact: true })).toBeVisible();
      if (mode === "financial") await expect(page.locator(".metric").first()).toContainText("365,00 ₺");
      else await expect(page.getByRole("cell", { name: "123,4567890123456789", exact: true })).toBeVisible();
      await mkdir("work/page-implementation/sales", { recursive: true });
      await page.evaluate(() => document.fonts.ready);
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.screenshot({ path: `work/page-implementation/sales/${mode}-${process.env.SALES_CAPTURE_BASELINE ? "before" : "after"}-${width}.png`, fullPage: true });
        if (!process.env.SALES_CAPTURE_BASELINE) await page.screenshot({ path: `${captureDir}/${mode}-${width}.png`, fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      if (process.env.SALES_CAPTURE_BASELINE) return;
      const desk = page.locator(".sales-control-desk");
      await expect(desk).toBeVisible();
      const rail = page.getByRole("complementary", { name: "Satış kapsamı ve kanıt" });
      await expect(rail.locator("canvas")).toBeVisible();
      await expect(rail.getByText("3D nesne tutar veya oran göstermez.", { exact: true })).toBeVisible();
      const sceneBox = await rail.locator("canvas").boundingBox();
      if (!sceneBox) throw Error("Receipt scene has no bounds");
      await page.mouse.click(sceneBox.x + sceneBox.width / 2, sceneBox.y + sceneBox.height / 2 - 18);
      if (mode === "financial") await expect(page.getByRole("heading", { name: "İşlemler", exact: true })).toBeVisible();
      else await expect(page.getByRole("button", { name: "1", exact: true })).toBeVisible();
      await page.emulateMedia({ reducedMotion: "reduce" });
      await rail.getByRole("button", { name: "Kaynak ve yöntemi incele", exact: true }).press("Enter");
      await expect(rail.getByRole("button", { name: "Kaynak ve yöntemi incele", exact: true })).toHaveAttribute("aria-pressed", "true");
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await page.waitForTimeout(250);
      const draws = await page.evaluate(() => ({ ...(window as unknown as { salesDraws: { calls: number; triangles: number } }).salesDraws }));
      await page.waitForTimeout(350);
      expect(await page.evaluate(() => (window as unknown as { salesDraws: { calls: number } }).salesDraws.calls)).toBe(draws.calls);
      const canvas = rail.locator("canvas");
      await canvas.evaluate(node => {
        const gl = (node as HTMLCanvasElement).getContext("webgl2");
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
      });
      await expect(rail.getByText("Görünüm kullanılamıyor", { exact: true })).toBeVisible();
      await expect(rail.getByRole("button", { name: "Kaynak ve yöntemi incele", exact: true })).toHaveAttribute("aria-pressed", "true");
      await rail.getByRole("button", { name: "3D’yi yeniden dene", exact: true }).click();
      await expect(rail.locator("canvas")).toBeVisible();
      await page.waitForTimeout(250);
      await page.evaluate(() => { const counters = (window as unknown as { salesDraws: { calls: number; triangles: number } }).salesDraws; counters.calls = 0; counters.triangles = 0; });
      await page.setViewportSize({ width: 1439, height: 1000 });
      await page.waitForTimeout(100);
      const render = await page.evaluate(() => ({ ...(window as unknown as { salesDraws: { calls: number; triangles: number } }).salesDraws }));
      expect(render.calls).toBeGreaterThan(0);
      expect(render.calls).toBeLessThanOrEqual(24);
      expect(render.triangles).toBeLessThanOrEqual(4000);
      await writeFile(`work/page-implementation/sales/${mode}-renderer.json`, JSON.stringify({ mode, idleDrawCalls: 0, render }, null, 2));
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await page.screenshot({ path: `${captureDir}/${mode}-recovery-${width}.png`, fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      if (mode === "financial") {
        await rail.getByRole("button", { name: "Müşteri iadelerini incele", exact: true }).press("Enter");
        await expect(page.getByRole("button", { name: "R001", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "S002", exact: true })).toHaveCount(0);
      } else {
        await rail.getByRole("button", { name: "Ürün kayıtlarını incele", exact: true }).press("Enter");
        await expect(page.getByRole("button", { name: "3", exact: true })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Net satış", exact: true })).toHaveCount(0);
        await page.getByRole("button", { name: "Belgeleri göster", exact: true }).click();
        await expect(rail.getByRole("button", { name: "Belge kayıtlarını incele", exact: true })).toHaveAttribute("aria-pressed", "true");
        await expect(rail.getByRole("button", { name: "Ürün kayıtlarını incele", exact: true })).toHaveAttribute("aria-pressed", "false");
      }
    } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
  });
}


test("packaged Sales task controls remain useful when WebGL is unavailable", async ({}, testInfo) => {
  const captureDir = process.env.ESMER_CAPTURE_EVIDENCE ? "workstreams/page-control-desks/sales" : testInfo.outputPath("screenshots");
  await mkdir(captureDir, { recursive: true });
  const userData = await mkdtemp(join(tmpdir(), "sales-desk-unavailable-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importPackage(salesPackage(journeyRecords())); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: function (type: string, ...args: unknown[]) {
        return type.startsWith("webgl") ? null : Reflect.apply(getContext, this, [type, ...args]);
      } });
    });
    await page.reload();
    await page.getByRole("button", { name: "Satışlar", exact: true }).click();
    const rail = page.getByRole("complementary", { name: "Satış kapsamı ve kanıt" });
    await expect(rail.getByText("Görünüm kullanılamıyor", { exact: true })).toBeVisible();
    await rail.getByRole("button", { name: "Müşteri iadelerini incele", exact: true }).press("Enter");
    await expect(page.getByRole("button", { name: "R001", exact: true })).toBeVisible();
    await rail.getByRole("button", { name: "3D’yi yeniden dene", exact: true }).click();
    await expect(rail.getByText("Görünüm kullanılamıyor", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Satışlar", exact: true }).click();
    await page.getByLabel("Ürün ara", { exact: true }).pressSequentially("İÇME");
    await expect(page.getByLabel("Ürün ara", { exact: true })).toHaveValue("İÇME");
    await expect(page.getByRole("button", { name: "İçme suyu", exact: true })).toBeVisible();
    await page.screenshot({ path: `${captureDir}/unavailable.png`, fullPage: true });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
