import {test,expect,_electron as electron,type Page} from "@playwright/test";
import {mkdtemp,rm,writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {executablePath} from "../helpers/desktop-executable";
import {openWorkspace,monthLabel,setMonth} from "../helpers/desktop-navigation";
import {monthProfitPackage} from "../helpers/month-profit-fixture";

const hero=(page:Page)=>page.getByRole("region",{name:"Ayın özeti"});
const netCard=(page:Page)=>page.getByRole("region",{name:/[Nn]et kâr$/});
const attention=(page:Page)=>page.getByRole("list",{name:"Dikkat edilecekler"}).getByRole("button");

test("Bu ay opens at launch with three tabs, and an imported estimate package answers the month in one screen",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"bu-ay-")),file=join(userData,"month.json");await writeFile(file,monthProfitPackage());
 let app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  let page=await app.firstWindow();await openWorkspace(page);
  const nav=page.getByRole("navigation",{name:"Ana gezinme"});
  await expect(nav.getByRole("button")).toHaveText(["Bu ay","Ürünler","Giderler"]);
  await expect(nav.getByRole("button",{name:"Bu ay",exact:true})).toHaveAttribute("aria-current","page");
  await expect(page.getByRole("button",{name:"Ayarlar",exact:true})).toBeVisible();
  await expect(page.getByRole("button",{name:"Rapor ve Excel"})).toHaveCount(0);
  // No estimate package yet: one sentence and the way to import one.
  await expect(page.getByRole("heading",{name:"Kâr tahmini için veri paketi gerekiyor",exact:true})).toBeVisible();
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);
  await page.getByRole("button",{name:"Veri paketi içe aktar",exact:true}).click();
  // First use selects the latest month in the package.
  await expect(page.getByRole("heading",{name:"Ekim 2025",level:1})).toBeVisible();
  await expect(monthLabel(page)).toHaveText("Ekim 2025");
  await expect(monthLabel(page)).toHaveAttribute("data-month","2025-10");
  await expect(hero(page).getByText("Ekim'de 480 ₺ satış yaptınız. Tahmini brüt kâr",{exact:true})).toBeVisible();
  await expect(hero(page).locator(".hero-num")).toHaveText("57,50 ₺");
  await expect(hero(page)).toContainText("Önceki ayla karşılaştırılamıyor");
  await expect(hero(page).getByText("Maliyeti bilinen her 100 ₺'lik satıştan 13 ₺ kâr kaldı.",{exact:true})).toBeVisible();
  // One trust chip per page, and the bridge behind "Nasıl hesaplandı?".
  await expect(page.getByRole("button",{name:"Tahmini",exact:true})).toHaveCount(1);
  await page.getByRole("button",{name:"Tahmini",exact:true}).click();
  await expect(page.getByRole("dialog",{name:"Tahmini hakkında"})).toContainText("Son alış fiyatıyla tahmin");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog",{name:"Tahmini hakkında"})).toBeHidden();
  await page.getByRole("button",{name:"Nasıl hesaplandı?",exact:true}).click();
  await expect(page.getByRole("list",{name:"Satıştan net kâra köprü"}).locator('li[data-state="unknown"]')).toHaveCount(3);
  await page.keyboard.press("Escape");
  // Net card: the month is not complete, so it says so and offers no expense step.
  await expect(netCard(page)).toContainText("Ay henüz tamamlanmadı (20.10.2025 tarihine kadar veri)");
  await expect(netCard(page).getByRole("button")).toHaveCount(0);
  // Attention: one row per product, at most four, then one aggregate missing-cost row.
  await expect(attention(page)).toHaveText([
   "EkmekZarar ediyorBrüt zarar 4,00 ₺",
   "SütMarjı düştüMarj %31,50 → %30,00",
   "ŞekerMarjı düştüMarj %40,00 → %20,00",
   "ÇayÇok satıyor ama marjı düşükSatış 200,00 ₺ · marj %5,00",
   "1 ürünün alış fiyatı yokSatışları kâra katılmadı; sıfır sayılmadı",
  ]);
  // Six-month bars from the history: three months here, the current one highlighted.
  const bars=page.getByRole("img",{name:"Son 6 ayın brüt kârı"});
  await expect(bars.locator("g[data-month]")).toHaveCount(3);
  await expect(bars.locator("g[data-month='2025-10'] .bar")).toHaveClass(/is-current/);
  await attention(page).first().click();
  await expect(nav.getByRole("button",{name:"Ürünler",exact:true})).toHaveAttribute("aria-current","page");
  await expect(page.getByRole("dialog",{name:"Ekmek"})).toBeVisible();
  // The aggregate row opens Ürünler filtered to the products without a purchase price.
  await page.getByRole("button",{name:"Bu ay",exact:true}).click();
  await attention(page).last().click();
  await expect(page.getByRole("button",{name:/^Alış fiyatı yok/})).toHaveAttribute("aria-pressed","true");
  await expect(page.locator(".products-table tbody tr")).toHaveCount(1);
  // A full month without expenses: net profit names the missing step and leads to Giderler.
  await page.getByRole("button",{name:"Bu ay",exact:true}).click();
  await setMonth(page,"2025-09");
  await expect(page.getByRole("heading",{name:"Eylül 2025",level:1})).toBeVisible();
  await expect(netCard(page)).toContainText("Bu ayın giderleri girilmedi");
  await netCard(page).getByRole("button",{name:"Giderleri gir",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Giderler",level:1})).toBeVisible();
  // The stepper stops at the data range: the package covers 01.08.2025 – 20.10.2025.
  const stepper=page.getByRole("group",{name:"Dönem",exact:true});
  await page.getByRole("button",{name:"Bu ay",exact:true}).click();
  await setMonth(page,"2025-10");
  await expect(stepper.getByRole("button",{name:"Sonraki ay",exact:true})).toHaveAttribute("aria-disabled","true");
  await stepper.getByRole("button",{name:"Sonraki ay",exact:true}).click({force:true});
  await expect(monthLabel(page)).toHaveAttribute("data-month","2025-10");
  await setMonth(page,"2025-08");
  await expect(stepper.getByRole("button",{name:"Önceki ay",exact:true})).toHaveAttribute("aria-disabled","true");
  await expect(page.getByRole("heading",{name:"Ağustos 2025",level:1})).toBeVisible();
  await expect(hero(page)).not.toContainText("göre");
  // The remembered month survives a restart and Bu ay opens directly.
  await app.close();app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});page=await app.firstWindow();
  await expect(page.getByRole("heading",{name:"Ağustos 2025",level:1})).toBeVisible();
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});

test("a remembered month outside the package says which months it covers and leads back",async()=>{
 const userData=await mkdtemp(join(tmpdir(),"bu-ay-range-")),file=join(userData,"month.json");await writeFile(file,monthProfitPackage());
 let app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 try{
  let page=await app.firstWindow();await openWorkspace(page);
  await app.evaluate(({dialog},path)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]});},file);
  await page.getByRole("button",{name:"Veri paketi içe aktar",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Ekim 2025",level:1})).toBeVisible();
  await page.evaluate(()=>window.esmer.setPreferences({selectedMonth:"2025-12"}));
  await app.close();app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});page=await app.firstWindow();
  await expect(page.getByText("Veri paketi 01.08.2025 – 20.10.2025 arasını kapsıyor. Bu aralıktan bir ay seçin.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Son aya git (Ekim 2025)",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Ekim 2025",level:1})).toBeVisible();
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});
