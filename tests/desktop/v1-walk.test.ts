import {test,expect,_electron as electron} from "@playwright/test";
import {mkdtemp,mkdir,rm,writeFile,stat} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join,resolve} from "node:path";
import {executablePath} from "../helpers/desktop-executable";
import {openWorkspace,openSection,importPackage} from "../helpers/desktop-navigation";
import {richEstimatePackage} from "../helpers/rich-estimate-fixture";

// #108: the v1 owner walk on the packaged app, synthetic data only. Screenshots go to docs/evidence/one-ui/.
test("v1 walk: Bu ay, Ürünler, Giderler, net profit, Rapor ve Excel, Ayarlar",async()=>{
 test.setTimeout(240_000);
 const shots=resolve("docs/evidence/one-ui");await mkdir(shots,{recursive:true});
 const userData=await mkdtemp(join(tmpdir(),"v1-walk-")),file=join(userData,"synthetic-estimate.json"),output=join(userData,"rapor.xlsx");
 await writeFile(file,richEstimatePackage());
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  const page=await app.firstWindow();await openWorkspace(page);
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setContentSize(1440,900));
  const shoot=async(name:string)=>{await page.locator(".app-body").focus();await page.waitForTimeout(700);await page.screenshot({path:join(shots,`v1-walk-${name}.png`)});};
  // Import the synthetic package through Ayarlar.
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
  const card=page.getByRole("region",{name:"Ürün kartı"});
  await expect(card).toBeVisible();
  await shoot("urunler");
  await card.getByRole("button",{name:"Kaynak satırlar",exact:true}).click();
  await expect(page.getByRole("table",{name:"Bu ürünün geçtiği satış belgeleri"})).toBeVisible();
  await page.getByRole("button",{name:"Ürünlere dön",exact:true}).click();
  await expect(page.locator(".products-table")).toBeVisible();
  // Giderler: one manual expense, then the month's expenses complete.
  await openSection(page,"Giderler");
  await page.locator("#expense-manual").click();
  await page.getByLabel("Gider tarihi",{exact:true}).fill("2025-10-15");
  await page.getByLabel("Kategori",{exact:true}).fill("Sentetik kira");
  await page.getByLabel("Sınıflandırma",{exact:true}).selectOption("operating-expense");
  await page.getByLabel("Net tutar (TRY)",{exact:true}).fill("1.000,00");
  await page.getByLabel("KDV tutarı (TRY)",{exact:true}).fill("0");
  await page.getByLabel("Brüt tutar (TRY)",{exact:true}).fill("1.000,00");
  await page.getByLabel("KDV işlemi",{exact:true}).selectOption("non-recoverable");
  await page.getByLabel("KDV kanıtı",{exact:true}).fill("synthetic-tax");
  await page.getByRole("button",{name:"Gideri kaydet",exact:true}).click();
  await expect(page.locator("#expense-manual")).toBeFocused();
  await shoot("giderler");
  await page.getByRole("button",{name:"Bu ayın giderleri tamam",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Onaylandı",exact:true})).toBeVisible();
  // Bu ay now carries the net profit (Ekim 2025 is a full month in the fixture).
  await openSection(page,"Bu ay");
  await expect(page.getByText("143.100,00 ₺").first()).toBeVisible();
  await expect(page.getByText("Bazı gider satırları net kârı engelliyor")).toHaveCount(0);
  await shoot("bu-ay-net");
  // Rapor ve Excel: export to a stubbed save path.
  await openSection(page,"Rapor ve Excel");
  await expect(page.getByRole("heading",{name:"Rapor ve Excel",level:1})).toBeVisible();
  await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});},output);
  await page.getByRole("button",{name:"Excel’e aktar",exact:true}).click();
  await expect(page.getByText("Doğrulanmamış tahmin Excel dosyasına kaydedildi.",{exact:true})).toBeVisible();
  expect((await stat(output)).size).toBeGreaterThan(0);
  await shoot("rapor-ve-excel");
  // Ayarlar: five tiles, then Bilinen sınırlar.
  await page.getByRole("button",{name:"Ayarlar",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Ayarlar",exact:true,level:1})).toBeVisible();
  for(const name of ["Veri paketi","Yedekleme ve kurtarma","Görünüm","Canlı bağlantı","Hakkında"])await expect(page.getByText(name,{exact:true}).first()).toBeVisible();
  await page.getByRole("button",{name:"Bilinen sınırlar",exact:true}).click();
  await expect(page.getByRole("region",{name:"Bilinen sınırlar"})).toBeVisible();
  await shoot("ayarlar");
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});
