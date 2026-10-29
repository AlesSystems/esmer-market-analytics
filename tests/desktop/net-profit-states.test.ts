import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "../helpers/desktop-executable";
import { openWorkspace, openSection, importPackage, setMonth } from "../helpers/desktop-navigation";
import { monthProfitSnapshot } from "../helpers/month-profit-fixture";
import { writeRawEstimatePackage } from "../../src/source/raw-package";

test("Giderler net profit panel: hidden before the confirmation, shown after it, hidden again when an edit makes it stale", async () => {
  const userData = await mkdtemp(join(tmpdir(), "net-states-")), file = join(userData, "month.json");
  await writeFile(file, writeRawEstimatePackage({ ...monthProfitSnapshot(), to: "2025-10-31" }, "fixture:net-states", "net-states"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow(); await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, file);
    await importPackage(page);
    await expect(page.getByRole("heading", { name: "Ekim 2025", level: 1 })).toBeVisible();
    await openSection(page, "Giderler");
    const panel = page.getByRole("complementary", { name: "Bu ayın net kârı" });
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    await expect(page.getByText("Kayıt bulunmaması, gider olmadığı anlamına gelmez.", { exact: true })).toBeVisible();
    const save = (requestId: string, category: string, net: string) => page.evaluate(({ requestId, category, net }) => window.esmer.createExpense({ action: "save", requestId, duplicateReview: null, fields: { date: "2025-10-05", paymentDate: null, category, classification: "operating-expense", net, tax: "0", gross: net, taxTreatment: "non-recoverable", taxEvidence: "synthetic-tax", supportingReference: null, sourceReference: null, labourPeriod: null, loss: null } } as never), { requestId, category, net });
    await save("net-state-1", "Kira", "10");
    await setMonth(page, "2025-09"); await setMonth(page, "2025-10");
    // Unconfirmed: expenses are entered but no net figure is shown.
    await expect(panel.getByText("Hesaplanamadı", { exact: true })).toBeVisible();
    await expect(panel.getByText(/onayı verilmedi/)).toBeVisible();
    await expect(panel.getByText("47,50 ₺", { exact: true })).toHaveCount(0);
    // Confirmed: the net figure appears and focus stays on the confirm control.
    await page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Onaylandı", exact: true })).toBeVisible();
    await expect(panel.getByText("47,50 ₺", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Onayı kaldır", exact: true })).toBeFocused();
    // An edit after the confirmation: stale state, and the old net figure is gone.
    await save("net-state-2", "Elektrik", "5");
    await setMonth(page, "2025-09"); await setMonth(page, "2025-10");
    await expect(page.getByRole("heading", { name: "Onay eskidi", exact: true })).toBeVisible();
    await expect(panel.getByText("47,50 ₺", { exact: true })).toHaveCount(0);
    await expect(panel.getByText("Onaydan sonra giderler değişti; yeniden onaylayın.", { exact: true })).toBeVisible();
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
