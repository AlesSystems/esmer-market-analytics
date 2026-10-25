import { openSection, openWorkspace } from "../helpers/desktop-navigation";
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
    await expect(page.getByLabel("Gider tarihi", { exact: true })).toHaveValue("");
    await expect(page.getByLabel("KDV tutarı (TRY)", { exact: true })).toHaveValue("");
    await page.getByLabel("Kategori", { exact: true }).fill("Sentetik elektrik");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    const period = page.locator(".sidebar").getByLabel("Dönem", { exact: true }), previous = await period.inputValue();
    if (host === "sales") {
      await period.fill("9999-01"); await expect(page.getByRole("alertdialog")).toHaveCount(0);
      await expect(period).toHaveValue(previous);
      await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik elektrik");
    }
    await period.fill("2026-01");
    await expect(page.getByRole("heading", { name: "Kaydedilmemiş bilgileri bırak?" })).toBeVisible();
    await expect(period).toHaveValue(previous);
    await page.getByRole("button", { name: "Düzenlemeye devam et", exact: true }).click();
    await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik elektrik");
    await openSection(page, "Bu ay");
    await expect(page.getByRole("heading", { name: "Kaydedilmemiş bilgileri bırak?" })).toBeVisible();
    await page.getByRole("button", { name: "Düzenlemeye devam et", exact: true }).click();
    await expect(nav.getByRole("button", { name: "Giderler", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik elektrik");
    await period.fill("2026-01"); await page.getByRole("button", { name: "Bilgileri bırak", exact: true }).click();
    await expect(period).toHaveValue("2026-01");
    await page.locator("#expense-manual").click();
    await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("");
    await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
    await expect(page.locator("#expense-manual")).toBeFocused();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
test("manual save validates fields, reviews duplicates, restores focus and resolves receipt after restart", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-manual-save-"));
  let app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    let page = await app.firstWindow();await openWorkspace(page); await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await page.getByLabel("Dönem", { exact: true }).fill("2026-01");
    await page.locator("#expense-manual").click(); await page.getByRole("button", { name: "Gideri kaydet", exact: true }).click();
    await expect(page.getByLabel("Gider tarihi", { exact: true })).toBeFocused();
    await page.getByLabel("Gider tarihi", { exact: true }).fill("2026-01-15"); await page.getByLabel("Kategori", { exact: true }).fill("Sentetik elektrik");
    await page.getByLabel("Sınıflandırma", { exact: true }).selectOption("labour"); await expect(page.getByText("İşçilik dönemi:", { exact: false })).toContainText("2026-01");
    await page.getByLabel("Sınıflandırma", { exact: true }).selectOption("inventory-loss"); await expect(page.getByLabel("Kayıp işlemi", { exact: true })).toHaveValue("");
    await page.getByLabel("Sınıflandırma", { exact: true }).selectOption("operating-expense");
    await page.getByLabel("Net tutar (TRY)", { exact: true }).fill("1.250,50"); await page.getByLabel("KDV tutarı (TRY)", { exact: true }).fill("0"); await page.getByLabel("Brüt tutar (TRY)", { exact: true }).fill("1.250,50");
    await page.getByText("Referanslar (isteğe bağlı)", { exact: true }).click(); await page.getByLabel("Destek referansı", { exact: true }).fill("invalid code");
    await page.getByText("Referanslar (isteğe bağlı)", { exact: true }).click(); await page.getByRole("button", { name: "Gideri kaydet", exact: true }).click();
    await expect(page.getByLabel("Destek referansı", { exact: true })).toBeVisible(); await expect(page.getByLabel("Destek referansı", { exact: true })).toBeFocused();
    await expect(page.locator("#manual-supportingReference-error")).toBeVisible(); await page.getByLabel("Destek referansı", { exact: true }).fill("synthetic-bill");
    await page.setViewportSize({ width: 390, height: 844 }); await page.screenshot({ path: testInfo.outputPath("manual-entry-narrow.png"), fullPage: true });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.setViewportSize({ width: 1440, height: 1080 }); await page.screenshot({ path: testInfo.outputPath("manual-entry-desktop.png"), fullPage: true });
    await app.evaluate(({ app }) => {
      const { DatabaseSync } = process.getBuiltinModule("node:sqlite"), { join } = process.getBuiltinModule("node:path");
      const db = new DatabaseSync(join(app.getPath("userData"), "analytics.sqlite")); db.exec("BEGIN IMMEDIATE"); Reflect.set(globalThis, "manualExpenseTestLock", db);
    });
    await page.getByRole("button", { name: "Gideri kaydet", exact: true }).click();
    await expect(page.getByLabel("Kategori", { exact: true })).toBeDisabled();
    await page.getByLabel("Dönem", { exact: true }).fill("2026-02");
    await expect(page.getByRole("heading", { name: "Kaydın sonucu bekleniyor", exact: true })).toBeVisible();
    await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2026-01");
    await app.evaluate(() => { const db = Reflect.get(globalThis, "manualExpenseTestLock"); db.exec("COMMIT"); db.close(); Reflect.deleteProperty(globalThis, "manualExpenseTestLock"); });
    await expect(page.locator("#expense-manual")).toBeFocused();
    await expect(page.getByText("Elle girildi · Sürüm 1", { exact: true })).toBeVisible();
    const original = await page.evaluate(() => window.esmer.queryExpenses({ period: "2026-01" })); if (original.status !== "expenses") throw Error("expenses missing");
    await page.evaluate(id => localStorage.setItem("esmer.pending-manual-expense", id), (original.rows[0].value as {origin: {requestId: string}}).origin.requestId);
    await app.evaluate(({ session }) => session.fromPartition("persist:esmer").flushStorageData());
    await app.close(); app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] }); page = await app.firstWindow();await openWorkspace(page);
    expect(await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense"))).not.toBeNull();
    await page.getByRole("button", { name: "Giderler", exact: true }).click(); await expect(page.locator(".notice[role=status]")).toContainText("Gider kaydedildi. Dönemin giderlerini yeniden inceleyin.");
    expect(await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense"))).toBeNull();
    expect(await page.evaluate(() => window.esmer.queryExpenses({ period: "2026-01" }))).toMatchObject({ rows: [expect.objectContaining({ revision: 1 })] });
    await page.getByLabel("Dönem", { exact: true }).fill("2026-01"); await page.locator("#expense-manual").click();
    await page.getByLabel("Gider tarihi", { exact: true }).fill("2026-01-15"); await page.getByLabel("Kategori", { exact: true }).fill("Sentetik ayrı elektrik");
    await page.getByLabel("Net tutar (TRY)", { exact: true }).fill("1250,50"); await page.getByLabel("KDV tutarı (TRY)", { exact: true }).fill("0"); await page.getByLabel("Brüt tutar (TRY)", { exact: true }).fill("1250,50");
    await page.getByRole("button", { name: "Gideri kaydet", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Benzer tarih ve tutarda 1 kayıt var", exact: true })).toBeFocused();
    await page.keyboard.press("Tab"); await expect(page.getByLabel("Benzer kayıtları inceledim; bu ayrı bir gider", { exact: true })).toBeFocused(); await page.keyboard.press("Space");
    await page.getByLabel("Kategori", { exact: true }).fill("Sentetik ikinci elektrik");
    await expect(page.getByRole("button", { name: "Ayrı gider olarak kaydet", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Gideri kaydet", exact: true }).click();
    await expect(page.getByLabel("Benzer kayıtları inceledim; bu ayrı bir gider", { exact: true })).not.toBeChecked();
    await page.getByLabel("Benzer kayıtları inceledim; bu ayrı bir gider", { exact: true }).check(); await page.getByRole("button", { name: "Ayrı gider olarak kaydet", exact: true }).click();
    await expect(page.getByRole("button", { name: "İncele / düzelt", exact: true })).toHaveCount(2);
    await page.locator(`[id="expense-record-${original.rows[0].entityId}"]`).click();
    await page.getByLabel("Değişiklik gerekçesi", { exact: true }).fill("Sentetik iptal kontrolü"); await page.getByRole("button", { name: "Gideri geri al", exact: true }).click();
    await expect(page.getByRole("cell", { name: /^Geri alınmış/ })).toBeVisible();
    await page.locator(`[id="expense-record-${original.rows[0].entityId}"]`).click();
    await page.getByLabel("Değişiklik gerekçesi", { exact: true }).fill("Sentetik geri yükleme"); await page.getByRole("button", { name: "Sürüm 1 geri yükle", exact: true }).click();
    expect(await page.evaluate(() => window.esmer.queryExpenses({ period: "2026-01" }))).toMatchObject({ rows: expect.arrayContaining([expect.objectContaining({ revision: 4 })]) });

  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
test("an in-flight save loses its renderer reply and resolves through the retained request identity", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-manual-lost-reply-")), app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page); await page.getByRole("button", { name: "Giderler", exact: true }).click(); await page.locator("#expense-manual").click();
    await page.getByLabel("Gider tarihi", { exact: true }).fill("2026-01-15"); await page.getByLabel("Kategori", { exact: true }).fill("Sentetik kayıp yanıt");
    for (const label of ["Net tutar (TRY)", "KDV tutarı (TRY)", "Brüt tutar (TRY)"]) await page.getByLabel(label, { exact: true }).fill(label === "KDV tutarı (TRY)" ? "0" : "75");
    await app.evaluate(({ app }) => {
      const { DatabaseSync } = process.getBuiltinModule("node:sqlite"), { join } = process.getBuiltinModule("node:path");
      const db = new DatabaseSync(join(app.getPath("userData"), "analytics.sqlite")); db.exec("BEGIN IMMEDIATE"); Reflect.set(globalThis, "manualExpenseTestLock", db);
    });
    await page.getByRole("button", { name: "Gideri kaydet", exact: true }).click(); await expect(page.getByLabel("Kategori", { exact: true })).toBeDisabled();
    const requestId = await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense")); expect(requestId).not.toBeNull();
    await page.reload({ waitUntil: "domcontentloaded" });await openWorkspace(page);
    await app.evaluate(() => { const db = Reflect.get(globalThis, "manualExpenseTestLock"); db.exec("COMMIT"); db.close(); Reflect.deleteProperty(globalThis, "manualExpenseTestLock"); });
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.locator(".notice[role=status]")).toContainText("Gider kaydedildi.");
    expect(await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense"))).toBeNull();
    expect(await page.evaluate(id => window.esmer.createExpense({ action: "resolve", requestId: id! }), requestId)).toMatchObject({ status: "already-saved", revision: 1 });
    expect(await page.evaluate(() => window.esmer.queryExpenses({ period: "2026-01" }))).toMatchObject({ rows: [expect.objectContaining({ revision: 1 })] });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
test("an absent pending receipt requires current-record review before another manual submission", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-manual-absent-receipt-")), app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page); await expect(page.getByRole("button", { name: "Giderler", exact: true })).toBeVisible();
    await page.evaluate(() => localStorage.setItem("esmer.pending-manual-expense", "absent-after-older-backup"));
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("button", { name: "Kayıtları incele", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "Gideri kaydet", exact: true })).toBeDisabled();
    await expect(page.getByLabel("Kategori", { exact: true })).toBeDisabled();
    expect(await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense"))).toBe("absent-after-older-backup");
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click(); await page.getByRole("button", { name: "Excel’den aktar", exact: true }).click(); await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click(); await page.locator("#expense-manual").click();
    await expect(page.getByRole("button", { name: "Kayıtları incele", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "Gideri kaydet", exact: true })).toBeDisabled();
    await page.getByLabel("Dönem", { exact: true }).fill("2026-01"); await expect(page.getByRole("button", { name: "Kayıtları incele", exact: true })).toBeFocused();
    await expect(page.getByRole("button", { name: "Gideri kaydet", exact: true })).toBeDisabled();
    await page.screenshot({ path: testInfo.outputPath("manual-review-required.png"), fullPage: true });
    await page.getByRole("button", { name: "Kayıtları incele", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Bu dönemde gider kaydı yok.", exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem("esmer.pending-manual-expense"))).toBeNull();
    await page.locator("#expense-manual").click(); await expect(page.getByRole("button", { name: "Gideri kaydet", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
test("a payment outside the displayed incurred month offers the payment month without changing selection", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-manual-payment-")), app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page); await page.getByRole("button", { name: "Giderler", exact: true }).click(); await page.getByLabel("Dönem", { exact: true }).fill("2026-01"); await page.locator("#expense-manual").click();
    await page.getByLabel("Gider tarihi", { exact: true }).fill("2026-01-15"); await page.getByLabel("Ödeme tarihi (isteğe bağlı)", { exact: true }).fill("2026-02-01"); await page.getByLabel("Kategori", { exact: true }).fill("Sentetik ayrı ödeme ayı");
    for (const label of ["Net tutar (TRY)", "KDV tutarı (TRY)", "Brüt tutar (TRY)"]) await page.getByLabel(label, { exact: true }).fill(label === "KDV tutarı (TRY)" ? "0" : "75");
    await page.getByRole("button", { name: "Gideri kaydet", exact: true }).click();
    await expect(page.getByRole("button", { name: "İlgili aya git", exact: true })).toBeVisible();
    await expect(page.getByText("Giderin oluşma dönemi: 2026-01", { exact: false })).toContainText("Ödeme dönemi: 2026-02");
    await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2026-01");
    await page.getByRole("button", { name: "İlgili aya git", exact: true }).click(); await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2026-02");
    expect(await page.evaluate(() => window.esmer.queryExpenses({ period: "2026-02" }))).toMatchObject({ incurred: "0", payments: "75" });
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
for (const host of ["source", "sales"] as const) test(`host error recovery retains a manual draft until confirmed in ${host}`, async () => {
  const userData = await mkdtemp(join(tmpdir(), `esmer-manual-error-${host}-`)), store = openStore(join(userData, "analytics.sqlite"));
  if (host === "source") store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:manual-error", "manual-error-host")); else store.importPackage(businessPackage()); store.close();
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    const nav = page.getByRole("navigation", { name: "Ana gezinme" });
    // Let startup reads settle before swapping the IPC handler, so none of them lands between remove and handle.
    await expect(page.locator(".sidebar").getByLabel("Dönem", { exact: true })).not.toHaveValue("");
    await expect(page.getByRole("heading", { name: "Kâr tahmini için veri paketi gerekiyor", exact: true })).toBeVisible();
    await app.evaluate(({ ipcMain }, host) => {
      const registry = ipcMain as unknown as { _invokeHandlers: Map<string, (event: unknown, operation: string, payload: unknown) => unknown> };
      const original = registry._invokeHandlers.get("esmer:request")!;
      let failures = 1;
      ipcMain.removeHandler("esmer:request");
      ipcMain.handle("esmer:request", (event, operation, payload) => {
        const request = payload as { period?: string };
        if (failures > 0 && request.period === "2024-01" && operation === (host === "source" ? "querySourceWorkspace" : "openSales")) { failures--; return host === "source" ? { status: "source-unavailable", code: "SERVICE_UNAVAILABLE", message: "Sentetik host hatası." } : { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Sentetik host hatası." }; }
        return original(event, operation, payload);
      });
    }, host);
    await openSection(page, "Giderler");
    await page.locator(".sidebar").getByLabel("Dönem", { exact: true }).fill("2024-01");
    await page.locator("#expense-manual").click(); await page.getByLabel("Kategori", { exact: true }).fill("Sentetik korunacak taslak");
    await openSection(page, "Rapor ve Excel"); await expect(page.getByRole("heading", { name: "Kaydedilmemiş bilgileri bırak?", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Düzenlemeye devam et", exact: true }).click(); await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik korunacak taslak");
    await expect(nav.getByRole("button", { name: "Giderler", exact: true })).toHaveAttribute("aria-current", "page");
    await openSection(page, "Rapor ve Excel"); await page.getByRole("button", { name: "Bilgileri bırak", exact: true }).click();
    const failure = page.locator(".reports-page [role=alert]");
    await expect(failure).toContainText("Sentetik host hatası.");
    await expect(page.locator(".sidebar").getByLabel("Dönem", { exact: true })).toHaveValue("2024-01");
    // The failure stays until the owner retries; it must not re-query by itself.
    await page.waitForTimeout(500); await expect(failure).toContainText("Sentetik host hatası.");
    await failure.getByRole("button", { name: "Yeniden dene", exact: true }).click();
    await expect(failure).toHaveCount(0);
    await expect(page.getByText("Rapor ve Excel açılıyor…", { exact: true })).toHaveCount(0);
    await expect(page.locator(".reports-page h1").nth(1)).toBeVisible();
    await openSection(page, "Giderler"); await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await page.locator("#expense-manual").click(); await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
