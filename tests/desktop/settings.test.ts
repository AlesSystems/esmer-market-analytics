import { test, expect, _electron as electron, type ElectronApplication } from "@playwright/test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { businessPackage } from "../helpers/business-fixtures";
import {openSettings, openWorkspace } from "../helpers/desktop-navigation";
// Launch opens Bu ay (#103/#105); data import, SQL and recovery are reached through Ayarlar.
import { openStore } from "../../src/store/store";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin"
  ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`)
  : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));
const capture = async (app: ElectronApplication, path: string) => writeFile(path, Buffer.from(await app.evaluate(async ({ BrowserWindow }) => (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString("base64")), "base64"));
const zoom = (app: ElectronApplication) => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.getZoomFactor());

test("Ayarlar owns data import, live connection, recovery and a persisted text size", async () => {
  test.setTimeout(60_000);
  const userData = await mkdtemp(join(tmpdir(), "esmer-settings-"));
  const store = openStore(join(userData, "analytics.sqlite")); store.importPackage(businessPackage()); store.close();
  const { version } = JSON.parse(await readFile("package.json", "utf8"));
  let app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    let page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("heading", { name: "Bu ay", level: 1 })).toBeVisible();
    await expect(page.getByText("İşlemler", { exact: true })).toHaveCount(0);
    await expect(page.getByText("Bağlantı ayarları", { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: "Canlı bağlantı kapalı", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ayarlar", level: 1 })).toBeFocused();
    await expect(page.getByRole("button", { name: "Ayarlar", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("navigation", { name: "Ana gezinme" }).locator("[aria-current]")).toHaveCount(0);
    for (const name of ["Etkin veriler", "Veri içe aktarma", "Canlı bağlantı", "Yedekleme ve kurtarma", "Görünüm", "Hakkında"])
      await expect(page.getByRole("region", { name, exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Veri içe aktarma" }).getByRole("button", { name: "Veri paketi içe aktar", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Canlı bağlantı" }).getByRole("button", { name: "SQL kaynağını içe aktar", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Hakkında" })).toContainText(`Sürüm ${version}`);
    await expect(page.getByRole("radio", { name: "Normal", exact: true })).toBeChecked();
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1280, 1040));
    await page.waitForTimeout(1200);
    await capture(app, "test-results/settings-desktop.png");
    await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
    await expect(page.getByRole("button", { name: "Canlı bağlantı kapalı", exact: true })).toBeFocused();

    await openSettings(page);
    await page.getByRole("radio", { name: "Büyük", exact: true }).check();
    await expect.poll(() => zoom(app)).toBeCloseTo(1.15);
    expect(JSON.parse(await readFile(join(userData, "preferences.json"), "utf8"))).toEqual({ textSize: "large", selectedMonth: "2025-09" });
    await page.getByRole("button", { name: "Yedekleme ve kurtarma", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yedekleme ve kurtarma", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Bu ay", level: 1 })).toBeVisible();
    await expect(page.getByRole("button", { name: "Ayarlar", exact: true })).toBeFocused();
    await app.close();

    app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("heading", { name: "Bu ay", level: 1 })).toBeVisible();
    await expect.poll(() => zoom(app)).toBeCloseTo(1.15);
    await openSettings(page);
    await expect(page.getByRole("radio", { name: "Büyük", exact: true })).toBeChecked();
    await page.getByRole("radio", { name: "Çok büyük", exact: true }).check();
    await expect.poll(() => zoom(app)).toBeCloseTo(1.3);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(680, 760));
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
    await page.getByRole("region", { name: "Görünüm", exact: true }).scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await capture(app, "test-results/settings-680-larger.png");
    await page.getByRole("radio", { name: "Normal", exact: true }).check();
    await expect.poll(() => zoom(app)).toBeCloseTo(1);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(760, 1500));
    await page.waitForTimeout(1200);
    await capture(app, "test-results/settings-narrow.png");
    await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "Ana gezinme" }).locator("[aria-current]")).toHaveCount(1);
  } finally { await app.close().catch(() => {}); await rm(userData, { recursive: true, force: true }); }
});

test("a SQL import that cannot reach its source opens Ayarlar with the reason", async () => {
  test.setTimeout(60_000);
  const userData = await mkdtemp(join(tmpdir(), "esmer-settings-sql-"));
  const sourceFile = join(userData, "test-source.json");
  await writeFile(sourceFile, JSON.stringify({ server: "localhost", port: 1, database: "synthetic", user: "reader", password: "SYNTHETIC_SECRET_SENTINEL", scope: "isolated-copy", lineage: "synthetic", expectedDatabaseId: "00000000-0000-0000-0000-000000000000", from: "2025-09-01", to: "2025-09-30" }), { mode: 0o600 });
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("heading", { name: "Kâr tahmini için veri paketi gerekiyor", exact: true })).toBeVisible();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, sourceFile);
    await openSettings(page);
    await page.getByRole("region", { name: "Canlı bağlantı" }).getByRole("button", { name: "SQL kaynağını içe aktar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ayarlar", level: 1 })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("region", { name: "Canlı bağlantı" }).getByRole("alert")).toHaveText("Kaynağa ulaşılamadı.", { timeout: 30_000 });
    await expect(page.getByRole("region", { name: "Canlı bağlantı" })).toContainText("Henüz geçerli yerel veri yok.");
    await page.screenshot({ path: "test-results/settings-sql-unreachable.png", fullPage: true, animations: "disabled" });
  } finally { await app.close().catch(() => {}); await rm(userData, { recursive: true, force: true }); }
});
