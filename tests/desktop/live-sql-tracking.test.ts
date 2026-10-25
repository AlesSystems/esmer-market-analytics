import {test, expect, _electron as electron, type Page} from "@playwright/test";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {createLiveSqlFixture, syntheticHeader, syntheticLine} from "../helpers/live-sql-fixture";
import {businessPackage} from "../helpers/business-fixtures";
import {openSettings, openWorkspace, openReportView } from "../helpers/desktop-navigation";
import {openStore} from "../../src/store/store";
import {SalesReports} from "../../src/reports/query";
import {ReportVersions} from "../../src/reports/versions";
import {Expenses} from "../../src/expenses/import";
import {workbook, row} from "../helpers/expense-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin"
  ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`)
  : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

/** Sidebar month picker (embedded workspaces keep their own). */
const month = (page: Page) => page.locator(".sidebar").getByLabel("Dönem", {exact: true});

/** The old Satışlar screen: Veri ve kaynak → all source documents, narrowed to sales-related type codes. */
async function openSourceSales(page: Page) {
  await openReportView(page, "Veri ve kaynak");
  await page.getByRole("button", {name: "Tüm kaynak belgeleri", exact: true}).click();
  await page.getByLabel("Kayıt kapsamı").selectOption("sales");
}

async function backgroundRefresh(page: Page) {
  const result = await page.evaluate(() => window.esmer.refreshLiveSource());
  expect(result).toMatchObject({status: "live", live: {phase: "idle"}});
}

async function setup() {
  const fixture = await createLiveSqlFixture(process.env.ESMER_SQL_TEST_ADMIN!);
  const userData = await mkdtemp(join(tmpdir(), "esmer-sql-tracking-"));
  try {
    await fixture.execute(`${syntheticHeader("1001")}; ${syntheticLine("2001", "1001")}; ${syntheticHeader("1002", "2025-09-11")}; ${syntheticLine("2002", "1002")}`);
    const sourceFile = join(userData, "synthetic-source.json");
    await writeFile(sourceFile, JSON.stringify(fixture.config), {mode: 0o600});
    const store = openStore(join(userData, "analytics.sqlite"));
    let before: ReturnType<typeof store.readSnapshot>;
    let accepted: ReturnType<typeof store.readReport>;
    let reportId: string;
    try {
      store.importPackage(businessPackage());
      const expenses = new Expenses(store);
      const preview = expenses.preview(await workbook([[row[0], "15.10.2025", "01.11.2025", ...row.slice(3)]]));
      expenses.confirm({previewId: preview.previewId, keepCandidateRows: []});
      const versions = new ReportVersions(store, new SalesReports(store));
      const candidate = versions.open({period: "2025-09"});
      if (candidate.status !== "monthly") throw new Error("SYNTHETIC_REPORT_MISSING");
      reportId = candidate.report.id;
      versions.accept({candidateId: reportId, previousAcceptedId: null, reason: "Synthetic live tracking preservation"});
      before = store.readSnapshot();
      accepted = store.readReport(reportId);
    } finally {store.close();}
    const app = await electron.launch({executablePath, args: [`--user-data-dir=${userData}`]});
    try {
      const page = await app.firstWindow();await openWorkspace(page);
      await openSettings(page);
      await app.evaluate(({dialog}, path) => {dialog.showOpenDialog = async () => ({canceled: false, filePaths: [path]});}, sourceFile);
      await page.getByRole("button", {name: "SQL kaynağını içe aktar", exact: true}).click();
      await expect(page.getByRole("navigation", {name: "Ana gezinme"}).getByRole("button", {name: "Bu ay", exact: true})).toHaveAttribute("aria-current", "page", {timeout: 30_000});
      await month(page).fill("2025-09");
      await openSourceSales(page);
      await expect(page.getByRole("button", {name: "1001", exact: true})).toBeVisible();
      return {fixture, userData, app, page, before, accepted, reportId};
    } catch (error) {await app.close(); throw error;}
  } catch (error) {await fixture.close(); await rm(userData, {recursive: true, force: true}); throw error;}
}

test("packaged disposable SQL tracks captures without losing inspection and retained financial records", async ({}, testInfo) => {
    test.skip(true, "old UI, removed in P5");
  test.skip(!process.env.ESMER_SQL_TEST_ADMIN, "Requires explicitly configured isolated synthetic SQL admin");
  test.setTimeout(150_000);
  const context = await setup();
  let app = context.app;
  const {fixture, page, userData} = context;
  try {
    await page.getByText("Gelişmiş filtreler", {exact: true}).click();
    await page.getByLabel("Ürün kayıt ID’si", {exact: true}).fill("9007199254740997");
    await page.getByRole("button", {name: "Filtreleri uygula", exact: true}).click();
    await page.getByRole("button", {name: "1001", exact: true}).click();
    await expect(page.getByRole("heading", {name: "Kaynak belge 1001", exact: true})).toBeVisible();
    const captureBefore = await page.locator(".data-status").textContent();
    await backgroundRefresh(page);
    await expect.poll(() => page.locator(".data-status").textContent(), {timeout: 15_000}).not.toBe(captureBefore);
    await expect(page.getByText("Kaynak sürümü değişti. Eski belge detayı kapatıldı; kayıt kimlikleri yeni kaynakta yeniden seçilmelidir.", {exact: true})).toBeVisible();
    await expect(page.getByRole("heading", {name: "Kaynak belge 1001", exact: true})).toHaveCount(0);
    await page.getByRole("button", {name: "1001", exact: true}).click();
    await expect(page.getByRole("heading", {name: "Kaynak belge 1001", exact: true})).toBeVisible();
    await fixture.execute("UPDATE dbo.FIS SET SATIR_TOPLAM=50.00000000,GENELTOPLAM=50.00000000 WHERE ID=1001");
    await backgroundRefresh(page);
    await expect(page.getByText("Kaynak sürümü değişti. Eski belge detayı kapatıldı; kayıt kimlikleri yeni kaynakta yeniden seçilmelidir.", {exact: true})).toBeVisible();
    await expect(page.getByRole("heading", {name: "Kaynak belge 1001", exact: true})).toHaveCount(0);
    await page.getByRole("button", {name: "1001", exact: true}).click();
    const recordedAmount = page.locator(".source-document-summary dl>div").filter({has: page.getByText("Kaynak belge tutarı · doğrulanmadı", {exact: true})}).locator("dd");
    await expect(recordedAmount.getByText("50", {exact: true})).toBeVisible({timeout: 15_000});
    await page.getByRole("region", {name: "Kaynak belge ayrıntıları", exact: true}).getByText("Veri ve hesaplama ayrıntıları", {exact: true}).click();
    await page.getByRole("checkbox", {name: "Tam kaynak değerlerini göster", exact: true}).check();
    await expect(recordedAmount.getByText("50.00000000", {exact: true})).toBeVisible();
    await expect(page.getByRole("heading", {name: "Kaynak belge 1001", exact: true})).toBeVisible();
    await expect(month(page)).toHaveValue("2025-09");
    await page.getByRole("button", {name: "Belgelere dön", exact: true}).click();
    await expect(page.getByLabel("Ürün kayıt ID’si", {exact: true})).toHaveValue("9007199254740997");
    await fixture.execute(`${syntheticHeader("1003", "2025-09-12")}; ${syntheticLine("2003", "1003")}; UPDATE dbo.FIS SET FIS_TARIHI='2025-08-01' WHERE ID=1002`);
    await backgroundRefresh(page);
    await expect(page.getByRole("button", {name: "1003", exact: true})).toBeVisible({timeout: 15_000});
    await expect(page.getByRole("button", {name: "1002", exact: true})).toHaveCount(0);
    await month(page).fill("2025-08");
    await expect(page.getByRole("button", {name: "1002", exact: true})).toBeVisible();
    await expect(page.getByRole("cell", {name: "01.08.2025", exact: true})).toBeVisible();
    await month(page).fill("2025-09");
    await page.getByRole("button", {name: "1003", exact: true}).click();
    await fixture.execute("DELETE dbo.FIS_DETAY WHERE FIS=1003; DELETE dbo.FIS WHERE ID=1003");
    await backgroundRefresh(page);
    await expect(page.getByText("Kaynak sürümü değişti. Eski belge detayı kapatıldı; kayıt kimlikleri yeni kaynakta yeniden seçilmelidir.", {exact: true})).toBeVisible({timeout: 15_000});
    await expect(page.getByRole("heading", {name: "Kaynak belge 1003", exact: true})).toHaveCount(0);
    await expect(recordedAmount).toHaveCount(0);
    await expect(page.getByRole("button", {name: "1003", exact: true})).toHaveCount(0);
    await expect(page.getByRole("button", {name: "1001", exact: true})).toBeVisible();
    await fixture.execute(`REVOKE SELECT ON dbo.FIS_DETAY FROM [${fixture.config.user}]; DENY SELECT ON dbo.FIS_DETAY TO [${fixture.config.user}]`);
    const failed = await page.evaluate(() => window.esmer.refreshLiveSource());
    expect(failed).toMatchObject({status: "live", live: {phase: "stale", error: "SOURCE_REJECTED"}});
    await expect(page.getByRole("button", {name: "1001", exact: true})).toBeVisible();
    await openSettings(page);
    await expect(page.getByText("Son geçerli yerel veriler kullanılıyor.", {exact: true})).toBeVisible({timeout: 15_000});
    await page.screenshot({path: testInfo.outputPath("retained-stale-synthetic.png"), fullPage: true});
    await page.getByRole("button", {name: "Ayarları kapat", exact: true}).click();
    await fixture.execute(`REVOKE SELECT ON dbo.FIS_DETAY FROM [${fixture.config.user}]; GRANT SELECT (ID,FIS,STOK,FIS_TURU,CARPAN,MIKTAR_FIS,TOPLAM_KDV_MATRAHI,TOPLAM_KDV,TOPLAM_OTV,TOPLAM_TEVKIF) ON dbo.FIS_DETAY TO [${fixture.config.user}]`);
    await fixture.execute(`${syntheticHeader("1004", "2025-09-13")}; ${syntheticLine("2004", "1004")}`);
    await backgroundRefresh(page);
    await expect(page.getByRole("button", {name: "1004", exact: true})).toBeVisible({timeout: 15_000});
    await openSettings(page);
    await expect(page.getByText("Son geçerli yerel veriler kullanılıyor.", {exact: true})).toHaveCount(0);
    await page.getByRole("button", {name: "Ayarları kapat", exact: true}).click();
    await page.screenshot({path: testInfo.outputPath("tracking-recovered-synthetic.png"), fullPage: true});
    await app.close();
    app = await electron.launch({executablePath, args: [`--user-data-dir=${userData}`]});
    const restarted = await app.firstWindow();await openWorkspace(restarted);
    await openReportView(restarted, "Veri ve kaynak");
    await expect(restarted.getByRole("heading", {name: "Veri ve kaynak", exact: true})).toBeVisible();
    expect(await restarted.evaluate(() => window.esmer.getLiveStatus())).toMatchObject({status: "live", configured: true});
    await app.close();
    const store = openStore(join(userData, "analytics.sqlite"));
    try {
      expect(store.readSnapshot()).toEqual(context.before);
      expect(store.readReport(context.reportId)).toEqual(context.accepted);
    } finally {store.close();}
  } finally {await app.close().catch(() => {}); await fixture.close(); await rm(userData, {recursive: true, force: true});}
});

test("packaged background SQL capture preserves focused unapplied filter draft", async () => {
  test.skip(!process.env.ESMER_SQL_TEST_ADMIN, "Requires explicitly configured isolated synthetic SQL admin");
  test.setTimeout(60_000);
  const {fixture, app, page, userData} = await setup();
  try {
    await page.getByText("Gelişmiş filtreler", {exact: true}).click();
    const draft = page.getByLabel("Ürün kayıt ID’si", {exact: true});
    await draft.fill("900719925474099");
    await expect(draft).toBeFocused();
    const before = await page.locator(".data-status").textContent();
    await backgroundRefresh(page);
    await expect.poll(() => page.locator(".data-status").textContent(), {timeout: 15_000}).not.toBe(before);
    await expect(draft).toBeVisible();
    await expect(draft).toBeFocused();
    await expect(draft).toHaveValue("900719925474099");
    await draft.pressSequentially("7");
    await expect(draft).toHaveValue("9007199254740997");
  } finally {await app.close().catch(() => {}); await fixture.close(); await rm(userData, {recursive: true, force: true});}
});

test("packaged disposable SQL discovers an insert on the actual five-minute service schedule", async ({}, testInfo) => {
  test.skip(!process.env.ESMER_SQL_TEST_ADMIN || process.env.ESMER_SQL_POLL_PROOF !== "1", "Opt-in proof uses the unchanged production five-minute cadence");
  test.setTimeout(390_000);
  const {fixture, app, page, userData} = await setup();
  try {
    const before = await page.evaluate(() => window.esmer.getLiveStatus());
    expect(before).toMatchObject({status: "live", live: {phase: "idle"}});
    await fixture.execute(`${syntheticHeader("1005", "2025-09-14")}; ${syntheticLine("2005", "1005")}`);
    await expect.poll(() => page.getByRole("button", {name: "1005", exact: true}).count(), {timeout: 330_000, intervals: [5000]}).toBe(1);
    await expect(month(page)).toHaveValue("2025-09");
    await expect(page.getByRole("heading", {name: "Satışlar", exact: true})).toBeVisible();
    const after = await page.evaluate(() => window.esmer.getLiveStatus());
    if (before.status !== "live" || after.status !== "live") throw new Error("LIVE_STATUS_UNAVAILABLE");
    expect(after.live.lastAttemptAt).not.toBe(before.live.lastAttemptAt);
    await page.screenshot({path: testInfo.outputPath("scheduled-poll-synthetic.png"), fullPage: true});
  } finally {await app.close().catch(() => {}); await fixture.close(); await rm(userData, {recursive: true, force: true});}
});
