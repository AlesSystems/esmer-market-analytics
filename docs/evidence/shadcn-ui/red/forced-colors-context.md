# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shadcn-ui.test.ts >> forced colors keeps a keyboard focus outline on actions and period input
- Location: tests\desktop\shadcn-ui.test.ts:12:1

# Error details

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "none"
```

# Test source

```ts
  1   | import { createHash } from "node:crypto";
  2   | import { mkdtemp, rm, writeFile } from "node:fs/promises";
  3   | import { tmpdir } from "node:os";
  4   | import { join, resolve } from "node:path";
  5   | import { test, expect, _electron as electron, type Page } from "@playwright/test";
  6   | import { importPackage } from "../helpers/desktop-navigation";
  7   | import { workbook, row } from "../helpers/expense-fixtures";
  8   | import { monthlyUiExpected, representativeMonthPackage, stressMonthPackage } from "../helpers/shadcn-fixtures";
  9   | 
  10  | const executablePath = process.env.ESMER_EXECUTABLE ?? resolve("release/win-unpacked/Esmer Market Analytics.exe");
  11  | 
  12  | test("forced colors keeps a keyboard focus outline on actions and period input", async ({}, testInfo) => {
  13  |   const { app, userData, packagePath } = await importedApp();
  14  |   try {
  15  |     const page = await app.firstWindow();
  16  |     await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
  17  |     await importPackage(page);
  18  |     await page.emulateMedia({ forcedColors: "active" });
  19  |     for (const control of [page.getByRole("button", { name: "Giderleri incele", exact: true }), page.getByLabel("Dönem", { exact: true })]) {
  20  |       await control.focus();
  21  |       await control.press("Tab");
  22  |       await page.keyboard.press("Shift+Tab");
  23  |       await expect(control).toBeFocused();
  24  |       const outline = await control.evaluate(node => {
  25  |         const style = getComputedStyle(node);
  26  |         return { style: style.outlineStyle, width: parseFloat(style.outlineWidth) };
  27  |       });
> 28  |       expect(outline.style).not.toBe("none");
      |                                 ^ Error: expect(received).not.toBe(expected) // Object.is equality
  29  |       expect(outline.width).toBeGreaterThanOrEqual(2);
  30  |     }
  31  |     await capture(page, testInfo.outputPath("forced-colors-keyboard-focus.png"));
  32  |   } finally {
  33  |     await app.close();
  34  |     await rm(userData, { recursive: true, force: true });
  35  |   }
  36  | });
  37  | 
  38  | async function importedApp(bytes = representativeMonthPackage()) {
  39  |   const userData = await mkdtemp(join(tmpdir(), "esmer-shadcn-ui-"));
  40  |   const packagePath = join(userData, "representative-month.json");
  41  |   await writeFile(packagePath, bytes);
  42  |   const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  43  |   return { app, userData, packagePath, fixtureHash: createHash("sha256").update(bytes).digest("hex") };
  44  | }
  45  | 
  46  | async function capture(page: Page, path: string, fullPage = false) {
  47  |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  48  |   await page.screenshot({ path, fullPage, animations: "disabled" });
  49  | }
  50  | 
  51  | async function checkContrast(page: Page) {
  52  |   const ratios = await page.evaluate(() => {
  53  |     function channels(value: string) {
  54  |       const parts = value.match(/[\d.]+/g)?.map(Number) ?? [];
  55  |       return parts.length >= 3 ? { rgb: parts.slice(0, 3), alpha: parts[3] ?? 1 } : null;
  56  |     }
  57  |     function background(element: Element) {
  58  |       for (let current: Element | null = element; current; current = current.parentElement) {
  59  |         const color = channels(getComputedStyle(current).backgroundColor);
  60  |         if (color && color.alpha > 0) return color.rgb;
  61  |       }
  62  |       return [255, 255, 255];
  63  |     }
  64  |     function luminance(rgb: number[]) {
  65  |       const linear = rgb.map(value => {
  66  |         const channel = value / 255;
  67  |         return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  68  |       });
  69  |       return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
  70  |     }
  71  |     function ratio(element: Element) {
  72  |       const foreground = channels(getComputedStyle(element).color)?.rgb;
  73  |       if (!foreground) throw new Error("Text color unavailable");
  74  |       const values = [luminance(foreground), luminance(background(element))].sort((a, b) => b - a);
  75  |       return (values[0] + 0.05) / (values[1] + 0.05);
  76  |     }
  77  |     const heading = document.querySelector(".monthly-overview h1");
  78  |     const action = [...document.querySelectorAll("button")].find(node => node.textContent?.trim() === "Giderleri incele");
  79  |     const period = document.querySelector('input[type="month"]');
  80  |     if (!heading || !action || !period) throw new Error("Representative text, action or period control missing");
  81  |     return { heading: ratio(heading), action: ratio(action), period: ratio(period) };
  82  |   });
  83  |   for (const [name, ratio] of Object.entries(ratios)) expect(ratio, `${name} text contrast`).toBeGreaterThanOrEqual(4.5);
  84  |   return ratios;
  85  | }
  86  | 
  87  | test("a representative month exposes the trend, gaps, cost exposure and evidence in the first desktop view", async ({}, testInfo) => {
  88  |   test.skip(process.platform !== "win32", "Packaged Windows layout contract");
  89  |   const { app, userData, packagePath } = await importedApp();
  90  |   try {
  91  |     const page = await app.firstWindow();
  92  |     await page.setViewportSize({ width: 1440, height: 900 });
  93  |     await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
  94  |     await importPackage(page);
  95  |     await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
  96  |     await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2025-09");
  97  |     await expect(page.locator(".data-status")).toContainText("30.09.2025");
  98  |     const overview = page.getByRole("region", { name: "Aylık göstergeler" });
  99  |     await expect(overview).toContainText(monthlyUiExpected.netSales);
  100 |     await expect(overview).toContainText(monthlyUiExpected.coveredCost);
  101 |     await expect(overview).toContainText(monthlyUiExpected.coveredGross);
  102 |     await expect(overview.getByText("Karşılaştırılamıyor", { exact: true })).toBeVisible();
  103 |     await expect(overview.getByText(/Dönem veya uzlaşma kanıtı karşılaştırma için eksik/)).toBeVisible();
  104 |     await expect(overview.getByRole("heading", { name: /Faaliyet kârı hesaplanamıyor.*gider verileri eksik/ })).toBeVisible();
  105 |     await expect(overview.getByRole("button", { name: "Giderleri incele", exact: true })).toBeVisible();
  106 |     await expect(overview.getByText(monthlyUiExpected.coveredCost, { exact: true }).first()).toBeVisible();
  107 |     await expect(overview.getByText("1.500,00 ₺", { exact: false }).filter({ visible: true }).first(), "covered sales exposure stays visible").toBeVisible();
  108 |     await expect(overview.getByText("1.400,00 ₺", { exact: false }).filter({ visible: true }).first(), "excluded sale exposure stays visible").toBeVisible();
  109 |     await expect(overview.getByText("-25,00 ₺", { exact: false }).filter({ visible: true }).first(), "excluded return exposure stays visible").toBeVisible();
  110 |     const trend = overview.getByRole("img", { name: "Günlük net satış grafiği" });
  111 |     await expect(trend).toBeVisible();
  112 |     const bounds = await trend.boundingBox();
  113 |     expect(bounds, "daily trend has a rendered box").not.toBeNull();
  114 |     expect(bounds!.y + bounds!.height, "daily trend fits in the first 900 CSS pixels").toBeLessThanOrEqual(900);
  115 |     await expect(trend.getByText("15.09.2025: -25,00 ₺")).toHaveCount(1);
  116 |     await expect(trend.getByText(/30\.09\.2025: 100,00 ₺/)).toHaveCount(1);
  117 |     await capture(page, testInfo.outputPath("representative-month-1440.png"));
  118 |     const evidence = overview.getByText("Günlük tutarlar", { exact: true });
  119 |     await evidence.focus();
  120 |     await evidence.press("Enter");
  121 |     await expect(overview.getByText("15.09.2025: -25,00 ₺").last()).toBeVisible();
  122 |     await evidence.press("Enter");
  123 |     await expect(evidence).toBeFocused();
  124 |     await overview.getByRole("button", { name: "Giderleri incele", exact: true }).click();
  125 |     await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
  126 |     await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Özet", exact: true }).click();
  127 |     await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2025-09");
  128 |     await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText(monthlyUiExpected.netSales);
```