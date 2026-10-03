import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { businessPackage, businessRecords, historicalCost } from "../helpers/business-fixtures";

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
    await expect(page.getByRole("group", {name: "Satış, maliyet ve gider katmanları. Tutarları temsil etmeyen 3D gezinme nesnesi.", exact: true})).toBeVisible();
    await expect(page.getByRole("group", {name: "Finansal katman", exact: true})).toBeVisible();
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

test("Kontrol masası keeps financial evidence usable without WebGL", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-control-desk-fallback-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage()).status).toBe("active"); } finally { store.close(); }
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
    await expect(page.getByRole("heading", { name: "Ay bir bakışta", exact: true })).toBeVisible();
    const rail = page.getByRole("complementary", { name: "Veri kapsamı ve yöntem" });
    await expect(rail.getByText("Görünüm kullanılamıyor", { exact: true })).toBeVisible();
    await rail.getByRole("button", { name: "Maliyet katmanı", exact: true }).press("Enter");
    await expect(rail.getByRole("button", { name: "Maliyet katmanı", exact: true })).toHaveAttribute("aria-pressed", "true");
    await expect(rail).toContainText("%50");
    await expect(page.getByRole("region", { name: "Aylık performans", exact: true })).toContainText("40,00 ₺");
    await page.screenshot({ path: testInfo.outputPath("control-desk-no-webgl.png"), fullPage: true });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});


test("large monthly figures fit the desk and 3D context loss preserves selection", async ({}, testInfo) => {
  const records = businessRecords(), fixtureDocument = records.documents[0], line = records.lines[0];
  const categories = ["Süt ve kahvaltılık", "Temel gıda", "İçecekler", "Temizlik ve bakım", "Diğer"];
  records.documents = Array.from({ length: 30 }, (_, index) => {
    const net = index % 2 ? "53240" : "30000";
    return { ...structuredClone(fixtureDocument), id: `D${index}`, date: `2025-09-${String(index + 1).padStart(2, "0")}`, sales: { ...fixtureDocument.sales!, net, tax: "0", gross: net } };
  });
  records.lines = records.documents.map((row, index) => ({ ...structuredClone(line), id: `L${index}`, documentId: row.id, net: row.sales!.net, sales: { ...line.sales!, unitNet: row.sales!.net, taxRate: "0", tax: "0", gross: row.sales!.net, productId: `P${index}`, productName: `Sentetik ürün ${index}`, categoryId: `C${index % 5}`, categoryName: categories[index % 5] }, business: { historicalCost: historicalCost(index % 2 ? "35000" : "20000"), inventory: null } }));
  const userData = await mkdtemp(join(tmpdir(), "esmer-control-desk-large-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(records)).status).toBe("active"); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    const matrix = page.getByRole("region", { name: "Aylık performans", exact: true });
    await expect(matrix).toContainText("1.248.600,00 ₺");
    await expect(matrix).toContainText("825.000,00 ₺");
    await expect(matrix).toContainText("423.600,00 ₺");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('14px "Manrope Variable"', "İıŞşĞğÜüÖöÇç"))).toBe(true);
    for (const width of [1440, 1120, 680, 390]) {
      await page.setViewportSize({ width, height: 1100 });
      expect(await matrix.locator("button > strong").evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`control-desk-large-${width}.png`) });
    }
    await page.setViewportSize({ width: 1440, height: 1100 });
    const rail = page.getByRole("complementary", { name: "Veri kapsamı ve yöntem" });
    await rail.getByRole("button", { name: "Maliyet katmanı", exact: true }).click();
    await expect(rail.getByRole("button", { name: "Maliyet katmanı", exact: true })).toHaveAttribute("aria-pressed", "true");
    const canvas = rail.locator("canvas");
    await canvas.screenshot({ path: testInfo.outputPath("selected-cost-object.png") });
    const bounds = await canvas.boundingBox();
    await canvas.click({ position: { x: bounds!.width / 2, y: bounds!.height * .4 } });
    await expect(rail.getByRole("button", { name: "Satış katmanı", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await rail.locator("canvas").evaluate(canvas => canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true })));
    await expect(rail.getByText("Görünüm kullanılamıyor", { exact: true })).toBeVisible();
    await rail.getByRole("button", { name: "Gider katmanı", exact: true }).press("Enter");
    await expect(rail.getByRole("button", { name: "Gider katmanı", exact: true })).toHaveAttribute("aria-pressed", "true");
    await rail.getByRole("button", { name: "3D’yi yeniden dene", exact: true }).click();
    await expect(rail.locator("canvas")).toBeVisible();
    await expect(rail.getByRole("button", { name: "Gider katmanı", exact: true })).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "Veri ve yöntemi incele →", exact: true }).click();
    await expect(rail.locator("details")).toHaveAttribute("open", "");
    await expect(rail.locator("details summary")).toBeFocused();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
