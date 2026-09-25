import type { Page } from "@playwright/test";

export async function importPackage(page: Page) {
  const menu = page.locator(".operations-menu");
  if (await menu.count() && await menu.getAttribute("open") === null) await menu.locator(":scope > summary").click();
  await page.getByRole("button", { name: "Veri paketi içe aktar", exact: true }).click();
}
