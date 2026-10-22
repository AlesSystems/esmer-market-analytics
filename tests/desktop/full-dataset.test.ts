import { openWorkspace } from "../helpers/desktop-navigation";
import { test, expect, _electron as electron, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { cpus, release, totalmem, tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { businessRecords, businessPackage } from "../helpers/business-fixtures";
import { openStore } from "../../src/store/store";

const executablePath = process.env.ESMER_EXECUTABLE ?? resolve("release/win-unpacked/Esmer Market Analytics.exe");

async function measure(page: Page, action: string, selector: string, expected: string) {
  return page.evaluate(({ action, selector, expected }) => new Promise<number>((done, fail) => {
    const button = [...document.querySelectorAll("button")].find(node => node.getClientRects().length > 0 && node.textContent?.trim() === action);
    if (!button) return fail(new Error(`Missing action ${action}`));
    const start = performance.now();
    button.click();
    const check = () => {
      const loading = [...document.querySelectorAll('[role="status"]')].some(node => node.getClientRects().length > 0 && /yükleniyor|hesaplanıyor/i.test(node.textContent ?? ""));
      if (!loading && [...document.querySelectorAll(selector)].some(node => node.getClientRects().length > 0 && node.textContent?.includes(expected))) requestAnimationFrame(() => requestAnimationFrame(() => done(performance.now() - start)));
      else if (performance.now() - start > 30_000) fail(new Error(`Readiness timeout ${action}`));
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  }), { action, selector, expected });
}

test("complete 25000-document synthetic dataset keeps monthly and drill-down interactions below two seconds", async ({}, testInfo) => {
  test.skip(process.platform !== "win32", "Windows performance evidence");
  test.setTimeout(180_000);
  const root = await mkdtemp(join(tmpdir(), "esmer-full-dataset-"));
  const records = businessRecords(), saleDocument = records.documents[0], line = records.lines[0];
  records.documents = Array.from({ length: 25_000 }, (_, i) => ({ ...saleDocument, id: `bulk-${i}` }));
  records.lines = Array.from({ length: 25_000 }, (_, i) => ({ ...line, id: `bulk-line-${i}`, documentId: `bulk-${i}` }));
  const bytes = businessPackage(records, { extractionId: "phase-10-complete-synthetic" });
  const samples: { process: number; startupMs: number; ordinary: Record<string, number> }[] = [];
  const receipt = {
    gate: "D18/A07", scope: "Complete imported synthetic package, not full market source volume",
    commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(),
    archiveSha256: createHash("sha256").update(await readFile(join(executablePath, "..", "resources", "app.asar"))).digest("hex"),
    environment: { os: release(), cpu: cpus()[0].model, logicalCpus: cpus().length, ramBytes: totalmem(), arch: process.arch },
    dataset: { documents: 25_000, lines: 25_000, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), cutoff: "2025-09-30" },
    conditions: "Three fresh processes, same imported profile; OS caches not cleared. First navigation and repeated navigation. Two rendered frames after content readiness. Startup calculation reported separately.",
    samples,
  };
  try {
    const store = openStore(join(root, "analytics.sqlite"));
    try { expect(store.importPackage(bytes).status).toBe("active"); } finally { store.close(); }
    for (let iteration = 0; iteration < 3; iteration++) {
      const start = performance.now();
      const app = await electron.launch({ executablePath, args: [`--user-data-dir=${root}`] });
      try {
        const page = await app.firstWindow();await openWorkspace(page);
        await page.waitForFunction(() => document.querySelector("h1")?.textContent === "Ay bir bakışta" && document.body.textContent?.includes("2.500.000,00"));
        const sample = { process: iteration + 1, startupMs: performance.now() - start, ordinary: {} as Record<string, number> };
        samples.push(sample);
        await page.getByRole("button", { name: "Raporlar", exact: true }).click();
        await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText("Faaliyet kârı hesaplanamıyor — gider verileri eksik.");
        sample.ordinary.salesFirst = await measure(page, "Satışlar", ".monthly-profit-page h1", "Satışlar");
        await page.getByText("İşlemler ve satış dağılımı", { exact: true }).click();
        sample.ordinary.transactionsFirst = await measure(page, "Tüm işlemleri göster", "h1", "İşlemler");
        await expect(page.locator(".sales-control-desk tbody tr").filter({ visible: true })).toHaveCount(100);
        sample.ordinary.nextPage = await measure(page, "Sonraki 100", 'nav[aria-label="İşlemler sayfaları"]', "Sayfa 2 / 250");
        const firstId = await page.locator(".sales-control-desk tbody .row-link").filter({ visible: true }).first().textContent();
        sample.ordinary.transactionDetail = await measure(page, firstId!, 'section[aria-label="İşlem detayı"] h2', "İşlem Detayı");
        await expect(page.getByRole("region", { name: "İşlem detayı" })).toContainText("100,00 ₺");
        sample.ordinary.monthlyReturn = await measure(page, "Özet", "h1", "Ay bir bakışta");
        sample.ordinary.salesWarm = await measure(page, "Satışlar", ".sales-control-desk h1", "İşlemler");
        await page.getByRole("button", { name: "Satış özetine dön", exact: true }).click();
        sample.ordinary.transactionsWarm = await measure(page, "Tüm işlemleri göster", "h1", "İşlemler");
        sample.ordinary.monthlyWarm = await measure(page, "Özet", "h1", "Ay bir bakışta");
        if (iteration === 0) await page.screenshot({ path: testInfo.outputPath("full-synthetic-monthly.png"), fullPage: true });
      } finally { await app.close(); }
    }
    for (const sample of samples) for (const [name, elapsed] of Object.entries(sample.ordinary)) expect.soft(elapsed, `process ${sample.process} ${name}`).toBeLessThan(2_000);
  } finally {
    await writeFile(testInfo.outputPath("performance.json"), JSON.stringify(receipt, null, 2));
    await testInfo.attach("performance", { path: testInfo.outputPath("performance.json"), contentType: "application/json" });
    await rm(root, { recursive: true, force: true });
  }
});
