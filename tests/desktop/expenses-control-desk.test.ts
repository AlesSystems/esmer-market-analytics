import { openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const executablePath = process.env.ESMER_EXECUTABLE ?? resolve("release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics");
test("plain month tasks selects existing tasks and preserves the review draft", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-desk-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.locator("canvas")).toHaveCount(0);
    await page.getByRole("button", { name: "Excel’den aktar", exact: true }).press("Enter");
    await expect(page.getByRole("button", { name: "Excel seç", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
    await expect(page.getByRole("button", { name: "Excel’den aktar", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Excel’den aktar", exact: true }).press("Enter");
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
    await page.getByRole("button", { name: "Giderlerin eksiksizliğini incele", exact: true }).click();
    await page.getByLabel("İnceleme açıklaması").fill("Ay sonu incelemesi");
    await page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum").check();
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
    await page.getByRole("button", { name: "Giderlerin eksiksizliğini incele", exact: true }).click();
    await expect(page.getByLabel("İnceleme açıklaması")).toHaveValue("Ay sonu incelemesi");
    await expect(page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum")).toBeChecked();
    const capture = async (name: string) => {
      const path = process.env.ESMER_CAPTURE_EVIDENCE === "1" ? `workstreams/page-control-desks/expenses/${name}.png` : testInfo.outputPath(`${name}.png`);
      if (process.env.ESMER_CAPTURE_EVIDENCE === "1") await mkdir("workstreams/page-control-desks/expenses", { recursive: true });
      await page.screenshot({ path, fullPage: true });
    };
    await capture("expenses-review");
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
    await expect(page.getByRole("button", { name: "Excel’den aktar", exact: true })).toBeVisible();
    await page.setViewportSize({ width: 1440, height: 1000 });
    await capture("expenses-desktop");
    await page.setViewportSize({ width: 390, height: 844 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await capture("expenses-narrow");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("recorded-source expenses embed one main and keep the plain task draft", async () => {
  const { openStore } = await import("../../src/store/store");
  const { writeRawPackage } = await import("../../src/source/raw-package");
  const { rawSnapshot } = await import("../helpers/raw-fixture");
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-source-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:expense-desk", "expense-desk-source")); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Gider ekle", exact: true }).first()).toBeVisible();
    await page.getByRole("button", { name: "Giderlerin eksiksizliğini incele", exact: true }).click();
    await page.getByLabel("İnceleme açıklaması").fill("Kaydedilen giderleri kontrol et");
    await page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum").check();
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
    await page.getByRole("button", { name: "Excel’den aktar", exact: true }).click();
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
    await page.getByRole("button", { name: "Giderlerin eksiksizliğini incele", exact: true }).press("Enter");
    await expect(page.getByLabel("İnceleme açıklaması")).toHaveValue("Kaydedilen giderleri kontrol et");
    await expect(page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum")).toBeChecked();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("plain task switches retain preview and explicit duplicate decisions", async () => {
  const { default: writeXlsxFile } = await import("write-excel-file/node");
  const { expenseColumns } = await import("../../src/expenses/template");
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-preview-desk-"));
  const workbookPath = join(userData, "expenses.xlsx");
  const good = ["folio-a", "15.01.2026", "", "Kira", "operating-expense", "50", "0", "50", "non-recoverable", "tax-a", "bill-a", "", "", ""];
  await writeFile(workbookPath, await writeXlsxFile([expenseColumns, good, ["folio-b", ...good.slice(1)]].map(row => row.map(value => ({ type: String, value })))).toBuffer());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await page.getByLabel("Dönem", { exact: true }).fill("2026-01");
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, workbookPath);
    await page.getByRole("button", { name: "Excel’den aktar", exact: true }).click();
    await page.getByRole("button", { name: "Excel seç", exact: true }).click();
    await page.getByLabel("Satır 3: benzer kayda rağmen ayrı gider olarak ekle").check();
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
    await expect(page.getByText("Bu dönemde gider kaydı yok.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Excel’den aktar", exact: true }).press("Enter");
    await expect(page.getByLabel("Satır 3: benzer kayda rağmen ayrı gider olarak ekle")).toBeChecked();
    await expect(page.getByRole("button", { name: "İçe aktarmayı onayla", exact: true })).toBeEnabled();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
