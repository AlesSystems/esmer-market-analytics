import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "../helpers/desktop-executable";
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";
import { writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";
import { writeFile } from "node:fs/promises";
import { importPackage } from "../helpers/desktop-navigation";

test("every packaged launch opens welcome with real workspace shortcuts", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-"));
  try {
    for (let launch = 0; launch < 2; launch++) {
      const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
      try {
        const page = await app.firstWindow();
        await expect(page.getByRole("heading", { name: "Marketinize bir bütün olarak bakın.", level: 1 })).toBeVisible();
        await expect(page.getByRole("navigation", { name: "Ana gezinme" })).not.toBeVisible();
        await expect(page.getByRole("button", { name: "Özeti aç", exact: true })).toBeVisible();
        const shortcuts = page.getByRole("navigation", { name: "Doğrudan aç" });
        for (const name of ["Satışlar", "Alışlar ve maliyet", "Giderler", "Raporlar"]) {
          await expect(shortcuts.getByRole("button", { name: new RegExp(name) })).toBeVisible();
        }
        const guide = page.getByRole("button", { name: /Başlangıç rehberi/ });
        await expect(guide).toHaveAttribute("aria-expanded", "false");
        await guide.click();
        await expect(guide).toHaveAttribute("aria-expanded", "true");
        await expect(page.getByRole("heading", { name: "Özet ile başlayın.", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Ayarlar", level: 1, exact: true })).toBeVisible();
      } finally {
        await app.close();
      }
    }
  } finally {
    await rm(userData, { recursive: true, force: true });
  }
});

for (const source of [false, true]) {
  test(`welcome shortcuts enter retained ${source ? "recorded-source" : "financial"} pages and remember month`, async () => {
    const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-routes-"));
    const store = openStore(join(userData, "analytics.sqlite"));
    try {
      if (source) store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:welcome", "welcome-1"));
      else store.importPackage(businessPackage());
    } finally { store.close(); }
    const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    try {
      const page = await app.firstWindow();
      for (const name of ["Satışlar", "Alışlar ve maliyet", "Giderler", "Raporlar", "Özet"]) {
        if (name === "Özet") await page.getByRole("button", { name: "Özeti aç", exact: true }).click();
        else await page.getByRole("navigation", { name: "Doğrudan aç" }).getByRole("button", { name: new RegExp(name) }).click();
        await expect(page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name, exact: true })).toHaveAttribute("aria-current", "page");
        await expect(page.locator("h1:visible").first()).toBeVisible();
        if (name === "Satışlar") await expect(page.getByRole("heading", { name: "Satışlar", exact: true })).toBeVisible();
        if (name === "Raporlar") await expect(page.getByRole("heading", { name: source ? "Raporlar" : "Aylık Ürün Kârlılığı", exact: true })).toBeVisible();
        if (name === "Giderler") await expect(page.getByRole("button", { name: "Gider ekle", exact: true })).toBeVisible();
        await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
        await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
        await expect(page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name, exact: true })).toHaveAttribute("aria-current", "page");
        await page.getByRole("button", { name: "Karşılama", exact: true }).click();
        await expect(page.getByRole("heading", { name: "Marketinize bir bütün olarak bakın.", level: 1 })).toBeFocused();
      }
      await page.getByRole("button", { name: "Özeti aç", exact: true }).click();
      await page.getByLabel("Dönem", { exact: true }).fill("2025-11");
      await page.getByRole("button", { name: "Karşılama", exact: true }).click();
      await page.getByRole("navigation", { name: "Doğrudan aç" }).getByRole("button", { name: /Giderler/ }).click();
      await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2025-11");
      await page.locator("#expense-manual").click();
      await page.getByLabel("Kategori", { exact: true }).fill("Sentetik taslak");
      await page.getByRole("button", { name: "Karşılama", exact: true }).click();
      await expect(page.getByRole("alertdialog")).toContainText("Kaydedilmemiş bilgileri bırak?");
      await page.getByRole("button", { name: "Düzenlemeye devam et", exact: true }).click();
      await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik taslak");
    } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
  });
}


test("welcome Settings closes to its opener and import leaves later launch requests usable", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-import-"));
  const packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
    await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Marketinize bir bütün olarak bakın.", level: 1 })).toBeFocused();
    await page.getByRole("button", { name: "Özeti aç", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Henüz mali rapor verisi yok", exact: true })).toBeVisible();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await expect(page.getByRole("heading", { name: "Ay bir bakışta", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Karşılama", exact: true }).click();
    await page.getByRole("navigation", { name: "Doğrudan aç" }).getByRole("button", { name: /Giderler/ }).click();
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});


test("welcome keeps empty readiness and unavailable recovery reachable", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-unavailable-"));
  await writeFile(join(userData, "recovery-config.json"), "{corrupt");
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await expect(page.getByRole("heading", { name: "Marketinize bir bütün olarak bakın.", level: 1 })).toBeVisible();
    await expect(page.getByText(/\d+[,.]\d+ ₺/)).toHaveCount(0);
    await page.getByRole("button", { name: "Özeti aç", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yerel veriler açılamadı", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Yedekten geri yükle", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yedekleme ve kurtarma", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yerel veriler açılamadı", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Karşılama", exact: true }).click();
    await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
    await page.getByRole("button", { name: "Yedekleme ve kurtarma", exact: true }).click();
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Marketinize bir bütün olarak bakın.", level: 1 })).toBeFocused();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("welcome loads bundled Newsreader fonts without external requests or page errors", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-fonts-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [], externalRequests: string[] = [];
    const fontResponses = new Map<string, number>();
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (!request.url().startsWith("esmer://app/")) externalRequests.push(request.url()); });
    page.on("response", response => { if (response.url().includes("newsreader-")) fontResponses.set(new URL(response.url()).pathname, response.status()); });
    await page.reload();
    await expect(page.getByRole("heading", { name: "Marketinize bir bütün olarak bakın.", level: 1 })).toBeVisible();
    const faces = await page.evaluate(async () => {
      const fonts = await document.fonts.load('italic 48px "Welcome Newsreader"', "olarak bakın. ĞŞİğş");
      return fonts.map(font => ({ family: font.family, status: font.status }));
    });
    expect(faces.length).toBeGreaterThan(0);
    expect(faces.every(font => font.status === "loaded")).toBe(true);
    expect(fontResponses.get("/assets/newsreader-latin-wght-italic.woff2")).toBe(200);
    expect(fontResponses.get("/assets/newsreader-latin-ext-wght-italic.woff2")).toBe(200);
    expect(externalRequests).toEqual([]);
    expect(errors).toEqual([]);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("a Sales launch pending initial financial load starts only its destination calculation", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-pending-sales-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importPackage(businessPackage()); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await app.evaluate(({ ipcMain }) => {
      const registry = ipcMain as unknown as { _invokeHandlers: Map<string, (event: unknown, operation: string, payload: unknown) => unknown> };
      const original = registry._invokeHandlers.get("esmer:request")!;
      ipcMain.removeHandler("esmer:request");
      ipcMain.handle("esmer:request", async (event, operation, payload) => {
        const result = await original(event, operation, payload);
        if (operation === "openSales") return new Promise(resolve => Reflect.set(globalThis, "releaseWelcomeSales", () => resolve(result)));
        if (operation === "queryMonthly") Reflect.set(globalThis, "welcomeMonthlyReads", (Reflect.get(globalThis, "welcomeMonthlyReads") ?? 0) + 1);
        return result;
      });
    });
    await page.reload();
    await page.getByRole("navigation", { name: "Doğrudan aç" }).getByRole("button", { name: /Satışlar/ }).click();
    await expect(page.getByRole("region", { name: "Satış özeti", exact: true })).toHaveCount(0);
    await expect.poll(() => app.evaluate(() => typeof Reflect.get(globalThis, "releaseWelcomeSales"))).toBe("function");
    await app.evaluate(() => Reflect.get(globalThis, "releaseWelcomeSales")());
    await expect(page.getByRole("heading", { name: "Satışlar", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Satış özeti", exact: true })).toContainText("200,00 ₺");
    await expect(page.getByRole("alert")).toHaveCount(0);
    expect(await app.evaluate(() => Reflect.get(globalThis, "welcomeMonthlyReads"))).toBe(1);
  } finally {
    await app.evaluate(() => Reflect.get(globalThis, "releaseWelcomeSales")?.()).catch(() => {});
    await app.close(); await rm(userData, { recursive: true, force: true });
  }
});

test("empty profile expense return restores summary navigation and readiness", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-empty-return-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await page.getByRole("navigation", { name: "Doğrudan aç" }).getByRole("button", { name: /Giderler/ }).click();
    await expect(page.getByRole("button", { name: "Gider ekle", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Özet", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Henüz mali rapor verisi yok", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Gider ekle", exact: true })).toHaveCount(0);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("keyboard guide close restores its trigger and next workspace action", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-guide-focus-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    const trigger = page.getByRole("button", { name: /Başlangıç rehberi/ });
    await trigger.focus();
    await page.keyboard.press("Enter");
    const close = page.getByRole("button", { name: "Rehberi kapat", exact: true });
    await close.focus();
    await page.keyboard.press("Enter");
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("button", { name: "Ayarlar", exact: true })).toBeFocused();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
