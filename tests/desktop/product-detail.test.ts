import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { readSheet } from "read-excel-file/node";
import { openStore } from "../../src/store/store";
import { businessPackage, productProfitRecords } from "../helpers/business-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("selected return month shows pinned daily amounts, original cost and complete product export", async ({}, testInfo) => {
  const root = await mkdtemp(join(tmpdir(), "esmer-selected-detail-"));
  const records = productProfitRecords();
  records.documents.find(row => row.id === "A1")!.date = "2025-08-31";
  const store = openStore(join(root, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(records, { coverage: { from: "2025-08-31", to: "2025-09-30", complete: true } })).status).toBe("active"); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${root}`] });
  try {
    const page = await app.firstWindow();
    await page.getByRole("button", { name: "Çay", exact: true }).click();
    const detail = page.getByRole("region", { name: "Seçili ürün özeti", exact: true });
    await expect(detail).toContainText("-100,00 ₺");
    await expect(detail).toContainText("-60,00 ₺");
    await expect(detail).toContainText("-40,00 ₺");
    await expect(detail).toContainText("Hesaplanamıyor");
    await page.getByText("Seçili ürünün günlük tutarları", { exact: true }).click();
    await expect(page.getByRole("table", { name: "Seçili ürünün günlük tutarları", exact: true }).locator("tbody tr")).toHaveCount(30);
    await page.getByRole("button", { name: "Asıl satışı aç · A1", exact: true }).click();
    const original = page.getByRole("region", { name: "Asıl satış kanıtı", exact: true });
    await expect(original).toContainText("31.08.2025");
    await expect(original).toContainText("60,00 ₺");
    await expect(original).toContainText("Seçili ayın toplamına eklenmez");
    await page.screenshot({ path: testInfo.outputPath("original-sale.png") });
    await page.getByRole("button", { name: "İadeye dön", exact: true }).click();
    await expect(page.getByRole("button", { name: "Asıl satışı aç · A1", exact: true })).toBeFocused();
    await page.getByLabel("Ürün ara", { exact: true }).fill("İçme");
    const output = join(root, "selected.xlsx");
    await app.evaluate(({ dialog }, filePath) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath }); }, output);
    await page.getByRole("button", { name: "Seçili ürünü Excel'e aktar", exact: true }).click();
    await expect(detail).toContainText("Seçili ürün dosyası kaydedildi");
    const sheets = await readSheet(output, { sheet: 1 });
    expect(JSON.stringify(sheets)).toContain("-40");
    await page.screenshot({ path: testInfo.outputPath("selected-summary.png"), fullPage: true });
  } finally { await app.close(); await rm(root, { recursive: true, force: true }); }
});
