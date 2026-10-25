import { importPackage, openSection, openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));
test("expenses are reachable without a source and cancelled selection leaves an empty period", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-expenses-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    await app.evaluate(({ dialog }) => { dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] }); });
    await page.getByRole("button", { name: "Excel’den içe aktar", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "İşlem iptal edildi" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true })).toBeVisible();
    await page.setViewportSize({ width: 680, height: 720 });
    await page.getByText("Hesap ayrıntıları ve içe aktarma geçmişi", { exact: true }).click();
    await page.getByText("Excel şablonu nasıl doldurulur?", { exact: true }).click();
    await page.screenshot({ path: "test-results/phase-7-expenses-empty-small.png", fullPage: true });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("expense workbook review, correction, reversal, history restoration and owner review persist", async () => {
  const { writeFile, stat } = await import("node:fs/promises");
  const { default: writeXlsxFile } = await import("write-excel-file/node");
  const { expenseColumns } = await import("../../src/expenses/template");
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-journey-"));
  const workbookPath = join(userData, "expenses.xlsx"), templatePath = join(userData, "template.xlsx");
  const rows = [expenseColumns, ["ref-1", "15.01.2026", "01.02.2026", "Kira", "operating-expense", "50,00", "0", "50", "non-recoverable", "tax-1", "bill-1", "", "", ""]];
  await writeFile(workbookPath, await writeXlsxFile(rows.map(row => row.map(value => ({ type: String, value })))).toBuffer());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await page.getByLabel("Dönem", { exact: true }).fill("2026-01");
    await app.evaluate(({ dialog }, path) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: path }); }, templatePath);
    await page.getByRole("button", { name: "Şablonu indir", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Excel şablonu kaydedildi." })).toBeVisible();
    expect((await stat(templatePath)).size).toBeGreaterThan(0);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, workbookPath);
    await page.getByRole("button", { name: "Excel’den içe aktar", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Excel önizlemesi" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bu ayın giderleri", exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => window.esmer.queryExpenses({ period: "2026-01" }))).toMatchObject({ status: "expenses", rows: [] });
    await page.getByRole("button", { name: "İçe aktar", exact: true }).click();
    const rent = page.locator("[data-group=rent] dd");
    await expect(rent).toHaveText("50,00 ₺");
    await expect(page.getByRole("heading", { name: "Onay bekliyor", exact: true })).toBeVisible();
    await page.getByText(/^Tüm kayıtlar/).click();
    await page.getByRole("button", { name: "İncele / düzelt" }).click();
    await expect(page.getByRole("heading", { name: "Gideri incele ve düzelt" })).toBeFocused();
    await page.getByLabel("Net tutar", { exact: true }).fill("60");
    await page.getByLabel("Brüt tutar", { exact: true }).fill("60");
    await page.getByLabel("Değişiklik gerekçesi").fill("Belge toplamı düzeltildi");
    await page.getByRole("button", { name: "Düzeltmeyi kaydet" }).click();
    await expect(rent).toHaveText("60,00 ₺");
    await page.getByRole("button", { name: "İncele / düzelt" }).click();
    await page.getByLabel("Değişiklik gerekçesi").fill("Kontrol için geri alma");
    await page.getByRole("button", { name: "Gideri geri al", exact: true }).click();
    await expect(page.getByText("Bu ay sayılan gider yok · 1 kayıt toplam dışında veya geri alınmış.", { exact: true })).toBeVisible();
    await expect(page.getByText("Tüm kayıtlar (1)", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "İncele / düzelt" }).click();
    await page.getByLabel("Değişiklik gerekçesi").fill("İlk belgeyi geri yükle");
    await page.getByRole("button", { name: "Sürüm 1 geri yükle", exact: true }).click();
    await expect(rent).toHaveText("50,00 ₺");
    await page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Bu ayın giderleri onaylandı." })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Onaylandı", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "İncele / düzelt" }).click();
    await expect(page.getByText("Güncel sürüm", { exact: true })).toHaveCount(1);
    await expect(page.getByText("Önceki sürüm", { exact: true })).toHaveCount(2);
    await page.screenshot({ path: "test-results/phase-7-expenses-history.png", fullPage: true });
    await page.setViewportSize({ width: 680, height: 720 });
    await page.screenshot({ path: "test-results/phase-7-expenses-small.png", fullPage: true });
    await page.getByLabel("Dönem", { exact: true }).fill("2026-02");
    await page.getByText("Hesap ayrıntıları ve içe aktarma geçmişi", { exact: true }).click();
    await expect(page.locator(".expense-totals > div").first()).toContainText("0,00 ₺");
    await expect(page.locator(".expense-totals > div").nth(1)).toContainText("50,00 ₺");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("invalid rows block a whole workbook and duplicate candidates require explicit decisions", async () => {
  const { writeFile } = await import("node:fs/promises");
  const { default: writeXlsxFile } = await import("write-excel-file/node");
  const { expenseColumns } = await import("../../src/expenses/template");
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-review-")), workbookPath = join(userData, "review.xlsx");
  const good = ["ref-a", "15.01.2026", "", "Kira", "operating-expense", "50", "0", "50", "non-recoverable", "tax-a", "bill-a", "", "", ""];
  async function write(rows: string[][]) { await writeFile(workbookPath, await writeXlsxFile([expenseColumns, ...rows].map(row => row.map(value => ({ type: String, value })))).toBuffer()); }
  await write([good, ["ref-b", "31.02.2026", ...good.slice(2)]]);
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await page.getByLabel("Dönem", { exact: true }).fill("2026-01");
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, workbookPath);
    await page.getByRole("button", { name: "Excel’den içe aktar", exact: true }).click();
    await expect(page.getByRole("button", { name: "İçe aktar", exact: true })).toBeDisabled();
    await expect(page.getByRole("alert").first()).toContainText("geçersiz");
    await page.screenshot({ path: "test-results/phase-7-expenses-rejected.png", fullPage: true });
    await write([good, ["ref-b", ...good.slice(1)]]);
    await page.getByRole("button", { name: "Önizlemeyi kapat", exact: true }).click();
    await page.getByRole("button", { name: "Excel’den içe aktar", exact: true }).click();
    await expect(page.getByRole("button", { name: "İçe aktar", exact: true })).toBeDisabled();
    await page.getByLabel("Satır 3: benzer kayıt var, yine de ayrı gider olarak ekle").check();
    await expect(page.getByRole("button", { name: "İçe aktar", exact: true })).toBeEnabled();
    await page.screenshot({ path: "test-results/phase-7-expenses-preview.png", fullPage: true });
    await page.getByRole("button", { name: "İçe aktar", exact: true }).click();
    await expect(page.locator("[data-group=rent] dd")).toHaveText("100,00 ₺");
    await page.getByText(/^Tüm kayıtlar/).click();
    await expect(page.getByRole("button", { name: "İncele / düzelt" })).toHaveCount(2);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("operating report reopens on the reviewed expense revision after expense edits", async () => {
  const { writeFile } = await import("node:fs/promises");
  const { default: writeXlsxFile } = await import("write-excel-file/node");
  const { expenseColumns } = await import("../../src/expenses/template");
  const { businessRecords, businessPackage } = await import("../helpers/business-fixtures");
  const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
  const userData = await mkdtemp(join(tmpdir(), "esmer-operating-")), workbookPath = join(userData, "expenses.xlsx"), packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage(records));
  const rows = [expenseColumns, ["operating-ref", "15.09.2025", "", "Kira", "operating-expense", "10", "0", "10", "non-recoverable", "tax-1", "bill-1", "", "", ""]];
  await writeFile(workbookPath, await writeXlsxFile(rows.map(row => row.map(value => ({ type: String, value })))).toBuffer());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await openSection(page, "Giderler");
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, workbookPath);
    await page.getByRole("button", { name: "Excel’den içe aktar", exact: true }).filter({ visible: true }).click();
    await page.getByRole("button", { name: "İçe aktar", exact: true }).click();
    await expect(page.locator(".expenses-workspace .notice[role=status]").filter({ visible: true })).toContainText("Giderler içe aktarıldı.");
    await page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true }).filter({ visible: true }).click();
    await expect(page.getByRole("status").filter({ hasText: "Bu ayın giderleri onaylandı." })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("initial expense query failure ends loading and can be retried", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-expense-retry-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await app.evaluate(({ ipcMain }) => {
      const listeners = ipcMain as typeof ipcMain & { _invokeHandlers: Map<string, (...args: unknown[]) => unknown> };
      const handler = listeners._invokeHandlers.get("esmer:request")!;
      let first = true;
      ipcMain.removeHandler("esmer:request");
      ipcMain.handle("esmer:request", (...args) => {
        const operation = args[1];
        if (operation === "queryExpenses" && first) { first = false; return { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Sentetik okuma hatası" }; }
        return handler(...args);
      });
    });
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("alert")).toContainText("Sentetik okuma hatası");
    await expect(page.getByText("Giderler yükleniyor…", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: "test-results/phase-7-expenses-retry.png", fullPage: true });
    await page.getByRole("button", { name: "Giderleri yeniden yükle", exact: true }).click();
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    await expect(page.getByRole("alert")).toHaveCount(0);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
