import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { salesPackage } from "../helpers/sales-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : "");

test("packaged sales tables render at most 100 rows and every transaction remains reachable", async () => {
  test.skip(process.platform !== "win32", "Windows packaged behavior");
  const userData = await mkdtemp(join(tmpdir(), "esmer-pagination-"));
  const packagePath = join(userData, "synthetic-pagination.json");
  const documents = Array.from({ length: 201 }, (_, index) => {
    const sequence = String(index + 1).padStart(3, "0");
    return { id: `S${sequence}`, kind: "sale" as const, date: "2025-09-01", supplierId: null, sales: { state: "completed" as const, convertedTo: null, net: "10", tax: "0.5", gross: "10.5" } };
  });
  const lines = documents.map((document, index) => ({ id: `L${String(index + 1).padStart(3, "0")}`, documentId: document.id, quantity: "1", net: "10", cost: null, sales: { productId: `P${index + 1}`, productName: `Ürün ${index + 1}`, categoryId: `C${index + 1}`, categoryName: `Kategori ${index + 1}`, unit: "piece" as const, unitNet: "10", discountRate: "0", taxRate: "5", tax: "0.5", gross: "10.5", meaning: "known" as const } }));
  await writeFile(packagePath, salesPackage({ documents, lines, suppliers: [] }, { cutoff: "2025-09-30", coverage: { from: "2025-09-01", to: "2025-09-30", complete: true } }));
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();
    await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
    await page.getByRole("button", { name: "Veri paketi içe aktar" }).click();
    await page.getByRole("button", { name: "Satış Özeti", exact: true }).click();
    await page.getByRole("button", { name: "Tüm işlemleri göster" }).click();
    await expect(page.locator("tbody tr")).toHaveCount(100);
    await expect(page.getByRole("button", { name: "S001", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Sonraki 100", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(100);
    await page.getByRole("button", { name: "Sonraki 100", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "S201", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Önceki 100", exact: true }).click();
    await expect(page.locator("tbody tr")).toHaveCount(100);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
