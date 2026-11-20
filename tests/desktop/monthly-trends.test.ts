import { expect } from "@playwright/test";
import { test } from "../helpers/monthly-trend-desktop";
import { setMonth } from "../helpers/desktop-navigation";
import { monthProfitPackage, monthProfitSnapshot, monthlyTrendSnapshot } from "../helpers/month-profit-fixture";

test("monthly gross profit follows covered months across years, selection and package replacement", async ({ trendDesktop }, testInfo) => {
  test.setTimeout(60_000);
  const { page, importSnapshot, captureTrend } = trendDesktop;
  const snapshot = monthlyTrendSnapshot();
  const headers = snapshot.headers.filter(header => header.FIS_TARIHI?.startsWith("2025-12"));
  const decemberIds = new Set(headers.map(header => header.ID));
  const lines = monthProfitSnapshot().lines.filter(line => decemberIds.has(line.FIS));
  const productIds = new Set(lines.map(line => line.STOK));
  const replacement = monthProfitPackage({
    ...snapshot,
    from: "2025-12-01",
    to: "2025-12-31",
    headers,
    lines,
    products: snapshot.products?.filter(product => productIds.has(product.ID)),
  });
  await importSnapshot(monthProfitPackage(snapshot));
  const gross = page.getByRole("region", { name: "Aylık tahmini brüt kâr (₺)", exact: true });
  const months = gross.getByRole("listitem");
  const exact = gross.getByRole("table");
  const disclose = gross.getByText("Aylık değerleri göster", { exact: true });
  await expect(gross).toContainText("Kasım 2025 – Ocak 2026");
  await expect(months).toHaveCount(3);
  await expect(months.nth(0)).toContainText(/Kasım 2025.*Kısmi ay · 10\.11\.2025 – 30\.11\.2025.*0,00 ₺/);
  await expect(months.nth(1)).toContainText(/Aralık 2025.*Satış maliyeti hesaplanamadı/);
  const net = page.getByRole("region", { name: "Aylık tahmini net kâr (₺)", exact: true });
  await expect(net.getByRole("listitem").nth(1)).toContainText(/Aralık 2025.*Satış maliyeti hesaplanamadı/);
  await expect(months.nth(2)).toContainText(/Ocak 2026.*Seçili ay.*Kısmi ay · 01\.01\.2026 – 20\.01\.2026.*-42,50 ₺/);
  await expect(page.getByRole("region", { name: "Ayın özeti" })).toContainText("-42,50 ₺");
  await expect.poll(() => disclose.evaluate(node => node.getBoundingClientRect().height)).toBeGreaterThanOrEqual(40);
  await disclose.focus();
  await page.keyboard.press("Enter");
  await expect(exact.getByRole("row", { name: /Aralık 2025/ })).toContainText(/Tam ay.*Satış maliyeti hesaplanamadı/);

  await captureTrend(gross, "gross", testInfo);
  await setMonth(page, "2025-12");
  await expect(months).toHaveCount(2);
  await expect(months.last()).toContainText(/Aralık 2025.*Seçili ay/);

  await importSnapshot(replacement);
  await expect(months).toHaveCount(1);
  await expect(gross).not.toContainText("Kasım 2025");
  await expect(months.first()).toContainText(/Aralık 2025.*Seçili ay.*102,00 ₺/);
  if (!await exact.isVisible()) await disclose.press("Enter");
  await expect(exact.getByRole("row")).toHaveCount(2);
  await expect(exact.getByRole("row", { name: /Aralık 2025/ })).toContainText(/1\.12\.2025 – 31\.12\.2025.*102,00 ₺/);
});
