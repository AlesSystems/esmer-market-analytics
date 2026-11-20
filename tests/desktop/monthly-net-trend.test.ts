import { expect } from "@playwright/test";
import { test } from "../helpers/monthly-trend-desktop";
import { openSection, setMonth } from "../helpers/desktop-navigation";
import { november, novemberProfitPackage, novemberProfitSnapshot } from "../helpers/november-bill-fixture";

test("monthly net chart and table follow approval, correction and withdrawal", async ({ trendDesktop }, testInfo) => {
  test.setTimeout(90_000);
  const { page, importSnapshot, captureTrend } = trendDesktop;
  const snapshot = novemberProfitSnapshot();
  // October has known gross profit but the package starts after the first day. December has no sales.
  const extendedSnapshot = novemberProfitPackage({
    ...snapshot, from: "2026-10-12", to: "2026-12-20", capturedAt: "2026-12-21T00:00:00.000Z",
    headers: [...snapshot.headers, { ...snapshot.headers[0], ID: "991", FIS_TARIHI: "2026-10-15T12:00:00.000" }],
    lines: [...snapshot.lines, { ...snapshot.lines[0], ID: "992", FIS: "991" }],
  });
  await page.clock.setFixedTime(new Date("2026-12-22T12:00:00Z"));
  await importSnapshot(extendedSnapshot);
  await expect(page.getByRole("region", { name: "Aylık tahmini brüt kâr (₺)", exact: true })).toBeVisible();
  await setMonth(page, november);
  const button = (name: string) => page.getByRole("button", { name, exact: true });
  const chart = page.getByRole("region", { name: "Aylık tahmini net kâr (₺)", exact: true });
  const point = chart.getByRole("listitem").filter({ hasText: "Kasım 2026" });
  const table = chart.getByRole("table");
  const row = table.getByRole("row", { name: /Kasım 2026/ });
  const toggle = chart.getByText("Aylık değerleri göster", { exact: true });
  const showTable = async () => {
    if (!await table.isVisible()) await toggle.press("Enter");
    await expect(table).toBeVisible();
  };
  const review = async () => {
    await button("Bu ayın giderleri tamam").click();
    await button("Bu kalemlerde gider yok, onayla").click();
    await expect(button("Onayı kaldır")).toBeVisible();
  };
  await expect(chart.getByRole("listitem").first()).toContainText(/Ekim 2026.*Kısmi ay.*Paket ayın tamamını kapsamıyor/);
  await expect(point).toContainText(/Kasım 2026.*Seçili ay.*Bu ayın giderleri girilmedi/);
  await showTable();
  await expect(row).toContainText(/0?1\.11\.2026 – 30\.11\.2026.*Tam ay.*Bu ayın giderleri girilmedi/);

  await openSection(page, "Giderler");
  await button("Elle gider ekle").click();
  await page.getByLabel("Kategori", { exact: true }).fill("Elektrik");
  await page.getByLabel("Tutar (TRY)", { exact: true }).fill("1.250,00");
  await button("Gideri kaydet").click();
  await expect(page.getByRole("status").filter({ hasText: "Gider kaydedildi." })).toBeVisible();
  await review();
  await button("Net kârı gör").click();
  await expect(page.getByRole("region", { name: "Tahmini net kâr", exact: true })).toContainText("8.750,00 ₺");
  await expect(point).toContainText("8.750,00 ₺");
  await setMonth(page, "2026-12");
  await expect(point).toContainText("8.750,00 ₺");
  await expect(point).not.toContainText("Seçili ay");
  await expect(chart.getByRole("listitem").last()).toContainText(/Kısmi ay · 0?1\.12\.2026 – 20\.12\.2026.*Brüt kâr için yeterli veri yok/);
  const gross = page.getByRole("region", { name: "Aylık tahmini brüt kâr (₺)", exact: true });
  await expect(gross.getByRole("listitem").last()).toContainText("Brüt kâr için yeterli veri yok");
  await showTable();
  await expect(row).toContainText("8.750,00 ₺");

  await captureTrend(chart, "net", testInfo);

  await openSection(page, "Giderler");
  await setMonth(page, november);
  await button("İncele / düzelt").click();
  await page.getByLabel("Tutar (TRY)", { exact: true }).fill("1.500,00");
  await page.getByLabel("Değişiklik gerekçesi", { exact: true }).fill("Düzeltilen tutar");
  await button("Düzeltmeyi kaydet").click();
  await expect(page.getByText("Onay eskidi", { exact: true })).toBeVisible();
  await openSection(page, "Bu ay");
  await setMonth(page, "2026-12");
  await expect(point).toContainText("Giderler onaydan sonra değişti");
  await showTable();
  await expect(row).toContainText("Giderler onaydan sonra değişti");
  await expect(chart).not.toContainText("8.750,00 ₺");

  await openSection(page, "Giderler");
  await setMonth(page, november);
  await review();
  await button("Net kârı gör").click();
  await expect(point).toContainText("8.500,00 ₺");
  await openSection(page, "Giderler");
  await button("Onayı kaldır").click();
  await expect(button("Bu ayın giderleri tamam")).toBeFocused();
  await openSection(page, "Bu ay");
  await setMonth(page, "2026-12");
  await expect(point).toContainText("Bu ayın giderleri tamamlanmadı");
  await showTable();
  await expect(row).toContainText("Bu ayın giderleri tamamlanmadı");
  await expect(chart).not.toContainText("8.500,00 ₺");
});
