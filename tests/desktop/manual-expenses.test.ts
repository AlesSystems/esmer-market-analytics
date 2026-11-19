import { monthLabel, openSection, openWorkspace, setMonth } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";
import { writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";
const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));
for (const host of ["empty", "source", "sales"] as const) test(`manual entry protects period and page navigation in ${host} host`, async () => {
  const userData = await mkdtemp(join(tmpdir(), `esmer-manual-${host}-`));
  if (host !== "empty") { const store = openStore(join(userData, "analytics.sqlite")); if (host === "source") store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:manual", "manual-host")); else store.importPackage(businessPackage()); store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    const nav = page.getByRole("navigation", { name: "Ana gezinme" });
    await expect(nav.getByRole("button", { name: "Bu ay", exact: true })).toHaveAttribute("aria-current", "page");
    await openSection(page, "Giderler");
    await page.locator("#expense-manual").click();
    await expect(page.getByRole("heading", { name: "Elle gider ekle", exact: true })).toBeFocused();
    await expect(page.getByLabel("Gider tarihi", { exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Tutar (TRY)", { exact: true })).toHaveValue("");
    await page.getByLabel("Kategori", { exact: true }).fill("Sentetik elektrik");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    const stepper = page.getByRole("group", { name: "Dönem", exact: true }), previous = await monthLabel(page).getAttribute("data-month");
    const earlier = stepper.getByRole("button", { name: "Önceki ay", exact: true });
    const step = await earlier.getAttribute("aria-disabled") === "true" ? stepper.getByRole("button", { name: "Sonraki ay", exact: true }) : earlier;
    await step.click();
    await expect(page.getByRole("heading", { name: "Kaydedilmemiş bilgileri bırak?" })).toBeVisible();
    await expect(monthLabel(page)).toHaveAttribute("data-month", previous!);
    await page.getByRole("button", { name: "Düzenlemeye devam et", exact: true }).click();
    await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik elektrik");
    await openSection(page, "Bu ay");
    await expect(page.getByRole("heading", { name: "Kaydedilmemiş bilgileri bırak?" })).toBeVisible();
    await page.getByRole("button", { name: "Düzenlemeye devam et", exact: true }).click();
    await expect(nav.getByRole("button", { name: "Giderler", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik elektrik");
    await step.click(); await page.getByRole("button", { name: "Bilgileri bırak", exact: true }).click();
    await expect(monthLabel(page)).not.toHaveAttribute("data-month", previous!);
    await page.locator("#expense-manual").click();
    await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("");
    await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
    await expect(page.locator("#expense-manual")).toBeFocused();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
test("a November bill survives reopening and each bill can be corrected with its history", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-manual-save-"));
  let app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    let page = await app.firstWindow();
    await page.clock.setFixedTime(new Date("2026-12-10T12:00:00Z"));
    await openWorkspace(page); await openSection(page, "Giderler");
    await setMonth(page, "2026-11");
    await page.locator("#expense-manual").click();
    const form = page.getByRole("region", { name: "Elle gider girişi" });
    await expect(form.getByText("Kasım 2026", { exact: true })).toBeVisible();
    await expect(form.getByRole("textbox")).toHaveCount(2);
    await expect(form.getByRole("combobox")).toHaveCount(0);
    await expect(form.locator('input[type="date"]')).toHaveCount(0);
    await form.getByRole("button", { name: "Gideri kaydet", exact: true }).click();
    await expect(form.getByLabel("Kategori", { exact: true })).toBeFocused();
    await form.getByLabel("Kategori", { exact: true }).fill("Sentetik elektrik");
    await form.getByLabel("Tutar (TRY)", { exact: true }).fill("1.250,00");
    await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: testInfo.outputPath("manual-entry-narrow.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.setViewportSize({ width: 1440, height: 1080 }); await page.screenshot({ path: testInfo.outputPath("manual-entry-desktop.png"), fullPage: true });
    await app.evaluate(({ app }) => {
      const { DatabaseSync } = process.getBuiltinModule("node:sqlite"), { join } = process.getBuiltinModule("node:path");
      const db = new DatabaseSync(join(app.getPath("userData"), "analytics.sqlite")); db.exec("BEGIN IMMEDIATE"); Reflect.set(globalThis, "manualExpenseTestLock", db);
    });
    await page.getByRole("button", { name: "Gideri kaydet", exact: true }).click();
    await expect(page.getByLabel("Kategori", { exact: true })).toBeDisabled();
    await page.getByRole("group", { name: "Dönem", exact: true }).getByRole("button", { name: "Önceki ay", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Kaydın sonucu bekleniyor", exact: true })).toBeVisible();
    await expect(monthLabel(page)).toHaveAttribute("data-month", "2026-11");
    await app.evaluate(() => { const db = Reflect.get(globalThis, "manualExpenseTestLock"); db.exec("COMMIT"); db.close(); Reflect.deleteProperty(globalThis, "manualExpenseTestLock"); });
    await expect(page.locator("#expense-manual")).toBeFocused();
    await expect(page.getByRole("button", { name: "İncele / düzelt", exact: true })).toBeVisible();
    const original = await page.evaluate(() => window.esmer.queryExpenses({ period: "2026-11" })); if (original.status !== "expenses") throw Error("expenses missing");
    await page.evaluate(id => localStorage.setItem("esmer.pending-manual-expense", id), (original.rows[0].value as {origin: {requestId: string}}).origin.requestId);
    await app.evaluate(({ session }) => session.fromPartition("persist:esmer").flushStorageData());
    await app.close(); app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] }); page = await app.firstWindow();await openWorkspace(page);
    expect(await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense"))).not.toBeNull();
    await openSection(page, "Giderler"); await expect(page.getByRole("status").filter({ hasText: "Gider kaydedildi." })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense"))).toBeNull();
    expect(await page.evaluate(() => window.esmer.queryExpenses({ period: "2026-11" }))).toMatchObject({ rows: [expect.objectContaining({ revision: 1 })] });
    await expect(page.getByRole("row", { name: /Kasım 2026 Sentetik elektrik 1\.250,00/ })).toBeVisible();
    await page.locator("#expense-manual").click();
    await page.getByLabel("Kategori", { exact: true }).fill("Sentetik ikinci elektrik");
    await page.getByLabel("Tutar (TRY)", { exact: true }).fill("1.250,00");
    await page.getByRole("button", { name: "Gideri kaydet", exact: true }).click();
    await expect(page.getByRole("button", { name: "İncele / düzelt", exact: true })).toHaveCount(2);
    await page.getByRole("row", { name: /Kasım 2026 Sentetik elektrik/ }).getByRole("button", { name: "İncele / düzelt" }).click();
    await page.getByLabel("Tutar (TRY)", { exact: true }).fill("900,25");
    await page.getByRole("button", { name: "Düzeltmeyi kapat", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Kaydedilmemiş bilgileri bırak?" })).toBeVisible();
    await page.getByRole("button", { name: "Düzenlemeye devam et", exact: true }).click();
    await expect(page.getByLabel("Tutar (TRY)", { exact: true })).toHaveValue("900,25");
    await page.getByLabel("Değişiklik gerekçesi", { exact: true }).fill("Sentetik tutar düzeltmesi");
    await page.getByRole("button", { name: "Düzeltmeyi kaydet", exact: true }).click();
    await expect(page.getByRole("row", { name: /Sentetik elektrik 900,25/ })).toBeVisible();
    await expect(page.getByRole("row", { name: /Sentetik ikinci elektrik 1\.250,00/ })).toBeVisible();
    await page.getByRole("row", { name: /Sentetik elektrik 900,25/ }).getByRole("button", { name: "İncele / düzelt" }).click();
    const history = page.getByRole("table", { name: "" }).filter({ has: page.getByText("Sentetik tutar düzeltmesi", { exact: false }) });
    await expect(history.getByRole("row", { name: /1 .*Önceki sürüm.*1\.250,00/ })).toBeVisible();
    await expect(history.getByRole("row", { name: /3 .*Güncel sürüm.*900,25/ })).toBeVisible();
    await page.getByLabel("Değişiklik gerekçesi", { exact: true }).fill("Sentetik iptal kontrolü");
    await page.getByRole("button", { name: "Gideri geri al", exact: true }).click();
    await expect(page.getByRole("cell", { name: /Geri alındı$/ })).toBeVisible();
    await page.locator(`[id="expense-record-${original.rows[0].entityId}"]`).click();
    await page.getByLabel("Değişiklik gerekçesi", { exact: true }).fill("Sentetik geri yükleme");
    await page.getByRole("button", { name: "Sürüm 1 geri yükle", exact: true }).click();
    await expect(page.getByRole("row", { name: /Sentetik elektrik 1\.250,00/ })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
test("an in-flight save loses its renderer reply and resolves through the retained request identity", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-manual-lost-reply-")), app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page); await openSection(page, "Giderler"); await page.locator("#expense-manual").click();
    await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
    await setMonth(page, "2026-01"); await page.locator("#expense-manual").click();
    await page.getByLabel("Kategori", { exact: true }).fill("Sentetik kayıp yanıt");
    await page.getByLabel("Tutar (TRY)", { exact: true }).fill("75");
    await app.evaluate(({ app }) => {
      const { DatabaseSync } = process.getBuiltinModule("node:sqlite"), { join } = process.getBuiltinModule("node:path");
      const db = new DatabaseSync(join(app.getPath("userData"), "analytics.sqlite")); db.exec("BEGIN IMMEDIATE"); Reflect.set(globalThis, "manualExpenseTestLock", db);
    });
    await page.getByRole("button", { name: "Gideri kaydet", exact: true }).click(); await expect(page.getByLabel("Kategori", { exact: true })).toBeDisabled();
    const requestId = await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense")); expect(requestId).not.toBeNull();
    await page.reload({ waitUntil: "domcontentloaded" });await openWorkspace(page);
    await app.evaluate(() => { const db = Reflect.get(globalThis, "manualExpenseTestLock"); db.exec("COMMIT"); db.close(); Reflect.deleteProperty(globalThis, "manualExpenseTestLock"); });
    await openSection(page, "Giderler");
    await expect(page.getByRole("status").filter({ hasText: "Gider kaydedildi." })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense"))).toBeNull();
    expect(await page.evaluate(id => window.esmer.createExpense({ action: "resolve", requestId: id! }), requestId)).toMatchObject({ status: "already-saved", revision: 1 });
    expect(await page.evaluate(() => window.esmer.queryExpenses({ period: "2026-01" }))).toMatchObject({ rows: [expect.objectContaining({ revision: 1 })] });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
test("an absent pending receipt requires current-record review before another manual submission", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-manual-absent-receipt-")), app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page); await expect(page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Giderler", exact: true })).toBeVisible();
    await page.evaluate(() => localStorage.setItem("esmer.pending-manual-expense", "absent-after-older-backup"));
    await openSection(page, "Giderler");
    await expect(page.getByRole("button", { name: "Kayıtları incele", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "Gideri kaydet", exact: true })).toBeDisabled();
    await expect(page.getByLabel("Kategori", { exact: true })).toBeDisabled();
    expect(await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense"))).toBe("absent-after-older-backup");
    await page.getByRole("button", { name: "Vazgeç", exact: true }).click(); await page.locator("#expense-manual").click();
    await expect(page.getByRole("button", { name: "Kayıtları incele", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "Gideri kaydet", exact: true })).toBeDisabled();
    const prior = await monthLabel(page).getAttribute("data-month");
    await page.getByRole("button", { name: "Önceki ay", exact: true }).click();
    await expect(monthLabel(page)).not.toHaveAttribute("data-month", prior!);
    await expect(page.getByRole("button", { name: "Kayıtları incele", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "Gideri kaydet", exact: true })).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath("manual-review-required.png"), fullPage: true });
    await page.getByRole("button", { name: "Kayıtları incele", exact: true }).click();
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense"))).toBeNull();
    await page.locator("#expense-manual").click(); await expect(page.getByRole("button", { name: "Gideri kaydet", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
for (const host of ["source"] as const) test(`leaving Giderler keeps a manual draft until the owner discards it in ${host}`, async () => {
  const userData = await mkdtemp(join(tmpdir(), `esmer-manual-leave-${host}-`)), store = openStore(join(userData, "analytics.sqlite"));
  if (host === "source") store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:manual-leave", "manual-leave-host")); else store.importPackage(businessPackage()); store.close();
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    const nav = page.getByRole("navigation", { name: "Ana gezinme" });
    await expect(monthLabel(page)).not.toHaveAttribute("data-month", "");
    await openSection(page, "Giderler");
    await setMonth(page, "2024-01");
    await page.locator("#expense-manual").click(); await page.getByLabel("Kategori", { exact: true }).fill("Sentetik korunacak taslak");
    await openSection(page, "Ürünler"); await expect(page.getByRole("heading", { name: "Kaydedilmemiş bilgileri bırak?", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Düzenlemeye devam et", exact: true }).click(); await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik korunacak taslak");
    await expect(nav.getByRole("button", { name: "Giderler", exact: true })).toHaveAttribute("aria-current", "page");
    await openSection(page, "Ürünler"); await page.getByRole("button", { name: "Bilgileri bırak", exact: true }).click();
    await expect(nav.getByRole("button", { name: "Ürünler", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(monthLabel(page)).toHaveAttribute("data-month", "2024-01");
    await openSection(page, "Giderler"); await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await page.locator("#expense-manual").click(); await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
