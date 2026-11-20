import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "../helpers/desktop-executable";
import { importPackage, openWorkspace, setMonth } from "../helpers/desktop-navigation";
import { monthProfitPackage, monthlyTrendSnapshot } from "../helpers/month-profit-fixture";

test("monthly margin uses known-cost sales and distinguishes break-even from an unavailable ratio", async ({}, testInfo) => {
  test.setTimeout(60_000);
  const userData = await mkdtemp(join(tmpdir(), "esmer-monthly-margin-"));
  const file = join(userData, "margin.json");
  const replacement = join(userData, "no-costed-sales-amount.json");
  const snapshot = monthlyTrendSnapshot();
  await writeFile(file, monthProfitPackage(snapshot));
  // A zero-priced sale still has a known cost of 10 × 10 TRY. Its margin is undefined.
  await writeFile(replacement, monthProfitPackage({
    ...snapshot,
    from: "2025-12-01",
    to: "2025-12-31",
    headers: snapshot.headers.filter(header => header.ID === "201"),
    lines: snapshot.lines.filter(line => line.ID === "2011").map(line => ({
      ...line, TOPLAM_KDV_MATRAHI: "0", BELGE_TARIHINDEKI_SON_ALIS_FIYATI: "10",
    })),
    products: snapshot.products?.filter(product => product.ID === "1"),
  }));

  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await openWorkspace(page);
    const choose = (path: string) => app.evaluate(({ dialog }, filePath) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [filePath] });
    }, path);
    await choose(file);
    await page.getByRole("button", { name: "Veri paketi içe aktar", exact: true }).click();
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

    for (const zoom of [1, 2]) {
      await app.evaluate(({ BrowserWindow }, factor) => {
        const window = BrowserWindow.getAllWindows()[0];
        window.setContentSize(680, 1000);
        window.webContents.setZoomFactor(factor);
      }, zoom);
      await expect.poll(() => page.evaluate(() => innerWidth)).toBe(680 / zoom);
      await expect.poll(() => margin.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await expect.poll(() => exact.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      const capture = async (name: string) => {
        const png = await app.evaluate(async ({ BrowserWindow }) =>
          (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString("base64"));
        await writeFile(testInfo.outputPath(name), Buffer.from(png, "base64"));
      };
      await margin.evaluate(node => node.scrollIntoView({ block: "start" }));
      await expect(margin.getByRole("heading")).toBeInViewport();
      await capture(`margin-chart-680-zoom${zoom}.png`);
      if (zoom === 2) {
        await exact.evaluate(node => node.scrollIntoView({ block: "end" }));
        await expect(exact.getByRole("row", { name: /Ocak 2026/ })).toBeInViewport();
        await capture("margin-table-680-zoom2.png");
      }
    }

    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(1));
    await setMonth(page, "2025-12");
    await expect(months).toHaveCount(2);
    await expect(months.last()).toContainText(/Aralık 2025.*Seçili ay/);
    if (!(await exact.isVisible())) await figures.press("Enter");
    await expect(exact.getByRole("row")).toHaveCount(3);
    await expect(exact.getByRole("row", { name: /Aralık 2025/ })).toContainText("Seçili ay");

    await choose(replacement);
    await importPackage(page);
    await expect(months).toHaveCount(1);
    await expect(months.first()).toContainText(/Aralık 2025.*Seçili ay.*Maliyeti bilinen satış tutarı pozitif olmadığı için marj hesaplanamadı/);
    await expect(summary).toContainText("-100,00 ₺");
    if (!(await exact.isVisible())) await figures.press("Enter");
    await expect(exact.getByRole("row")).toHaveCount(2);
    await expect(exact.getByRole("row", { name: /Aralık 2025/ })).toContainText("Maliyeti bilinen satış tutarı pozitif olmadığı için marj hesaplanamadı");
  } finally {
    await app.close().catch(() => {});
    await rm(userData, { recursive: true, force: true });
  }
});
