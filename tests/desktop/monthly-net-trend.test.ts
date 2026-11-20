import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "../helpers/desktop-executable";
import { importPackage, openSection, openWorkspace, setMonth } from "../helpers/desktop-navigation";
import { november, novemberProfitPackage, novemberProfitSnapshot } from "../helpers/november-bill-fixture";

test("monthly net chart and table follow approval, correction and withdrawal", async ({}, testInfo) => {
  test.setTimeout(90_000);
  const userData = await mkdtemp(join(tmpdir(), "monthly-net-chart-"));
  const file = join(userData, "net.json");
  await writeFile(file, novemberProfitPackage({ ...novemberProfitSnapshot(), to: "2026-12-20", capturedAt: "2026-12-21T00:00:00.000Z" }));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await page.clock.setFixedTime(new Date("2026-12-22T12:00:00Z"));
    await openWorkspace(page);
    await app.evaluate(({ dialog }, path) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] });
    }, file);
    await importPackage(page);
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
    await expect(chart.getByRole("listitem").last()).toContainText(/Kısmi ay · 0?1\.12\.2026 – 20\.12\.2026/);
    await showTable();
    await expect(row).toContainText("8.750,00 ₺");

    for (const zoom of [1, 2]) {
      await app.evaluate(({ BrowserWindow }, factor) => {
        const window = BrowserWindow.getAllWindows()[0];
        window.setContentSize(680, 1000);
        window.webContents.setZoomFactor(factor);
      }, zoom);
      await expect.poll(() => page.evaluate(() => innerWidth)).toBe(680 / zoom);
      await expect.poll(() => chart.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await expect.poll(() => table.evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
      await page.evaluate(() => document.fonts.ready);
      for (const [name, target] of [["chart", chart], ["table", table]] as const) {
        await target.scrollIntoViewIfNeeded();
        const png = await app.evaluate(async ({ BrowserWindow }) =>
          (await BrowserWindow.getAllWindows()[0].webContents.capturePage()).toPNG().toString("base64"));
        await writeFile(testInfo.outputPath(`net-${name}-680-zoom${zoom}.png`), Buffer.from(png, "base64"));
      }
    }
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.setZoomFactor(1));

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
  } finally {
    await app.close().catch(() => {});
    await rm(userData, { recursive: true, force: true, maxRetries: 5 });
  }
});
