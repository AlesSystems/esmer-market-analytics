import { openSection, openWorkspace, setMonth } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { richBusinessPackage, seedRichExpenses } from "../helpers/rich-business-fixture";
import { monthProfitPackage } from "../helpers/month-profit-fixture";
const executablePath = process.env.ESMER_EXECUTABLE ?? resolve("release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics");
test("plain month offers import first, opens and closes manual entry with focus restored, and stays chart-free", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-desk-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await openSection(page, "Giderler");
    await expect(page.locator("canvas")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Excel’den içe aktar", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Şablonu indir", exact: true })).toBeVisible();
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    for (const group of ["staff", "rent", "utilities", "other"]) await expect(page.locator(`[data-group=${group}]`)).toContainText("Kayıt yok");
    await expect(page.getByRole("button", { name: "Bu ay gider yok", exact: true })).toBeVisible();
    await app.evaluate(({ dialog }) => { dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] }); });
    await page.getByRole("button", { name: "Excel’den içe aktar", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "İşlem iptal edildi" })).toBeVisible();
    await page.getByRole("button", { name: "Elle ekle", exact: true }).press("Enter");
    await expect(page.getByRole("heading", { name: "Elle gider ekle", exact: true })).toBeFocused();
    // The form opens inside Kayıtlar; the month's totals stay in view but cannot be confirmed or re-imported beside an open draft.
    await expect(page.getByRole("region", { name: "Kayıtlar" }).getByRole("heading", { name: "Elle gider ekle", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Aylık toplamlar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bu ay gider yok", exact: true })).toBeDisabled();
    await expect(page.getByRole("button", { name: "Excel’den içe aktar", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
    await expect(page.getByRole("button", { name: "Elle ekle", exact: true })).toBeFocused();
    const capture = async (name: string) => {
      const path = process.env.ESMER_CAPTURE_EVIDENCE === "1" ? `workstreams/page-control-desks/expenses/${name}.png` : testInfo.outputPath(`${name}.png`);
      if (process.env.ESMER_CAPTURE_EVIDENCE === "1") await mkdir("workstreams/page-control-desks/expenses", { recursive: true });
      await page.screenshot({ path, fullPage: true });
    };
    await page.setViewportSize({ width: 1440, height: 1000 });
    await capture("expenses-desktop");
    await page.setViewportSize({ width: 1100, height: 560 });
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator(".g-grid")).toBeVisible();
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
    await openSection(page, "Giderler");
    await expect(page.getByRole("main").filter({ visible: true })).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Elle ekle", exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Excel’den içe aktar", exact: true }).filter({ visible: true })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("expense groups show unknown totals as Eksik, never zero, block the confirmation, and an empty month says so", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-charts-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importPackage(richBusinessPackage()); seedRichExpenses(store); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await openSection(page, "Giderler");
    await setMonth(page, "2025-09");
    const groups = page.getByRole("region", { name: "Aylık toplamlar" }).filter({ visible: true });
    await expect(groups).toBeVisible();
    await expect(groups.locator(".g-total b")).toHaveText("Eksik");
    await expect(groups.locator(".g-total")).not.toContainText("0,00 ₺");
    await expect(groups.getByRole("group", { name: "Düzeltilmesi gereken satırlar" })).toBeVisible();
    // A blocking line disables the confirmation and says why.
    await expect(groups.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true })).toBeDisabled();
    await expect(groups.getByText("Önce işaretli satırları düzeltin.", { exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Kayıtlar" }).locator("tbody tr")).toHaveCount(8);
    await expect(page.locator("canvas")).toHaveCount(0);
    for (const width of [1440, 1100, 680, 390]) { await page.setViewportSize({ width, height: width === 1100 ? 560 : 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
    await setMonth(page, "2025-08");
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Excel’den içe aktar", exact: true }).filter({ visible: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Elle ekle", exact: true }).filter({ visible: true })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("a confirmed earlier month is shown as a hint under each group, an unconfirmed one is not", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-hints-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importSourcePreview(monthProfitPackage()); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    const save = (requestId: string, date: string, category: string, net: string) => page.evaluate(({ requestId, date, category, net }) => window.esmer.createExpense({ action: "save", requestId, duplicateReview: null, fields: { date, paymentDate: null, category, classification: "operating-expense", net, tax: "0", gross: net, taxTreatment: "non-recoverable", taxEvidence: "synthetic-tax", supportingReference: null, sourceReference: null, labourPeriod: null, loss: null } } as never), { requestId, date, category, net });
    await save("hint-sep", "2025-09-05", "Kira", "40");
    await save("hint-oct", "2025-10-05", "Kira", "45");
    await openSection(page, "Giderler");
    await expect(page.getByRole("heading", { name: "Ekim 2025 giderleri", level: 1 })).toBeVisible();
    await expect(page.locator("[data-group=rent] .g-amt")).toHaveText("45,00 ₺");
    // September has a line but no confirmation yet: no hint.
    await expect(page.locator(".g-grid")).not.toContainText("Eylül");
    const september = await page.evaluate(() => window.esmer.queryExpenses({ period: "2025-09" }));
    if (september.status !== "expenses") throw Error("expenses missing");
    await page.evaluate(revision => window.esmer.confirmExpenseCompleteness({ period: "2025-09", reviewedRevision: revision, complete: true, reason: "Sentetik onay" }), september.expenseRevision);
    await setMonth(page, "2025-09"); await setMonth(page, "2025-10");
    await expect(page.locator("[data-group=rent]")).toContainText("Eylül: 40,00 ₺");
    await expect(page.locator("[data-group=staff]")).toContainText("Eylül: kayıt yok");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
