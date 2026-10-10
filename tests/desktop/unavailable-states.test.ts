import {importPackage, openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { businessPackage } from "../helpers/business-fixtures";
const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("monthly loading, failure retry and missing period preserve useful navigation", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-monthly-state-")), packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage(undefined, { cutoff: "2025-09-10", coverage: { from: "2025-09-01", to: "2025-09-10", complete: true } }));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("heading", { name: "Henüz mali rapor verisi yok" })).toBeVisible();
    await app.evaluate(({ ipcMain, dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] });
      const registry = ipcMain as unknown as { _invokeHandlers: Map<string, (event: unknown, operation: string, payload: unknown) => unknown> };
      const original = registry._invokeHandlers.get("esmer:request")!;
      let failed = false, periodFailed = false;
      ipcMain.removeHandler("esmer:request");
      ipcMain.handle("esmer:request", async (event, operation, payload) => {
        if (operation === "queryMonthly" && !failed) { failed = true; await new Promise(resolve => setTimeout(resolve, 700)); return { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Sentetik yükleme hatası." }; }
        if (operation === "queryMonthly" && (payload as { context?: { period?: string } }).context?.period === "2024-01" && !periodFailed) { periodFailed = true; return { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Sentetik dönem yükleme hatası." }; }
        return original(event, operation, payload);
      });
    }, packagePath);
    await importPackage(page);
    await expect(page.getByText("Aylık rapor hesaplanıyor…", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Giderler", exact: true })).toBeEnabled();
    await expect(page.getByRole("alert")).toContainText("Sentetik yükleme hatası.");
    await expect(page.getByText("Aylık rapor hesaplanıyor…", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: "test-results/shadcn-monthly-error.png", fullPage: true });
    await page.getByRole("button", { name: "Aylık raporu yeniden yükle" }).click();
    await expect(page.getByRole("heading", { name: "Ay bir bakışta", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Aylık performans", exact: true })).toContainText("Kısmi dönem");
    await expect(page.locator(".c-heading")).toContainText("Açık");
    await page.screenshot({ path: "test-results/shadcn-monthly-partial.png", fullPage: true });
    await page.getByLabel("Dönem", { exact: true }).fill("2024-01");
    await expect(page.getByRole("alert")).toContainText("Sentetik dönem yükleme hatası.");
    await expect(page.locator(".monthly-amount")).toHaveCount(0);
    await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2024-01");
    await page.getByRole("button", { name: "Aylık raporu yeniden yükle" }).click();
    await expect(page.getByRole("region", { name: "Aylık performans", exact: true })).toContainText("Dönem verisi yok");
    await expect(page.getByRole("region", { name: "Aylık performans" })).toContainText("Hesaplanamıyor");
    await page.screenshot({ path: "test-results/phase-8-unavailable.png", fullPage: true });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("real background import exposes progress, cancels and leaves previous data navigable", async () => {
  test.setTimeout(60_000);
  const { businessRecords } = await import("../helpers/business-fixtures");
  const userData = await mkdtemp(join(tmpdir(), "esmer-monthly-cancel-")), packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await expect(page.getByRole("heading", { name: "Ay bir bakışta", exact: true })).toBeVisible();
    const records = businessRecords(), document = records.documents[0], line = records.lines[0];
    records.documents = Array.from({ length: 25_000 }, (_, index) => ({ ...document, id: `bulk-${index}` }));
    records.lines = Array.from({ length: 25_000 }, (_, index) => ({ ...line, id: `bulk-line-${index}`, documentId: `bulk-${index}` }));
    await writeFile(packagePath, businessPackage(records, { extractionId: "synthetic-background", extractedAt: "2025-10-02T00:00:00.000Z" }));
    await importPackage(page);
    await expect(page.getByRole("progressbar", { name: "İşlem ilerlemesi" })).toBeVisible();
    await page.screenshot({ path: "test-results/shadcn-import-progress.png", fullPage: true });
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "İşlemi iptal et", exact: true }).click();
    await expect(page.getByText("İçe aktarma iptal edildi.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Özet", exact: true }).click();
    await expect(page.getByRole("region", { name: "Aylık performans" })).toContainText("200,00 ₺");
    await expect(page.getByText("Yeni veri sürümü hazır", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: "test-results/phase-8-cancelled.png", fullPage: true });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
