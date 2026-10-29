import { test, expect, _electron as electron, type Page } from "@playwright/test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { executablePath } from "../helpers/desktop-executable";
import { openSection, openWorkspace } from "../helpers/desktop-navigation";
import { monthProfitPackage, monthProfitSnapshot } from "../helpers/month-profit-fixture";

// Giderler in three states, synthetic data only: an empty month, lines with one empty group asking before it confirms, and confirmed.
// ESMER_CAPTURE_GIDERLER=<directory> writes giderler-<state>-<width>x<height>.png (the window as the owner sees it) and a -tam variant of the whole page.
const output = process.env.ESMER_CAPTURE_GIDERLER;
const sizes = [{ width: 1440, height: 900 }, { width: 1100, height: 560 }];
const save = (page: Page, requestId: string, date: string, category: string, net: string, classification = "operating-expense") =>
  page.evaluate(({ requestId, date, category, net, classification }) => window.esmer.createExpense({ action: "save", requestId, duplicateReview: null, fields: { date, paymentDate: null, category, classification, net, tax: "0", gross: net, taxTreatment: "non-recoverable", taxEvidence: "synthetic-tax", supportingReference: null, sourceReference: null, labourPeriod: classification === "labour" ? date.slice(0, 7) : null, loss: null } } as never), { requestId, date, category, net, classification });

for (const size of sizes) test(`capture Giderler ${size.width}x${size.height}`, async () => {
  test.skip(!output, "set ESMER_CAPTURE_GIDERLER to a directory");
  test.setTimeout(120_000);
  const directory = resolve(output!);
  await mkdir(directory, { recursive: true });
  const userData = await mkdtemp(join(tmpdir(), "giderler-capture-")), store = openStore(join(userData, "analytics.sqlite"));
  try { store.importSourcePreview(monthProfitPackage({ ...monthProfitSnapshot(), to: "2025-10-31" })); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow(); await openWorkspace(page);
    await app.evaluate(({ BrowserWindow }, s) => BrowserWindow.getAllWindows()[0].setContentSize(s.width, s.height), size);
    // September is confirmed, so October shows "Eylül: …" under each group.
    await save(page, "cap-sep-1", "2025-09-02", "Kira", "27500");
    await save(page, "cap-sep-2", "2025-09-10", "Elektrik", "5980.50");
    await save(page, "cap-sep-3", "2025-09-28", "Personel", "40000", "labour");
    await save(page, "cap-sep-4", "2025-09-14", "Temizlik", "1850");
    const september = await page.evaluate(() => window.esmer.queryExpenses({ period: "2025-09" }));
    if (september.status !== "expenses") throw Error("expenses missing");
    await page.evaluate(revision => window.esmer.confirmExpenseCompleteness({ period: "2025-09", reviewedRevision: revision, complete: true, reason: "Sentetik onay" }), september.expenseRevision);
    const shoot = async (state: string) => {
      await expect(page.getByRole("heading", { name: "Ekim 2025 giderleri", level: 1 })).toBeVisible();
      await page.evaluate(() => { (document.activeElement as HTMLElement | null)?.blur(); window.scrollTo(0, 0); return document.fonts.ready; }); await page.waitForTimeout(500);
      const name = `giderler-${state}-${size.width}x${size.height}`;
      await page.screenshot({ path: join(directory, `${name}.png`) });
      await page.screenshot({ path: join(directory, `${name}-tam.png`), fullPage: true });
    };
    await openSection(page, "Giderler");
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    await shoot("bos-ay");
    await save(page, "cap-oct-1", "2025-10-02", "Kira", "28000");
    await save(page, "cap-oct-2", "2025-10-10", "Elektrik", "6420.50");
    await save(page, "cap-oct-3", "2025-10-28", "Personel", "41500", "labour");
    await openSection(page, "Bu ay"); await openSection(page, "Giderler");
    await expect(page.locator("[data-group=other]")).toContainText("Kayıt yok");
    await page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Diğer için kayıt yok." })).toBeVisible();
    await shoot("bos-grup-uyarisi");
    await page.getByRole("button", { name: "Bu kalemlerde gider yok, onayla", exact: true }).click();
    await expect(page.getByText("Onaylandı", { exact: true })).toBeVisible();
    await shoot("onayli");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
