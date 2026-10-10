import {importPackage, openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { salesPackage } from "../helpers/sales-fixtures";
const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("legacy sales remain usable while purchasing evidence is explicitly unavailable", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-purchasing-")), packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, salesPackage());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await page.getByRole("button", { name: "Alışlar ve maliyet", exact: true }).click();
    await page.getByText("Maliyet kapsamı, alış geçmişi ve diğer araçlar", { exact: true }).click();
    await expect(page.getByRole("heading", { name: "Alışlar ve maliyet", exact: true })).toBeVisible();
    await expect(page.getByText("Maliyet ve alış kanıtı yok", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Satışlar", exact: true }).click();
    await page.getByText("İşlemler ve satış dağılımı", { exact: true }).click();
    await expect(page.locator(".sales-control-desk .metric").first()).toContainText("180,00 ₺");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("purchasing shows covered estimates and follows converted return evidence without assuming settlement", async () => {
  const { purchasingJourney } = await import("../helpers/purchasing-journey");
  const { businessPackage } = await import("../helpers/business-fixtures");
  const userData = await mkdtemp(join(tmpdir(), "esmer-business-")), packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage(purchasingJourney()));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await page.getByRole("button", { name: "Alışlar ve maliyet", exact: true }).click();
    await page.getByText("Maliyet kapsamı, alış geçmişi ve diğer araçlar", { exact: true }).click();
    await expect(page.locator(".purchasing-secondary .metric").first()).toContainText("40,00 ₺");
    await page.getByRole("button", { name: "Kapsam ve dışlananlar", exact: true }).click();
    await expect(page.getByText("1 kapsanan / 1 dışlanan satır", { exact: false })).toContainText("%50");
    await expect(page.getByText("Negatif stok kaydı var", { exact: false })).toBeVisible();
    await expect(page.getByText("Fire kayıtları seyrek", { exact: false })).toBeVisible();
    await page.getByRole("button", { name: "Tedarikçi iadeleri", exact: true }).click();
    const returnTable = page.getByRole("region", { name: "Tedarikçi iadeleri", exact: true }).locator("table");
    await expect(returnTable.getByRole("row")).toHaveCount(2);
    await expect(returnTable.getByRole("cell", { name: "Bilinmiyor", exact: true })).toHaveCount(3);
    await page.getByLabel("Tedarikçi", { exact: true }).selectOption("supplier-1");
    await page.getByLabel("Alış ürünü").selectOption("water");
    await page.screenshot({ path: "test-results/phase-6-purchasing.png", fullPage: true });
    await page.getByRole("region", { name: "Tedarikçi iadeleri", exact: true }).getByRole("button", { name: "D1", exact: true }).press("Enter");
    const panel = page.getByRole("main", { name: "Alış kaynak detayı" });
    await expect(panel.getByRole("heading", { name: "Maliyet ve alış kaynak detayı" })).toBeFocused();
    await expect(panel.getByText("İrsaliye", { exact: true })).toBeVisible();
    await panel.locator(":scope > details > summary").click();
    await expect(panel.getByText("business-1", { exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/phase-6-purchasing-source.png", fullPage: true });
    await panel.getByRole("button", { name: "R1", exact: true }).click();
    await expect(panel.getByText("Fatura", { exact: true })).toBeVisible();
    await panel.getByRole("button", { name: "D1", exact: true }).click();
    await expect(panel.getByText("İrsaliye", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel.getByText("Fatura", {exact:true})).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel.getByText("İrsaliye", {exact:true})).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("region", { name: "Tedarikçi iadeleri", exact: true }).getByRole("button", { name: "D1", exact: true })).toBeFocused();
    await page.getByRole("region", { name: "Tedarikçi iadeleri", exact: true }).getByRole("button", { name: "D1", exact: true }).click();
    await panel.getByRole("button", { name: "R1", exact: true }).click();
    await panel.getByRole("button", { name: "Önceki belgeye dön", exact: true }).click();
    await expect(panel.getByRole("button", {name:"R1",exact:true})).toBeFocused();
    await panel.getByRole("button", { name: "Alışlara dön", exact: true }).click();
    await expect(page.getByRole("region", { name: "Tedarikçi iadeleri", exact: true }).getByRole("button", { name: "D1", exact: true })).toBeFocused();
    await page.setViewportSize({ width: 680, height: 720 });
    await page.screenshot({ path: "test-results/phase-6-purchasing-small.png", fullPage: true });
    await page.setViewportSize({ width: 1120, height: 850 });
    await writeFile(packagePath, businessPackage(purchasingJourney(), { extractionId: "business-2" }));
    await importPackage(page);
    await expect(page.getByText("Yeni veri sürümü hazır", { exact: true })).toBeVisible();
    await page.getByRole("region", { name: "Tedarikçi iadeleri", exact: true }).getByRole("button", { name: "D1", exact: true }).click();
    await panel.locator(":scope > details > summary").click();
    await expect(panel.getByText("business-1", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Raporu yenile" }).click();
    await page.getByRole("button", { name: "Alışlar ve maliyet", exact: true }).click();
    await page.getByText("Maliyet kapsamı, alış geçmişi ve diğer araçlar", { exact: true }).click();
    await page.getByRole("button", { name: "Tedarikçi iadeleri", exact: true }).click();
    await page.getByRole("region", { name: "Tedarikçi iadeleri", exact: true }).getByRole("button", { name: "D1", exact: true }).click();
    await panel.locator(":scope > details > summary").click();
    await expect(panel.getByText("business-2", { exact: true })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("customer return evidence opens its original sale from the prior month and restores focus", async () => {
  const { businessRecords, businessPackage } = await import("../helpers/business-fixtures");
  const records = businessRecords();
  records.documents[0].date = "2025-08-15";
  records.documents[1] = { ...structuredClone(records.documents[0]), id: "C1", kind: "customer-return", date: "2025-09-15", sales: { ...records.documents[0].sales!, net: "-100", tax: "-5", gross: "-105" } };
  records.lines[1] = { ...structuredClone(records.lines[0]), id: "C1-line", documentId: "C1", net: "-100", sales: { ...records.lines[0].sales!, tax: "-5", gross: "-105" }, business: { historicalCost: { ...records.lines[0].business!.historicalCost!, originalSaleLineId: records.lines[0].id }, inventory: null } };
  const userData = await mkdtemp(join(tmpdir(), "esmer-return-evidence-")), packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage(records, { coverage: { from: "2025-08-01", to: "2025-09-30", complete: true } }));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await page.getByRole("button", { name: "Alışlar ve maliyet", exact: true }).click();
    await page.getByText("Maliyet kapsamı, alış geçmişi ve diğer araçlar", { exact: true }).click();
    await page.getByRole("button", { name: "Kapsam ve dışlananlar", exact: true }).click();
    await page.getByText("Satır maliyet kanıtları", { exact: true }).click();
    const opener = page.getByRole("button", { name: "C1", exact: true });
    await opener.press("Enter");
    const panel = page.getByRole("main", { name: "Alış kaynak detayı" });
    await panel.getByRole("button", { name: "S1", exact: true }).press("Enter");
    await expect(panel.getByText("15.08.2025", { exact: true })).toBeVisible();
    await expect(panel.getByText("Satır: L1", { exact: true })).toBeVisible();
    await expect(panel.getByRole("heading", { name: "Maliyet ve alış kaynak detayı" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(panel.getByRole("button",{name:"S1",exact:true})).toBeFocused();
    await expect(panel.getByText("15.09.2025",{exact:true})).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("purchasing distinguishes partial source coverage from a period with no source data", async () => {
  const { purchasingJourney } = await import("../helpers/purchasing-journey");
  const { businessPackage } = await import("../helpers/business-fixtures");
  const userData = await mkdtemp(join(tmpdir(), "esmer-purchasing-coverage-")), packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage(purchasingJourney(), { coverage: { from: "2025-09-01", to: "2025-09-30", complete: false } }));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await page.getByRole("button", { name: "Alışlar ve maliyet", exact: true }).click();
    await page.getByText("Maliyet kapsamı, alış geçmişi ve diğer araçlar", { exact: true }).click();
    await expect(page.getByText("Kaynak dönem kapsamı eksik", { exact: true })).toBeVisible();
    await expect(page.locator(".purchasing-secondary .metric").first()).toContainText("40,00 ₺");
    await page.getByLabel("Dönem").fill("2025-10");
    await expect(page.getByRole("heading", { name: "Alışlar ve maliyet", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Alışlar ve maliyet", exact: true }).click();
    await page.getByText("Maliyet kapsamı, alış geçmişi ve diğer araçlar", { exact: true }).click();
    await expect(page.getByText("Maliyet ve alışlar için dönem verisi yok", { exact: true })).toBeVisible();
    await expect(page.locator(".purchasing-secondary .metric")).toHaveCount(0);
    await page.screenshot({ path: "test-results/phase-6-purchasing-unavailable.png", fullPage: true });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
