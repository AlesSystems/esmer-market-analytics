import { openWorkspace } from "../helpers/desktop-navigation";
import { expect, test, _electron as electron } from "@playwright/test";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import { readSheet } from "read-excel-file/node";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { populateRecoveryStore } from "../helpers/recovery-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("packaged recovery restores a real encrypted backup after original user data is lost", async () => {
  const root = await mkdtemp(join(tmpdir(), "esmer-recovery-desktop-"));
  const original = join(root, "original"), fresh = join(root, "fresh"), destination = join(root, "backups"), keyPath = join(root, "independent-key.txt");
  const {mkdir} = await import("node:fs/promises");
  await Promise.all([mkdir(original), mkdir(fresh), mkdir(destination)]);
  const store = openStore(join(original, "analytics.sqlite"));
  const accepted = await populateRecoveryStore(store);
  store.close();
  let app = await electron.launch({executablePath, args: [`--user-data-dir=${original}`]});
  try {
    await app.evaluate(({safeStorage, dialog}, paths) => {
      if (process.platform !== "win32") {
        // Avoid a machine Keychain prompt outside Windows acceptance.
        safeStorage.isEncryptionAvailable = () => true;
        safeStorage.getSelectedStorageBackend = () => "kwallet";
        safeStorage.encryptString = value => Buffer.from(value, "utf8");
        safeStorage.decryptString = bytes => bytes.toString("utf8");
      }
      dialog.showMessageBox = async () => ({response: 0, checkboxChecked: false});
      dialog.showSaveDialog = async () => ({canceled: false, filePath: paths.keyPath});
      dialog.showOpenDialog = (async (...args: unknown[]) => { const options = args.at(-1) as {properties?: string[]}; return {canceled: false, filePaths: options.properties?.includes("openDirectory") ? [paths.destination] : [paths.keyPath]}; }) as typeof dialog.showOpenDialog;
    }, {destination, keyPath});
    if (process.platform === "win32") {
      expect(await app.evaluate(({safeStorage}) => {
        const sample = "synthetic-dpapi-proof";
        const protectedBytes = safeStorage.encryptString(sample);
        return safeStorage.isEncryptionAvailable() && !protectedBytes.equals(Buffer.from(sample)) && safeStorage.decryptString(protectedBytes) === sample;
      })).toBe(true);
    }
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
    await page.getByRole("button", {name: "Yedekleme ve kurtarma"}).click();
    await page.getByRole("button", {name: "Yedeklemeyi kur"}).click();
    await expect(page.getByText("Kurtarma anahtarı doğrulandı ve yedekleme kuruldu.")).toBeVisible();
    await expect.poll(async () => (await readdir(destination)).filter(name => name.endsWith(".esmerbackup")).length).toBeGreaterThan(0);
    await page.screenshot({path: "test-results/phase-9-recovery-1120.png", fullPage: true});
    await page.setViewportSize({width: 680, height: 720});
    await expect(page.locator(".brand")).toBeVisible();
    await page.screenshot({path: "test-results/phase-9-recovery-680.png", fullPage: true});
    expect((await readFile(keyPath)).length).toBeGreaterThan(50);
    await app.close();
    await rm(original, {recursive: true, force: true});
    app = await electron.launch({executablePath, args: [`--user-data-dir=${fresh}`]});
    const backupPath = join(destination, (await readdir(destination)).find(name => name.endsWith(".esmerbackup"))!);
    await app.evaluate(({dialog}, paths) => {
      dialog.showOpenDialog = (async (...args: unknown[]) => { const options = args.at(-1) as {filters?: {extensions?: string[]}[]}; return {canceled: false, filePaths: options.filters?.some(filter => filter.extensions?.includes("txt")) ? [paths.keyPath] : [paths.backupPath]}; }) as typeof dialog.showOpenDialog;
      dialog.showMessageBox = async () => ({response: 0, checkboxChecked: false});
    }, {backupPath, keyPath});
    const restored = await app.firstWindow();await openWorkspace(restored);
    await restored.getByRole("button", {name: "Yedekleme ve kurtarma"}).click();
    await restored.getByRole("button", {name: "Yedek ve anahtar seç"}).click();
    await expect(restored.getByRole("heading", {name: "Geri yükleme önizlemesi"})).toBeVisible();
    await expect(restored.getByText(/Veri kesim tarihi: 30\.09\.2025/)).toBeVisible();
    await restored.screenshot({path: "test-results/phase-9-restore-preview-1120.png", fullPage: true});
    await restored.setViewportSize({width: 680, height: 720});
    await expect(restored.locator(".brand")).toBeVisible();
    await restored.screenshot({path: "test-results/phase-9-restore-preview-680.png", fullPage: true});
    await restored.getByRole("button", {name: "Geri yüklemeyi onayla"}).click();
    await expect(restored.getByRole("heading", { name: "Verileriniz bu bilgisayarda hazır", exact: true })).toBeVisible();
    await restored.getByLabel("Dönem", { exact: true }).fill("2025-09");
    await expect(restored.getByRole("heading", {name: "Ay bir bakışta"})).toBeVisible();
    expect(await restored.evaluate(() => window.esmer.getAvailability())).toMatchObject({status: "ready", store: "loaded"});
    await restored.getByRole("button", {name: "Raporlar"}).click();
    await restored.getByRole("button", { name: "Sürüm listesine dön", exact: true }).click();
    await restored.getByRole("button", {name: "Kaydedilmiş sürümü aç"}).click();
    await expect(restored.locator(".monthly-amount")).toHaveText("40,00 ₺");
    await expect(restored.locator(".financial-ledger").locator("dt", {hasText: "Net satış (KDV hariç)"}).locator("xpath=following-sibling::dd")).toContainText("100,00 ₺");
    await expect(restored.locator(".monthly-operating")).toContainText("Hesaba alınan gider: 60,00 ₺");
    const restoredStore = openStore(join(fresh, "analytics.sqlite"));
    try { expect(restoredStore.readReport(accepted.id)?.output.report).toEqual(accepted); }
    finally { restoredStore.close(); }
    const displayed = await restored.evaluate(reportId => window.esmer.readReportVersion({reportId}), accepted.id);
    expect(displayed).toMatchObject({status: "monthly", report: {sales: {metrics: {netSales: "100"}}, purchasing: {gross: {coveredGrossProfit: "40"}}, operating: {result: {expenses: "60"}}}});
    const excelPath = join(root, "restored-report.xlsx");
    await app.evaluate(({dialog}, filePath) => { dialog.showSaveDialog = async () => ({canceled: false, filePath}); }, excelPath);
    expect(await restored.evaluate(reportId => window.esmer.exportReportVersion({reportId}), accepted.id)).toMatchObject({status: "saved"});
    const summary = await readSheet(await readFile(excelPath), "Özet");
    expect(summary.flat()).toContain(accepted.id);
    expect(summary.flat()).toContain(100);
  } finally { await app.close(); await rm(root, {recursive: true, force: true}); }
});
