import { openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readSheet } from "read-excel-file/node";
import { SalesReports } from "../../src/reports/query";
import { ReportVersions } from "../../src/reports/versions";
import { openStore } from "../../src/store/store";
import { businessPackage, businessRecords, historicalCost, productProfitRecords } from "../helpers/business-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("packaged product-profit pages stay bounded and accepted values survive restart", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-product-profit-"));
  const records = businessRecords(), template = records.lines[0];
  records.documents = Array.from({ length: 101 }, (_, index) => ({ id: `S${index}`, kind: "sale" as const, date: "2025-09-01", supplierId: null, purchasing: null, sales: { state: "completed" as const, convertedTo: null, net: "10", tax: "0.5", gross: "10.5" } }));
  records.lines = records.documents.map((document, index) => ({ ...structuredClone(template), id: `L${index}`, documentId: document.id, net: "10", sales: { ...template.sales!, productId: `P${String(index).padStart(3, "0")}`, productName: `Sentetik ürün ${String(index).padStart(3, "0")}`, unitNet: "10", tax: "0.5", gross: "10.5" }, business: { historicalCost: historicalCost("6"), inventory: null } }));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(records)).status).toBe("active"); } finally { store.close(); }
  let app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    let page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("heading", { name: "Ay bir bakışta", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Raporlar", exact: true }).click();
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("1.010,00 ₺");
    await expect(page.getByRole("region", { name: "Ürün katkıları", exact: true }).locator("tbody tr")).toHaveCount(100);
    await page.getByRole("button", { name: "Sonraki 100 ürün", exact: true }).click();
    await expect(page.getByRole("region", { name: "Ürün katkıları", exact: true }).locator("tbody tr")).toHaveCount(1);
    await page.getByRole("button", { name: "Sentetik ürün 100", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Seçili ürün · Sentetik ürün 100" })).toBeFocused();
    const bounds = await page.getByRole("heading", { name: "Seçili ürün · Sentetik ürün 100" }).boundingBox();
    expect(bounds!.y).toBeGreaterThanOrEqual(0); expect(bounds!.y).toBeLessThan(700);
    await page.getByRole("button", { name: "Ürün listesine dön" }).click();
    await expect(page.getByRole("button", { name: "Sentetik ürün 100", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Önceki 100 ürün", exact: true }).click();
    await expect(page.getByRole("button", { name: "Sentetik ürün 100", exact: true })).toHaveCount(0);
    await page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true }).fill("  ÜRÜN 000  ");
    await expect(page.getByRole("region", { name: "Ürün katkıları", exact: true }).locator("tbody tr")).toHaveCount(1);
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("404,00 ₺");
    await page.screenshot({ path: testInfo.outputPath("lane-03-04.png") });
    await page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true }).fill("");
    await expect.poll(() => page.evaluate(() => window.esmer.getOperationStatus())).toEqual({ status: "idle" });
    const opened = await page.evaluate(() => window.esmer.openMonthly({ period: "2025-09" }));
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2 monthly display");
    const reportId = opened.report.id;
    expect(opened.report.productProfit).toMatchObject({ productCount: 101, summary: { netSales: "1010", coveredCost: "606", coveredGrossProfit: "404" } });
    expect(opened.report.productProfit.daily).toHaveLength(30);
    expect(opened.report.productProfit).not.toHaveProperty("products");
    expect(opened.report.productProfit).not.toHaveProperty("lines");
    const request = { reportId, search: "", sort: "profit" as const, direction: "desc" as const, offset: 0 };
    const first = await page.evaluate(request => window.esmer.readReportProducts(request), request);
    if (first.status !== "products") throw new Error(`Expected product page: ${JSON.stringify(first)}`);
    expect(first.total).toBe(101); expect(first.rows).toHaveLength(100);
    const second = await page.evaluate(request => window.esmer.readReportProducts(request), { ...request, offset: 100 });
    if (second.status !== "products") throw new Error(`Expected second product page: ${JSON.stringify(second)}`);
    expect(second.rows).toHaveLength(1);
    expect(new Set([...first.rows, ...second.rows].map(row => row.productId)).size).toBe(101);
    const selected = await page.evaluate(request => window.esmer.readReportProducts(request), { ...request, search: "  ÜRÜN 100  " });
    if (selected.status !== "products") throw new Error("Expected product search");
    expect(selected.rows).toMatchObject([{ productId: "P100", coveredGrossProfit: "4" }]);
    const evidence = await page.evaluate(reportId => window.esmer.readReportEvidence({ reportId, section: "product-profit", productId: "P100", offset: 0, search: "", range: "current", documentId: null }), reportId);
    expect(evidence).toMatchObject({ status: "evidence", reportId, productId: "P100", total: 1, rows: [{ lineId: "L100", cost: "6", historicalUnitCost: "6" }] });
    const invalid = await page.evaluate(request => { const invalidRequest = { ...request, limit: 1000 }; return window.esmer.readReportProducts(invalidRequest); }, request);
    expect(invalid).toMatchObject({ status: "rejected", code: "INVALID_PAYLOAD" });
    const saved = await page.evaluate(candidateId => window.esmer.acceptReportVersion({ candidateId, previousAcceptedId: null, reason: "Sentetik paketli uygulama kontrolü" }), reportId);
    expect(saved.status).toBe("monthly");
    await app.close();
    app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("button", { name: "Raporlar", exact: true }).click();
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("1.010,00 ₺");
    await expect.poll(() => page.evaluate(() => window.esmer.getOperationStatus())).toEqual({ status: "idle" });
    const reopened = await page.evaluate(reportId => window.esmer.readReportVersion({ reportId }), reportId);
    expect(reopened).toMatchObject({ status: "monthly", report: { id: reportId, productProfit: opened.report.productProfit } });
    const retained = await page.evaluate(request => window.esmer.readReportProducts(request), request);
    expect(retained).toEqual(first);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

for (const missingCost of [false, true]) test(`owner reads E0${missingCost ? "3" : "2"} monthly profit and selected historical cost on one page`, async () => {
  const reviewDirectory = missingCost ? process.env.ESMER_R42_REVIEW : undefined;
  const userData = await mkdtemp(join(tmpdir(), "esmer-profit-journey-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(productProfitRecords(missingCost))).status).toBe("active"); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`], ...(reviewDirectory ? { recordVideo: { dir: reviewDirectory } } : {}) });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Raporlar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Aylık Ürün Kârlılığı", exact: true })).toBeVisible();
    const summary = page.getByRole("region", { name: "Aylık göstergeler", exact: true });
    await expect(summary).toContainText("60,00 ₺");
    await expect(summary).toContainText(missingCost ? "%89,74" : "%100");
    if (missingCost) { await expect(summary).toContainText("Tüm market kârı belirlenemiyor"); await expect(summary.locator(".partial-reasons")).toContainText("Maliyet kanıtı eksik"); }
    else { await expect(summary).not.toContainText("Tüm market kârı belirlenemiyor"); await expect(summary.locator(".partial-reasons")).toHaveCount(0); }
    await expect(page.getByRole("group", { name: "Günlük tahmini brüt kâr grafiği" })).toBeVisible();
    await expect(page.locator(".monthly-trend [data-state='value']").first()).toBeVisible();
    await page.locator(".monthly-trend").getByRole("button", { name: "Tablo", exact: true }).click();
    await expect(page.locator(".monthly-trend table")).toContainText("100,00 ₺");
    await expect(page.locator(".monthly-trend table")).toContainText("-40,00 ₺");
    await page.getByRole("button", { name: "Çay", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Seçili ürün · Çay" })).toBeFocused();
    await expect(page.getByRole("region", { name: "Seçili ürün kanıtı" })).toContainText("60,00 ₺");
    await page.getByRole("button", { name: "Ürün listesine dön" }).click();
    await expect(page.getByRole("button", { name: "Çay", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Çay", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "Seçili ürün · Çay" })).toBeFocused();
    await page.getByRole("button", { name: "Ürün listesine dön" }).click();
    await page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true }).fill("eşleşmeyen");
    await expect(page.getByRole("region", { name: "Ürün katkıları", exact: true }).locator("tbody tr")).toHaveCount(0);
    await expect(summary).toContainText("60,00 ₺");
    await expect(page.getByRole("heading", { name: "Ürün katkıları", exact: true })).toBeVisible();
    expect(await page.getByRole("main").count()).toBe(1);
    if (reviewDirectory) {
      test.setTimeout(60_000);
      await page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true }).fill("");
      await page.getByRole("button", { name: "Çay", exact: true }).click();
      await page.getByRole("button", { name: "Belgeyi aç · A1", exact: true }).click();
      await expect(page.getByRole("region", { name: "Sabit belge kanıtı" })).toContainText("Kaydedilen tam belge neti: 200,00 ₺");
      await page.screenshot({ path: `${reviewDirectory}/functional-page.png`, fullPage: true });
      await page.screenshot({ path: `${reviewDirectory}/selected-detail.png` });
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: `${reviewDirectory}/monthly-top.png` });
      await page.getByRole("region", { name: "Sabit belge kanıtı" }).scrollIntoViewIfNeeded();
      await page.waitForTimeout(10_000);
      await page.getByRole("button", { name: "Ürüne dön", exact: true }).click();
      await page.getByRole("heading", { name: "Ürün katkıları", exact: true }).scrollIntoViewIfNeeded();
      await page.waitForTimeout(10_000);
      await page.getByRole("heading", { name: "Günlük tahmini brüt kâr", exact: true }).scrollIntoViewIfNeeded();
      await page.waitForTimeout(10_000);
    }
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("late product, document and month responses cannot replace the current selection", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-profit-races-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(productProfitRecords())).status).toBe("active"); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await test.step("initialReportArrival", async () => {
      await app.evaluate(({ ipcMain }) => {
        const registry = ipcMain as unknown as { _invokeHandlers: Map<string, (event: unknown, operation: string, payload: unknown) => unknown> };
        const original = registry._invokeHandlers.get("esmer:request")!;
        ipcMain.removeHandler("esmer:request");
        ipcMain.handle("esmer:request", async (event, operation, payload) => {
          const request = payload as { search?: string; productId?: string; documentId?: string; context?: { period: string } };
          const result = await original(event, operation, payload);
          if (operation === "readReportProducts" && request.search === "ÇAY" || operation === "readReportProduct" && request.productId === "A" || operation === "readReportEvidence" && (request.productId === "A" || request.documentId === "A1") || operation === "queryMonthly" && request.context?.period === "2025-10") await new Promise(resolve => setTimeout(resolve, 500));
          return result;
        });
      });
      const page = await app.firstWindow();await openWorkspace(page);
      await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Raporlar", exact: true }).click();
      await expect(page.getByRole("heading", { name: "Aylık Ürün Kârlılığı", exact: true })).toBeVisible();
      return page;
    });
    await test.step("searchrace", async () => {
      await page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true }).fill("ÇAY");
      await page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true }).fill("İÇ");
      await expect(page.getByRole("region", { name: "Ürün katkıları", exact: true }).locator("tbody tr")).toHaveCount(1);
      await expect(page.getByRole("button", { name: "İçme suyu", exact: true })).toBeVisible();
      await page.waitForTimeout(600);
      await expect(page.getByRole("button", { name: "Çay", exact: true })).toHaveCount(0);
      await page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true }).fill("");
    });
    await test.step("productrace", async () => {
      await page.getByRole("button", { name: "Çay", exact: true }).click();
      await page.getByRole("button", { name: "Ürün listesine dön" }).click();
      await page.getByRole("button", { name: "İçme suyu", exact: true }).click();
      await expect(page.getByRole("region", { name: "Seçili ürün özeti", exact: true })).toContainText("30,00 ₺");
      await page.waitForTimeout(600);
      await expect(page.getByRole("heading", { name: "Seçili ürün · İçme suyu" })).toBeFocused();
      await expect(page.getByRole("button", { name: "Belgeyi aç · A1", exact: true })).toHaveCount(0);
    });
    await test.step("documentrace", async () => {
      await page.getByRole("button", { name: "Belgeyi aç · B1", exact: true }).click();
      await expect(page.getByRole("region", { name: "Sabit belge kanıtı" })).toContainText("Kaydedilen tam belge neti: 50,00 ₺");
      await page.getByRole("button", { name: "Ürün listesine dön" }).click();
      await page.getByRole("button", { name: "Çay", exact: true }).click();
      await expect(page.getByRole("button", { name: "Belgeyi aç · A1", exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Belgeyi aç · A1", exact: true }).click();
      await expect(page.getByText("Belge kanıtı yükleniyor…", { exact: true })).toBeVisible();
      await page.getByRole("button", { name: "Ürün listesine dön" }).click();
      await page.getByRole("button", { name: "İçme suyu", exact: true }).click();
      await page.getByRole("button", { name: "Belgeyi aç · B1", exact: true }).click();
      await expect(page.getByRole("region", { name: "Sabit belge kanıtı" })).toContainText("Kaydedilen tam belge neti: 50,00 ₺");
      await page.waitForTimeout(600);
      await expect(page.getByRole("region", { name: "Sabit belge kanıtı" })).toContainText("Belge kanıtı · B1");
      await expect(page.getByRole("region", { name: "Sabit belge kanıtı" })).not.toContainText("200,00 ₺");
    });
    await test.step("monthrace", async () => {
      await page.getByLabel("Dönem", { exact: true }).fill("2025-10");
      await page.getByLabel("Dönem", { exact: true }).fill("2025-09");
      await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("60,00 ₺");
      await page.waitForTimeout(600);
      await expect(page.getByRole("region", { name: "Seçili ürün kanıtı" })).toHaveCount(0);
      await expect(page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true })).toHaveValue("");
      await page.screenshot({ path: testInfo.outputPath("lane-05.png") });
    });
  } finally {
    await test.step("cleanup", async () => { await app.close(); await rm(userData, { recursive: true, force: true }); });
  }
});

for (const scenario of ["empty", "zero", "loss", "return-only", "no-cost", "unsupported", "partial"]) test(`profit page distinguishes ${scenario} and keeps unknown days as gaps`, async ({}, testInfo) => {
  const records = businessRecords(); records.documents = records.documents.slice(0, 1); records.lines = records.lines.slice(0, 1);
  if (scenario === "empty") { records.documents = []; records.lines = []; }
  if (scenario === "zero" || scenario === "loss") records.lines[0].business!.historicalCost = historicalCost(scenario === "zero" ? "100" : "120");
  if (scenario === "no-cost") records.lines[0].business!.historicalCost = null;
  if (scenario === "unsupported") records.lines[0].sales!.unit = "unknown";
  if (scenario === "return-only") {
    const crossMonth = productProfitRecords(false);
    records.documents = crossMonth.documents.filter(row => row.id !== "B1"); records.lines = crossMonth.lines.filter(row => row.id !== "B1");
    records.documents[0].date = "2025-08-31";
  }
  const userData = await mkdtemp(join(tmpdir(), "esmer-profit-state-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(records, scenario === "return-only" ? { coverage: { from: "2025-08-31", to: "2025-09-30", complete: true } } : scenario === "partial" ? { cutoff: "2025-09-02", coverage: { from: "2025-09-01", to: "2025-09-02", complete: true } } : {})).status).toBe("active"); } finally { store.close(); }
  if (scenario === "empty") await writeFile(join(userData, "preferences.json"), JSON.stringify({ textSize: "normal", selectedMonth: "2025-09" }));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("button", { name: "Raporlar", exact: true }).click();
    const summary = page.getByRole("region", { name: "Aylık göstergeler", exact: true });
    await expect(page.getByRole("heading", { name: "Aylık Ürün Kârlılığı", exact: true })).toBeVisible();
    if (scenario === "empty") { await expect(page.locator(".monthly-amount")).toHaveText("Bu ay satış veya iade yok"); await expect(page.locator(".monthly-trend .viz-zero-marker")).toHaveCount(30); }
    if (scenario === "zero") { await expect(page.locator(".monthly-amount")).toHaveText("0,00 ₺"); await expect(page.locator(".monthly-trend .viz-zero-marker")).toHaveCount(30); }
    if (scenario === "loss") { await expect(page.locator(".monthly-amount")).toHaveText("-20,00 ₺"); await expect(summary).toContainText("Tahmini brüt zarar"); }
    if (scenario === "return-only") { await expect(page.locator(".monthly-amount")).toHaveText("-40,00 ₺"); await expect(summary).toContainText("Hesaplanamıyor"); await page.getByRole("button", { name: "Çay", exact: true }).click(); await page.getByRole("button", { name: "Asıl satışı aç · A1", exact: true }).click(); await expect(page.getByRole("region", { name: "Asıl satış kanıtı", exact: true })).toContainText("31.08.2025"); }
    if (scenario === "no-cost" || scenario === "unsupported") { await expect(page.locator(".monthly-amount")).toHaveText("Hesaplanamıyor"); const gap = page.locator('.monthly-trend g[data-date="2025-09-01"]'); await expect(gap.locator('[data-state="value"], .viz-zero-marker')).toHaveCount(0); await expect(gap.locator(".viz-ghost")).toHaveCount(1); }
    if (scenario === "partial") { await expect(summary).toContainText("Kısmi dönem"); await expect(page.locator(".monthly-trend .viz-zero-marker")).toHaveCount(1); const gap = page.locator('.monthly-trend g[data-date="2025-09-03"]'); await expect(gap.locator('[data-state="value"], .viz-zero-marker')).toHaveCount(0); await expect(gap.locator('.viz-ghost[data-state="out-of-range"]')).toHaveCount(1); }
    if (["zero", "loss", "no-cost", "partial"].includes(scenario)) {
      await page.getByRole("region", { name: "Ürün katkıları", exact: true }).locator("tbody button").first().click();
      const selected = page.getByRole("region", { name: "Seçili ürün özeti", exact: true });
      await expect(selected).toContainText(scenario === "zero" ? "0,00 ₺" : scenario === "loss" ? "-20,00 ₺" : scenario === "no-cost" ? "Hesaplanamıyor" : "40,00 ₺");
      if (scenario === "no-cost") await expect(selected).toContainText("0 kapsanan / 1 dışlanan");
      if (scenario === "partial") await expect(selected).toContainText("Dönem veya kaynak kapsamı eksik");
    }
    if (await page.getByRole("button", { name: "Ürün listesine dön" }).isVisible()) await page.getByRole("button", { name: "Ürün listesine dön" }).click();
    await page.locator(".monthly-trend").getByRole("button", { name: "Tablo", exact: true }).click();
    await expect(page.locator(".monthly-trend table tbody tr")).toHaveCount(30);
    if (["no-cost", "unsupported"].includes(scenario)) await expect(page.locator(".monthly-trend table tbody tr").first()).toContainText("Hesaplanamıyor");
    if (scenario === "partial") { const outside = page.locator(".monthly-trend table tbody tr").filter({ hasText: "03.09.2025" }); await expect(outside).toContainText("Kapsam dışı"); await expect(outside).not.toContainText("Hesaplanamıyor"); }
    await page.screenshot({ path: testInfo.outputPath("lane-06-07.png") });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("keyboard zoom, full-document scope and filtered export preserve the pinned population", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-profit-export-")), exportPath = join(userData, "synthetic.xlsx");
  const records = productProfitRecords();
  records.lines.find(row => row.id === "B1")!.documentId = "A1";
  records.documents = records.documents.filter(row => row.id !== "B1");
  records.documents[0].sales = { ...records.documents[0].sales!, net: "250", gross: "250" };
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(records)).status).toBe("active"); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Raporlar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Aylık Ürün Kârlılığı", exact: true })).toBeVisible();
    await page.setViewportSize({ width: 680, height: 720 });
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(2); });
    const opener = page.getByRole("button", { name: "Çay", exact: true });
    await page.getByLabel("Dönem", { exact: true }).focus();
    for (let tab = 0; tab < 40 && !await opener.evaluate(node => node === document.activeElement); tab++) await page.keyboard.press("Tab");
    await expect(opener).toBeFocused();
    await opener.press("Enter");
    await expect(page.getByRole("heading", { name: "Seçili ürün · Çay" })).toBeFocused();
    await expect(page.getByRole("region", { name: "Seçili ürün özeti", exact: true })).toContainText("%40");
    await page.getByText("Seçili ürünün günlük tutarları", { exact: true }).click();
    await expect(page.getByRole("table", { name: "Seçili ürünün günlük tutarları", exact: true }).locator("tbody tr")).toHaveCount(30);
    await page.getByRole("button", { name: "Belgeyi aç · A1", exact: true }).press("Enter");
    const documentProof = page.getByRole("region", { name: "Sabit belge kanıtı" });
    await expect(documentProof).toContainText("Kaydedilen tam belge neti: 250,00 ₺");
    await expect(documentProof).toContainText("Seçili ürün kapsamı dışında");
    await page.getByRole("button", { name: "Ürüne dön", exact: true }).press("Enter");
    await expect(page.getByRole("button", { name: "Belgeyi aç · A1", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Ürün listesine dön" }).press("Enter");
    await expect(opener).toBeFocused();
    await page.screenshot({ path: testInfo.outputPath("lane-08.png") });
    await app.evaluate(({ BrowserWindow }) => { BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(1); });
    await page.getByRole("button", { name: "Raporlar", exact: true }).press("Enter");
    await page.getByRole("button", { name: "Sürüm listesine dön", exact: true }).click();
    await page.getByLabel("Rapor inceleme açıklaması").fill("Sentetik tam kapsam kontrolü");
    await page.getByRole("button", { name: "İncelenen raporu kaydet", exact: true }).press("Enter");
    await expect(page.getByRole("region", { name: "Seçili rapor", exact: true })).toContainText("Kaydedilmiş sürüm");
    await page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true }).fill("ÇAY");
    await expect(page.getByRole("region", { name: "Ürün katkıları", exact: true }).locator("tbody tr")).toHaveCount(1);
    await app.evaluate(({ dialog }, path) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: path }); }, exportPath);
    await page.getByRole("button", { name: "Seçili aylık raporu Excel'e aktar", exact: true }).click();
    await expect(page.getByText("Seçili rapor Excel dosyasına kaydedildi.", { exact: true })).toBeVisible();
    const rows = await readSheet(exportPath, "Ürün kârlılığı");
    expect(rows.filter(row => ["A", "B", "C"].includes(String(row[0]))).map(row => row[0])).toEqual(["A", "B", "C"]);
    const days = await readSheet(exportPath, "Günlük ürün kârlılığı");
    expect(days.filter(row => /^2025-09-\d\d$/.test(String(row[0])))).toHaveLength(30);
    await page.screenshot({ path: testInfo.outputPath("lane-09.png") });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("synthetic compatibility v1 shape keeps original overview and export without product sections", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-profit-v1-")), exportPath = join(userData, "legacy.xlsx");
  const store = openStore(join(userData, "analytics.sqlite"));
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store)), opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected monthly");
    const legacy = structuredClone(opened.report) as unknown as import("../../src/reports/contracts").MonthlyReportV1;
    Reflect.deleteProperty(legacy, "productProfit");
    legacy.id = "legacy-ui"; legacy.format = "monthly-report-v1"; legacy.calculations.report = "monthly-calc-v1"; legacy.rules.artifact = "esmer-market:monthly-v1";
    legacy.review = { acceptedAt: "2025-10-01T00:00:00.000Z", reason: "Sentetik eski sürüm", previousAcceptedId: null };
    store.acceptReport({ id: legacy.id, pin: { datasetId: legacy.context.datasetId, appRevision: legacy.context.appRevision }, calculationVersion: legacy.calculations.report, evidence: [legacy.rules.artifact], output: { report: legacy } });
  } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Raporlar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Aylık Ürün Kârlılığı", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Raporlar", exact: true }).click();
    await page.getByRole("button", { name: "Sürüm listesine dön", exact: true }).click();
    await page.getByRole("button", { name: "Kaydedilmiş sürümü aç", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("200,00 ₺");
    await expect(page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true })).toHaveCount(0);
    await app.evaluate(({ dialog }, path) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: path }); }, exportPath);
    await page.getByRole("button", { name: "Seçili aylık raporu Excel'e aktar", exact: true }).click();
    await expect(page.getByText("Seçili rapor Excel dosyasına kaydedildi.", { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath("lane-01.png") });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("product and evidence failures retry locally without replacing the monthly result", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-profit-retry-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importPackage(businessPackage(productProfitRecords())); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    await app.evaluate(({ ipcMain }) => {
      const registry = ipcMain as unknown as { _invokeHandlers: Map<string, (event: unknown, operation: string, payload: unknown) => unknown> };
      const original = registry._invokeHandlers.get("esmer:request")!;
      let productsFailed = false, evidenceFailed = false, documentFailed = false;
      ipcMain.removeHandler("esmer:request");
      ipcMain.handle("esmer:request", (event, operation, payload) => {
        const request = payload as { search?: string; productId?: string; section?: string; documentId?: string };
        if (operation === "readReportProducts" && request.search === "hata" && !productsFailed) { productsFailed = true; return { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Sentetik ürün hatası" }; }
        if (operation === "readReportEvidence" && request.productId === "C" && !evidenceFailed) { evidenceFailed = true; return { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Sentetik kanıt hatası" }; }
        if (operation === "readReportEvidence" && request.section === "documents" && request.documentId === "C1" && !documentFailed) { documentFailed = true; return { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Sentetik belge hatası" }; }
        return original(event, operation, payload);
      });
    });
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Raporlar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Aylık Ürün Kârlılığı", exact: true })).toBeVisible();
    await page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true }).fill("hata");
    await expect(page.getByRole("button", { name: "Ürün listesini yeniden yükle", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ürün listesini yeniden yükle", exact: true }).click();
    await expect(page.getByText("Eşleşen ürün yok. Aramayı temizleyin; rapor kapsamı değişmez.", { exact: true })).toBeVisible();
    await page.getByLabel("Ürün ara", { exact: true }).filter({ visible: true }).fill("");
    await page.getByRole("button", { name: "Maliyeti bilinmeyen ürün", exact: true }).click();
    await page.getByRole("button", { name: "Ürün kanıtını yeniden yükle", exact: true }).click();
    await expect(page.getByRole("region", { name: "Seçili ürün kanıtı" })).toContainText("Eksik maliyet sıfır değildir");
    await page.getByRole("button", { name: "Belgeyi aç · C1", exact: true }).click();
    await page.getByRole("button", { name: "Belge kanıtını yeniden yükle", exact: true }).click();
    await expect(page.getByRole("region", { name: "Sabit belge kanıtı" })).toContainText("Kaydedilen tam belge neti: 40,00 ₺");
    await expect(page.locator(".monthly-amount")).toHaveText("60,00 ₺");
    await page.screenshot({ path: testInfo.outputPath("lane-06-retry.png") });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("Satışlar and Raporlar lead with charts that keep unknown, zero and coverage distinct", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-profit-charts-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(productProfitRecords(true))).status).toBe("active"); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Satışlar", exact: true }).click();
    const ranking = page.getByRole("list", { name: "Kapsanan kâra göre ilk on ürün" });
    await expect(ranking).toBeVisible();
    await expect(ranking.locator("li[data-state='value']").first()).toContainText("₺");
    const unknown = ranking.locator("li[data-state='unknown']");
    await expect(unknown).toHaveCount(1);
    await expect(unknown).toContainText("Maliyeti bilinmeyen ürün");
    await expect(unknown).toContainText("Bilinmiyor");
    const rankButton = ranking.getByRole("button").first();
    await rankButton.click();
    await expect(page.getByRole("heading", { name: /^Seçili ürün · / })).toBeFocused();
    await page.getByRole("button", { name: "Ürün listesine dön" }).click();
    await expect(rankButton).toBeFocused();
    await expect(page.getByRole("group", { name: "Günlük tahmini brüt kâr grafiği" })).toBeVisible();
    await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Raporlar", exact: true }).click();
    await expect(page.getByRole("group", { name: "Günlük tahmini brüt kâr grafiği" }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("img", { name: /^Satırların kapsanan \d+, dışlanan [1-9]/ })).toBeVisible();
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("dışlanan satır");
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("Giderler dahil değil");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
