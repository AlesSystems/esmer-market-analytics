import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));
test("expenses are reachable without a source and cancelled selection leaves an empty period", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-expenses-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
    await expect(page.getByText("Bu dönemde gider kaydı yok.", { exact: true })).toBeVisible();
    await app.evaluate(({ dialog }) => { dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] }); });
    await page.getByRole("button", { name: "Excel seç", exact: true }).click();
    await expect(page.getByRole("status")).toContainText("İşlem iptal edildi");
    await expect(page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum")).not.toBeChecked();
    await page.setViewportSize({ width: 680, height: 720 });
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
    const page = await app.firstWindow();
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await page.getByLabel("Dönem", { exact: true }).fill("2026-01");
    await app.evaluate(({ dialog }, path) => { dialog.showSaveDialog = async () => ({ canceled: false, filePath: path }); }, templatePath);
    await page.getByRole("button", { name: "Şablonu kaydet" }).click();
    await expect(page.getByRole("status")).toContainText("Gider şablonu kaydedildi");
    expect((await stat(templatePath)).size).toBeGreaterThan(0);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, workbookPath);
    await page.getByRole("button", { name: "Excel seç", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Excel önizlemesi" })).toBeVisible();
    await expect(page.getByText("Bu dönemde gider kaydı yok.", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "İçe aktarmayı onayla" }).click();
    await expect(page.getByText("Faaliyet kârı hesaplanamıyor — gider verileri eksik.", { exact: true })).toBeVisible();
    await expect(page.locator(".expense-totals")).toContainText("50,00 ₺");
    await page.getByRole("button", { name: "İncele / düzelt" }).click();
    await expect(page.getByRole("heading", { name: "Gideri incele ve düzelt" })).toBeFocused();
    await page.getByLabel("Net tutar", { exact: true }).fill("60");
    await page.getByLabel("Brüt tutar", { exact: true }).fill("60");
    await page.getByLabel("Değişiklik gerekçesi").fill("Belge toplamı düzeltildi");
    await page.getByRole("button", { name: "Düzeltmeyi kaydet" }).click();
    await expect(page.locator(".expense-totals")).toContainText("60,00 ₺");
    await page.getByRole("button", { name: "İncele / düzelt" }).click();
    await page.getByLabel("Değişiklik gerekçesi").fill("Kontrol için geri alma");
    await page.getByRole("button", { name: "Gideri geri al", exact: true }).click();
    await expect(page.locator(".expense-totals")).toContainText("0,00 ₺");
    await page.getByRole("button", { name: "İncele / düzelt" }).click();
    await page.getByLabel("Değişiklik gerekçesi").fill("İlk belgeyi geri yükle");
    await page.getByRole("button", { name: "Sürüm 1 geri yükle", exact: true }).click();
    await expect(page.locator(".expense-totals")).toContainText("50,00 ₺");
    await page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum").check();
    await page.getByLabel("İnceleme açıklaması").fill("Ocak kayıtları kontrol edildi");
    await page.getByRole("button", { name: "Eksiksizliği onayla", exact: true }).click();
    await expect(page.getByText("Dönemin giderleri eksiksiz olarak onaylandı", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "İncele / düzelt" }).click();
    await page.screenshot({ path: "test-results/phase-7-expenses-history.png", fullPage: true });
    await page.setViewportSize({ width: 680, height: 720 });
    await page.screenshot({ path: "test-results/phase-7-expenses-small.png", fullPage: true });
    await page.getByLabel("Dönem", { exact: true }).fill("2026-02");
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
    const page = await app.firstWindow();
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await page.getByLabel("Dönem", { exact: true }).fill("2026-01");
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, workbookPath);
    await page.getByRole("button", { name: "Excel seç", exact: true }).click();
    await expect(page.getByRole("button", { name: "İçe aktarmayı onayla" })).toBeDisabled();
    await expect(page.getByRole("alert")).toContainText("geçersiz");
    await page.screenshot({ path: "test-results/phase-7-expenses-rejected.png", fullPage: true });
    await write([good, ["ref-b", ...good.slice(1)]]);
    await page.getByRole("button", { name: "Excel seç", exact: true }).click();
    await expect(page.getByRole("button", { name: "İçe aktarmayı onayla" })).toBeDisabled();
    await page.getByLabel("Satır 3: benzer kayda rağmen ayrı gider olarak ekle").check();
    await expect(page.getByRole("button", { name: "İçe aktarmayı onayla" })).toBeEnabled();
    await page.screenshot({ path: "test-results/phase-7-expenses-preview.png", fullPage: true });
    await page.getByRole("button", { name: "İçe aktarmayı onayla" }).click();
    await expect(page.locator(".expense-totals")).toContainText("100,00 ₺");
    await expect(page.getByRole("button", { name: "İncele / düzelt" })).toHaveCount(2);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("operating report stays pinned after expense edits until the owner reopens it", async () => {
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
    const page = await app.firstWindow();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await page.getByRole("button", { name: "Veri paketi içe aktar", exact: true }).click();
    const operating = page.getByRole("region", { name: "Faaliyet sonucu", exact: true });
    await expect(operating).toContainText("Faaliyet kârı hesaplanamıyor — gider verileri eksik.");
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, workbookPath);
    await page.getByRole("button", { name: "Excel seç", exact: true }).click();
    await page.getByRole("button", { name: "İçe aktarmayı onayla" }).click();
    await page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum").check();
    await page.getByLabel("İnceleme açıklaması").fill("Eylül kontrolü");
    await page.getByRole("button", { name: "Eksiksizliği onayla", exact: true }).click();
    await expect(page.getByText("Dönemin giderleri eksiksiz olarak onaylandı", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Satış Özeti", exact: true }).click();
    await expect(operating).toContainText("Gider kayıtları değişti");
    await expect(operating).toContainText("Faaliyet kârı hesaplanamıyor — gider verileri eksik.");
    await operating.getByRole("button", { name: "Raporu yeni giderlerle aç" }).click();
    await expect(operating).toContainText("Tahmini yönetim faaliyet kârı");
    await expect(operating.locator(".operating-value")).toHaveText("30,00 ₺");
    await page.screenshot({ path: "test-results/phase-7-operating.png", fullPage: true });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
