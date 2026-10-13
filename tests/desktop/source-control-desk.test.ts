import { openWorkspace } from "../helpers/desktop-navigation";
import {test, expect, _electron as electron} from "@playwright/test";
import {mkdtemp, rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {openStore} from "../../src/store/store";
import {writeRawPackage} from "../../src/source/raw-package";
import {rawSnapshot} from "../helpers/raw-fixture";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("source control desk shows raw counts, evidence and working drilldowns in the blue layout", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "source-control-desk-"));
  const snapshot = rawSnapshot();
  snapshot.headers = [snapshot.headers[0], {...snapshot.headers[0], ID: "2", FIS_TURU: "1", FIS_TARIHI: "2025-10-03T12:00:00.000"}, {...snapshot.headers[0], ID: "3", FIS_TURU: "999"}];
  snapshot.lines = [snapshot.lines[0], {...snapshot.lines[0], ID: "3", FIS: "2", FIS_TURU: "1", STOK: "444"}];
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importSourcePreview(writeRawPackage(snapshot, "fixture:source-control-desk", "source-desk-1")).status).toBe("preview-imported"); } finally { store.close(); }
  const app = await electron.launch({executablePath, args: [`--user-data-dir=${userData}`]});
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    await expect(page.getByRole("heading", {name: "Aylık Market Özeti", exact: true})).toBeVisible();
    const matrix = page.getByRole("region", {name: "Kaynak kayıt göstergeleri", exact: true});
    await expect(matrix).toBeVisible();
    await expect(matrix.getByRole("button", {name: /Belge kaydı/})).toContainText("3");
    await expect(matrix.getByRole("button", {name: /Satır kaydı/})).toContainText("2");
    await expect(matrix.getByRole("button", {name: /Ürün kayıt ID’si/})).toContainText("2");
    await expect(matrix.getByRole("button", {name: /Satırsız belge/})).toContainText("1");
    const evidence = page.getByRole("complementary", {name: "Kaynak kapsamı ve yöntem", exact: true});
    await expect(evidence).toContainText("Mali sonuçlar doğrulanmadı");
    await expect(page.getByRole("region", {name: "Kaynak tahmini"})).toHaveCount(0);
    const dailyChart = page.getByRole("img", {name: "Günlük kaynak belge kayıtları"});
    await expect(dailyChart).toBeVisible();
    await expect(dailyChart.locator('g[data-date="2025-10-01"] [data-key="documents"]')).toHaveCount(1);
    await expect(dailyChart.locator('g[data-date="2025-10-02"] rect[data-state="unknown"]')).toHaveCount(1);
    await expect(dailyChart.locator('g[data-date="2025-10-02"] [data-key="documents"]')).toHaveCount(0);
    await expect(dailyChart.locator('g[data-date="2025-10-20"] rect[data-state="out-of-range"]')).toHaveCount(1);
    await expect(dailyChart.locator(".viz-zero-marker")).toHaveCount(0);
    const typeChart = page.getByRole("list", {name: "Kaynak belge türlerine göre kayıt sayıları"});
    await expect(typeChart).toBeVisible();
    await expect(typeChart.getByRole("listitem")).toHaveCount(3);
    await page.getByText("Günlük tam sayıları göster", {exact: true}).click();
    const days = page.getByRole("table", {name: "Günlük kaynak belge kayıtları tablosu"});
    await expect(days.getByRole("row")).toHaveCount(3);
    await expect(days.getByRole("row").filter({hasText: "01.10.2025"})).toContainText("2");
    await expect(days.getByRole("row").filter({hasText: "03.10.2025"})).toContainText("1");
    await page.getByText("Belge türlerinin tam sayılarını göster", {exact: true}).click();
    await expect(page.getByRole("table", {name: "Kaynak belge türleri tablosu"})).toContainText("999 · Tür anlamı doğrulanmadı");
    for (const width of [1440, 1120, 680, 390]) {
      await page.setViewportSize({width, height: 1000});
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      expect(await matrix.getByRole("button").evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth))).toBe(true);
      await page.screenshot({path: testInfo.outputPath(`source-desk-${width}.png`), fullPage: true});
    }
    await page.setViewportSize({width: 1440, height: 1000});
    await matrix.getByRole("button", {name: /Ürün kayıt ID’si/}).press("Enter");
    await expect(page.getByRole("columnheader", {name: "Ürün kayıt ID’si", exact: true})).toBeVisible();
    await expect(page.getByRole("button", {name: "444", exact: true})).toBeVisible();
    await page.getByRole("button", {name: "Özet", exact: true}).click();
    await page.getByText("Belge türlerinin tam sayılarını göster", {exact: true}).click();
    await page.getByRole("table", {name: "Kaynak belge türleri tablosu"}).getByRole("button", {name: "999 · Tür anlamı doğrulanmadı"}).press("Enter");
    await expect(page.getByRole("button", {name: "3", exact: true})).toBeVisible();
    await expect(page.getByRole("button", {name: "1", exact: true})).toHaveCount(0);
    await page.getByRole("button", {name: "Özet", exact: true}).click();
    await page.getByLabel("Dönem", {exact: true}).fill("2025-11");
    await expect(matrix.getByRole("button")).toHaveCount(4);
    for (const button of await matrix.getByRole("button").all()) await expect(button).toContainText("Kapsam dışında");
    await expect(page.getByText("Seçili dönem yedek kapsamı dışında. Eksik veri sıfır sayılmaz.", {exact: true})).toBeVisible();
    await expect(page.getByText("Günlük kayıtlar bu dönem için gösterilemiyor; dönem yedek kapsamında değil.", {exact: true})).toBeVisible();
  } finally { await app.close(); await rm(userData, {recursive: true, force: true}); }
});

test("source desk discloses truncated type counts and an empty month within the backup", async () => {
  const userData = await mkdtemp(join(tmpdir(), "source-control-desk-types-"));
  const snapshot = rawSnapshot();
  snapshot.from = "2025-09-01";
  snapshot.headers = Array.from({length: 51}, (_, index) => ({...snapshot.headers[0], ID: String(index + 1), FIS_TURU: String(100 + index)}));
  snapshot.lines = [];
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importSourcePreview(writeRawPackage(snapshot, "fixture:source-control-desk-types", "source-desk-types-1")).status).toBe("preview-imported"); } finally { store.close(); }
  const app = await electron.launch({executablePath, args: [`--user-data-dir=${userData}`]});
  try {
    const page = await app.firstWindow();await openWorkspace(page);
    const matrix = page.getByRole("region", {name: "Kaynak kayıt göstergeleri", exact: true});
    await expect(matrix.getByRole("button", {name: /Belge kaydı/})).toContainText("51");
    await expect(matrix.getByRole("button", {name: /Satırsız belge/})).toContainText("51");
    await expect(page.getByText("50 / 51 tür kodu gösteriliyor", {exact: false})).toBeVisible();
    await expect(page.getByText("diğer türler grafikte ve tabloda yok.", {exact: false})).toBeVisible();
    await page.getByText("Belge türlerinin tam sayılarını göster", {exact: true}).click();
    await expect(page.getByRole("table", {name: "Kaynak belge türleri tablosu"}).getByRole("row")).toHaveCount(51);
    await page.getByLabel("Dönem", {exact: true}).fill("2025-09");
    await expect(matrix.getByRole("button", {name: /Belge kaydı/})).toContainText("0");
    await expect(page.getByText("Bu dönem için günlük belge kaydı yok.", {exact: true})).toBeVisible();
    await expect(page.getByText("Bu dönem için belge türü kaydı yok.", {exact: true})).toBeVisible();
    await expect(page.getByText("Seçili dönem yedek kapsamı dışında. Eksik veri sıfır sayılmaz.", {exact: true})).toHaveCount(0);
  } finally { await app.close(); await rm(userData, {recursive: true, force: true}); }
});
