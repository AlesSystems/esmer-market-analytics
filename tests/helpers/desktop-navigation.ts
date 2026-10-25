import { expect, type Page } from "@playwright/test";

export async function openSettings(page: Page) {
  await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  await page.getByRole("heading", { name: "Ayarlar", exact: true, level: 1 }).waitFor();
}

/** Imports through Ayarlar, where the package import lives. */
export async function importPackage(page: Page) {
  if (!await page.getByRole("heading", { name: "Ayarlar", exact: true, level: 1 }).isVisible()) await openSettings(page);
  await page.getByRole("button", { name: "Veri paketi içe aktar", exact: true }).click();
}

/** Launch opens Bu ay directly; waits for the shell. */
export async function openWorkspace(page: Page) {
  await expect(page.getByRole("navigation", { name: "Ana gezinme" })).toBeVisible();
}

export async function openSection(page: Page, name: "Bu ay" | "Ürünler" | "Giderler" | "Rapor ve Excel") {
  await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name, exact: true }).click();
}
