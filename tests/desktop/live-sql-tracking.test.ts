import {test, expect, _electron as electron, type Page} from "@playwright/test";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {createLiveSqlFixture, syntheticHeader, syntheticLine} from "../helpers/live-sql-fixture";
import {businessPackage} from "../helpers/business-fixtures";
import {openSettings} from "../helpers/desktop-navigation";
import {openStore} from "../../src/store/store";
import {SalesReports} from "../../src/reports/query";
import {ReportVersions} from "../../src/reports/versions";
import {Expenses} from "../../src/expenses/import";
import {workbook, row} from "../helpers/expense-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin"
  ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`)
  : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

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
      const page = await app.firstWindow();
      await openSettings(page);
      await app.evaluate(({dialog}, path) => {dialog.showOpenDialog = async () => ({canceled: false, filePaths: [path]});}, sourceFile);
      await page.getByRole("button", {name: "SQL kaynağını içe aktar", exact: true}).click();
      await expect(page.getByRole("heading", {name: "Aylık Market Özeti", exact: true})).toBeVisible({timeout: 30_000});
      await page.getByLabel("Dönem", {exact: true}).fill("2025-09");
      await page.getByRole("button", {name: "Satışlar", exact: true}).click();
      await expect(page.getByRole("button", {name: "1001", exact: true})).toBeVisible();
      return {fixture, userData, app, page, before, accepted, reportId};
    } catch (error) {await app.close(); throw error;}
  } catch (error) {await fixture.close(); await rm(userData, {recursive: true, force: true}); throw error;}
}

test("packaged disposable SQL tracks captures without losing inspection and retained financial records", async ({}, testInfo) => {
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
    await expect(page.getByRole("heading", {name: "Kaynak belge 1001", exact: true})).toBeVisible();
    await fixture.execute("UPDATE dbo.FIS SET SATIR_TOPLAM=50.00000000,GENELTOPLAM=50.00000000 WHERE ID=1001");
    await backgroundRefresh(page);
    await expect(page.locator("dl.evidence")).toContainText("50,00000000", {timeout: 15_000});
    await expect(page.getByRole("heading", {name: "Kaynak belge 1001", exact: true})).toBeVisible();
    await expect(page.getByLabel("Dönem", {exact: true})).toHaveValue("2025-09");
    await page.getByRole("button", {name: "Belgelere dön", exact: true}).click();
    await expect(page.getByLabel("Ürün kayıt ID’si", {exact: true})).toHaveValue("9007199254740997");
    await fixture.execute(`${syntheticHeader("1003", "2025-09-12")}; ${syntheticLine("2003", "1003")}; UPDATE dbo.FIS SET FIS_TARIHI='2025-08-01' WHERE ID=1002`);
    await backgroundRefresh(page);
    await expect(page.getByRole("button", {name: "1003", exact: true})).toBeVisible({timeout: 15_000});
    await expect(page.getByRole("button", {name: "1002", exact: true})).toHaveCount(0);
    await page.getByLabel("Dönem", {exact: true}).fill("2025-08");
    await expect(page.getByRole("button", {name: "1002", exact: true})).toBeVisible();
    await expect(page.getByRole("cell", {name: "01.08.2025", exact: true})).toBeVisible();
    await page.getByLabel("Dönem", {exact: true}).fill("2025-09");
    await page.getByRole("button", {name: "1003", exact: true}).click();
    await fixture.execute("DELETE dbo.FIS_DETAY WHERE FIS=1003; DELETE dbo.FIS WHERE ID=1003");
    await backgroundRefresh(page);
    await expect(page.getByRole("alert")).toContainText(/Belge.*bulunamadı/, {timeout: 15_000});
    await page.getByRole("button", {name: "Belgelere dön", exact: true}).click();
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
    const restarted = await app.firstWindow();
    await expect(restarted.getByRole("heading", {name: "Aylık Market Özeti", exact: true})).toBeVisible();
    expect(await restarted.evaluate(() => window.esmer.getLiveStatus())).toMatchObject({status: "live", configured: true});
    await app.close();
    const store = openStore(join(userData, "analytics.sqlite"));
    try {
      expect(store.readSnapshot()).toEqual(context.before);
      expect(store.readReport(context.reportId)).toEqual(context.accepted);
    } finally {store.close();}
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
    await expect(page.getByLabel("Dönem", {exact: true})).toHaveValue("2025-09");
    await expect(page.getByRole("heading", {name: "Satışlar", exact: true})).toBeVisible();
    const after = await page.evaluate(() => window.esmer.getLiveStatus());
    if (before.status !== "live" || after.status !== "live") throw new Error("LIVE_STATUS_UNAVAILABLE");
    expect(after.live.lastAttemptAt).not.toBe(before.live.lastAttemptAt);
    await page.screenshot({path: testInfo.outputPath("scheduled-poll-synthetic.png"), fullPage: true});
  } finally {await app.close().catch(() => {}); await fixture.close(); await rm(userData, {recursive: true, force: true});}
});
