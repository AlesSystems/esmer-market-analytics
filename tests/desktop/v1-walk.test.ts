import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,mkdir,rm,writeFile,readFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {readSheet} from "read-excel-file/node";
import {executablePath} from "../helpers/desktop-executable";
import {openWorkspace,openSection,importPackage,openSettings,settingsMenu,setMonth} from "../helpers/desktop-navigation";
import {workbook} from "../helpers/expense-fixtures";
import {november,novemberElectricityExcelRow,novemberProfitPackage} from "../helpers/november-bill-fixture";
import {richEstimatePackage} from "../helpers/rich-estimate-fixture";

// #108: the v1 owner walk on the packaged app, synthetic data only. Screenshots go to the test output dir; ESMER_CAPTURE_WALK=1 writes them to docs/evidence/one-ui/.
const lira=(text:string)=>Number(text.replace(/[^\d,-]/g,"").replace(",","."));
test("v1 walk: Bu ay, Ürünler, Giderler, net profit, Excel, Ayarlar",async({},testInfo)=>{
 test.setTimeout(240_000);
 const capture=process.env.ESMER_CAPTURE_WALK==="1",shots=capture?resolve("docs/evidence/one-ui"):testInfo.outputPath();await mkdir(shots,{recursive:true});
 const userData=await mkdtemp(join(tmpdir(),"v1-walk-")),file=join(userData,"synthetic-estimate.json"),output=join(userData,"rapor.xlsx");
 await writeFile(file,richEstimatePackage());
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setContentSize(1440,900));
  const shoot=async(name:string)=>{await page.locator(".app-body").focus();await expect(page.locator(".app-body h1").first()).toBeAttached();await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:join(shots,`v1-walk-${name}.png`)});};
  // Import the synthetic package through the gear menu.
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);
  await importPackage(page);
  await expect(page.getByText("Gerçek kaynak kayıtları içe aktarıldı.",{exact:true})).toBeVisible();
  // Bu ay.
  await openSection(page,"Bu ay");
  await expect(page.getByRole("heading",{name:"Ekim 2025",level:1})).toBeVisible();
  await expect(page.getByText("Tahmini brüt kâr").first()).toBeVisible();
  await shoot("bu-ay");
  // Ürünler: sort, open a card, Kaynak satırlar, back.
  await openSection(page,"Ürünler");
  await expect(page.getByRole("heading",{name:"Ürünler",level:1})).toBeVisible();
  const sales=page.locator(".products-table thead th").filter({has:page.getByRole("button",{name:"Satış",exact:true})});
  await sales.getByRole("button").click();
  await expect(sales).toHaveAttribute("aria-sort",/ascending|descending/);
  await page.locator(".products-table tbody tr").first().click();
  const card=page.getByRole("dialog");
  await expect(card).toBeVisible();
  await shoot("urunler");
  await card.getByRole("button",{name:"Kaynak satırlar",exact:true}).click();
  await expect(page.getByRole("table",{name:"Bu ürünün geçtiği satış belgeleri"})).toBeVisible();
  await page.getByRole("button",{name:"Ürünlere dön",exact:true}).click();
  await expect(page.locator(".products-table")).toBeVisible();
  // Giderler: one manual expense, then the month's expenses complete.
  await openSection(page,"Giderler");
  await page.locator("#expense-manual").click();
  await page.getByLabel("Kategori",{exact:true}).fill("Sentetik kira");
  await page.getByLabel("Tutar (TRY)",{exact:true}).fill("1.000,00");
  await page.getByRole("button",{name:"Gideri kaydet",exact:true}).click();
  await expect(page.locator("#expense-manual")).toBeFocused();
  await shoot("giderler");
  // One group has a line, so the empty groups are named before the explicit confirmation.
  await page.getByRole("button",{name:"Bu ayın giderleri tamam",exact:true}).click();
  await expect(page.getByRole("alert").filter({hasText:"Personel toplamı, Elektrik/su ve Diğer için kayıt yok."})).toBeVisible();
  await page.getByRole("button",{name:"Bu kalemlerde gider yok, onayla",exact:true}).click();
  await expect(page.getByText("Onaylandı",{exact:true})).toBeVisible();
  // Bu ay now carries the net profit (Ekim 2025 is a full month in the fixture).
  await openSection(page,"Bu ay");
  await expect(page.getByRole("heading",{name:"Tahmini net kâr",exact:true,level:2})).toBeVisible();
  const gross=lira(await page.locator(".hero-num").innerText()),net=lira(await page.locator(".netcard .net").innerText());
  expect(Number.isFinite(gross)).toBe(true);
  expect(net).toBeCloseTo(gross-1000,2);
  await expect(page.getByText("Bazı gider satırları net kârı engelliyor")).toHaveCount(0);
  await shoot("bu-ay-net");
  // Excel'e aktar in the header: export to a stubbed save path.
  await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},output);
  await page.getByRole("button",{name:"Excel’e aktar",exact:true}).click();
  await expect(page.getByText("Doğrulanmamış tahmin Excel dosyasına kaydedildi.",{exact:true})).toBeVisible();
  const summary=await readSheet(await readFile(output),"Özet"),cell=(label:string)=>Number(summary.find(r=>r[0]===label)?.[1]);
  expect(cell("Tahmini brüt kâr")).toBeCloseTo(gross,2);
  expect(cell("Tahmini net kâr")).toBeCloseTo(net,2);
  // The gear menu: its items, then Hakkında ve bilinen sınırlar.
  await openSettings(page);
  for(const name of [/^Veri paketi içe aktar/,/^Yedekle \/ Geri yükle/,/^Canlı bağlantı/,/^Kaynak belgeler/,/^Hakkında ve bilinen sınırlar/])await expect(settingsMenu(page).getByRole("button",{name})).toBeVisible();
  await settingsMenu(page).getByRole("button",{name:/^Hakkında ve bilinen sınırlar/}).click();
  await expect(page.getByRole("region",{name:"Bilinen sınırlar"})).toBeVisible();
  await shoot("ayarlar");
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true,maxRetries:5});}
});

test("November bill survives restart, reconciles with Excel and keeps a separate bill", async ({}, testInfo) => {
 test.setTimeout(90_000);
 const userData = await mkdtemp(join(tmpdir(), "november-bill-"));
 const source = join(userData, "source.json"), matchingWorkbook = join(userData, "matching.xlsx");
 const template = join(userData, "template.xlsx"), separateWorkbook = join(userData, "separate.xlsx");
 await writeFile(source, novemberProfitPackage());
 await writeFile(matchingWorkbook, await workbook([novemberElectricityExcelRow]));
 const separateRow = [...novemberElectricityExcelRow];
 separateRow[0] = "november-electricity-2";
 separateRow[8] = "non-recoverable";
 separateRow[9] = "tax-2";
 separateRow[10] = "bill-2";
 await writeFile(separateWorkbook, await workbook([separateRow]));

 const launch = () => electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
 let app = await launch();
 try {
  let page = await app.firstWindow();
  const button = (name: string) => page.getByRole("button", { name, exact: true });
  const history = () => page.getByRole("region", { name: "İçe aktarma geçmişi" });
  const records = () => page.getByRole("region", { name: "Kayıtlar" }).locator("tbody tr");
  const chooseOpenPath = (path: string) => app.evaluate(({ dialog }, path) => {
   dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [path] });
  }, path);
  const chooseSavePath = (path: string) => app.evaluate(({ dialog }, path) => {
   dialog.showSaveDialog = async () => ({ canceled: false, filePath: path });
  }, path);
  const shot = async (name: string) => {
   await page.evaluate(() => document.fonts.ready);
   await page.screenshot({ path: testInfo.outputPath(`${name}.png`), fullPage: true });
  };
  const review = async () => {
   await button("Bu ayın giderleri tamam").click();
   await button("Bu kalemlerde gider yok, onayla").click();
   await button("Net kârı gör").click();
  };
  const exportEstimate = async (name: string, shownNet: string, expenses: string, net: string) => {
   await expect(page.locator(".hero-num")).toContainText("10.000,00");
   await expect(page.locator(".netcard .net")).toContainText(shownNet);
   const output = join(userData, `${name}.xlsx`);
   await chooseSavePath(output);
   await button("Excel’e aktar").click();
   await expect(page.getByText("Doğrulanmamış tahmin Excel dosyasına kaydedildi.", { exact: true })).toBeVisible();
   const summary = await readSheet(await readFile(output), "Özet");
   const amount = (label: string) => summary.find(row => row[0] === label)?.[1];
   expect([amount("Tahmini brüt kâr"), amount("Giderler"), amount("Tahmini net kâr")]).toEqual(["10000", expenses, net]);
   expect(amount("Hesaplama sürümü")).toBe("month-profit-v2");
  };

  await page.clock.setFixedTime(new Date("2026-12-10T12:00:00Z"));
  await openWorkspace(page);
  await chooseOpenPath(source);
  await importPackage(page);
  await expect(page.getByText("Gerçek kaynak kayıtları içe aktarıldı.", { exact: true })).toBeVisible();
  await expect(page.locator(".hero-num")).toContainText("10.000,00");
  await openSection(page, "Giderler");
  await setMonth(page, november);
  await expect(page.getByText("Hesap ayrıntıları ve içe aktarma geçmişi", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Excel şablonu nasıl doldurulur?", { exact: true })).toHaveCount(0);
  await button("Excel’den içe aktar").click();
  await expect(history()).toContainText("Henüz içe aktarma yok.");
  await chooseSavePath(template);
  await button("Şablonu indir").click();
  await expect(page.getByText("Excel şablonu kaydedildi.", { exact: true })).toBeVisible();
  const templateRows = await readSheet(await readFile(template), "Giderler");
  expect(templateRows[0]).toContain("Gider tarihi");
  await button("Giderlere dön").click();

  await button("Elle gider ekle").click();
  await page.getByLabel("Kategori", { exact: true }).fill("Elektrik");
  await page.getByLabel("Tutar (TRY)", { exact: true }).fill("1.250,00");
  await shot("manual");
  await button("Gideri kaydet").click();
  await expect(page.getByRole("status").filter({ hasText: "Gider kaydedildi." })).toBeVisible();
  await app.close();

  app = await launch();
  page = await app.firstWindow();
  await page.clock.setFixedTime(new Date("2026-12-10T12:00:00Z"));
  await openWorkspace(page);
  await openSection(page, "Giderler");
  await setMonth(page, november);
  await expect(records()).toHaveCount(1);
  await expect(records().first()).toContainText("Kasım 2026");
  await expect(records().first()).toContainText("Elle kayıt no. 1");
  await records().first().getByRole("button", { name: "İncele / düzelt" }).click();
  await expect(page.getByLabel("Tutar (TRY)", { exact: true })).toHaveValue("1250");
  await button("Düzeltmeyi kapat").click();

  await openSection(page, "Bu ay");
  await expect(page.getByRole("heading", { name: "Kasım 2026", level: 1 })).toBeVisible();
  await expect(page.locator(".hero-num")).toContainText("10.000,00");
  await expect(page.locator(".netcard")).toContainText("Bu ayın giderleri tamamlanmadı");
  await expect(page.locator(".netcard .net")).toHaveCount(0);
  await openSection(page, "Giderler");
  await review();
  await exportEstimate("manual-estimate", "8.750,00", "1250", "8750");
  await shot("net-manual");

  await openSection(page, "Giderler");
  await chooseOpenPath(matchingWorkbook);
  await button("Excel’den içe aktar").click();
  await button("Excel dosyası seç").click();
  await button("Satır 2: 1 olası elle kayıt").click();
  await expect(button("İçe aktar")).toBeDisabled();
  await page.getByRole("combobox", { name: "Satır 2 eşleştirme kararı" })
   .selectOption({ label: "Elle kayıt no. 1 · Elektrik · Kasım 2026 · 1.250,00 ₺" });
  await shot("match");
  await button("İçe aktar").click();
  await expect(records()).toHaveCount(1);
  await expect(records().first()).toContainText("Elle kayıt no. 1");
  await expect(records().first()).toContainText(/15[.\/]11[.\/]2026/);
  await expect(page.getByText("Onay eskidi", { exact: true })).toBeVisible();
  await openSection(page, "Bu ay");
  await expect(page.locator(".netcard")).toContainText("Giderler onaydan sonra değişti");
  await expect(page.locator(".netcard .net")).toHaveCount(0);
  await openSection(page, "Giderler");
  await review();
  await exportEstimate("linked-estimate", "9.000,00", "1000", "9000");
  await shot("net-linked");

  await openSection(page, "Giderler");
  await button("Excel’den içe aktar").click();
  await expect(history().getByRole("listitem")).toHaveCount(1);
  await shot("import-history");
  await button("Excel dosyası seç").click();
  await expect(page.getByText("Bu Excel dosyası zaten içe aktarılmış.", { exact: true })).toBeVisible();
  await expect(button("İçe aktar")).toBeDisabled();
  await button("Önizlemeyi kapat").click();
  await expect(history().getByRole("listitem")).toHaveCount(1);
  await button("Giderlere dön").click();
  await expect(records()).toHaveCount(1);

  await button("Excel’den içe aktar").click();
  await chooseOpenPath(separateWorkbook);
  await button("Excel dosyası seç").click();
  await expect(button("İçe aktar")).toBeDisabled();
  await page.getByLabel("Satır 2: benzer kayıt var, yine de ayrı gider olarak ekle").check();
  await button("İçe aktar").click();
  await expect(records()).toHaveCount(2);
  await expect(page.getByText("Onay eskidi", { exact: true })).toBeVisible();
  await review();
  // The linked bill contributes its 1,000 TRY net and the separate bill its 1,250 TRY gross.
  await exportEstimate("separate-estimate", "7.750,00", "2250", "7750");
 } finally {
  await app.close().catch(() => {});
  await rm(userData, { recursive: true, force: true, maxRetries: 5 });
 }
});
