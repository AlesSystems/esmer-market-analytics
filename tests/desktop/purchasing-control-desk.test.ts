import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { importPackage, openWorkspace, openReportView } from "../helpers/desktop-navigation";
import { businessPackage } from "../helpers/business-fixtures";
import { purchasingJourney } from "../helpers/purchasing-journey";
import { openStore } from "../../src/store/store";
import { richBusinessPackage } from "../helpers/rich-business-fixture";
const executablePath = process.env.ESMER_EXECUTABLE ?? resolve("release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics");
test("purchasing inspection selects actual excluded cost evidence with plain keyboard controls", async ({}, testInfo) => {
 const dir = await mkdtemp(join(tmpdir(), "esmer-cost-desk-"));
 const path = join(dir, "synthetic.json"); await writeFile(path, businessPackage(purchasingJourney()));
 const app = await electron.launch({ executablePath, args: [`--user-data-dir=${dir}`] });
 try {
  const page = await app.firstWindow();await openWorkspace(page);
  await app.evaluate(({ dialog }, file) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] }); }, path);
  await importPackage(page); await openReportView(page, "Alış belgeleri");
  await page.getByText("Maliyet kapsamı, alış geçmişi ve diğer araçlar", { exact: true }).click();
  const inspector = page.getByRole("region", { name: "Maliyet kapsamı incelemesi" });
  await expect(inspector).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: process.env.ESMER_CAPTURE_EVIDENCE ? "workstreams/page-control-desks/purchasing/desktop.png" : testInfo.outputPath("desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: process.env.ESMER_CAPTURE_EVIDENCE ? "workstreams/page-control-desks/purchasing/narrow.png" : testInfo.outputPath("narrow.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await inspector.getByRole("button", { name: /Satırı incele/ }).first().press("Enter");
  await expect(page.getByRole("region", { name: "Seçilen maliyet kanıtı" })).toContainText("Maliyet kanıtı eksik");
  await page.getByText("Bu sayı nasıl oluştu?", { exact: true }).press("Enter");
  await expect(page.getByText("1 kapsanan / 1 dışlanan satır · Tutar kapsamı", { exact: false })).toBeVisible();
  await page.getByRole("button", { name: "Alış geçmişi", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Tedarikçi iadeleri", exact: true }).press("Enter");
  await expect(page.getByRole("button", { name: "Tedarikçi iadeleri", exact: true })).toHaveAttribute("aria-pressed", "true");
 } finally { await app.close(); await rm(dir, { recursive: true, force: true }); }
});

test("source purchasing remains raw evidence with keyboard controls without decorative scenes", async ({}, testInfo) => {
 const { openStore } = await import("../../src/store/store");
 const { writeRawPackage } = await import("../../src/source/raw-package");
 const { rawSnapshot } = await import("../helpers/raw-fixture");
 const dir = await mkdtemp(join(tmpdir(), "esmer-source-cost-"));
 const store = openStore(join(dir, "analytics.sqlite"));
 const snapshot = rawSnapshot(); snapshot.headers[0].FIS_TURU = "1"; snapshot.lines[0].FIS_TURU = "1";
 store.importSourcePreview(writeRawPackage(snapshot, "fixture:cost-desk", "cost-source-1")); store.close();
 const app = await electron.launch({ executablePath, args: [`--user-data-dir=${dir}`] });
 try {
  const page = await app.firstWindow();await openWorkspace(page);
  await openReportView(page, "Alış belgeleri");
  await expect(page.locator("canvas")).toHaveCount(0);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.screenshot({ path: process.env.ESMER_CAPTURE_EVIDENCE ? "workstreams/page-control-desks/purchasing/source-desktop.png" : testInfo.outputPath("source-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: process.env.ESMER_CAPTURE_EVIDENCE ? "workstreams/page-control-desks/purchasing/source-narrow.png" : testInfo.outputPath("source-narrow.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const tableScroll = page.getByLabel("Alış kaynak kayıtları", { exact: true });
  const dateCell = tableScroll.getByRole("cell", { name: "01.10.2025", exact: true });
  expect(await dateCell.evaluate(element => { const range = document.createRange(); range.selectNodeContents(element); return range.getClientRects().length; })).toBe(1);
  await tableScroll.focus(); await expect(tableScroll).toBeFocused();
  await tableScroll.press("ArrowRight");
  expect(await tableScroll.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);
  await page.getByRole("button", { name: "Ürün kimliklerini göster", exact: true }).press("Enter");
  await page.getByRole("button", { name: "Belgeleri göster", exact: true }).press("Enter");
  await expect(page.getByRole("columnheader", { name: "Kaynak belge tutarı · doğrulanmadı" })).toBeVisible();
  await page.locator(".data-status > summary").press("Enter");
  await page.screenshot({ path: process.env.ESMER_CAPTURE_EVIDENCE ? "workstreams/page-control-desks/purchasing/source-no-webgl.png" : testInfo.outputPath("source-no-webgl.png"), fullPage: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator("main").count()).toBe(1);
 } finally { await app.close(); await rm(dir, { recursive: true, force: true }); }
});

test("purchasing leads with cost coverage and replacement-cost charts that keep unknown and exact values", async () => {
 const dir = await mkdtemp(join(tmpdir(), "esmer-cost-charts-"));
 const store = openStore(join(dir, "analytics.sqlite"));
 try { store.importPackage(richBusinessPackage()); } finally { store.close(); }
 const app = await electron.launch({ executablePath, args: [`--user-data-dir=${dir}`] });
 try {
  const page = await app.firstWindow();await openWorkspace(page);
  await page.locator(".sidebar").getByLabel("Dönem", { exact: true }).fill("2025-09");
  await openReportView(page, "Alış belgeleri");
  await expect(page.getByRole("heading", { name: "Alışlar ve maliyet", exact: true, level: 1 })).toBeVisible();
  const coverage = page.getByRole("img", { name: /Maliyeti kapsanan/ });
  await expect(coverage).toBeVisible();
  await expect(page.locator(".viz-comp-legend")).toContainText("Maliyeti kapsanan satırlar");
  const replacements = page.getByRole("list", { name: "İkame maliyeti değişimi" });
  await expect(replacements).toBeVisible();
  expect(await replacements.getByRole("listitem").count()).toBeLessThanOrEqual(10);
  await expect(replacements.locator(".viz-row-value").first()).toHaveText(/^%/);
  expect(await page.locator(".purchasing-control-desk .viz-frame").count()).toBeLessThanOrEqual(3);
  await page.getByRole("button", { name: "Tablo", exact: true }).first().click();
  await expect(page.locator(".viz-table").first()).toBeVisible();
  for (const width of [1440, 1120, 680, 390]) { await page.setViewportSize({ width, height: 900 }); expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true); }
  await expect(page.locator("canvas")).toHaveCount(0);
  await expect(page.getByText("Maliyet kapsamı, alış geçmişi ve diğer araçlar", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Fatura kayıtları tablosu" })).toBeVisible();
 } finally { await app.close(); await rm(dir, { recursive: true, force: true }); }
});
