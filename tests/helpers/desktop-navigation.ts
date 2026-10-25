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

/** The old Rapor tabs were removed in P5; tests that call this are skipped as old UI. Former sub-views: "Aylık rapor" (reports and Excel), "Veri ve kaynak" (records and sales), "Alış belgeleri" (purchasing). */
export async function openReportView(page: Page, name: "Aylık rapor" | "Veri ve kaynak" | "Alış belgeleri") {
  await openSection(page, "Rapor ve Excel");
  await page.getByRole("navigation", { name: "Rapor bölümleri" }).getByRole("button", { name, exact: true }).click();
}

/** Keyboard variant of openReportView: activates Rapor ve Excel, then the sub-view, with Enter. */
export async function pressReportView(page: Page, name: "Aylık rapor" | "Veri ve kaynak" | "Alış belgeleri") {
  await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Rapor ve Excel", exact: true }).press("Enter");
  await page.getByRole("navigation", { name: "Rapor bölümleri" }).getByRole("button", { name, exact: true }).press("Enter");
}
