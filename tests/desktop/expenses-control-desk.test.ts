import { openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { richBusinessPackage, seedRichExpenses } from "../helpers/rich-business-fixture";
const executablePath = process.env.ESMER_EXECUTABLE ?? resolve("release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics");
test("plain month offers import first, opens and closes manual entry with focus restored, and stays chart-free", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-desk-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Excel’den içe aktar", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Şablonu indir", exact: true })).toBeVisible();
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true })).toBeVisible();
    await app.evaluate(({ dialog }) => { dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] }); });
    await page.getByRole("button", { name: "Excel’den içe aktar", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "İşlem iptal edildi" })).toBeVisible();
    await page.getByRole("button", { name: "Elle ekle", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "Elle gider ekle", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
    await expect(page.getByRole("button", { name: "Elle ekle", exact: true })).toBeFocused();
    const capture = async (name: string) => {
      const path = process.env.ESMER_CAPTURE_EVIDENCE === "1" ? `workstreams/page-control-desks/expenses/${name}.png` : testInfo.outputPath(`${name}.png`);
      if (process.env.ESMER_CAPTURE_EVIDENCE === "1") await mkdir("workstreams/page-control-desks/expenses", { recursive: true });
      await page.screenshot({ path, fullPage: true });
    };
    await page.setViewportSize({ width: 1440, height: 1000 });
    await capture("expenses-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture("expenses-narrow");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("recorded-source expenses embed one main and keep manual entry reachable", async () => {
  const { writeRawPackage } = await import("../../src/source/raw-package");
  const { rawSnapshot } = await import("../helpers/raw-fixture");
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-source-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:expense-desk", "expense-desk-source")); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("main").filter({ visible: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Elle ekle", exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Excel’den içe aktar", exact: true }).filter({ visible: true })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("expense groups show unknown totals as Eksik, never zero, and an empty month says so", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-charts-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importPackage(richBusinessPackage()); seedRichExpenses(store); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByLabel("Dönem", { exact: true }).fill("2025-09");
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    const groups = page.getByRole("region", { name: "Bu ayın giderleri" }).filter({ visible: true });
    await expect(groups).toBeVisible();
    await expect(groups.locator(".expense-group-total dd")).toHaveText("Eksik");
    await expect(groups.locator(".expense-group-total")).not.toContainText("0,00 ₺");
    await expect(groups.getByRole("group", { name: "Düzeltilmesi gereken satırlar" })).toBeVisible();
    await expect(page.getByText("Tüm kayıtlar (8)", { exact: true })).toBeVisible();
    await expect(page.locator("canvas")).toHaveCount(0);
    for (const width of [1440, 1120, 680, 390]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
    await page.getByLabel("Dönem", { exact: true }).fill("2025-08");
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Excel’den içe aktar", exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Elle ekle", exact: true }).filter({ visible: true })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
