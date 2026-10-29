import { test, expect, _electron as electron, type ElectronApplication, type Page } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { executablePath } from "../helpers/desktop-executable";
import { openSection, openWorkspace } from "../helpers/desktop-navigation";
import { monthProfitPackage, monthProfitSnapshot } from "../helpers/month-profit-fixture";

// Design finish on the three tabs at the small window (1100x560): what stays above the fold, one-line rows, columns instead of tiles.
async function launch(to?: string): Promise<{ app: ElectronApplication; page: Page; userData: string }> {
  const userData = await mkdtemp(join(tmpdir(), "design-finish-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { store.importSourcePreview(monthProfitPackage(to ? { ...monthProfitSnapshot(), to } : monthProfitSnapshot())); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentSize(1100, 560));
  const page = await app.firstWindow(); await openWorkspace(page);
  return { app, page, userData };
}
const finish = async (app: ElectronApplication, userData: string) => { await app.close().catch(() => undefined); await rm(userData, { recursive: true, force: true }); };
const save = (page: Page, requestId: string, date: string, category: string, net: string, treatment = "non-recoverable") =>
  page.evaluate(({ requestId, date, category, net, treatment }) => window.esmer.createExpense({ action: "save", requestId, duplicateReview: null, fields: { date, paymentDate: null, category, classification: "operating-expense", net, tax: "0", gross: net, taxTreatment: treatment, taxEvidence: treatment === "unknown" ? null : "synthetic-tax", supportingReference: null, sourceReference: null, labourPeriod: null, loss: null } } as never), { requestId, date, category, net, treatment });
const bottom = (page: Page, selector: string) => page.locator(selector).evaluate(node => ({ bottom: node.getBoundingClientRect().bottom, fold: innerHeight }));
const style = (page: Page, selector: string, property: string) => page.locator(selector).first().evaluate((node, name) => getComputedStyle(node).getPropertyValue(name), property);

test("Giderler, empty month: the answer and the confirmation stay above the fold, Excel import leads", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch("2025-10-31");
  try {
    await openSection(page, "Giderler");
    const heading = page.getByRole("heading", { name: "Ekim 2025 giderleri", level: 1 });
    await expect(heading).toBeAttached();
    expect(await heading.evaluate(node => node.getBoundingClientRect().width)).toBeLessThanOrEqual(1);
    await expect(page.locator(".g-say")).toHaveText("Bu ay için gider girilmedi.");
    const confirm = page.getByRole("button", { name: "Bu ay gider yok", exact: true });
    await expect(confirm).toBeVisible();
    const edge = await bottom(page, ".g-foot");
    expect(edge.bottom).toBeLessThanOrEqual(edge.fold);
    await expect(page.getByRole("button", { name: "Excel’den içe aktar", exact: true })).toHaveClass(/btn-primary/);
    await expect(page.getByRole("button", { name: "Elle ekle", exact: true })).toHaveClass(/\blink\b/);
    await expect(page.getByRole("button", { name: "Şablonu indir", exact: true })).toHaveClass(/\blink\b/);
    expect(await style(page, "[data-state=empty] .g-amt", "font-size")).toBe("18px");
    await expect(page.locator(".g-empty p")).toHaveText("Kayıt yok demek gider yok demek değildir: şablonu doldurup içe aktarın. Personel için yalnızca aylık toplamı girin.");
    expect(await style(page, ".g-tile:nth-child(2)", "border-left-width")).toBe("1px");
    expect(await style(page, ".g-tile:nth-child(2)", "background-color")).toBe("rgba(0, 0, 0, 0)");
  } finally { await finish(app, userData); }
});

test("Giderler with lines: one line per row, the blank-group question above the fold, no hint for a month without lines in a group", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch("2025-10-31");
  try {
    await save(page, "sep-rent", "2025-09-05", "Kira", "40");
    const september = await page.evaluate(() => window.esmer.queryExpenses({ period: "2025-09" }));
    if (september.status !== "expenses") throw Error("expenses missing");
    await page.evaluate(revision => window.esmer.confirmExpenseCompleteness({ period: "2025-09", reviewedRevision: revision, complete: true, reason: "Sentetik onay" }), september.expenseRevision);
    await save(page, "oct-rent", "2025-10-05", "Kira", "45");
    await save(page, "oct-tax", "2025-10-06", "Temizlik", "12", "unknown");
    await openSection(page, "Giderler");
    await expect(page.locator("[data-group=rent]")).toContainText("Eylül: 40,00 ₺");
    await expect(page.locator("[data-group=staff]")).not.toContainText("Eylül");
    await expect(page.getByRole("button", { name: "Excel’den içe aktar", exact: true })).toHaveClass(/btn-secondary/);
    const rows = page.getByRole("region", { name: "Kayıtlar" }).locator("tbody tr");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0).locator("td")).toHaveText(["05.10.2025", "Kira", "45,00 ₺", "İncele / düzelt"]);
    await expect(rows.nth(1).locator("td")).toHaveText(["06.10.2025", "Temizlik KDV bilinmiyor", "12,00 ₺", "İncele / düzelt"]);
    // Net, KDV, version and origin live in the editor.
    await rows.nth(0).getByRole("button", { name: "İncele / düzelt" }).click();
    await expect(page.getByText("Elle girildi · sürüm 1", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Giderlere dön", exact: true }).click();
    // Without the blocking line the first press asks about the blank groups, still inside the window.
    await rows.nth(1).getByRole("button", { name: "İncele / düzelt" }).click();
    await page.getByLabel("KDV işlemi").selectOption("non-recoverable");
    await page.getByLabel("KDV kanıtı").fill("synthetic-tax");
    await page.getByLabel("Değişiklik gerekçesi").fill("Sentetik düzeltme");
    await page.getByRole("button", { name: "Düzeltmeyi kaydet" }).click();
    await page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true }).click();
    const ask = page.getByRole("alert").filter({ hasText: "için kayıt yok." });
    await expect(ask).toBeVisible();
    const edge = await ask.evaluate(node => ({ bottom: node.getBoundingClientRect().bottom, fold: innerHeight }));
    expect(edge.bottom).toBeLessThanOrEqual(edge.fold);
  } finally { await finish(app, userData); }
});

test("Bu ay and the drawer: chart title with its unit, quiet net reason, fold slack, columns instead of nested tiles", async () => {
  test.setTimeout(90_000);
  const { app, page, userData } = await launch();
  try {
    await expect(page.getByRole("heading", { name: "Son 6 ay brüt kâr (₺)", level: 2 })).toBeVisible();
    const net = page.locator(".netcard");
    await expect(net).toContainText("Ay henüz tamamlanmadı");
    await expect(net.locator(".net-say")).toHaveCount(0);
    expect(await style(page, ".netcard .muted", "font-size")).toBe("14px");
    const edge = await bottom(page, ".att-row:last-child");
    expect(edge.fold - edge.bottom).toBeGreaterThanOrEqual(24);
    await openSection(page, "Ürünler");
    await page.locator(".products-table tr[data-product='1'] button").click();
    await expect(page.locator(".drawer")).toBeVisible();
    expect(await style(page, ".dr-facts > div:nth-child(2)", "border-left-width")).toBe("1px");
    expect(await style(page, ".dr-facts > div:nth-child(2)", "background-color")).toBe("rgba(0, 0, 0, 0)");
  } finally { await finish(app, userData); }
});
