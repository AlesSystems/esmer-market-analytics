import { importPackage } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { businessPackage } from "../helpers/business-fixtures";

test("sidebar keeps the reporting period through analysis and recovery", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-option-b-"));
  const packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage());
  const app = await electron.launch({ executablePath: process.env.ESMER_EXECUTABLE ?? resolve("release/win-unpacked/Esmer Market Analytics.exe"), args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    const nav = page.getByRole("navigation", { name: "Ana gezinme" });
    await expect(nav.getByRole("button", { name: "Özet", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2025-09");
    await expect(page.getByText("Sentetik veri", { exact: true })).toBeVisible();
    await nav.getByRole("button", { name: "Giderler", exact: true }).click();
    await page.getByLabel("Dönem", { exact: true }).fill("2025-08");
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await expect(nav.getByRole("button", { name: "Giderler", exact: true })).toHaveAttribute("aria-current", "page");
    await page.getByText("İşlemler", { exact: true }).click();
    await page.getByRole("button", { name: "Yedekleme ve kurtarma", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yedekleme ve kurtarma", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2025-08");
    await page.setViewportSize({ width: 680, height: 720 });
    await expect(nav.getByRole("button", { name: "Raporlar", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
