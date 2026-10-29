import { test, expect, _electron as electron, type ElectronApplication } from "@playwright/test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { businessPackage } from "../helpers/business-fixtures";
import { richEstimatePackage } from "../helpers/rich-estimate-fixture";
import {openSettings, openSettingsItem, openWorkspace, settingsMenu } from "../helpers/desktop-navigation";
// Launch opens Bu ay (#103/#105); data import, SQL and recovery are reached through Ayarlar.
import { openStore } from "../../src/store/store";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin"
  ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`)
  : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));
const capture = async (app: ElectronApplication, path: string) => writeFile(path, Buffer.from(await app.evaluate(async ({ BrowserWindow }) => (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString("base64")), "base64"));
const zoom = (app: ElectronApplication) => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getZoomFactor());

test("the gear menu owns data import, recovery, live connection, source documents, about and a persisted text size", async () => {
  test.setTimeout(60_000);
  const userData = await mkdtemp(join(tmpdir(), "esmer-settings-"));
  const store = openStore(join(userData, "analytics.sqlite")); store.importPackage(businessPackage()); store.importSourcePreview(richEstimatePackage()); store.close();
  const { version } = JSON.parse(await readFile("package.json", "utf8"));
  let app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    let page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("heading", { name: "Ekim 2025", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Canlı bağlantı/ })).toHaveCount(0);

    const gear = page.getByRole("button", { name: "Ayarlar", exact: true });
    await gear.click();
    const menu = settingsMenu(page);
    await expect(menu).toBeVisible();
    await expect(gear).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("button")).toHaveText([/^Veri paketi içe aktar/, /^Yedekle \/ Geri yükle/, /^Canlı bağlantı/, /^Kaynak belgeler/, /^Hakkında ve bilinen sınırlar/]);
    await expect(menu.getByRole("button", { name: /^Veri paketi içe aktar/ })).toContainText("Şu anki veri sonu: 31.10.2025");
    await expect(menu.getByRole("button", { name: /^Canlı bağlantı/ })).toContainText("Bağlantı kapalı");
    await expect(menu.getByRole("radio", { name: "Normal", exact: true })).toBeChecked();
    // Escape closes the menu and returns focus to the gear; so does a press outside.
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(gear).toBeFocused();
    await gear.click();
    await page.mouse.click(8, 400);
    await expect(menu).toBeHidden();

    // About: version, package range, data end and the limitations list.
    await openSettings(page);
    await menu.getByRole("button", { name: /^Hakkında ve bilinen sınırlar/ }).click();
    await expect(menu).toContainText(version);
    await expect(menu.getByText("Veri sonu", { exact: true })).toBeVisible();
    await expect(page.locator(".limitations li").first()).toBeVisible();
    await expect(page.locator(".limitations")).toContainText("Tahmin doğrulanmış kâr değildir");
    await expect(page.getByRole("region", { name: "Bilinen sınırlar", exact: true })).toHaveAttribute("tabindex", "0");
    await menu.getByRole("button", { name: "Hakkında ve bilinen sınırlar" }).click();
    await expect(menu.getByRole("radio", { name: "Normal", exact: true })).toBeVisible();

    // Text size persists and applies the Electron zoom.
    await menu.getByRole("radio", { name: "Büyük", exact: true }).check();
    await expect.poll(() => zoom(app)).toBeCloseTo(1.15);
    expect(JSON.parse(await readFile(join(userData, "preferences.json"), "utf8"))).toEqual({ textSize: "large" });

    // Recovery is a full-page view; going back lands on Bu ay with focus on the gear.
    await menu.getByRole("button", { name: /^Yedekle \/ Geri yükle/ }).click();
    await expect(menu).toBeHidden();
    await expect(page.getByRole("heading", { name: "Yedekleme ve kurtarma", exact: true })).toBeFocused();
    await expect(page.getByRole("navigation", { name: "Ana gezinme" }).locator("[aria-current]")).toHaveCount(0);
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ekim 2025", level: 1 })).toBeVisible();
    await expect(gear).toBeFocused();
    await app.close();

    app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("heading", { name: "Ekim 2025", level: 1 })).toBeVisible();
    await expect.poll(() => zoom(app)).toBeCloseTo(1.15);
    await openSettings(page);
    await expect(page.getByRole("radio", { name: "Büyük", exact: true })).toBeChecked();
    await page.getByRole("radio", { name: "Çok büyük", exact: true }).check();
    await expect.poll(() => zoom(app)).toBeCloseTo(1.3);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(680, 760));
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await page.waitForTimeout(600);
    await capture(app, "test-results/settings-680-larger.png");
    await page.getByRole("radio", { name: "Normal", exact: true }).check();
    await expect.poll(() => zoom(app)).toBeCloseTo(1);
    await page.keyboard.press("Escape");
  } finally { await app.close().catch(() => {}); await rm(userData, { recursive: true, force: true }); }
});

test("a SQL import that cannot reach its source opens the live connection panel with the reason", async () => {
  test.setTimeout(60_000);
  const userData = await mkdtemp(join(tmpdir(), "esmer-settings-sql-"));
  const sourceFile = join(userData, "test-source.json");
  await writeFile(sourceFile, JSON.stringify({ server: "localhost", port: 1, database: "synthetic", user: "reader", password: "SYNTHETIC_SECRET_SENTINEL", scope: "isolated-copy", lineage: "synthetic", expectedDatabaseId: "00000000-0000-0000-0000-000000000000", from: "2025-09-01", to: "2025-09-30" }), { mode: 0o600 });
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("heading", { name: "Kâr tahmini için veri paketi gerekiyor", exact: true })).toBeVisible();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, sourceFile);
    await openSettingsItem(page, /^Canlı bağlantı/);
    await page.getByRole("region", { name: "Canlı bağlantı" }).getByRole("button", { name: "SQL kaynağını içe aktar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Canlı bağlantı", level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("region", { name: "Canlı bağlantı" }).getByRole("alert")).toHaveText("Kaynağa ulaşılamadı.", { timeout: 30_000 });
    await expect(page.getByRole("region", { name: "Canlı bağlantı" })).toContainText("Henüz geçerli yerel veri yok.");
    await page.screenshot({ path: "test-results/settings-sql-unreachable.png", fullPage: true, animations: "disabled" });
  } finally { await app.close().catch(() => {}); await rm(userData, { recursive: true, force: true }); }
});

for (const failure of [false, true]) test(`pending initial source ${failure ? "failure" : "success"} never shows the Veri paketi item as ready`, async () => {
  test.setTimeout(60_000);
  const userData = await mkdtemp(join(tmpdir(), "esmer-settings-pending-"));
  const store = openStore(join(userData, "analytics.sqlite")); store.importPackage(businessPackage()); store.close();
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow(); await openWorkspace(page);
    await app.evaluate(({ ipcMain }, failed) => {
      const registry = ipcMain as unknown as { _invokeHandlers: Map<string, (event: unknown, operation: string, payload: unknown) => unknown> }, original = registry._invokeHandlers.get("esmer:request")!;
      ipcMain.removeHandler("esmer:request");
      ipcMain.handle("esmer:request", async (event, operation, payload) => { const result = await original(event, operation, payload); return operation === "querySourceWorkspace" ? new Promise(resolve => Reflect.set(globalThis, "releaseInitialSource", () => resolve(failed ? { status: "source-unavailable", code: "SERVICE_UNAVAILABLE", message: "Sentetik kaynak hatası" } : result))) : result; });
    }, failure);
    await page.reload(); await openWorkspace(page);
    await openSettings(page);
    const item = settingsMenu(page).getByRole("button", { name: /^Veri paketi içe aktar/ });
    await expect(item).toContainText("Kaynak durumu kontrol ediliyor…");
    await expect(item).not.toContainText("Şu anki veri sonu");
    await expect(item).toBeEnabled();
    await expect(settingsMenu(page).getByRole("button", { name: /^Yedekle \/ Geri yükle/ })).toBeEnabled();
    await app.evaluate(() => Reflect.get(globalThis, "releaseInitialSource")?.());
    if (failure) { await expect(item).toContainText("Sentetik kaynak hatası"); await expect(item).not.toContainText("Şu anki veri sonu"); }
    else await expect(item).toContainText("Şu anki veri sonu");
  } finally { await app.evaluate(() => Reflect.get(globalThis, "releaseInitialSource")?.()).catch(() => {}); await app.close().catch(() => {}); await rm(userData, { recursive: true, force: true }); }
});
