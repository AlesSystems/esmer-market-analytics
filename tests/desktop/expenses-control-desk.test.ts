import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const executablePath = process.env.ESMER_EXECUTABLE ?? resolve("release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics");
test("month folio selects existing tasks and preserves the review draft", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-desk-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await page.addInitScript(() => {
      const counts = { calls: 0, triangles: 0, total: 0 };
      Object.assign(window, { expenseDraws: counts });
      for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
        const clear = prototype.clear;
        Object.defineProperty(prototype, "clear", { value: function (...args: number[]) { counts.calls = 0; counts.triangles = 0; return Reflect.apply(clear, this, args); } });
        for (const method of ["drawElements", "drawArrays"] as const) {
          const original = prototype[method];
          Object.defineProperty(prototype, method, { value: function (...args: number[]) { counts.calls++; counts.total++; counts.triangles += (method === "drawElements" ? args[1] : args[2]) / 3; return Reflect.apply(original, this, args); } });
        }
      }
    });
    await page.reload();
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ayı tamamlamak için" })).toBeVisible();
    await expect(page.locator('[data-scene="standing-month-folio"]')).toBeVisible();
    const initialCanvas = page.locator(".expense-folio canvas");
    await expect(initialCanvas).toBeVisible();
    await expect(page.getByText("3D görünüm hazırlanıyor…", { exact: true })).toHaveCount(0);
    await page.waitForTimeout(150);
    const tabBounds = await initialCanvas.boundingBox();
    if (!tabBounds) throw Error("Folio missing");
    const { OrthographicCamera, Vector3, Matrix4, Euler } = await import("three");
    const camera = new OrthographicCamera(-tabBounds.width / 2, tabBounds.width / 2, tabBounds.height / 2, -tabBounds.height / 2, .1, 1000);
    camera.position.set(2.1, 1.2, 6); camera.zoom = 65; camera.lookAt(0, 0, 0); camera.updateMatrixWorld(); camera.updateProjectionMatrix();
    const tab = new Vector3(.98, .08, .02).applyMatrix4(new Matrix4().makeRotationFromEuler(new Euler(0, -.12, -.04))).project(camera);
    await page.mouse.click(tabBounds.x + (tab.x + 1) * tabBounds.width / 2, tabBounds.y + (1 - tab.y) * tabBounds.height / 2);
    await expect(page.getByRole("button", { name: "Excel hazırlığı", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("button", { name: "Excel seç", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
    await expect(page.getByRole("button", { name: "Excel hazırlığı", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Excel hazırlığı", exact: true }).press("Enter");
    await page.getByRole("button", { name: "Tamlık incelemesi", exact: true }).click();
    await page.getByLabel("İnceleme açıklaması").fill("Ay sonu incelemesi");
    await page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum").check();
    await page.getByRole("button", { name: "Tamlık incelemesi", exact: true }).click();
    await expect(page.getByLabel("İnceleme açıklaması")).toHaveValue("Ay sonu incelemesi");
    await expect(page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum")).toBeChecked();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.getByRole("button", { name: "Tamlık incelemesi", exact: true }).press("Enter");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const canvas = page.locator(".expense-folio canvas");
    await canvas.evaluate(node => (node as HTMLCanvasElement).getContext("webgl2")?.getExtension("WEBGL_lose_context")?.loseContext());
    await expect(page.getByText("Görünüm kullanılamıyor", { exact: true })).toBeVisible();
    await expect(page.getByLabel("İnceleme açıklaması")).toHaveValue("Ay sonu incelemesi");
    await page.getByRole("button", { name: "3D’yi yeniden dene" }).click();
    await expect(canvas).toBeVisible();
    await expect(page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum")).toBeChecked();
    const capture = async (name: string) => {
      const path = process.env.ESMER_CAPTURE_EVIDENCE === "1" ? `workstreams/page-control-desks/expenses/${name}.png` : testInfo.outputPath(`${name}.png`);
      if (process.env.ESMER_CAPTURE_EVIDENCE === "1") await mkdir("workstreams/page-control-desks/expenses", { recursive: true });
      await page.screenshot({ path, fullPage: true });
    };
    await capture("expenses-review");
    await page.getByRole("button", { name: "Kayıtlar", exact: true }).click();
    const box = await canvas.boundingBox();
    if (!box) throw Error("Folio missing");
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
    await expect(page.getByRole("button", { name: "Kayıtlar", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(250);
    const counts = await page.evaluate(() => ({ ...(window as unknown as { expenseDraws: { calls: number; triangles: number; total: number } }).expenseDraws }));
    expect(counts.calls).toBeGreaterThan(0); expect(counts.calls).toBeLessThanOrEqual(24); expect(counts.triangles).toBeLessThanOrEqual(4000);
    await page.waitForTimeout(350);
    expect(await page.evaluate(() => (window as unknown as { expenseDraws: { total: number } }).expenseDraws.total)).toBe(counts.total);
    if (process.env.ESMER_CAPTURE_EVIDENCE === "1") await writeFile("workstreams/page-control-desks/expenses/renderer.json", JSON.stringify({ ...counts, idleDrawCalls: 0 }, null, 2));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await capture("expenses-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture("expenses-narrow");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("expense tasks remain usable without WebGL", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-fallback-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await page.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { value: function (type: string, ...args: unknown[]) { return type.startsWith("webgl") ? null : Reflect.apply(original, this, [type, ...args]); } });
    });
    await page.reload(); await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByText("Görünüm kullanılamıyor", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Excel hazırlığı", exact: true }).press("Enter");
    await expect(page.getByRole("button", { name: "Excel seç", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "3D’yi yeniden dene" }).click();
    await expect(page.getByText("Görünüm kullanılamıyor", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tamlık incelemesi", exact: true }).press("Enter");
    await expect(page.getByRole("button", { name: "Eksiksizliği onayla", exact: true })).toBeDisabled();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("recorded-source expenses embed one main and keep the folio task draft", async () => {
  const { openStore } = await import("../../src/store/store");
  const { writeRawPackage } = await import("../../src/source/raw-package");
  const { rawSnapshot } = await import("../helpers/raw-fixture");
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-source-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:expense-desk", "expense-desk-source")); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { name: "Ayı tamamlamak için" })).toBeVisible();
    await page.getByRole("button", { name: "Tamlık incelemesi", exact: true }).click();
    await page.getByLabel("İnceleme açıklaması").fill("Kaydedilen giderleri kontrol et");
    await page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum").check();
    await page.getByRole("button", { name: "Excel hazırlığı", exact: true }).click();
    await page.getByRole("button", { name: "Tamlık incelemesi", exact: true }).press("Enter");
    await expect(page.getByLabel("İnceleme açıklaması")).toHaveValue("Kaydedilen giderleri kontrol et");
    await expect(page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum")).toBeChecked();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("folio task switches retain preview and explicit duplicate decisions", async () => {
  const { default: writeXlsxFile } = await import("write-excel-file/node");
  const { expenseColumns } = await import("../../src/expenses/template");
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-preview-desk-"));
  const workbookPath = join(userData, "expenses.xlsx");
  const good = ["folio-a", "15.01.2026", "", "Kira", "operating-expense", "50", "0", "50", "non-recoverable", "tax-a", "bill-a", "", "", ""];
  await writeFile(workbookPath, await writeXlsxFile([expenseColumns, good, ["folio-b", ...good.slice(1)]].map(row => row.map(value => ({ type: String, value })))).toBuffer());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await page.getByLabel("Dönem", { exact: true }).fill("2026-01");
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, workbookPath);
    await page.getByRole("button", { name: "Excel hazırlığı", exact: true }).click();
    await page.getByRole("button", { name: "Excel seç", exact: true }).click();
    await page.getByLabel("Satır 3: benzer kayda rağmen ayrı gider olarak ekle").check();
    await page.getByRole("button", { name: "Kayıtlar", exact: true }).click();
    await expect(page.getByText("Bu dönemde gider kaydı yok.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Excel hazırlığı", exact: true }).press("Enter");
    await expect(page.getByLabel("Satır 3: benzer kayda rağmen ayrı gider olarak ekle")).toBeChecked();
    await expect(page.getByRole("button", { name: "İçe aktarmayı onayla", exact: true })).toBeEnabled();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
