import { expect, type Page } from "@playwright/test";

export const settingsMenu = (page: Page) => page.getByRole("dialog", { name: "Ayarlar", exact: true });

/** Opens the gear menu (a popover, not a page). */
export async function openSettings(page: Page) {
  if (!await settingsMenu(page).isVisible()) await page.getByRole("button", { name: "Ayarlar", exact: true }).click();
  await settingsMenu(page).waitFor();
}

/** Runs one gear menu item, e.g. "Canlı bağlantı" or "Yedekle / Geri yükle". */
export async function openSettingsItem(page: Page, name: string | RegExp) {
  await openSettings(page);
  await settingsMenu(page).getByRole("button", { name }).click();
}

/** Imports through the gear menu, where the package import lives. */
export async function importPackage(page: Page) {
  await openSettingsItem(page, /^Veri paketi içe aktar/);
}

/** Launch opens Bu ay directly; waits for the shell. */
export async function openWorkspace(page: Page) {
  await expect(page.getByRole("navigation", { name: "Ana gezinme" })).toBeVisible();
}

export async function openSection(page: Page, name: "Bu ay" | "Ürünler" | "Giderler") {
  await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name, exact: true }).click();
}

export const monthLabel = (page: Page) => page.getByRole("group", { name: "Dönem", exact: true }).locator(".month-label");
const monthIndex = (month: string) => Number(month.slice(0, 4)) * 12 + Number(month.slice(5, 7));

/** Steps the month stepper to `month` (YYYY-MM). Fails when the data range ends before it. */
export async function setMonth(page: Page, month: string) {
  const group = page.getByRole("group", { name: "Dönem", exact: true });
  for (let guard = 0; guard < 80; guard++) {
    const current = await monthLabel(page).getAttribute("data-month");
    if (current === month) return;
    const step = group.getByRole("button", { name: monthIndex(month) > monthIndex(current!) ? "Sonraki ay" : "Önceki ay", exact: true });
    expect(await step.getAttribute("aria-disabled"), `the data range ends before ${month}`).not.toBe("true");
    await step.click();
    await expect(monthLabel(page)).not.toHaveAttribute("data-month", current!);
  }
  throw new Error(`could not reach ${month}`);
}
