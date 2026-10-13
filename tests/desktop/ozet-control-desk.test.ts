import { openWorkspace } from "../helpers/desktop-navigation";
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
    const page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("heading", { name: "Ay bir bakışta", exact: true })).toBeVisible();
    const matrix = page.getByRole("region", { name: "Aylık performans", exact: true });
    await expect(matrix).toContainText("200,00 ₺");
    await page.getByRole("button", { name: "Raporlar", exact: true }).click();
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("60,00 ₺");
    await page.getByRole("button", { name: "Özet", exact: true }).click();
    await expect(matrix).toContainText("40,00 ₺");
    await page.getByRole("button", { name: "Raporlar", exact: true }).click();
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("Faaliyet kârı hesaplanamıyor");
    await page.getByRole("button", { name: "Özet", exact: true }).click();
    await expect(matrix).toContainText("Kayıtlı giderlerHesaplanamıyor");
    await expect(matrix).toContainText("Karşılaştırılamıyor");
    await expect(page.locator(".c-evidence")).toContainText("%50");
    const logo = page.getByRole("img", { name: "Esmer Market", exact: true });
    await expect(logo).toBeVisible();
    await expect.poll(() => logo.evaluate(node => (node as HTMLImageElement).naturalWidth)).toBe(459);
    expect(await logo.getAttribute("src")).not.toMatch(/^https?:/);
    await expect(page.getByRole("img", { name: "Günlük net satış grafiği", exact: true })).toBeVisible();
    await expect(matrix).toContainText("Giderler düşülmemiştir");
    await expect(matrix).toContainText("maliyet kapsamı %50");
    await expect(matrix).not.toContainText("Eksik maliyet sıfır kabul edilmez");
    await expect(page.locator(".c-evidence")).toContainText("Eksik maliyet sıfır kabul edilmez");
    await expect(page.locator(".c-viz-daily .viz-zero-marker")).toHaveCount(29);
    const bridge = page.getByRole("list", { name: "Kapsanan satıştan brüt kâra köprü" });
    await expect(bridge).toContainText("Kapsanan satış");
    await expect(bridge).toContainText("Kapsanan maliyet");
    await expect(bridge).toContainText("Kapsanan tahmini brüt kâr");
    await expect(bridge.locator("li[data-state='unknown']")).toContainText("Maliyeti eksik satış");
    await expect(page.getByRole("list", { name: "Net satışa göre ilk beş ürün" })).toBeVisible();
    await page.locator(".c-viz-daily").getByRole("button", { name: "Tablo", exact: true }).click();
    await expect(page.locator(".c-viz-daily table tbody tr")).toHaveCount(30);
    await expect(page.locator(".c-viz-daily table tbody tr").first()).toContainText("200,00 ₺");
    await expect(page.locator(".c-viz-daily table tbody tr").nth(1)).toContainText("İşlemsiz gün");
    await page.locator(".c-viz-daily").getByRole("button", { name: "Grafik", exact: true }).click();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({ path: testInfo.outputPath("control-desk-desktop.png"), fullPage: true });
    await matrix.getByRole("button", { name: /Net satış/ }).press("Enter");
    await expect(page.getByRole("heading", { name: "Satışlar", exact: true })).toBeVisible();
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

test("Kontrol masası keeps financial evidence accessible with keyboard disclosure", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-control-desk-fallback-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage()).status).toBe("active"); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("heading", { name: "Ay bir bakışta", exact: true })).toBeVisible();
    const rail = page.locator(".c-evidence");
    await rail.locator(":scope > summary").press("Enter");
    await expect(rail).toHaveAttribute("open", "");
    await rail.locator(".c-method > summary").press("Enter");
    await expect(rail.locator(".c-method")).toContainText("Paket:");
    await expect(rail.locator("canvas")).toHaveCount(0);
    await expect(rail).toContainText("%50");
    await expect(page.getByRole("region", { name: "Aylık performans", exact: true })).toContainText("40,00 ₺");
    await page.screenshot({ path: testInfo.outputPath("control-desk-no-webgl.png"), fullPage: true });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});


test("large monthly figures fit the desk and preserve report evidence", async ({}, testInfo) => {
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
    const page = await app.firstWindow();await openWorkspace(page);
    const matrix = page.getByRole("region", { name: "Aylık performans", exact: true });
    await expect(matrix).toContainText("1.248.600,00 ₺");
    await page.getByRole("button", { name: "Raporlar", exact: true }).click();
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("825.000,00 ₺");
    await page.getByRole("button", { name: "Özet", exact: true }).click();
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
    const rail = page.locator(".c-evidence");
    await rail.locator(":scope > summary").press("Enter");
    await expect(rail).toHaveAttribute("open", "");
    await expect(rail.locator(":scope > summary")).toBeFocused();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("Özet daily chart keeps days outside source coverage as hatched gaps, never zero", async () => {
  const records = businessRecords(); records.documents = records.documents.slice(0, 1); records.lines = records.lines.slice(0, 1);
  const userData = await mkdtemp(join(tmpdir(), "esmer-control-desk-gap-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(records, { cutoff: "2025-09-02", coverage: { from: "2025-09-01", to: "2025-09-02", complete: true } })).status).toBe("active"); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("img", { name: "Günlük net satış grafiği", exact: true })).toBeVisible();
    await expect(page.locator(".c-viz-daily .viz-zero-marker")).toHaveCount(1);
    const gap = page.locator('.c-viz-daily g[data-date="2025-09-03"]');
    await expect(gap.locator('[data-state="value"], .viz-zero-marker')).toHaveCount(0);
    await expect(gap.locator('.viz-ghost[data-state="out-of-range"]')).toHaveCount(1);
    await page.locator(".c-viz-daily").getByRole("button", { name: "Tablo", exact: true }).click();
    await expect(page.locator(".c-viz-daily table tbody tr").nth(2)).toContainText("Kapsam dışı");
    await expect(page.locator(".c-viz-daily table tbody tr").nth(2)).not.toContainText("0,00 ₺");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
