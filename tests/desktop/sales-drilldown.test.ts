import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { salesPackage } from "../helpers/sales-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("packaged sales workspace follows a number through product, document and source with keyboard", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-sales-"));
  const packagePath = join(userData, "synthetic-sales.json");
  await writeFile(packagePath, salesPackage());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await page.getByRole("button", { name: "Veri paketi içe aktar" }).click();
    await expect(page.getByRole("heading", { name: "Satış Özeti", exact: true })).toBeVisible();
    await expect(page.getByLabel("Dönem")).toHaveValue("2025-09");
    await page.getByLabel("Ürün ara").fill("İÇME");
    await page.getByRole("button", { name: "İçme suyu", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "İşlemler", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "S1", exact: true }).press("Enter");
    const panel = page.getByRole("complementary");
    await expect(panel.getByRole("heading", { name: "İşlem Detayı" })).toBeFocused();
    await expect(panel.getByText("Belge net toplamı")).toBeVisible();
    await panel.getByRole("button", { name: "Kaynak detayını göster" }).first().press("Enter");
    await expect(panel.getByRole("heading", { name: "Kaynak Detayı" })).toBeFocused();
    await expect(panel.getByText("S1 / L1", { exact: true })).toBeVisible();
    await expect(panel.getByText("sales-1", { exact: true })).toBeVisible();
    await panel.getByRole("button", { name: "İşleme dön" }).press("Enter");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: "S1", exact: true })).toBeFocused();
    await expect(page.getByLabel("Ürün ara")).toHaveValue("İÇME");
    await page.screenshot({ path: "test-results/phase-5-sales-journey.png" });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
