import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "../helpers/desktop-executable";
import { openWorkspace, openSection, importPackage, setMonth } from "../helpers/desktop-navigation";
import { monthProfitSnapshot } from "../helpers/month-profit-fixture";
import { writeRawEstimatePackage } from "../../src/source/raw-package";

// Tahmini net kâr has one home, Bu ay's net card. Giderler owns the confirmation that unlocks it.
test("net profit: absent before the confirmation on Bu ay, shown after it, withdrawn when an edit makes the confirmation stale", async () => {
  const userData = await mkdtemp(join(tmpdir(), "net-states-")), file = join(userData, "month.json");
  await writeFile(file, writeRawEstimatePackage({ ...monthProfitSnapshot(), to: "2025-10-31" }, "fixture:net-states", "net-states"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow(); await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, file);
    await importPackage(page);
    await expect(page.getByRole("heading", { name: "Ekim 2025", level: 1 })).toBeVisible();
    const netCard = page.getByRole("region", { name: /[Nn]et kâr$/ });
    // Giderler no longer carries a net-profit panel.
    await openSection(page, "Giderler");
    await expect(page.getByRole("heading", { name: "Ekim 2025 giderleri", level: 1 })).toBeVisible();
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    await expect(page.getByText("Kayıt bulunmaması, gider olmadığı anlamına gelmez.", { exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Bu ayın net kârı" })).toHaveCount(0);
    await expect(page.getByText("Tahmini net kâr")).toHaveCount(0);
    const save = (requestId: string, category: string, net: string) => page.evaluate(({ requestId, category, net }) => window.esmer.createExpense({ action: "save", requestId, duplicateReview: null, fields: { date: "2025-10-05", paymentDate: null, category, classification: "operating-expense", net, tax: "0", gross: net, taxTreatment: "non-recoverable", taxEvidence: "synthetic-tax", supportingReference: null, sourceReference: null, labourPeriod: null, loss: null } } as never), { requestId, category, net });
    await save("net-state-1", "Kira", "10");
    await setMonth(page, "2025-09"); await setMonth(page, "2025-10");
    // Unconfirmed: expenses are entered but Bu ay shows no net figure and leads back.
    await openSection(page, "Bu ay");
    await expect(netCard).toContainText("Bu ayın giderleri tamamlanmadı");
    await expect(page.getByText("47,50 ₺", { exact: true })).toHaveCount(0);
    await netCard.getByRole("button", { name: "Giderleri gir", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ekim 2025 giderleri", level: 1 })).toBeVisible();
    await expect(page.locator(".g-say")).toContainText("1 / 4 grupta kayıt var");
    // Confirmed (Kira is the only group with a line, so the empty groups are named first): the net figure appears on Bu ay, and focus stays on the confirm control.
    await page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true }).click();
    await page.getByRole("button", { name: "Bu kalemlerde gider yok, onayla", exact: true }).click();
    await expect(page.getByText("Onaylandı", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Onayı kaldır", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Net kârı gör", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Tahmini net kâr", level: 2 })).toBeVisible();
    await expect(netCard.locator(".net")).toHaveText("47,50 ₺");
    await expect(netCard).toContainText("Giderler: 10,00 ₺");
    // An edit after the confirmation: Giderler says the confirmation is stale, and the old net figure is gone from Bu ay.
    await openSection(page, "Giderler");
    await save("net-state-2", "Elektrik", "5");
    await setMonth(page, "2025-09"); await setMonth(page, "2025-10");
    await expect(page.getByText("Onay eskidi", { exact: true })).toBeVisible();
    await expect(page.locator(".g-say")).toContainText("Onaydan sonra giderler değişti.");
    await expect(page.getByRole("button", { name: "Onayı kaldır", exact: true })).toHaveCount(0);
    await openSection(page, "Bu ay");
    await expect(page.getByText("47,50 ₺", { exact: true })).toHaveCount(0);
    await expect(netCard).toContainText("Giderler onaydan sonra değişti; yeniden onaylayın");
    // Re-confirming (two groups now have lines) and then taking the confirmation back withdraws the figure again.
    await netCard.getByRole("button", { name: "Giderleri gir", exact: true }).click();
    await page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true }).click();
    await page.getByRole("button", { name: "Bu kalemlerde gider yok, onayla", exact: true }).click();
    await expect(page.getByText("Onaylandı", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Onayı kaldır", exact: true }).click();
    await expect(page.locator(".g-say")).not.toContainText("onayladınız");
    await expect(page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true })).toBeFocused();
    await openSection(page, "Bu ay");
    await expect(netCard).toContainText("Bu ayın giderleri tamamlanmadı");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
