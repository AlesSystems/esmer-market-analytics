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
      const fonts = await document.fonts.load('italic 48px "Welcome Newsreader"', "olarak bakın.");
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
