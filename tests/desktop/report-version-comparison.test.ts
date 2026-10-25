import { openWorkspace, openReportView } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { ReportVersions } from "../../src/reports/versions";
import { businessPackage, businessRecords } from "../helpers/business-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("saved comparison stays separate from candidate review and report details restore focus", async () => {
    test.skip(true, "old UI, removed in P5");
  const userData = await mkdtemp(join(tmpdir(), "esmer-version-pair-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  let firstId: string, secondId: string;
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const first = versions.open({ period: "2025-09" }); if (first.status !== "monthly") throw new Error("Expected report");
    firstId = first.report.id;
    versions.accept({ candidateId: firstId, previousAcceptedId: null, reason: "İlk inceleme" });
    const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
    store.importPackage(businessPackage(records, { extractionId: "second" }));
    const second = versions.open({ period: "2025-09" }); if (second.status !== "monthly") throw new Error("Expected report");
    secondId = second.report.id;
    versions.accept({ candidateId: secondId, previousAcceptedId: firstId, reason: "İkinci inceleme" });
  } finally { store.close(); }
  const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await openReportView(page, "Aylık rapor"); await page.getByRole("button", { name: "Sürüm listesine dön", exact: true }).click();
    await page.getByLabel("Rapor inceleme açıklaması").fill("Yeni aday incelemesi");
    await page.getByLabel("Eski sürüm", { exact: true }).selectOption(firstId);
    await page.getByLabel("Yeni sürüm", { exact: true }).selectOption(secondId);
    await page.getByRole("button", { name: "Seçili sürümleri karşılaştır", exact: true }).click();
    const differences = page.getByRole("region", { name: "Sürüm farkları" });
    await expect(differences).toContainText("-100,00 ₺");
    await expect(page.getByRole("button", { name: "İncelenen raporu kaydet", exact: true })).toBeDisabled();
    const firstRow = page.getByRole("row").filter({ hasText: firstId });
    const firstOpener = firstRow.getByRole("button", { name: "Kaydedilmiş sürümü aç", exact: true });
    await firstOpener.click();
    await expect(page.getByRole("heading", { name: "Seçili rapor", exact: true })).toBeFocused();
    await expect(page.getByRole("region", { name: "Seçili rapor", exact: true })).toContainText("Dönem: 2025-09");
    await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText("200,00 ₺");
    await page.getByRole("button", { name: "Sürüm listesine dön", exact: true }).click();
    await expect(firstOpener).toBeFocused();
    await page.getByRole("row").filter({ hasText: secondId }).getByRole("button", { name: "Adayla karşılaştır", exact: true }).click();
    await expect(page.getByRole("button", { name: "İncelenen raporu kaydet", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "İncelenen raporu kaydet", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Seçili rapor", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Sürüm listesine dön", exact: true }).click();
    await expect(page.getByRole("button", { name: "Aday raporu aç", exact: true })).toBeFocused();
    await page.getByRole("button", { name: "Seçili sürümleri karşılaştır", exact: true }).click();
    await expect(differences).toContainText("-100,00 ₺");
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
