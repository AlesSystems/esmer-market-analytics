import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {importPackage, openWorkspace } from "../helpers/desktop-navigation";
import { businessPackage } from "../helpers/business-fixtures";
import { purchasingJourney } from "../helpers/purchasing-journey";
const executablePath = process.env.ESMER_EXECUTABLE ?? resolve("release/mac-arm64/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics");
test("purchasing inspection selects actual excluded cost evidence with plain keyboard controls", async ({}, testInfo) => {
 const dir = await mkdtemp(join(tmpdir(), "esmer-cost-desk-"));
 const path = join(dir, "synthetic.json"); await writeFile(path, businessPackage(purchasingJourney()));
 const app = await electron.launch({ executablePath, args: [`--user-data-dir=${dir}`] });
 try {
  const page = await app.firstWindow();await openWorkspace(page);
  await app.evaluate(({ dialog }, file) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [file] }); }, path);
  await importPackage(page); await page.getByRole("button", { name: "Alışlar ve maliyet", exact: true }).click();
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
  await expect(page.getByText("1 kapsanan / 1 dışlanan satır", { exact: false })).toBeVisible();
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
  await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Alışlar ve maliyet", exact: true }).click();
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
