import { expect } from "@playwright/test";
import { test } from "../helpers/monthly-trend-desktop";
import { setMonth } from "../helpers/desktop-navigation";
import { monthProfitPackage, monthlyTrendSnapshot } from "../helpers/month-profit-fixture";

test("monthly margin uses known-cost sales and distinguishes break-even from an unavailable ratio", async ({ trendDesktop }, testInfo) => {
  test.setTimeout(60_000);
  const { page, importSnapshot, captureTrend } = trendDesktop;
  const snapshot = monthlyTrendSnapshot();
  // A zero-priced sale still has a known cost of 10 × 10 TRY. Its margin is undefined.
  const replacement = monthProfitPackage({
    ...snapshot,
    from: "2025-12-01",
    to: "2025-12-31",
    headers: snapshot.headers.filter(header => header.ID === "201"),
    lines: snapshot.lines.filter(line => line.ID === "2011").map(line => ({
      ...line, TOPLAM_KDV_MATRAHI: "0", BELGE_TARIHINDEKI_SON_ALIS_FIYATI: "10",
    })),
    products: snapshot.products?.filter(product => product.ID === "1"),
  });
  await importSnapshot(monthProfitPackage(snapshot));
  const margin = page.getByRole("region", { name: "Aylık marj (%)", exact: true });
  const months = margin.getByRole("listitem");
  const figures = margin.getByText("Aylık değerleri göster", { exact: true });
  const exact = margin.getByRole("table");
  const summary = page.getByRole("region", { name: "Ayın özeti" });
  await expect(margin).toContainText("Kasım 2025 – Ocak 2026");
  await expect(months).toHaveCount(3);
  await expect(months.nth(0)).toContainText(/Kasım 2025.*Kısmi ay.*%0,00/);
  await expect(months.nth(1)).toContainText(/Aralık 2025.*Brüt kâr hesaplanamadığı için marj hesaplanamadı/);
  // January gross is -42.50 TRY on 430 TRY of known-cost sales, not the full 480 TRY.
  await expect(months.nth(2)).toContainText(/Ocak 2026.*Seçili ay.*Kısmi ay · 01\.01\.2026 – 20\.01\.2026.*-%9,88/);
  await expect(summary.getByRole("group", { name: "Aylık destekleyici tutarlar" })).toContainText("-%9,88");

  await summary.getByRole("button", { name: "Tahmini", exact: true }).click();
  const explanation = page.getByRole("dialog", { name: "Tahmini hakkında" });
  await expect(explanation).toContainText("Son alış fiyatıyla tahmin");
  await expect(explanation).toContainText("alış fiyatı olmayan ürünlerin satışı kâra katılmaz");
  await page.keyboard.press("Escape");
  await figures.focus();
  await page.keyboard.press("Enter");
  await expect(exact.getByRole("row", { name: /Kasım 2025/ })).toContainText(/10\.11\.2025 – 30\.11\.2025.*Kısmi ay.*%0,00/);
  await expect(exact.getByRole("row", { name: /Aralık 2025/ })).toContainText(/Tam ay.*Brüt kâr hesaplanamadığı için marj hesaplanamadı/);

  await captureTrend(margin, "margin", testInfo);
  await setMonth(page, "2025-12");
  await expect(months).toHaveCount(2);
  await expect(months.last()).toContainText(/Aralık 2025.*Seçili ay/);
  if (!(await exact.isVisible())) await figures.press("Enter");
  await expect(exact.getByRole("row")).toHaveCount(3);
  await expect(exact.getByRole("row", { name: /Aralık 2025/ })).toContainText("Seçili ay");

  await importSnapshot(replacement);
  await expect(months).toHaveCount(1);
  await expect(months.first()).toContainText(/Aralık 2025.*Seçili ay.*Maliyeti bilinen satış tutarı pozitif olmadığı için marj hesaplanamadı/);
  await expect(summary).toContainText("-100,00 ₺");
  if (!(await exact.isVisible())) await figures.press("Enter");
  await expect(exact.getByRole("row")).toHaveCount(2);
  await expect(exact.getByRole("row", { name: /Aralık 2025/ })).toContainText("Maliyeti bilinen satış tutarı pozitif olmadığı için marj hesaplanamadı");
});
