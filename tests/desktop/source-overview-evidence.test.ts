import {test, expect, _electron as electron} from "@playwright/test";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {createLiveSqlFixture, syntheticHeader, syntheticLine} from "../helpers/live-sql-fixture";
import {openSettings} from "../helpers/desktop-navigation";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("source overview evidence follows actual disposable SQL import and refresh", async ({}, testInfo) => {
  test.skip(!process.env.ESMER_SQL_TEST_ADMIN, "Requires explicitly configured isolated synthetic SQL admin");
  test.setTimeout(60_000);
  const fixture = await createLiveSqlFixture(process.env.ESMER_SQL_TEST_ADMIN!);
  const userData = await mkdtemp(join(tmpdir(), "source-overview-sql-"));
  let app: Awaited<ReturnType<typeof electron.launch>> | undefined;
  try {
    await fixture.execute(`${syntheticHeader("1001", "2025-12-10")}; ${syntheticLine("2001", "1001")}`);
    const sourceFile = join(userData, "synthetic-source.json");
    await writeFile(sourceFile, JSON.stringify(fixture.config), {mode: 0o600});
    app = await electron.launch({executablePath, args: [`--user-data-dir=${userData}`]});
    const page = await app.firstWindow();
    await openSettings(page);
    await app.evaluate(({dialog}, path) => {dialog.showOpenDialog = async () => ({canceled: false, filePaths: [path]});}, sourceFile);
    await page.getByRole("button", {name: "SQL kaynağını içe aktar", exact: true}).click();
    await expect(page.getByRole("heading", {name: "Aylık Market Özeti", exact: true})).toBeVisible({timeout: 30_000});
    await expect(page.getByLabel("Dönem", {exact: true})).toHaveValue("2025-12");
    const evidence = page.getByRole("complementary", {name: "Kaynak kapsamı ve yöntem", exact: true});
    await expect(evidence.getByRole("heading", {name: "Sonucun dayanağı", exact: true})).toBeVisible();
    await expect(evidence.getByRole("button", {name: "Kapsam katmanı", exact: true})).toHaveAttribute("aria-pressed", "true");
    await evidence.getByRole("button", {name: "Kayıtlar katmanı", exact: true}).click();
    await expect(evidence.locator(".scene-caption")).toHaveText("1 belge, 1 satır, 1 ürün kayıt ID’si. Tüm durumları içerir; doğrulanmış satış değildir.");
    await evidence.getByText("Kaynak yöntemini göster", {exact: true}).click();
    await expect(evidence).toContainText(fixture.config.lineage);
    await expect(evidence).toContainText(fixture.config.expectedDatabaseId);
    const before = await evidence.locator(".c-method").textContent();
    await page.screenshot({path: testInfo.outputPath("source-evidence-sql-import.png"), fullPage: true});
    await fixture.execute(`${syntheticHeader("1002", "2025-12-11")}; ${syntheticLine("2002", "1002")}`);
    expect(await page.evaluate(() => window.esmer.refreshLiveSource())).toMatchObject({status: "live", live: {phase: "idle"}});
    await expect(evidence.locator(".scene-caption")).toHaveText("2 belge, 2 satır, 1 ürün kayıt ID’si. Tüm durumları içerir; doğrulanmış satış değildir.", {timeout: 15_000});
    await expect(evidence.getByRole("button", {name: "Kayıtlar katmanı", exact: true})).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => evidence.locator(".c-method").textContent()).not.toBe(before);
    await expect(evidence).toContainText(fixture.config.lineage);
    await expect(evidence).toContainText(fixture.config.expectedDatabaseId);
    await expect(evidence).toContainText("Tür kodları tamamlanmış işlem veya tanınmış tutar anlamına gelmez.");
    await page.screenshot({path: testInfo.outputPath("source-evidence-sql-refresh.png"), fullPage: true});
  } finally {await app?.close(); await fixture.close(); await rm(userData, {recursive: true, force: true});}
});
