import { test, expect, _electron as electron, type ElectronApplication, type Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { executablePath } from "../helpers/desktop-executable";
import { openSection, openWorkspace } from "../helpers/desktop-navigation";
import { monthProfitPackage, monthProfitSnapshot } from "../helpers/month-profit-fixture";

// A blank group is never silently 0: with lines present, confirming needs the owner's explicit "no expense in these groups".
// Synthetic October 2025 (a full month in the package) so Bu ay can show the net card afterwards.
async function launch(): Promise<{ app: ElectronApplication; page: Page; userData: string }> {
  const userData = await mkdtemp(join(tmpdir(), "expense-confirm-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importSourcePreview(monthProfitPackage({ ...monthProfitSnapshot(), to: "2025-10-31" })); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  const page = await app.firstWindow(); await openWorkspace(page);
  await expect(page.getByRole("heading", { name: "Ekim 2025", level: 1 })).toBeVisible();
  return { app, page, userData };
}
const save = (page: Page, requestId: string, category: string, net: string, tax: { treatment: string; evidence: string | null } = { treatment: "non-recoverable", evidence: "synthetic-tax" }) =>
  page.evaluate(({ requestId, category, net, tax }) => window.esmer.createExpense({ action: "save", requestId, duplicateReview: null, fields: { date: "2025-10-05", paymentDate: null, category, classification: "operating-expense", net, tax: "0", gross: net, taxTreatment: tax.treatment, taxEvidence: tax.evidence, supportingReference: null, sourceReference: null, labourPeriod: null, loss: null } } as never), { requestId, category, net, tax });
const confirmation = async (page: Page) => { const view = await page.evaluate(() => window.esmer.queryExpenses({ period: "2025-10" })); if (view.status !== "expenses") throw Error("expenses missing"); return view.confirmation; };
const netCard = (page: Page) => page.getByRole("region", { name: /[Nn]et kâr$/ });

test("lines in one group: the first press names the empty groups and does not confirm, only the explicit action does", async () => {
  const { app, page, userData } = await launch();
  try {
    await save(page, "blank-1", "Kira", "10");
    await openSection(page, "Giderler");
    await expect(page.getByRole("heading", { name: "Ekim 2025 giderleri", level: 1 })).toBeVisible();
    await expect(page.locator(".g-say")).toContainText("1 / 4 grupta kayıt var");
    await expect(page.locator("[data-group=rent] .g-amt")).toHaveText("10,00 ₺");
    for (const group of ["staff", "utilities", "other"]) await expect(page.locator(`[data-group=${group}]`)).toContainText("Kayıt yok");
    const primary = page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true });
    await primary.click();
    const notice = page.getByRole("alert").filter({ hasText: "için kayıt yok." });
    await expect(notice).toContainText("Personel toplamı, Elektrik/su ve Diğer için kayıt yok.");
    await expect(page.getByRole("button", { name: "Vazgeç", exact: true })).toBeFocused();
    await expect(primary).toHaveCount(0);
    expect(await confirmation(page)).toBe("none");
    await expect(page.getByText("Onaylandı", { exact: true })).toHaveCount(0);
    // Vazgeç and Escape both put the question away without confirming, focus returns to the primary action.
    await page.getByRole("button", { name: "Vazgeç", exact: true }).click();
    await expect(notice).toHaveCount(0);
    await expect(primary).toBeFocused();
    await primary.click(); await expect(notice).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(notice).toHaveCount(0);
    expect(await confirmation(page)).toBe("none");
    // The explicit action confirms.
    await primary.click();
    await page.getByRole("button", { name: "Bu kalemlerde gider yok, onayla", exact: true }).click();
    await expect(page.locator(".g-say")).toContainText("Bu ayın giderlerini onayladınız.");
    await expect(page.getByText("Onaylandı", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Onayı kaldır", exact: true })).toBeFocused();
    expect(await confirmation(page)).toBe("current");
    // The net figure lives on Bu ay: gross minus the 10 ₺ rent.
    await page.getByRole("button", { name: "Net kârı gör", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Tahmini net kâr", level: 2 })).toBeVisible();
    await expect(netCard(page)).toContainText("Giderler: 10,00 ₺");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("lines in every group confirm in one press", async () => {
  const { app, page, userData } = await launch();
  try {
    await save(page, "all-1", "Kira", "10"); await save(page, "all-2", "Elektrik", "5"); await save(page, "all-3", "Temizlik", "2");
    await page.evaluate(() => window.esmer.createExpense({ action: "save", requestId: "all-4", duplicateReview: null, fields: { date: "2025-10-06", paymentDate: null, category: "Personel", classification: "labour", net: "20", tax: "0", gross: "20", taxTreatment: "non-recoverable", taxEvidence: "synthetic-tax", supportingReference: null, sourceReference: null, labourPeriod: "2025-10", loss: null } } as never));
    await openSection(page, "Giderler");
    await page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true }).click();
    await expect(page.locator(".g-say")).toContainText("Bu ayın giderlerini onayladınız.");
    await expect(page.getByRole("alert").filter({ hasText: "için kayıt yok." })).toHaveCount(0);
    expect(await confirmation(page)).toBe("current");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("zero lines: 'Bu ay gider yok' is the explicit confirmation and Bu ay then reads the net as the gross", async () => {
  const { app, page, userData } = await launch();
  try {
    await openSection(page, "Giderler");
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    await expect(page.locator(".g-total b")).toHaveText("—");
    await expect(page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true })).toHaveCount(0);
    expect(await confirmation(page)).toBe("none");
    await page.getByRole("button", { name: "Bu ay gider yok", exact: true }).click();
    await expect(page.locator(".g-say")).toContainText("“gider yok” dediniz");
    await expect(page.getByText("Onaylandı", { exact: true })).toBeVisible();
    expect(await confirmation(page)).toBe("current");
    await page.getByRole("button", { name: "Net kârı gör", exact: true }).click();
    await expect(netCard(page)).toContainText("Brüt kârla aynı");
    await expect(netCard(page)).toContainText("Bu ay gider yok");
    // Taking the confirmation back returns Giderler to the question.
    await openSection(page, "Giderler");
    await page.getByRole("button", { name: "Onayı kaldır", exact: true }).click();
    await expect(page.getByRole("button", { name: "Bu ay gider yok", exact: true })).toBeVisible();
    expect(await confirmation(page)).toBe("none");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("a blocking line disables the confirmation, says why and leads to the line", async () => {
  const { app, page, userData } = await launch();
  try {
    await save(page, "block-1", "Kira", "10", { treatment: "unknown", evidence: null });
    await openSection(page, "Giderler");
    await expect(page.locator("[data-group=rent] .g-amt")).toHaveText("Eksik");
    await expect(page.locator(".g-total b")).toHaveText("Eksik");
    const confirm = page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true });
    await expect(confirm).toBeDisabled();
    await expect(page.getByText("Önce işaretli satırları düzeltin.", { exact: true })).toBeVisible();
    await expect(page.locator(".g-say")).toContainText("Bazı satırlar düzeltilmeden onaylanamaz");
    const attention = page.getByRole("group", { name: "Düzeltilmesi gereken satırlar" });
    await expect(attention).toContainText("KDV durumu bilinmiyor");
    await attention.getByRole("button", { name: "Kira satırını düzelt" }).click();
    await expect(page.getByRole("heading", { name: "Gideri incele ve düzelt" })).toBeFocused();
    expect(await confirmation(page)).toBe("none");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
