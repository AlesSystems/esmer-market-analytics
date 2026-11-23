import { expect, test, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { executablePath } from "../helpers/desktop-executable";
import { openSettingsItem, openWorkspace } from "../helpers/desktop-navigation";
import { monthProfitPackage, monthProfitSnapshot } from "../helpers/month-profit-fixture";

test("monthly figures and readable source records round to kuruş", async () => {
  const userData = await mkdtemp(join(tmpdir(), "gross-profit-display-"));
  try {
    const snapshot = monthProfitSnapshot();
    // Raising the cost of one unit by 0.004 reduces gross profit from 57.50 to 57.496.
    snapshot.lines.find(line => line.ID === "1033")!.BELGE_TARIHINDEKI_SON_ALIS_FIYATI = "9.504";
    snapshot.lines.find(line => line.ID === "1012")!.TOPLAM_KDV_MATRAHI = "50.006";
    const file = join(userData, "month.json");
    await writeFile(file, monthProfitPackage(snapshot));
    const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    try {
      const page = await app.firstWindow();
      await openWorkspace(page);
      await app.evaluate(({ dialog }, path) => {
        dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] });
      }, file);
      await page.getByRole("button", { name: "Veri paketi içe aktar", exact: true }).click();
      const hero = page.getByRole("region", { name: "Ayın özeti" });
      await expect(hero.locator(".hero-num")).toHaveText("57,50 ₺");
      await expect(hero.getByText("480,01 ₺", { exact: true })).toBeVisible();
      const grossTrend = page.getByRole("region", { name: "Aylık tahmini brüt kâr (₺)", exact: true });
      await grossTrend.getByText("Aylık değerleri göster", { exact: true }).click();
      const history = grossTrend.getByRole("table");
      await expect(history.getByRole("row", { name: /Ekim 2025/ }).getByRole("cell", { name: "57,50 ₺", exact: true })).toHaveCount(1);
      await page.getByRole("button", { name: "Nasıl hesaplandı?", exact: true }).click();
      const explanation = page.getByRole("dialog", { name: "Nasıl hesaplandı" });
      await expect(explanation.getByText("= 57,50 ₺", { exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await page.getByRole("button", { name: "Ürünler", exact: true }).click();
      await expect(page.getByRole("row").filter({ hasText: "Tuz" }).getByRole("cell", { name: "0,50 ₺", exact: true })).toBeVisible();
      await openSettingsItem(page, /^Kaynak belgeler/);
      await page.getByRole("button", { name: "Belgeyi aç 103", exact: true }).click();
      const source = page.getByRole("region", { name: "Kaynak belge ayrıntıları" });
      await expect(source.getByText("9,5", { exact: true })).toBeVisible();
      await source.getByText("Veri ve hesaplama ayrıntıları", { exact: true }).click();
      await source.getByRole("checkbox", { name: "Tam kaynak değerlerini göster" }).check();
      await expect(source.getByText("9.504", { exact: true })).toBeVisible();
    } finally {
      await app.close();
    }
  } finally {
    await rm(userData, { recursive: true, force: true });
  }
});
