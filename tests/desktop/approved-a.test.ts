import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { monthProfitPackage } from "../helpers/month-profit-fixture";
import { executablePath } from "../helpers/desktop-executable";
import { openSection, openSettings, openWorkspace, settingsMenu } from "../helpers/desktop-navigation";

test("approved A exposes the observed period and supporting amounts before product investigation", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-approved-a-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importSourcePreview(monthProfitPackage()); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await openWorkspace(page);
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1440, 900));
    await expect(page.getByRole("heading", { name: "Ekim 2025", level: 1 })).toBeVisible();
    await expect(page.getByText("01.10.2025 – 20.10.2025 · Kısmi ay", { exact: true })).toBeVisible();
    await expect(page.getByText("Veri sonu: 20.10.2025", { exact: true })).toBeVisible();
    const facts = page.getByRole("group", { name: "Aylık destekleyici tutarlar" });
    await expect(facts).toContainText("Satış480,00 ₺");
    await expect(facts).toContainText("Tahmini ürün maliyeti372,50 ₺");
    await expect(facts).toContainText("Marj%13,37");
    await expect(page.locator(".hero-num")).toHaveText("57,50 ₺");
    // Reading order keeps the selected month's main answer before its investigation actions.
    for (const width of [1440, 680]) {
      await app.evaluate(({ BrowserWindow }, width) => BrowserWindow.getAllWindows()[0].setContentSize(width, 900), width);
      const answer = await page.getByRole("region", { name: "Ayın özeti" }).boundingBox();
      const observations = await page.getByRole("region", { name: "Ürünlerde dikkat çekenler" }).boundingBox();
      expect(answer!.y + answer!.height).toBeLessThanOrEqual(observations!.y);
    }
    await page.getByRole("button", { name: /Ekmek.*Zarar ediyor/ }).click();
    await expect(page.getByRole("dialog", { name: "Ekmek" })).toBeVisible();
    await openSection(page, "Giderler");
    await expect(page.getByRole("heading", { name: "Ekim 2025 giderleri", level: 1 })).toBeVisible();
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1100, 560));
    await openSettings(page);
    const menu = settingsMenu(page);
    const menuBounds = await menu.boundingBox();
    expect(menuBounds!.y + menuBounds!.height).toBeLessThanOrEqual(560);
    const about = menu.getByRole("button", { name: /^Hakkında ve bilinen sınırlar/ });
    await about.scrollIntoViewIfNeeded();
    await expect(about).toBeInViewport();
    await about.click();
    await expect(page.getByRole("region", { name: "Bilinen sınırlar" })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
