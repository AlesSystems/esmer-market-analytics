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
    const page = await app.firstWindow();
    await expect(page.getByRole("heading", {name: "Aylık Market Özeti", exact: true})).toBeVisible();
    const matrix = page.getByRole("region", {name: "Kaynak kayıt göstergeleri", exact: true});
    await expect(matrix).toBeVisible();
    await expect(matrix.getByRole("button", {name: /Belge kaydı/})).toContainText("3");
    await expect(matrix.getByRole("button", {name: /Satır kaydı/})).toContainText("2");
    await expect(matrix.getByRole("button", {name: /Ürün kayıt ID’si/})).toContainText("2");
    await expect(matrix.getByRole("button", {name: /Satırsız belge/})).toContainText("1");
    const evidence = page.getByRole("complementary", {name: "Kaynak kapsamı ve yöntem", exact: true});
    await expect(evidence.getByRole("heading", {name: "Sonucun dayanağı", exact: true})).toBeVisible();
    await expect(evidence.getByRole("button", {name: "Kapsam katmanı", exact: true})).toHaveAttribute("aria-pressed", "true");
    await expect(evidence).toContainText("Mali sonuçlar doğrulanmadı");
    await page.setViewportSize({width: 1440, height: 1000});
    await page.screenshot({path: testInfo.outputPath("source-evidence-default-1440.png")});
    await expect(evidence.getByRole("group", {name: "Kaynak kapsamı, kayıtlar ve yöntem katmanları. Tutarları veya doğrulanmış mali sonuçları temsil etmeyen 3D gezinme nesnesi.", exact: true})).toBeVisible();
    await expect(evidence.getByRole("group", {name: "Kaynak kanıt katmanı", exact: true})).toBeVisible();
    await evidence.getByRole("button", {name: "Kayıtlar katmanı", exact: true}).press("Enter");
    await expect(evidence.locator(".scene-caption")).toHaveText("3 belge, 2 satır, 2 ürün kayıt ID’si. Tüm durumları içerir; doğrulanmış satış değildir.");
    await evidence.getByRole("button", {name: "Yöntem katmanı", exact: true}).press("Space");
    await expect(evidence.locator(".scene-caption")).toContainText("eksik maliyet sıfır değildir");
    await evidence.getByRole("button", {name: "Kayıtlar katmanı", exact: true}).click();
    const canvas = evidence.locator("canvas");
    await expect(canvas).toBeVisible();
    const bounds = await canvas.boundingBox();
    await canvas.click({position: {x: bounds!.width / 2, y: bounds!.height * .4}});
    await expect(evidence.getByRole("button", {name: "Kapsam katmanı", exact: true})).toHaveAttribute("aria-pressed", "true");
    await page.emulateMedia({reducedMotion: "reduce"});
    await page.emulateMedia({reducedMotion: "no-preference"});
    await canvas.evaluate(node => node.dispatchEvent(new Event("webglcontextlost", {cancelable: true})));
    await expect(evidence.getByRole("status").filter({hasText: "Görünüm kullanılamıyor"})).toBeVisible();
    await evidence.getByRole("button", {name: "Yöntem katmanı", exact: true}).press("Enter");
    await evidence.getByRole("button", {name: "3D’yi yeniden dene", exact: true}).click();
    await expect(evidence.locator("canvas")).toBeVisible();
    await expect(evidence.getByRole("button", {name: "Yöntem katmanı", exact: true})).toHaveAttribute("aria-pressed", "true");
    await expect(evidence.locator("button[aria-pressed=true]")).toHaveCount(1);
    await evidence.getByText("Kaynak yöntemini göster", {exact: true}).click();
    await expect(evidence).toContainText("fixture:source-control-desk");
    await expect(evidence).toContainText("source-desk-1");
    await expect(evidence).toContainText(snapshot.databaseId);
    await expect(evidence).toContainText(snapshot.capturedAt);

    await expect(page.getByRole("region", {name: "Kaynak tahmini"})).toContainText("Bu paket maliyet adayı içermiyor; tahmin hazırlanamadı.");
    await expect(page.getByRole("img", {name: "Günlük kaynak belge kayıtları"})).toBeVisible();
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
      expect(await evidence.locator(".scene-tabs button").evaluateAll(nodes => nodes.every(node => node.scrollWidth <= node.clientWidth))).toBe(true);
      await page.screenshot({path: testInfo.outputPath(`source-desk-${width}.png`), fullPage: true});
      if (width === 390) await evidence.screenshot({path: testInfo.outputPath("source-evidence-narrow.png")});
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
    await evidence.getByRole("button", {name: "Kapsam katmanı", exact: true}).click();
    await expect(evidence.locator(".scene-caption")).toHaveText("2025-11 kaynak kapsamı dışında. Eksik veri sıfır sayılmaz.");
    await evidence.getByRole("button", {name: "Kayıtlar katmanı", exact: true}).click();
    await expect(evidence.locator(".scene-caption")).toHaveText("Bu dönem için kayıt sayıları gösterilemiyor; dönem kaynak kapsamında değil.");
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
    const page = await app.firstWindow();
    const matrix = page.getByRole("region", {name: "Kaynak kayıt göstergeleri", exact: true});
    await expect(matrix.getByRole("button", {name: /Belge kaydı/})).toContainText("51");
    await expect(matrix.getByRole("button", {name: /Satırsız belge/})).toContainText("51");
    await expect(page.getByText("50 / 51 tür kodu gösteriliyor", {exact: false})).toBeVisible();
    await expect(page.getByText("diğer türler grafikte ve tabloda yok.", {exact: false})).toBeVisible();
    await page.getByText("Belge türlerinin tam sayılarını göster", {exact: true}).click();
    await expect(page.getByRole("table", {name: "Kaynak belge türleri tablosu"}).getByRole("row")).toHaveCount(51);
    await page.getByLabel("Dönem", {exact: true}).fill("2025-09");
    await expect(matrix.getByRole("button", {name: /Belge kaydı/})).toContainText("0");
    const evidence = page.getByRole("complementary", {name: "Kaynak kapsamı ve yöntem", exact: true});
    await expect(evidence.locator(".scene-caption")).toContainText("2025-09 kaynak kapsamı içinde");
    await evidence.getByRole("button", {name: "Kayıtlar katmanı", exact: true}).click();
    await expect(evidence.locator(".scene-caption")).toHaveText("0 belge, 0 satır, 0 ürün kayıt ID’si. Tüm durumları içerir; doğrulanmış satış değildir.");
    await expect(page.getByText("Bu dönem için günlük belge kaydı yok.", {exact: true})).toBeVisible();
    await expect(page.getByText("Bu dönem için belge türü kaydı yok.", {exact: true})).toBeVisible();
    await expect(page.getByText("Seçili dönem yedek kapsamı dışında. Eksik veri sıfır sayılmaz.", {exact: true})).toHaveCount(0);
  } finally { await app.close(); await rm(userData, {recursive: true, force: true}); }
});

test("source evidence stays usable when WebGL creation is denied", async ({}, testInfo) => {
  const userData = await mkdtemp(join(tmpdir(), "source-evidence-fallback-"));
  const store = openStore(join(userData, "analytics.sqlite"));
  try {expect(store.importSourcePreview(writeRawPackage(rawSnapshot(), "fixture:source-fallback", "source-fallback-1")).status).toBe("preview-imported");} finally {store.close();}
  const app = await electron.launch({executablePath, args: [`--user-data-dir=${userData}`]});
  try {
    const page = await app.firstWindow();
    await page.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {value: function (type: string, ...args: unknown[]) {
        return type.startsWith("webgl") ? null : Reflect.apply(getContext, this, [type, ...args]);
      }});
    });
    await page.reload();
    const evidence = page.getByRole("complementary", {name: "Kaynak kapsamı ve yöntem", exact: true});
    const failure = evidence.getByRole("status").filter({hasText: "Görünüm kullanılamıyor"});
    await expect(failure).toBeVisible();
    await expect(failure.getByRole("button")).toHaveCount(0);
    await evidence.getByRole("button", {name: "Kayıtlar katmanı", exact: true}).press("Space");
    await expect(evidence.locator(".scene-caption")).toContainText("1 belge, 1 satır");
    await evidence.getByRole("button", {name: "3D’yi yeniden dene", exact: true}).click();
    await expect(failure).toBeVisible();
    await expect(evidence.getByRole("button", {name: "Kayıtlar katmanı", exact: true})).toHaveAttribute("aria-pressed", "true");
    await expect(evidence).toContainText("source-fallback-1");
    await page.screenshot({path: testInfo.outputPath("source-evidence-no-webgl.png"), fullPage: true});
  } finally {await app.close(); await rm(userData, {recursive: true, force: true});}
});
