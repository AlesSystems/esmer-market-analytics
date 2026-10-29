import { test, expect, _electron as electron, type ElectronApplication, type Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { executablePath } from "../helpers/desktop-executable";
import { monthLabel, openSection, openSettings, openSettingsItem, openWorkspace, settingsMenu } from "../helpers/desktop-navigation";
import { monthProfitPackage, monthProfitSnapshot } from "../helpers/month-profit-fixture";

// Review fixes on the three-tab shell. Synthetic October 2025 package (August to October), nothing private.
async function launch(withPackage = true): Promise<{ app: ElectronApplication; page: Page; userData: string }> {
  const userData = await mkdtemp(join(tmpdir(), "review-fixes-"));
  if (withPackage) { const store = openStore(join(userData, "analytics.sqlite")); try { store.importSourcePreview(monthProfitPackage({ ...monthProfitSnapshot(), to: "2025-10-31" })); } finally { store.close(); } }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  const page = await app.firstWindow(); await openWorkspace(page);
  return { app, page, userData };
}
const finish = async (app: ElectronApplication, userData: string) => { await app.close().catch(() => undefined); await rm(userData, { recursive: true, force: true }); };

/** Answers one IPC operation from `globalThis.__answers[operation]` (a JSON value, or `{hold: month}` style hooks below) and lets every other operation through. */
async function answer(app: ElectronApplication, operation: string, value: unknown) {
  await app.evaluate(({ ipcMain }, [name, json]) => {
    const registry = ipcMain as unknown as { _invokeHandlers: Map<string, (...args: unknown[]) => unknown> };
    const store = globalThis as unknown as { __answers?: Record<string, unknown>; __wrapped?: boolean };
    store.__answers = { ...store.__answers, [name]: JSON.parse(json) };
    if (store.__wrapped) return;
    store.__wrapped = true;
    const original = registry._invokeHandlers.get("esmer:request")!;
    ipcMain.removeHandler("esmer:request");
    ipcMain.handle("esmer:request", (...args) => { const known = store.__answers?.[String(args[1])]; return known !== undefined ? known : original(...args); });
  }, [operation, JSON.stringify(value)] as const);
}
/** Holds the answer to readMonthProfit for one month until released. */
async function hold(app: ElectronApplication, month: string) {
  await app.evaluate(({ ipcMain }, held) => {
    const registry = ipcMain as unknown as { _invokeHandlers: Map<string, (...args: unknown[]) => unknown> };
    const original = registry._invokeHandlers.get("esmer:request")!;
    ipcMain.removeHandler("esmer:request");
    ipcMain.handle("esmer:request", async (...args) => {
      if (args[1] === "readMonthProfit" && (args[2] as { month: string }).month === held) await new Promise<void>(resolve => { Reflect.set(globalThis, "releaseMonth", resolve); });
      return original(...args);
    });
  }, month);
}
const release = (app: ElectronApplication) => app.evaluate(() => (Reflect.get(globalThis, "releaseMonth") as (() => void) | undefined)?.());
const save = (page: Page, requestId: string) =>
  page.evaluate(requestId => window.esmer.createExpense({ action: "save", requestId, duplicateReview: null, fields: { date: "2025-10-05", paymentDate: null, category: "Kira", classification: "operating-expense", net: "10", tax: "0", gross: "10", taxTreatment: "non-recoverable", taxEvidence: "synthetic-tax", supportingReference: null, sourceReference: null, labourPeriod: null, loss: null } } as never), requestId);
const gear = (page: Page, name: string | RegExp = "Ayarlar") => page.getByRole("button", { name, exact: typeof name === "string" });
const stale = { status: "live", configured: true, cutoff: null, live: { phase: "stale", error: "SOURCE_UNAVAILABLE", lastAttemptAt: "2025-10-31T09:00:00.000Z", lastSuccessAt: null, lastDatasetId: null, lastRecord: "none", persistenceError: false } };
const backup = (state: string) => ({ status: "recovery", state, lastVerifiedAt: null, backups: [] });

test("an open Elle ekle draft survives opening and closing the gear overlays, and recovery still asks before leaving it", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch();
  try {
    await openSection(page, "Giderler");
    await page.locator("#expense-manual").click();
    await page.getByLabel("Kategori", { exact: true }).fill("Sentetik taslak");
    for (const item of [/^Kaynak belgeler/, /^Canlı bağlantı/]) {
      await openSettingsItem(page, item);
      await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
      await expect(page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Giderler", exact: true })).toHaveAttribute("aria-current", "page");
      await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik taslak");
    }
    await openSettings(page);
    await settingsMenu(page).getByRole("button", { name: /^Hakkında ve bilinen sınırlar/ }).click();
    await page.keyboard.press("Escape");
    await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik taslak");
    // Recovery replaces the workspace, so it still goes through the draft prompt.
    await openSettingsItem(page, /^Yedekle \/ Geri yükle/);
    await expect(page.getByRole("heading", { name: "Kaydedilmemiş bilgileri bırak?" })).toBeVisible();
    await page.getByRole("button", { name: "Düzenlemeye devam et", exact: true }).click();
    await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik taslak");
  } finally { await finish(app, userData); }
});

test("backup trouble shows in the gear menu and on the gear", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch();
  try {
    for (const [state, line, attention] of [["failed", "Dikkat gerekiyor", true], ["pending", "Yedek sırada", false], ["running", "Yedek alınıyor", false]] as const) {
      await answer(app, "getRecoveryStatus", backup(state));
      await page.reload(); await openWorkspace(page);
      await expect(gear(page, attention ? "Ayarlar, dikkat gerekiyor" : "Ayarlar")).toBeVisible();
      await openSettings(page);
      await expect(settingsMenu(page).getByRole("button", { name: /^Yedekle \/ Geri yükle/ })).toContainText(line);
      await page.keyboard.press("Escape");
    }
  } finally { await finish(app, userData); }
});

test("live trouble shows on the gear and in its menu item, a disabled or healthy connection shows nothing", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch();
  try {
    await expect(gear(page)).toBeVisible();
    await answer(app, "getLiveStatus", { ...stale, live: { ...stale.live, phase: "disabled", error: null } });
    await page.reload(); await openWorkspace(page);
    await expect(gear(page)).toBeVisible();
    await answer(app, "getLiveStatus", stale);
    await page.reload(); await openWorkspace(page);
    await expect(gear(page, "Ayarlar, dikkat gerekiyor")).toBeVisible();
    await openSettings(page);
    await expect(settingsMenu(page).getByRole("button", { name: /^Canlı bağlantı/ })).toContainText("Güncellik doğrulanamadı");
  } finally { await finish(app, userData); }
});

test("a pending manual-expense receipt resolves and locks navigation even when the expense read fails", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch();
  try {
    expect(await save(page, "pending-1")).toMatchObject({ status: "saved" });
    await page.evaluate(() => localStorage.setItem("esmer.pending-manual-expense", "pending-1"));
    await answer(app, "queryExpenses", { status: "failed", code: "SERVICE_UNAVAILABLE", message: "Sentetik okuma hatası" });
    await openSection(page, "Giderler");
    await expect(page.getByRole("alert").filter({ hasText: "Sentetik okuma hatası" })).toBeVisible();
    await expect(page.getByRole("status").filter({ hasText: "Gider kaydedildi." })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense"))).toBeNull();
  } finally { await finish(app, userData); }
});

test("a month far outside the data range steps back into it from Bu ay", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch();
  try {
    await openSection(page, "Giderler");
    const stepper = page.getByRole("group", { name: "Dönem", exact: true });
    for (let step = 0; step < 2; step++) await stepper.getByRole("button", { name: "Sonraki ay", exact: true }).click();
    await expect(monthLabel(page)).toHaveAttribute("data-month", "2025-12");
    await openSection(page, "Bu ay");
    await expect(page.getByText("Aralık 2025 için veri yok", { exact: false })).toBeVisible();
    await expect(stepper.getByRole("button", { name: "Önceki ay", exact: true })).toHaveAttribute("aria-disabled", "false");
    await stepper.getByRole("button", { name: "Önceki ay", exact: true }).click();
    await expect(monthLabel(page)).toHaveAttribute("data-month", "2025-10");
    await expect(page.getByRole("heading", { name: "Ekim 2025", level: 1 })).toBeAttached();
  } finally { await finish(app, userData); }
});

test("while another month loads Bu ay and Ürünler show no figures under the new month label", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch();
  try {
    await expect(page.locator(".hero-num")).toBeVisible();
    await hold(app, "2025-09");
    await page.getByRole("group", { name: "Dönem", exact: true }).getByRole("button", { name: "Önceki ay", exact: true }).click();
    await expect(monthLabel(page)).toHaveAttribute("data-month", "2025-09");
    await expect(page.getByRole("status").filter({ hasText: "Bu ayın rakamları yükleniyor…" })).toBeVisible();
    await expect(page.locator(".hero-num")).toHaveCount(0);
    await expect(page.locator(".att-row")).toHaveCount(0);
    await release(app);
    await expect(page.locator(".hero-num")).toBeVisible();
    await openSection(page, "Ürünler");
    await expect(page.locator(".products-table")).toBeVisible();
    await hold(app, "2025-08");
    await page.getByRole("group", { name: "Dönem", exact: true }).getByRole("button", { name: "Önceki ay", exact: true }).click();
    await expect(monthLabel(page)).toHaveAttribute("data-month", "2025-08");
    await expect(page.getByRole("status").filter({ hasText: "Ürünler yükleniyor…" })).toBeVisible();
    await expect(page.locator(".products-table")).toHaveCount(0);
    await release(app);
    await expect(page.locator(".products-table")).toBeVisible();
  } finally { await release(app).catch(() => undefined); await finish(app, userData); }
});

test("Excel'e aktar stays focusable and says why it is unavailable", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch();
  const button = page.getByRole("button", { name: "Excel’e aktar", exact: true });
  try {
    await expect(button).toHaveAttribute("aria-disabled", "false");
    await openSection(page, "Giderler");
    const stepper = page.getByRole("group", { name: "Dönem", exact: true });
    await stepper.getByRole("button", { name: "Sonraki ay", exact: true }).click();
    await stepper.getByRole("button", { name: "Sonraki ay", exact: true }).click();
    await expect(monthLabel(page)).toHaveAttribute("data-month", "2025-12");
    await expect(button).toHaveAttribute("aria-disabled", "true");
    await button.focus();
    await expect(button).toBeFocused();
    await expect(button).toHaveAccessibleDescription("Bu ay veri paketinin dışında.");
  } finally { await finish(app, userData); }
  const empty = await launch(false);
  try {
    const none = empty.page.getByRole("button", { name: "Excel’e aktar", exact: true });
    await expect(none).toHaveAttribute("aria-disabled", "true");
    await none.focus();
    await expect(none).toBeFocused();
    await expect(none).toHaveAccessibleDescription("Önce maliyet bilgisi içeren bir veri paketi içe aktarın.");
  } finally { await finish(empty.app, empty.userData); }
});

test("Escape closes only the trust popover while the product drawer is open", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch();
  try {
    await openSection(page, "Ürünler");
    await expect(page.locator(".products-table")).toBeVisible();
    await page.locator(".products-table tr[data-product='1'] button").click();
    const drawer = page.getByRole("dialog", { name: "Süt" });
    await expect(drawer).toBeVisible();
    await page.getByRole("button", { name: "Tahmini", exact: true }).click();
    const popover = page.getByRole("dialog", { name: "Tahmini hakkında" });
    await expect(popover).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(popover).toHaveCount(0);
    await expect(drawer).toBeVisible();
    await page.locator(".products-table tr[data-product='1'] button").focus();
    await page.keyboard.press("Escape");
    await expect(drawer).toHaveCount(0);
  } finally { await finish(app, userData); }
});

test("the gear points aria-controls only at a menu that exists, and Hakkında returns focus to its own item", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch();
  try {
    await expect(gear(page)).not.toHaveAttribute("aria-controls", /.+/);
    await gear(page).click();
    await expect(gear(page)).toHaveAttribute("aria-controls", "settings-menu");
    await expect(page.locator("#settings-menu")).toBeVisible();
    const about = settingsMenu(page).getByRole("button", { name: /^Hakkında ve bilinen sınırlar/ });
    await about.click();
    await settingsMenu(page).getByRole("button", { name: "Hakkında ve bilinen sınırlar", exact: true }).click();
    await expect(settingsMenu(page).getByRole("button", { name: /^Hakkında ve bilinen sınırlar/ })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(gear(page)).not.toHaveAttribute("aria-controls", /.+/);
  } finally { await finish(app, userData); }
});
