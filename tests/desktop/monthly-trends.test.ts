import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "../helpers/desktop-executable";
import { importPackage, openWorkspace, setMonth } from "../helpers/desktop-navigation";
import { monthProfitPackage, monthProfitSnapshot, monthlyTrendSnapshot } from "../helpers/month-profit-fixture";

test("monthly gross profit follows covered months across years, selection and package replacement", async ({}, testInfo) => {
  test.setTimeout(60_000);
  const userData = await mkdtemp(join(tmpdir(), "esmer-monthly-trends-"));
  const file = join(userData, "trend.json"), replacement = join(userData, "one-month.json");
  const snapshot = monthlyTrendSnapshot();
  const headers = snapshot.headers.filter(header => header.FIS_TARIHI?.startsWith("2025-12"));
  const decemberIds = new Set(headers.map(header => header.ID));
  const lines = monthProfitSnapshot().lines.filter(line => decemberIds.has(line.FIS));
  const productIds = new Set(lines.map(line => line.STOK));
  await writeFile(file, monthProfitPackage(snapshot));
  await writeFile(replacement, monthProfitPackage({
    ...snapshot,
    from: "2025-12-01",
    to: "2025-12-31",
    headers,
    lines,
    products: snapshot.products?.filter(product => productIds.has(product.ID)),
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
    const gross = page.getByRole("region", { name: "Aylık tahmini brüt kâr (₺)", exact: true });
    const months = gross.getByRole("listitem");
    const exact = gross.getByRole("table");
    const disclose = gross.getByText("Aylık değerleri göster", { exact: true });
    await expect(gross).toContainText("Kasım 2025 – Ocak 2026");
    await expect(months).toHaveCount(3);
    await expect(months.nth(0)).toContainText(/Kasım 2025.*Kısmi ay · 10\.11\.2025 – 30\.11\.2025.*0,00 ₺/);
    await expect(months.nth(1)).toContainText(/Aralık 2025.*Maliyetler bilinmediği için brüt kâr hesaplanamadı/);
    await expect(months.nth(2)).toContainText(/Ocak 2026.*Seçili ay.*Kısmi ay · 01\.01\.2026 – 20\.01\.2026.*-42,50 ₺/);
    await expect(page.getByRole("region", { name: "Ayın özeti" })).toContainText("-42,50 ₺");
    await disclose.focus();
    await page.keyboard.press("Enter");
    await expect(exact.getByRole("row", { name: /Aralık 2025/ })).toContainText("Tam ay");

    for (const size of [{ width: 680, height: 900, zoom: 1 }, { width: 680, height: 1000, zoom: 2 }]) {
      await app.evaluate(({ BrowserWindow }, viewport) => {
        const window = BrowserWindow.getAllWindows()[0];
        window.setContentSize(viewport.width, viewport.height);
        window.webContents.setZoomFactor(viewport.zoom);
      }, size);
      await expect.poll(() => page.evaluate(() => innerWidth)).toBe(size.width / size.zoom);
      await expect.poll(() => gross.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await expect.poll(() => exact.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await expect(exact.getByRole("row", { name: /Ocak 2026/ })).toContainText("-42,50 ₺");
      await page.evaluate(() => document.fonts.ready);
      const screenshot = testInfo.outputPath(`gross-chart-${size.width}-zoom${size.zoom}.png`);
      if (size.zoom === 1) await gross.screenshot({ path: screenshot, animations: "disabled" });
      else {
        const capture = async (path: string) => {
          const png = await app.evaluate(async ({ BrowserWindow }) =>
            (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString("base64"));
          await writeFile(path, Buffer.from(png, "base64"));
        };
        await gross.evaluate(node => node.scrollIntoView({ block: "start" }));
        await expect.poll(() => gross.evaluate(node => node.getBoundingClientRect().top < innerHeight / 3)).toBe(true);
        await capture(screenshot);
        await exact.evaluate(node => node.scrollIntoView({ block: "end" }));
        await expect.poll(() => exact.evaluate(node => node.getBoundingClientRect().bottom <= innerHeight + 1)).toBe(true);
        await capture(testInfo.outputPath("gross-table-680-zoom2.png"));
      }
    }
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(1));
    await setMonth(page, "2025-12");
    await expect(months).toHaveCount(2);
    await expect(months.last()).toContainText(/Aralık 2025.*Seçili ay/);

    await choose(replacement);
    await importPackage(page);
    await expect(months).toHaveCount(1);
    await expect(gross).not.toContainText("Kasım 2025");
    await expect(months.first()).toContainText(/Aralık 2025.*Seçili ay.*102,00 ₺/);
    if (!await exact.isVisible()) await disclose.press("Enter");
    await expect(exact.getByRole("row")).toHaveCount(2);
    await expect(exact.getByRole("row", { name: /Aralık 2025/ })).toContainText(/1\.12\.2025 – 31\.12\.2025.*102,00 ₺/);
  } finally {
    await app.close().catch(() => {});
    await rm(userData, { recursive: true, force: true });
  }
});
