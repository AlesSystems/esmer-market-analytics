import { executablePath } from "../helpers/desktop-executable";
import { importPackage } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { businessPackage } from "../helpers/business-fixtures";
import { purchasingJourney } from "../helpers/purchasing-journey";

test("daily workspaces separate ledgers from focused review tasks", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-workspace-views-"));
  const packagePath = join(userData, "synthetic.json");
  await writeFile(packagePath, businessPackage(purchasingJourney()));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await importPackage(page);
    await page.getByRole("button", { name: "Alışlar ve maliyet", exact: true }).click();
    await expect(page.getByRole("navigation", { name: "Alış ve maliyet görünümleri" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Alış geçmişi", exact: true })).toBeVisible();
    await expect(page.getByRole("region", { name: "Tedarikçi iadeleri", exact: true })).toHaveCount(0);
    await page.getByLabel("Tedarikçi", { exact: true }).selectOption("supplier-1");
    await page.getByRole("button", { name: "Tedarikçi iadeleri", exact: true }).click();
    await expect(page.getByLabel("Tedarikçi", { exact: true })).toHaveValue("supplier-1");
    await expect(page.getByRole("region", { name: "Tedarikçi iadeleri", exact: true })).toContainText("Bilinmiyor");
    await page.getByRole("button", { name: "Giderler", exact: true }).click();
    await expect(page.getByRole("button", { name: "Excel seç", exact: true })).toHaveCount(0);
    await expect(page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum")).toHaveCount(0);
    await page.getByRole("button", { name: "Giderlerin eksiksizliğini incele", exact: true }).click();
    await expect(page.getByLabel("Bu dönemin giderlerini inceledim ve eksiksiz olduğunu onaylıyorum")).not.toBeChecked();
    await expect(page.getByRole("button", { name: "Eksiksizliği onayla", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
    await page.getByRole("button", { name: "Excel’den gider ekle", exact: true }).click();
    await expect(page.getByRole("button", { name: "Excel seç", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Dönem kayıtları", exact: true })).toHaveCount(0);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
