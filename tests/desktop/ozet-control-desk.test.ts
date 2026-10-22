import { openReportView, openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { businessPackage, businessRecords, historicalCost } from "../helpers/business-fixtures";
import { executablePath } from "../helpers/desktop-executable";

// The financial Özet control desk (#103) was removed; its monthly figures now live in Rapor ve Excel › Aylık rapor.
test("large monthly figures fit the monthly report and preserve its evidence", async ({}, testInfo) => {
  const records = businessRecords(), fixtureDocument = records.documents[0], line = records.lines[0];
  const categories = ["Süt ve kahvaltılık", "Temel gıda", "İçecekler", "Temizlik ve bakım", "Diğer"];
  records.documents = Array.from({ length: 30 }, (_, index) => {
    const net = index % 2 ? "53240" : "30000";
    return { ...structuredClone(fixtureDocument), id: `D${index}`, date: `2025-09-${String(index + 1).padStart(2, "0")}`, sales: { ...fixtureDocument.sales!, net, tax: "0", gross: net } };
  });
  records.lines = records.documents.map((row, index) => ({ ...structuredClone(line), id: `L${index}`, documentId: row.id, net: row.sales!.net, sales: { ...line.sales!, unitNet: row.sales!.net, taxRate: "0", tax: "0", gross: row.sales!.net, productId: `P${index}`, productName: `Sentetik ürün ${index}`, categoryId: `C${index % 5}`, categoryName: categories[index % 5] }, business: { historicalCost: historicalCost(index % 2 ? "35000" : "20000"), inventory: null } }));
  const userData = await mkdtemp(join(tmpdir(), "esmer-control-desk-large-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(records)).status).toBe("active"); } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await openReportView(page, "Aylık rapor");
    const indicators = page.getByRole("region", { name: "Aylık göstergeler", exact: true });
    await expect(indicators).toContainText("1.248.600,00 ₺");
    await expect(indicators).toContainText("825.000,00 ₺");
    await expect(indicators).toContainText("423.600,00 ₺");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('14px "Manrope Variable"', "İıŞşĞğÜüÖöÇç"))).toBe(true);
    for (const width of [1440, 1120, 680, 390]) {
      await page.setViewportSize({ width, height: 1100 });
      expect(await indicators.locator("strong, dd").evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth))).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`monthly-report-large-${width}.png`) });
    }
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
