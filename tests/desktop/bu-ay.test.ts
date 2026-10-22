import {test,expect,_electron as electron,type Page} from "@playwright/test";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {executablePath} from "../helpers/desktop-executable";
import {openWorkspace,importPackage} from "../helpers/desktop-navigation";
import {monthProfitPackage} from "../helpers/month-profit-fixture";

const figure=(page:Page,name:string)=>page.getByRole("region",{name:"Ayın rakamları"}).getByRole("article").filter({has:page.getByRole("heading",{name,exact:true})});

test("Bu ay opens at launch with four sections, and an imported estimate package answers the month in one screen",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"bu-ay-")),file=join(userData,"month.json");await writeFile(file,monthProfitPackage());
 let app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  let page=await app.firstWindow();await openWorkspace(page);
  const nav=page.getByRole("navigation",{name:"Ana gezinme"});
  await expect(nav.getByRole("button")).toHaveText(["Bu ay","Ürünler","Giderler","Rapor ve Excel"]);
  await expect(nav.getByRole("button",{name:"Bu ay",exact:true})).toHaveAttribute("aria-current","page");
  await expect(page.getByRole("button",{name:"Ayarlar",exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Karşılama",exact:true})).toHaveCount(0);
  // No estimate package yet: one sentence and the way to import one.
  await expect(page.getByRole("heading",{name:"Kâr tahmini için veri paketi gerekiyor",exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Veri paketi içe aktar",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Ayarlar",level:1})).toBeVisible();
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);
  await importPackage(page);
  // First use selects the latest month in the package.
  await expect(page.getByRole("heading",{name:"Ekim 2025",level:1})).toBeVisible();
  await expect(page.getByLabel("Dönem",{exact:true})).toHaveValue("2025-10");
  await expect(page.getByText("Ekim'de 480 ₺ satış yaptınız; tahmini brüt kâr 57,5 ₺ — maliyeti bilinen her 100 ₺'lik satıştan 13 ₺.",{exact:true})).toBeVisible();
  await expect(figure(page,"Satış").locator("strong")).toHaveText("480,00 ₺");
  await expect(figure(page,"Satış")).toContainText("▼ %5,88 önceki aya göre");
  await expect(figure(page,"Tahmini brüt kâr").locator("strong")).toHaveText("57,50 ₺");
  await expect(figure(page,"Tahmini brüt kâr")).toContainText("▼ %43,63 önceki aya göre");
  await expect(figure(page,"Marj").locator("strong")).toHaveText("%13,37");
  await expect(figure(page,"Marj")).toContainText("▼ 6,63 puan önceki aya göre");
  await expect(figure(page,"Tahmini net kâr")).toContainText("Ay henüz tamamlanmadı (20.10.2025 tarihine kadar veri)");
  await expect(page.locator(".viz-estimate")).toHaveCount(1);
  await expect(page.getByRole("list",{name:"Satıştan net kâra köprü"}).locator('li[data-state="unknown"]')).toHaveCount(3);
  await expect(page.getByRole("list",{name:"En çok kazandıran ürünler"}).getByRole("button").first()).toContainText("Süt");
  const attention=page.getByRole("list",{name:"Dikkat edilecek ürünler"}).getByRole("button");
  await expect(attention).toHaveText([
   "Zarar ediyorEkmekBrüt zarar 4,00 ₺",
   "Marjı düştüSütMarj %31,50 → %30,00",
   "Marjı düştüŞekerMarj %40,00 → %20,00",
   "Çok satıyor ama marjı düşükÇaySatış 200,00 ₺ · marj %5,00",
   "Çok satıyor ama marjı düşükEkmekSatış 40,00 ₺ · marj %-10,00",
   "Maliyeti eksikPeynirSatış 50,00 ₺ · maliyet kaydı yok",
  ]);
  await attention.first().click();
  await expect(page.getByRole("heading",{name:"Ürünler",level:1})).toBeVisible();
  await expect(page.locator('tr[data-product="3"]')).toHaveAttribute("aria-selected","true");
  await expect(page.locator('tr[data-product="3"]')).toBeFocused();
  // A full month without expenses: net profit names the missing step and leads to Giderler.
  await page.getByRole("button",{name:"Bu ay",exact:true}).click();
  await page.getByLabel("Dönem",{exact:true}).fill("2025-09");
  await expect(page.getByRole("heading",{name:"Eylül 2025",level:1})).toBeVisible();
  await expect(figure(page,"Tahmini net kâr")).toContainText("Bu ayın giderleri girilmedi");
  await figure(page,"Tahmini net kâr").getByRole("button",{name:"Giderlere git",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Giderler",level:1})).toBeVisible();
  // Months outside the package say which months it covers.
  await page.getByRole("button",{name:"Bu ay",exact:true}).click();
  await page.getByLabel("Dönem",{exact:true}).fill("2025-12");
  await expect(page.getByText("Veri paketi 01.08.2025 – 20.10.2025 arasını kapsıyor. Bu aralıktan bir ay seçin.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Son aya git (Ekim 2025)",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Ekim 2025",level:1})).toBeVisible();
  await page.getByLabel("Dönem",{exact:true}).fill("2025-08");
  await expect(page.getByRole("heading",{name:"Ağustos 2025",level:1})).toBeVisible();
  await expect(figure(page,"Satış")).not.toContainText("önceki aya göre");
  // The remembered month survives a restart and Bu ay opens directly.
  await app.close();app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});page=await app.firstWindow();
  await expect(page.getByRole("heading",{name:"Ağustos 2025",level:1})).toBeVisible();
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});
