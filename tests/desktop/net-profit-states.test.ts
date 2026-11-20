import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "../helpers/desktop-executable";
import { openWorkspace, openSection, importPackage, setMonth } from "../helpers/desktop-navigation";
import { monthProfitSnapshot } from "../helpers/month-profit-fixture";
import { writeRawEstimatePackage } from "../../src/source/raw-package";
import { openStore } from "../../src/store/store";

// Giderler owns the confirmation that unlocks the result shown in Bu ay.
test("net profit on Bu ay follows expense confirmation and a corrected rent amount", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "net-states-")), file = join(userData, "month.json");
  const snapshot = monthProfitSnapshot();
  const octoberSale = snapshot.lines.find(line => line.ID === "1011")!;
  // October has one 800 TRY sale with 10 units at 50 TRY cost, leaving 300 TRY gross profit.
  const lines = snapshot.lines.filter(line => !String(line.FIS).startsWith("10"));
  lines.push({ ...octoberSale, MIKTAR_FIS: "10", TOPLAM_KDV_MATRAHI: "800", BELGE_TARIHINDEKI_SON_ALIS_FIYATI: "50" });
  const headers = snapshot.headers.filter(header => !String(header.ID).startsWith("10") || header.ID === "101");
  const products = snapshot.products?.filter(product => lines.some(line => line.STOK === product.ID));
  await writeFile(file, writeRawEstimatePackage({ ...snapshot, headers, lines, products, to: "2025-10-31" }, "fixture:net-states", "net-states"));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow(); await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, file);
    await importPackage(page);
    await expect(page.getByRole("heading", { name: "Ekim 2025", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Bildirimi kapat", exact: true }).click();
    const netCard = page.getByRole("region", { name: /[Nn]et kâr$/ });
    await expect(netCard).toContainText("Bu ayın giderleri girilmedi");
    await netCard.getByRole("button", { name: "Giderleri gir", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ekim 2025 giderleri", level: 1 })).toBeVisible();
    await expect(page.getByText("Bu ay için gider girilmedi.", { exact: true })).toBeVisible();
    await expect(page.getByText("Kayıt yok demek gider yok demek değildir: şablonu doldurup içe aktarın. Personel için yalnızca aylık toplamı girin.", { exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "Bu ayın net kârı" })).toHaveCount(0);
    await expect(page.getByText("Tahmini net kâr")).toHaveCount(0);
    const save = (requestId: string, category: string, net: string) => page.evaluate(({ requestId, category, net }) => window.esmer.createExpense({ action: "save", requestId, duplicateReview: null, fields: { date: "2025-10-05", paymentDate: null, category, classification: "operating-expense", net, tax: "0", gross: net, taxTreatment: "non-recoverable", taxEvidence: "synthetic-tax", supportingReference: null, sourceReference: null, labourPeriod: null, loss: null } } as never), { requestId, category, net });
    await save("net-state-1", "Kira", "100");
    await setMonth(page, "2025-09"); await setMonth(page, "2025-10");
    // Unconfirmed: expenses are entered but Bu ay shows no net figure and leads back.
    await openSection(page, "Bu ay");
    await expect(netCard).toContainText("Bu ayın giderleri tamamlanmadı");
    await expect(page.getByText("200,00 ₺", { exact: true })).toHaveCount(0);
    await netCard.getByRole("button", { name: "Giderleri gir", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ekim 2025 giderleri", level: 1 })).toBeVisible();
    await expect(page.locator(".g-say")).toContainText("1 / 4 grupta kayıt var");
    // Confirmed (Kira is the only group with a line, so the empty groups are named first): the net figure appears on Bu ay, and focus stays on the confirm control.
    await page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true }).click();
    await page.getByRole("button", { name: "Bu kalemlerde gider yok, onayla", exact: true }).click();
    await expect(page.getByText("Onaylandı", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Onayı kaldır", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Net kârı gör", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Tahmini net kâr", exact: true, level: 2 })).toBeVisible();
    await expect(netCard.getByText("200,00 ₺", { exact: true })).toBeVisible();
    const equation = netCard.getByText("300,00 ₺ brüt kâr − 100,00 ₺ gider = 200,00 ₺ tahmini net kâr", { exact: true });
    await expect(equation).toBeVisible();
    for (const size of [{ width: 1440, height: 900, zoom: 1 }, { width: 680, height: 900, zoom: 1 }, { width: 680, height: 1000, zoom: 2 }]) {
      await app.evaluate(({ BrowserWindow }, size) => {
        const window = BrowserWindow.getAllWindows()[0];
        window.setContentSize(size.width, size.height);
        window.webContents.setZoomFactor(size.zoom);
      }, size);
      await expect.poll(() => page.evaluate(() => innerWidth)).toBe(size.width / size.zoom);
      await equation.scrollIntoViewIfNeeded();
      await expect(equation).toBeInViewport({ ratio: 1 });
      await expect.poll(() => equation.evaluate(node => {
        const text = document.createRange();
        text.selectNodeContents(node);
        const bounds = node.getBoundingClientRect();
        return Array.from(text.getClientRects()).every(rect => rect.left >= bounds.left - 1 && rect.right <= bounds.right + 1);
      })).toBe(true);
      if (size.width === 1440) {
        await page.evaluate(() => document.fonts.ready);
        await expect.poll(() => equation.evaluate(node => {
          const text = document.createRange();
          text.selectNodeContents(node);
          return new Set(Array.from(text.getClientRects(), rect => rect.top)).size;
        })).toBe(1);
        await page.screenshot({ path: testInfo.outputPath("net-calculation.png"), animations: "disabled" });
      }
    }
    await app.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0];
      window.webContents.setZoomFactor(1);
      window.setContentSize(1100, 700);
    });
    // An edit after the confirmation: Giderler says the confirmation is stale, and the old net figure is gone from Bu ay.
    await openSection(page, "Giderler");
    await page.getByRole("row").filter({ hasText: "Kira" }).getByRole("button", { name: "İncele / düzelt" }).click();
    await page.getByLabel("Net tutar", { exact: true }).fill("350");
    await page.getByLabel("Brüt tutar", { exact: true }).fill("350");
    await page.getByLabel("Değişiklik gerekçesi").fill("Sentetik kira düzeltmesi");
    await page.getByRole("button", { name: "Düzeltmeyi kaydet", exact: true }).click();
    await expect(page.getByText("Onay eskidi", { exact: true })).toBeVisible();
    await expect(page.locator(".g-say")).toContainText("Onaydan sonra giderler değişti.");
    await expect(page.getByRole("button", { name: "Onayı kaldır", exact: true })).toHaveCount(0);
    await openSection(page, "Bu ay");
    await expect(page.getByText("200,00 ₺", { exact: true })).toHaveCount(0);
    const staleReason = netCard.getByText("Giderler onaydan sonra değişti; yeniden onaylayın", { exact: true });
    await expect(staleReason).toBeVisible();
    await app.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0];
      window.setContentSize(680, 1000);
      window.webContents.setZoomFactor(2);
    });
    await expect.poll(() => page.evaluate(() => innerWidth)).toBe(340);
    await staleReason.scrollIntoViewIfNeeded();
    await expect(staleReason).toBeInViewport({ ratio: 1 });
    await app.evaluate(({ BrowserWindow }) => {
      const window = BrowserWindow.getAllWindows()[0];
      window.webContents.setZoomFactor(1);
      window.setContentSize(1100, 700);
    });
    // Re-confirming uses the corrected expense. Taking the confirmation back withdraws the figure again.
    await netCard.getByRole("button", { name: "Giderleri gir", exact: true }).click();
    await page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true }).click();
    await page.getByRole("button", { name: "Bu kalemlerde gider yok, onayla", exact: true }).click();
    await expect(page.getByText("Onaylandı", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Net kârı gör", exact: true }).click();
    await expect(netCard.getByText("-50,00 ₺", { exact: true })).toBeVisible();
    await expect(netCard).toContainText("300,00 ₺ brüt kâr − 350,00 ₺ gider = -50,00 ₺ tahmini net kâr");
    await netCard.getByRole("button", { name: "Düzelt", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Ekim 2025 giderleri", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Onayı kaldır", exact: true }).click();
    await expect(page.locator(".g-say")).not.toContainText("onayladınız");
    await expect(page.getByRole("button", { name: "Bu ayın giderleri tamam", exact: true })).toBeFocused();
    await openSection(page, "Bu ay");
    await expect(netCard).toContainText("Bu ayın giderleri tamamlanmadı");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});

test("Bu ay explains why each selected month has no net profit", async () => {
  const userData = await mkdtemp(join(tmpdir(), "net-reasons-"));
  try {
    const snapshot = monthProfitSnapshot();
    const augustDocument = snapshot.headers.find(header => header.ID === "301")!;
    const augustSale = snapshot.lines.find(line => line.ID === "3011")!;
    const headers = [...snapshot.headers, { ...augustDocument, ID: "401", FIS_TARIHI: "2025-07-15T12:00:00.000" }, { ...augustDocument, ID: "501", FIS_TARIHI: "2025-06-15T12:00:00.000" }];
    const lines = snapshot.lines.map(line => line.ID === augustSale.ID ? { ...line, BELGE_TARIHINDEKI_SON_ALIS_FIYATI: null } : line);
    lines.push({ ...augustSale, ID: "4011", FIS: "401" }, { ...augustSale, ID: "5011", FIS: "501" });
    const source = writeRawEstimatePackage({ ...snapshot, from: "2025-06-10", headers, lines }, "fixture:net-reasons", "net-reasons");
    const store = openStore(join(userData, "analytics.sqlite"));
    try {
      store.importSourcePreview(source);
      const expense = { paymentDate: null, category: "Sentetik gider", net: "10", tax: "0", gross: "10", supportingReference: null, sourceReference: null, labourPeriod: null, loss: null } as const;
      store.createExpenseCommand("unknown-kdv", { ...expense, date: "2025-09-05", classification: "operating-expense", taxTreatment: "unknown", taxEvidence: null }, null);
      const blocked = store.createExpenseCommand("unclassified", { ...expense, date: "2025-07-05", classification: "unclassified", taxTreatment: "non-recoverable", taxEvidence: "synthetic-tax" }, null);
      // Seed an existing approved period with a blocking line. Current Giderler prevents approving it from the UI.
      if (blocked.status !== "saved") throw Error("Could not seed the blocking expense");
      store.confirmExpensesComplete({ period: "2025-07", reviewedRevision: blocked.revision, complete: true, reason: "Sentetik geçmiş onay" });
    } finally { store.close(); }

    const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    try {
      const page = await app.firstWindow();
      await openWorkspace(page);
      const netCard = page.getByRole("region", { name: "Net kâr", exact: true });
      const expenseLink = netCard.getByRole("button", { name: "Giderleri gir", exact: true });
      await expect(netCard).toContainText("Ayın tamamı için veri yok (01.10.2025 – 20.10.2025)");
      await expect(expenseLink).toHaveCount(0);

      await setMonth(page, "2025-06");
      await expect(netCard).toContainText("Ayın tamamı için veri yok (10.06.2025 – 30.06.2025)");
      await expect(expenseLink).toHaveCount(0);

      await setMonth(page, "2025-09");
      await expect(netCard).toContainText("Bazı giderlerin KDV durumu bilinmiyor");
      await expenseLink.click();
      await expect(page.getByRole("heading", { name: "Eylül 2025 giderleri", level: 1 })).toBeVisible();
      await openSection(page, "Bu ay");

      await setMonth(page, "2025-08");
      await expect(netCard).toContainText("Bu ayın brüt kârı hesaplanamadığı için net kâr gösterilemiyor");
      await expect(expenseLink).toHaveCount(0);

      await setMonth(page, "2025-07");
      await expect(netCard).toContainText("Bazı gider satırları net kârı engelliyor");
      await expenseLink.click();
      await expect(page.getByRole("heading", { name: "Temmuz 2025 giderleri", level: 1 })).toBeVisible();
    } finally { await app.close(); }
  } finally { await rm(userData, { recursive: true, force: true }); }
});
