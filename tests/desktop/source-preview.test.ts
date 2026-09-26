import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { rawSnapshot } from "../helpers/raw-fixture";
import { readRawPackage, writeRawPackage } from "../../src/source/raw-package";
import { importPackage } from "../helpers/desktop-navigation";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin"
  ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`)
  : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));
for (const actual of [false, true]) test(`packaged ${actual ? "actual backup" : "synthetic raw"} preview imports and survives offline restart`, async () => {
  test.skip(actual && !process.env.ESMER_SQL_PREVIEW_PACKAGE, "Private prepared SQL preview not configured");
  test.setTimeout(60_000);
  // Actual source values must never enter traces, screenshots or assertion output.

  const userData = await mkdtemp(join(tmpdir(), "esmer-preview-desktop-"));
  const snapshot = rawSnapshot();
  snapshot.headers = Array.from({length: 60}, (_, i) => ({...snapshot.headers[0], ID: String(i+1)}));
  const bytes = actual ? await readFile(process.env.ESMER_SQL_PREVIEW_PACKAGE!) : writeRawPackage(snapshot,"fixture:raw","batch-1");
  const parsed = readRawPackage(bytes); if (!parsed) throw Error("INVALID_TEST_PREVIEW");
  const sourceFile = join(userData,"preview.json"); await writeFile(sourceFile,bytes,{mode:0o600});
  let app = await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
  try {
    let page = await app.firstWindow();
    await expect(page.getByRole("heading",{name:"Henüz veri yok"})).toBeVisible();
    await app.evaluate(({dialog},path) => {dialog.showOpenDialog = async () => ({canceled:false,filePaths:[path]});},sourceFile);
    await importPackage(page);
    await expect(page.getByRole("heading",{name:"SQL yedeğinden gerçek kayıt örneği"})).toBeVisible();
    const status = await page.evaluate(() => window.esmer.getAvailability());
    expect(status.status === "ready" && status.store === "empty").toBe(true);
    const countsMatch = await page.evaluate(async expected => {
      const value = await window.esmer.readSourcePreview({stream:"headers",offset:0});
      return value.status === "source-preview" && value.counts.headers === expected.headers && value.counts.lines === expected.lines && value.metadata.provenance === "isolated-sql-backup";
    },{headers:parsed.snapshot.headers.length,lines:parsed.snapshot.lines.length});
    expect(countsMatch).toBe(true);
    if (!actual) {
      await page.screenshot({path:"test-results/source-preview.png",fullPage:true});
      await page.getByRole("button",{name:"Sonraki kaynak kayıtları"}).click();
      await expect(page.getByText("51–60 / 60",{exact:true})).toBeVisible();
      await writeFile(sourceFile,writeRawPackage(rawSnapshot(),"fixture:raw","batch-2"));
      await importPackage(page);
      await expect(page.getByText("1–1 / 1",{exact:true})).toBeVisible();
    }
    await app.close();
    app = await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]}); page = await app.firstWindow();
    await expect(page.getByRole("heading",{name:"SQL yedeğinden gerçek kayıt örneği"})).toBeVisible();
    await expect(page.getByText("Canlı bağlantı kapalı",{exact:true})).toBeVisible();
  } finally {await app.close().catch(() => {}); await rm(userData,{recursive:true,force:true});}
});
