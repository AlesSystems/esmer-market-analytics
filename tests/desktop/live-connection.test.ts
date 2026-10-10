import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { businessPackage } from "../helpers/business-fixtures";
import { openStore } from "../../src/store/store";
import { openSettings } from "../helpers/desktop-navigation";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin"
  ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`)
  : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));
test("packaged SQL connection preserves local reports and encrypts configuration through restart", async () => {
  test.setTimeout(60_000);
  const userData = await mkdtemp(join(tmpdir(), "esmer-live-desktop-"));
  const config = process.env.ESMER_SQL_TEST_CONFIG
    ? JSON.parse(await readFile(process.env.ESMER_SQL_TEST_CONFIG, "utf8"))
    : {server: "localhost", port: 1, database: "synthetic", user: "reader", password: "SYNTHETIC_SECRET_SENTINEL", scope: "isolated-copy", lineage: "synthetic", expectedDatabaseId: "00000000-0000-0000-0000-000000000000", from: "2025-09-01", to: "2025-09-30"};
  const sourceFile = join(userData, "test-source.json");
  await writeFile(sourceFile, JSON.stringify(config), {mode: 0o600});
  const seed = openStore(join(userData, "analytics.sqlite"));
  seed.importPackage(businessPackage());
  const before = seed.readSnapshot(); seed.close();
  let app = await electron.launch({executablePath, args: [`--user-data-dir=${userData}`]});
  try {
    let page = await app.firstWindow();
    await expect(page.getByRole("heading", {name: "Ay bir bakışta", exact: true})).toBeVisible();
    await expect(page.getByRole("button", {name: "Test bağlantısını ayarla", exact: true})).toBeHidden();
    await openSettings(page);
    await expect(page.getByRole("button", {name: "Test bağlantısını ayarla", exact: true})).toBeHidden();
    await app.evaluate(({dialog}, path) => {dialog.showOpenDialog = async () => ({canceled: false, filePaths: [path]});}, sourceFile);
    await page.getByRole("button", {name: "SQL kaynağını içe aktar", exact: true}).click();
    const configured = Boolean(process.env.ESMER_SQL_TEST_CONFIG);
    if (configured) {
      await expect(page.getByText("Kaynak kayıtlarının özeti", {exact: false})).toBeVisible({timeout: 30_000});
      expect(await page.evaluate(() => window.esmer.getLiveStatus())).toMatchObject({status: "live", configured: true, live: {phase: "idle", lastRecord: "preview"}});
      await openSettings(page);
    } else {
      await expect(page.getByText("Kaynağa ulaşılamadı.", {exact: true})).toBeVisible({timeout: 30_000});
      expect(await page.evaluate(() => window.esmer.getLiveStatus())).toMatchObject({status: "live", configured: true, live: {phase: "stale", lastSuccessAt: null}});
      await expect(page.getByRole("button", {name: "Canlı kaynak doğrulanamadı", exact: true})).toBeVisible();
      await page.getByRole("button", {name: "Kaynağı yeniden kontrol et", exact: true}).click();
      await expect(page.getByText("Kaynağa ulaşılamadı.", {exact: true})).toBeVisible({timeout: 30_000});
    }
    await expect(page.getByRole("button", {name: "Test bağlantısını ayarla", exact: true})).toBeVisible();
    const status = await page.evaluate(() => window.esmer.getLiveStatus());
    expect(JSON.stringify(status)).not.toContain(config.password);
    expect((await readFile(join(userData, "live-source.enc"))).includes(Buffer.from(config.password))).toBe(false);
    await page.screenshot({path: "test-results/live-fallback.png", fullPage: true});
    await page.getByRole("button", {name: "Bağlantıyı kapat", exact: true}).click();
    await expect(page.getByRole("button", {name: "Test bağlantısını aç", exact: true})).toBeVisible();
    await expect(page.getByRole("button", {name: "Canlı bağlantı kapalı", exact: true})).toBeVisible();
    await page.getByRole("button", {name: "Ayarları kapat", exact: true}).click();
    if (!configured) await expect(page.getByRole("region", {name: "Aylık performans"})).toContainText("200,00 ₺");
    await app.close();
    app = await electron.launch({executablePath, args: [`--user-data-dir=${userData}`]});
    page = await app.firstWindow();
    await openSettings(page);
    await expect(page.getByRole("button", {name: "Test bağlantısını aç", exact: true})).toBeVisible();
    expect(await page.evaluate(() => window.esmer.getLiveStatus())).toMatchObject({status: "live", configured: true, live: {phase: "disabled"}});
    await page.getByRole("button", {name: "Ayarları kapat", exact: true}).click();
    if(configured) await expect(page.getByRole("region", {name: "Kaynak kayıt göstergeleri"})).toBeVisible();
    else await expect(page.getByRole("region", {name: "Aylık performans"})).toContainText("200,00 ₺");
    await app.close();
    const store = openStore(join(userData, "analytics.sqlite"));
    try {expect(store.readSnapshot()).toEqual(before);} finally {store.close();}
  } finally {await app.close().catch(() => {}); await rm(userData, {recursive: true, force: true});}
});
