// The welcome page was removed (#103/#105): launch opens Bu ay directly. These tests keep the launch
// behaviours that survive it: direct section entry, remembered month, Settings return, recovery reachability.
import { test, expect, _electron as electron, type Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "../helpers/desktop-executable";
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";
import { estimatePackage } from "../helpers/estimate-fixture";
import { writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";
import { writeFile } from "node:fs/promises";
import { importPackage, openSection, openWorkspace } from "../helpers/desktop-navigation";

const nav = (page: Page) => page.getByRole("navigation", { name: "Ana gezinme" });

test("every packaged launch opens Bu ay with the four sections and Settings in reach", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-"));
  try {
    for (let launch = 0; launch < 2; launch++) {
      const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
      try {
        const page = await app.firstWindow();
        await openWorkspace(page);
        await expect(page.getByRole("heading", { name: "Marketinize bir bütün olarak bakın.", level: 1 })).toHaveCount(0);
        await expect(nav(page).getByRole("button")).toHaveText(["Bu ay", "Ürünler", "Giderler", "Rapor ve Excel"]);
        await expect(nav(page).getByRole("button", { name: "Bu ay", exact: true })).toHaveAttribute("aria-current", "page");
        await expect(page.getByRole("heading", { name: "Kâr tahmini için veri paketi gerekiyor", exact: true })).toBeVisible();
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
  test(`sections enter retained ${source ? "recorded-source" : "financial"} pages and remember month`, async () => {
    const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-routes-"));
    const store = openStore(join(userData, "analytics.sqlite"));
    try {
      if (source) store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:welcome", "welcome-1"));
      else store.importPackage(businessPackage());
    } finally { store.close(); }
    const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    try {
      const page = await app.firstWindow();
      await openWorkspace(page);
      const routes: [string, () => Promise<void>, () => Promise<void>][] = [
        ["Ürünler", () => openSection(page, "Ürünler"), () => expect(page.getByRole("heading", { name: "Ürünler", level: 1 })).toBeVisible()],
        ["Rapor ve Excel", () => openSection(page, "Rapor ve Excel"), () => expect(page.getByRole("heading", { name: "Rapor ve Excel", level: 1, exact: true })).toBeVisible()],
        ["Giderler", () => openSection(page, "Giderler"), () => expect(page.getByRole("button", { name: "Elle ekle", exact: true })).toBeVisible()],
        ["Bu ay", () => openSection(page, "Bu ay"), () => expect(page.getByRole("heading", { name: "Kâr tahmini için veri paketi gerekiyor", exact: true })).toBeVisible()],
      ];
      for (const [name, open, check] of routes) {
        await open();
        await expect(nav(page).getByRole("button", { name, exact: true })).toHaveAttribute("aria-current", "page");
        await check();
        await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
        await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
        await expect(nav(page).getByRole("button", { name, exact: true })).toHaveAttribute("aria-current", "page");
        await check();
      }
      await page.getByLabel("Dönem", { exact: true }).filter({ visible: true }).fill("2025-11");
      await openSection(page, "Giderler");
      await expect(page.getByLabel("Dönem", { exact: true }).filter({ visible: true })).toHaveValue("2025-11");
      await page.locator("#expense-manual").click();
      await page.getByLabel("Kategori", { exact: true }).fill("Sentetik taslak");
      await openSection(page, "Bu ay");
      await expect(page.getByRole("alertdialog")).toContainText("Kaydedilmemiş bilgileri bırak?");
      await page.getByRole("button", { name: "Düzenlemeye devam et", exact: true }).click();
      await expect(page.getByLabel("Kategori", { exact: true })).toHaveValue("Sentetik taslak");
      await expect(nav(page).getByRole("button", { name: "Giderler", exact: true })).toHaveAttribute("aria-current", "page");
    } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
  });
}

test("Settings closes to its opener and import leaves later section requests usable", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-import-"));
  const packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, estimatePackage());
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await openWorkspace(page);
    await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
    await page.getByRole("button", { name: "Ayarları kapat", exact: true }).click();
    await expect(page.getByRole("button", { name: "Ayarlar", exact: true })).toBeFocused();
    await expect(page.getByRole("heading", { name: "Kâr tahmini için veri paketi gerekiyor", exact: true })).toBeVisible();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await expect(page.getByRole("status").filter({ hasText: "Veri paketi içe aktarıldı." })).toBeVisible();
    await expect(nav(page).getByRole("button", { name: "Bu ay", exact: true })).toHaveAttribute("aria-current", "page");
    await openSection(page, "Rapor ve Excel");
    await expect(page.getByRole("heading", { name: "Rapor ve Excel", level: 1, exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Excel’e aktar", exact: true })).toBeVisible();
    await openSection(page, "Giderler");
    await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("launch keeps empty readiness and unavailable recovery reachable", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-unavailable-"));
  await writeFile(join(userData, "recovery-config.json"), "{corrupt");
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await expect(page.getByRole("heading", { name: "Yerel veriler açılamadı", exact: true })).toBeVisible();
    await expect(page.getByText(/\d+[,.]\d+ ₺/)).toHaveCount(0);
    await page.getByRole("button", { name: "Yedekten geri yükle", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yedekleme ve kurtarma", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yerel veriler açılamadı", exact: true })).toBeVisible();
    await openSection(page, "Giderler");
    await expect(page.getByRole("heading", { name: "Yerel veriler açılamadı", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
    await page.getByRole("button", { name: "Yedekleme ve kurtarma", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yedekleme ve kurtarma", level: 1, exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Ana sayfaya dön", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Yerel veriler açılamadı", exact: true })).toBeVisible();
    await expect(nav(page).getByRole("button", { name: "Giderler", exact: true })).toHaveAttribute("aria-current", "page");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("launch loads bundled assets without external requests or page errors", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-fonts-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    const errors: string[] = [], externalRequests: string[] = [], failed: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    page.on("request", request => { if (!request.url().startsWith("esmer://app/")) externalRequests.push(request.url()); });
    page.on("response", response => { if (response.status() >= 400) failed.push(response.url()); });
    await page.reload();
    await openWorkspace(page);
    await expect(page.getByRole("img", { name: "Esmer Market" })).toBeVisible();
    expect(await page.getByRole("img", { name: "Esmer Market" }).evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    for (const section of ["Ürünler", "Giderler", "Rapor ve Excel", "Bu ay"] as const) await openSection(page, section);
    await expect(page.getByRole("heading", { name: "Bu ay", level: 1 })).toBeVisible();
    expect(externalRequests).toEqual([]);
    expect(failed).toEqual([]);
    expect(errors).toEqual([]);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});


test("empty profile expense return restores Bu ay navigation and readiness", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-welcome-empty-return-"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await openSection(page, "Giderler");
    await expect(page.getByRole("button", { name: "Elle ekle", exact: true })).toBeVisible();
    await openSection(page, "Bu ay");
    await expect(nav(page).getByRole("button", { name: "Bu ay", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("heading", { name: "Kâr tahmini için veri paketi gerekiyor", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Elle ekle", exact: true })).toHaveCount(0);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
