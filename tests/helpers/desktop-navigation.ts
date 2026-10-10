import { expect, type Page } from "@playwright/test";

export async function openSettings(page: Page) {
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  await page.getByRole("heading", { name: "Ayarlar", exact: true, level: 1 }).waitFor();
}

export async function importPackage(page: Page) {
  const button = page.getByRole("button", { name: "Veri paketi içe aktar", exact: true });
  if (!await button.isVisible()) await openSettings(page);
  await button.click();
}

export async function openWorkspace(page: Page) {
  await expect(page.getByRole("heading", { name: "Marketinize bir bütün olarak bakın.", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Özeti aç", exact: true }).click();
}
