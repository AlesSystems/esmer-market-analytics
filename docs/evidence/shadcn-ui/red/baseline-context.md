# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: shadcn-ui.test.ts >> a representative month exposes the trend, gaps, cost exposure and evidence in the first desktop view
- Location: tests\desktop\shadcn-ui.test.ts:26:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('region', { name: 'Aylık göstergeler' }).getByRole('button', { name: 'Giderleri incele', exact: true })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByRole('region', { name: 'Aylık göstergeler' }).getByRole('button', { name: 'Giderleri incele', exact: true }) with timeout 5000ms
  - waiting for getByRole('region', { name: 'Aylık göstergeler' }).getByRole('button', { name: 'Giderleri incele', exact: true })

```

```yaml
- text: ESMER MARKET Dönem
- textbox "Dönem": 2025-09
- group:
  - text: "Veri:"
  - strong: 30.09.2025
- text: Sentetik veri
- group: İşlemler
- navigation "Ana gezinme":
  - button "Özet"
  - button "Satışlar"
  - button "Alışlar ve maliyet"
  - button "Giderler"
  - button "Raporlar"
- text: Çevrimdışı analiz
- status: Veri paketi içe aktarıldı.
- button "Bildirimi kapat"
- main:
  - heading "Aylık Market Özeti" [level=1]
  - text: Geçici Aday rapor
  - region "Aylık göstergeler":
    - heading "Net satış" [level=2]
    - strong: 2.875,00 ₺
    - paragraph:
      - text: Önceki aya göre
      - strong: Karşılaştırılamıyor
    - paragraph: Dönem veya uzlaşma kanıtı karşılaştırma için eksik.
    - group: Kaynakla uzlaşıyor
    - heading "Tamamlanmış satış belgeleri" [level=3]
    - strong: "29"
    - group: Kaynakla uzlaşıyor
    - heading "Ortalama sepet" [level=3]
    - strong: 100,00 ₺
    - group: Kaynakla uzlaşıyor
    - button "Satışları incele"
    - heading "Finansal görünüm" [level=2]
    - term: Kapsanan tahmini brüt kâr
    - definition:
      - text: 900,00 ₺
      - group: Tahmini · %51,28 kapsam
    - term: Kapsanan tahmini maliyet
    - definition:
      - text: 600,00 ₺
      - group: Tahmini · %51,28 kapsam
    - term: Maliyet kapsamı
    - definition:
      - text: "%51,28"
      - group: Tahmini · %51,28 kapsam
    - term: Hesaba alınan faaliyet gideri
    - definition:
      - text: Henüz sağlanmadı
      - group: Kanıt eksik
    - term: İşçilik
    - definition:
      - text: Henüz sağlanmadı
      - group: Kanıt eksik
    - heading "Faaliyet kârı hesaplanamıyor — gider verileri eksik." [level=3]
    - group: Hesaplanamıyor
    - heading "Günlük net satış" [level=2]
    - text: TRY · müşteri iadeleri dahil
    - img "Günlük net satış grafiği": "01 01.09.2025: 100,00 ₺ 02 02.09.2025: 100,00 ₺ 03 03.09.2025: 100,00 ₺ 04 04.09.2025: 100,00 ₺ 05 05.09.2025: 100,00 ₺ 06 06.09.2025: 100,00 ₺ 07 07.09.2025: 100,00 ₺ 08 08.09.2025: 100,00 ₺ 09 09.09.2025: 100,00 ₺ 10 10.09.2025: 100,00 ₺ 11 11.09.2025: 100,00 ₺ 12 12.09.2025: 100,00 ₺ 13 13.09.2025: 100,00 ₺ 14 14.09.2025: 100,00 ₺ 15 15.09.2025: -25,00 ₺ 16 16.09.2025: 100,00 ₺ 17 17.09.2025: 100,00 ₺ 18 18.09.2025: 100,00 ₺ 19 19.09.2025: 100,00 ₺ 20 20.09.2025: 100,00 ₺ 21 21.09.2025: 100,00 ₺ 22 22.09.2025: 100,00 ₺ 23 23.09.2025: 100,00 ₺ 24 24.09.2025: 100,00 ₺ 25 25.09.2025: 100,00 ₺ 26 26.09.2025: 100,00 ₺ 27 27.09.2025: 100,00 ₺ 28 28.09.2025: 100,00 ₺ 29 29.09.2025: 100,00 ₺ 30 30.09.2025: 100,00 ₺"
    - group: Günlük tutarlar
    - group: Kaynakla uzlaşıyor
    - heading "Öne çıkan kategoriler" [level=2]
    - button "Tüm kategoriler"
    - table:
      - rowgroup:
        - row "Kategori Net satış Pay":
          - columnheader "Kategori"
          - columnheader "Net satış"
          - columnheader "Pay"
      - rowgroup:
        - row "Fırın 600,00 ₺ %20,87":
          - cell "Fırın":
            - button "Fırın"
          - cell "600,00 ₺"
          - cell "%20,87"
        - row "Temizlik ve kişisel bakım ürünleri 600,00 ₺ %20,87":
          - cell "Temizlik ve kişisel bakım ürünleri":
            - button "Temizlik ve kişisel bakım ürünleri"
          - cell "600,00 ₺"
          - cell "%20,87"
        - row "İçecekler 600,00 ₺ %20,87":
          - cell "İçecekler":
            - button "İçecekler"
          - cell "600,00 ₺"
          - cell "%20,87"
        - row "Manav 600,00 ₺ %20,87":
          - cell "Manav":
            - button "Manav"
          - cell "600,00 ₺"
          - cell "%20,87"
        - row "Temel gıda 475,00 ₺ %16,52":
          - cell "Temel gıda":
            - button "Temel gıda"
          - cell "475,00 ₺"
          - cell "%16,52"
    - group: Kaynakla uzlaşıyor
  - group: Ay ve yıl karşılaştırmaları
  - group: Rapor kanıtı
- contentinfo: Esmer Market · Çevrimdışı analiz Tutarlar Türk lirası (TRY)
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
  8   | import { monthlyUiExpected, representativeMonthPackage } from "../helpers/shadcn-fixtures";
  9   | 
  10  | const executablePath = process.env.ESMER_EXECUTABLE ?? resolve("release/win-unpacked/Esmer Market Analytics.exe");
  11  | 
  12  | async function importedApp() {
  13  |   const userData = await mkdtemp(join(tmpdir(), "esmer-shadcn-ui-"));
  14  |   const packagePath = join(userData, "representative-month.json");
  15  |   const bytes = representativeMonthPackage();
  16  |   await writeFile(packagePath, bytes);
  17  |   const app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  18  |   return { app, userData, packagePath, fixtureHash: createHash("sha256").update(bytes).digest("hex") };
  19  | }
  20  | 
  21  | async function capture(page: Page, path: string, fullPage = false) {
  22  |   await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  23  |   await page.screenshot({ path, fullPage, animations: "disabled" });
  24  | }
  25  | 
  26  | test("a representative month exposes the trend, gaps, cost exposure and evidence in the first desktop view", async ({}, testInfo) => {
  27  |   test.skip(process.platform !== "win32", "Packaged Windows layout contract");
  28  |   const { app, userData, packagePath } = await importedApp();
  29  |   try {
  30  |     const page = await app.firstWindow();
  31  |     await page.setViewportSize({ width: 1440, height: 900 });
  32  |     await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
  33  |     await importPackage(page);
  34  |     await expect(page.getByRole("heading", { name: "Aylık Market Özeti", exact: true })).toBeVisible();
  35  |     await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2025-09");
  36  |     await expect(page.locator(".data-status")).toContainText("30.09.2025");
  37  |     const overview = page.getByRole("region", { name: "Aylık göstergeler" });
  38  |     await expect(overview).toContainText(monthlyUiExpected.netSales);
  39  |     await expect(overview).toContainText(monthlyUiExpected.coveredCost);
  40  |     await expect(overview).toContainText(monthlyUiExpected.coveredGross);
  41  |     await expect(overview.getByText("Karşılaştırılamıyor", { exact: true })).toBeVisible();
  42  |     await expect(overview.getByText(/Dönem veya uzlaşma kanıtı karşılaştırma için eksik/)).toBeVisible();
  43  |     await expect(overview.getByRole("heading", { name: /Faaliyet kârı hesaplanamıyor.*gider verileri eksik/ })).toBeVisible();
> 44  |     await expect(overview.getByRole("button", { name: "Giderleri incele", exact: true })).toBeVisible();
      |                                                                                           ^ Error: expect(locator).toBeVisible() failed
  45  |     await expect(overview.getByText(monthlyUiExpected.coveredCost, { exact: true }).first()).toBeVisible();
  46  |     await expect(overview.getByText("1.500,00 ₺", { exact: false }).filter({ visible: true }).first(), "covered sales exposure stays visible").toBeVisible();
  47  |     await expect(overview.getByText("1.400,00 ₺", { exact: false }).filter({ visible: true }).first(), "excluded sale exposure stays visible").toBeVisible();
  48  |     await expect(overview.getByText("-25,00 ₺", { exact: false }).filter({ visible: true }).first(), "excluded return exposure stays visible").toBeVisible();
  49  |     const trend = overview.getByRole("img", { name: "Günlük net satış grafiği" });
  50  |     await expect(trend).toBeVisible();
  51  |     const bounds = await trend.boundingBox();
  52  |     expect(bounds, "daily trend has a rendered box").not.toBeNull();
  53  |     expect(bounds!.y + bounds!.height, "daily trend fits in the first 900 CSS pixels").toBeLessThanOrEqual(900);
  54  |     await expect(trend.getByText("15.09.2025: -25,00 ₺")).toHaveCount(1);
  55  |     await expect(trend.getByText(/30\.09\.2025: 100,00 ₺/)).toHaveCount(1);
  56  |     await capture(page, testInfo.outputPath("representative-month-1440.png"));
  57  |     const evidence = overview.getByText("Günlük tutarlar", { exact: true });
  58  |     await evidence.focus();
  59  |     await evidence.press("Enter");
  60  |     await expect(overview.getByText("15.09.2025: -25,00 ₺").last()).toBeVisible();
  61  |     await evidence.press("Enter");
  62  |     await expect(evidence).toBeFocused();
  63  |     await overview.getByRole("button", { name: "Giderleri incele", exact: true }).click();
  64  |     await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
  65  |     await page.getByRole("navigation", { name: "Ana gezinme" }).getByRole("button", { name: "Özet", exact: true }).click();
  66  |     await expect(page.getByLabel("Dönem", { exact: true })).toHaveValue("2025-09");
  67  |     await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText(monthlyUiExpected.netSales);
  68  |   } finally {
  69  |     await app.close();
  70  |     await rm(userData, { recursive: true, force: true });
  71  |   }
  72  | });
  73  | 
  74  | test("packaged visual journey retains every destination and important desktop state", async ({}, testInfo) => {
  75  |   test.skip(process.platform !== "win32", "Packaged Windows visual evidence");
  76  |   const { app, userData, packagePath, fixtureHash } = await importedApp();
  77  |   try {
  78  |     const page = await app.firstWindow();
  79  |     await page.setViewportSize({ width: 1440, height: 900 });
  80  |     await expect(page.getByRole("heading", { name: "Henüz veri yok" })).toBeVisible();
  81  |     await capture(page, testInfo.outputPath("empty-1440.png"));
  82  |     await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, packagePath);
  83  |     await importPackage(page);
  84  |     await expect(page.getByRole("region", { name: "Aylık göstergeler" })).toContainText(monthlyUiExpected.netSales);
  85  |     const dismiss = page.getByRole("button", { name: "Bildirimi kapat" });
  86  |     if (await dismiss.isVisible()) await dismiss.click();
  87  |     await capture(page, testInfo.outputPath("overview-1440.png"));
  88  | 
  89  |     const nav = page.getByRole("navigation", { name: "Ana gezinme" });
  90  |     await nav.getByRole("button", { name: "Satışlar", exact: true }).click();
  91  |     await expect(page.getByRole("heading", { name: "Satış Özeti", exact: true })).toBeVisible();
  92  |     await capture(page, testInfo.outputPath("sales-summary.png"));
  93  |     await page.getByRole("button", { name: "Tüm ürünler", exact: true }).click();
  94  |     await expect(page.getByRole("heading", { name: "Kategori / Ürün Detayı", exact: true })).toBeVisible();
  95  |     await capture(page, testInfo.outputPath("sales-products.png"));
  96  |     await page.getByRole("button", { name: "Satış özetine dön", exact: true }).click();
  97  |     await page.getByRole("button", { name: "Tüm işlemleri göster", exact: true }).click();
  98  |     await expect(page.getByRole("heading", { name: "İşlemler", exact: true })).toBeVisible();
  99  |     await capture(page, testInfo.outputPath("sales-transactions.png"));
  100 |     await page.getByRole("button", { name: "UI01", exact: true }).click();
  101 |     await expect(page.getByRole("complementary", { name: "İşlem detayı" })).toBeVisible();
  102 |     await capture(page, testInfo.outputPath("sales-receipt.png"));
  103 |     await page.getByRole("complementary", { name: "İşlem detayı" }).getByRole("button", { name: "Kaynak detayını göster" }).click();
  104 |     await expect(page.getByRole("complementary", { name: "Kaynak detayı" })).toBeVisible();
  105 |     await capture(page, testInfo.outputPath("sales-source.png"));
  106 |     await page.getByRole("button", { name: "Kapat", exact: true }).click();
  107 |     await expect(page.getByRole("button", { name: "UI01", exact: true })).toBeFocused();
  108 | 
  109 |     await nav.getByRole("button", { name: "Alışlar ve maliyet", exact: true }).click();
  110 |     await expect(page.getByRole("heading", { name: "Alışlar ve maliyet", exact: true })).toBeVisible();
  111 |     await capture(page, testInfo.outputPath("purchasing-history.png"));
  112 |     for (const [label, file] of [["Tedarikçi iadeleri", "purchasing-returns.png"], ["İkame maliyeti", "purchasing-replacement.png"], ["Stok ve fire", "purchasing-stock.png"]] as const) {
  113 |       await page.getByRole("navigation", { name: "Alış ve maliyet görünümleri" }).getByRole("button", { name: label, exact: true }).click();
  114 |       await expect(page.getByRole("region", { name: label, exact: true })).toBeVisible();
  115 |       await capture(page, testInfo.outputPath(file));
  116 |     }
  117 | 
  118 |     await nav.getByRole("button", { name: "Giderler", exact: true }).click();
  119 |     await expect(page.getByRole("heading", { name: "Giderler", exact: true })).toBeVisible();
  120 |     await capture(page, testInfo.outputPath("expenses-records.png"));
  121 |     await page.getByRole("button", { name: "Gider tamlığını onayla", exact: true }).click();
  122 |     await expect(page.getByRole("heading", { name: "Dönem eksiksizlik incelemesi", exact: true })).toBeVisible();
  123 |     await capture(page, testInfo.outputPath("expenses-completeness.png"));
  124 |     await page.getByRole("button", { name: "Kayıtlara dön", exact: true }).click();
  125 |     const expensePath = join(userData, "synthetic-expense.xlsx");
  126 |     await writeFile(expensePath, await workbook([["ui-rent-1", "15.09.2025", "01.10.2025", ...row.slice(3)]]));
  127 |     await app.evaluate(({ dialog }, path) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] }); }, expensePath);
  128 |     await page.getByRole("button", { name: "Gider içe aktar", exact: true }).click();
  129 |     await capture(page, testInfo.outputPath("expenses-import.png"));
  130 |     await page.getByRole("button", { name: "Excel seç", exact: true }).click();
  131 |     await expect(page.getByRole("region", { name: "Excel önizlemesi" })).toBeVisible();
  132 |     await capture(page, testInfo.outputPath("expenses-preview.png"));
  133 | 
  134 |     await nav.getByRole("button", { name: "Raporlar", exact: true }).click();
  135 |     await expect(page.getByRole("heading", { name: "Rapor sürümleri", exact: true })).toBeVisible();
  136 |     await capture(page, testInfo.outputPath("reports-list.png"));
  137 |     await page.getByRole("button", { name: "Aday raporu aç", exact: true }).click();
  138 |     await expect(page.getByRole("region", { name: "Seçili rapor" })).toBeVisible();
  139 |     await capture(page, testInfo.outputPath("reports-candidate.png"));
  140 | 
  141 |     await page.getByText("İşlemler", { exact: true }).click();
  142 |     await page.getByText("İçe aktarma geçmişi", { exact: true }).click();
  143 |     await capture(page, testInfo.outputPath("operations-history.png"));
  144 |     await page.getByRole("button", { name: "Yedekleme ve kurtarma", exact: true }).click();
```