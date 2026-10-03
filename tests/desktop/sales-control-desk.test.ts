import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { salesPackage, journeyRecords } from "../helpers/sales-fixtures";
import { writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

for (const mode of ["financial", "source"] as const) {
  test(`packaged ${mode} Sales desk preserves real data and provides receipt navigation`, async () => {
    const userData = await mkdtemp(join(tmpdir(), `sales-desk-${mode}-`));
    const store = openStore(join(userData, "analytics.sqlite"));
    try {
      if (mode === "financial") expect(store.importPackage(salesPackage(journeyRecords())).status).toBe("active");
      else store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:sales-desk", "sales-desk-source"));
    } finally { store.close(); }
    const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    try {
      const page = await app.firstWindow();
      await page.getByRole("button", { name: "Satışlar", exact: true }).click();
      await expect(page.getByRole("heading", { name: mode === "financial" ? "Satış Özeti" : "Satışlar", exact: true })).toBeVisible();
      if (mode === "financial") await expect(page.locator(".metric").first()).toContainText("365,00 ₺");
      else await expect(page.getByRole("cell", { name: "123,4567890123456789", exact: true })).toBeVisible();
      await mkdir("work/page-implementation/sales", { recursive: true });
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.screenshot({ path: `work/page-implementation/sales/${mode}-before-${width}.png`, fullPage: true });
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
      const desk = page.locator(".sales-control-desk");
      await expect(desk).toBeVisible();
      const rail = page.getByRole("complementary", { name: "Satış kapsamı ve kanıt" });
      await expect(rail.locator("canvas")).toBeVisible();
      await expect(rail.getByText("3D nesne tutar veya oran göstermez.", { exact: true })).toBeVisible();
      if (mode === "financial") {
        await rail.getByRole("button", { name: "Müşteri iadelerini incele", exact: true }).press("Enter");
        await expect(page.getByRole("button", { name: "R001", exact: true })).toBeVisible();
        await expect(page.getByRole("button", { name: "S002", exact: true })).toHaveCount(0);
      } else {
        await rail.getByRole("button", { name: "Ürün kayıtlarını incele", exact: true }).press("Enter");
        await expect(page.getByRole("button", { name: "3", exact: true })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Net satış", exact: true })).toHaveCount(0);
      }
    } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
  });
}
