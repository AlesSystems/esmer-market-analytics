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
    const page = await app.firstWindow();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await page.getByRole("button", { name: "Veri paketi içe aktar" }).click();
    await page.getByRole("button", { name: "Maliyet ve Alışlar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Maliyet ve Alışlar", exact: true })).toBeVisible();
    await expect(page.getByText("Maliyet ve alış kanıtı yok", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Satış Özeti", exact: true }).click();
    await expect(page.locator(".metric").first()).toContainText("180,00 ₺");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("purchasing shows covered estimates and follows converted return evidence without assuming settlement", async () => {
  const { purchasingJourney } = await import("../helpers/purchasing-journey");
  const { businessPackage } = await import("../helpers/business-fixtures");
  const userData = await mkdtemp(join(tmpdir(), "esmer-business-")), packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage(purchasingJourney()));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await page.getByRole("button", { name: "Veri paketi içe aktar" }).click();
    await page.getByRole("button", { name: "Maliyet ve Alışlar", exact: true }).click();
    await expect(page.locator(".metric").nth(2)).toContainText("40,00 ₺");
    await expect(page.getByText("1 kapsanan / 1 dışlanan satır", { exact: false })).toContainText("%50");
    await expect(page.getByText("Negatif stok kaydı var", { exact: false })).toBeVisible();
    await expect(page.getByText("Fire kayıtları seyrek", { exact: false })).toBeVisible();
    const returnTable = page.locator("section").filter({ has: page.getByRole("heading", { name: "Alış geçmişi ve tedarikçi iadeleri", exact: true }) }).locator("table").nth(1);
    await expect(returnTable.getByRole("row")).toHaveCount(2);
    await expect(returnTable.getByRole("cell", { name: "Bilinmiyor", exact: true })).toHaveCount(3);
    await page.getByLabel("Tedarikçi", { exact: true }).selectOption("supplier-1");
    await page.getByLabel("Alış ürünü").selectOption("water");
    await page.screenshot({ path: "test-results/phase-6-purchasing.png", fullPage: true });
    await page.getByRole("button", { name: "D1", exact: true }).press("Enter");
    const panel = page.getByRole("complementary");
    await expect(panel.getByRole("heading", { name: "Maliyet ve alış kaynak detayı" })).toBeFocused();
    await expect(panel.getByText("İrsaliye", { exact: true })).toBeVisible();
    await expect(panel.getByText("business-1", { exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/phase-6-purchasing-source.png", fullPage: true });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "D1", exact: true })).toBeFocused();
    await page.setViewportSize({ width: 680, height: 720 });
    await page.screenshot({ path: "test-results/phase-6-purchasing-small.png", fullPage: true });
    await page.setViewportSize({ width: 1120, height: 850 });
    await writeFile(packagePath, businessPackage(purchasingJourney(), { extractionId: "business-2" }));
    await page.getByRole("button", { name: "Veri paketi içe aktar" }).click();
    await expect(page.getByText("Yeni veri sürümü hazır", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "D1", exact: true }).click();
    await expect(panel.getByText("business-1", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Raporu yenile" }).click();
    await page.getByRole("button", { name: "Maliyet ve Alışlar", exact: true }).click();
    await page.getByRole("button", { name: "D1", exact: true }).click();
    await expect(panel.getByText("business-2", { exact: true })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
