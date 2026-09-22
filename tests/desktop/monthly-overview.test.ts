import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { businessPackage } from "../helpers/business-fixtures";
const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("monthly overview combines pinned sales, covered cost and honest missing expenses", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-monthly-")), packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await page.getByRole("button", { name: "Veri paketi içe aktar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
    const overview = page.getByRole("region", { name: "Aylık göstergeler", exact: true });
    await expect(overview).toContainText("200,00 ₺");
    await expect(overview).toContainText("60,00 ₺");
    await expect(overview).toContainText("40,00 ₺");
    await expect(overview).toContainText("%50");
    await expect(overview).toContainText("İşçilik");
    await expect(overview).toContainText("Faaliyet kârı hesaplanamıyor — gider verileri eksik.");
    await expect(page.getByText("Sentetik gösterim verisi; gerçek market verisi değildir.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Satış Özeti", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "Satış Özeti", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Aylık Market Özeti", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/phase-8-monthly-overview.png", fullPage: true });
    await page.setViewportSize({ width: 680, height: 720 });
    await expect(page.getByRole("button", { name: "Rapor sürümleri", exact: true })).toBeVisible();
    await page.screenshot({ path: "test-results/phase-8-monthly-small.png", fullPage: true });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
