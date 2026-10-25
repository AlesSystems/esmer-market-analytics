import {test,expect,_electron as electron,type ElectronApplication,type Page} from "@playwright/test";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {openStore} from "../../src/store/store";
import {executablePath} from "../helpers/desktop-executable";
import {openSection,openWorkspace} from "../helpers/desktop-navigation";
import {monthProfitPackage} from "../helpers/month-profit-fixture";

// Synthetic month-profit fixture, October 2025 (hand-computed in tests/unit/month-profit.test.ts):
// 1 Süt 150/105/45 %30 (−1,50 puan) · 4 Çay 200/190/10 %5 (−1,40) · 5 Şeker 30/24/6 %20 (−20,00)
// 7 Tuz 10/9,5/0,5 %5 (—) · 3 Ekmek 40/44/−4 %−10 (—) · 2 Peynir 50/—/— (maliyeti eksik).
const order=(page:Page)=>page.locator(".products-table tbody tr").evaluateAll(rows=>rows.map(row=>row.getAttribute("data-product")));
const header=(page:Page,name:string)=>page.locator(".products-table thead th").filter({has:page.getByRole("button",{name,exact:true})});
const filters=(page:Page)=>page.getByRole("group",{name:"Hızlı süzgeçler"});
const card=(page:Page)=>page.getByRole("region",{name:"Ürün kartı"});
const fact=(page:Page,name:string)=>card(page).locator("dl > div").filter({has:page.locator("dt",{hasText:new RegExp(`^${name}$`)})}).locator("dd");

async function launch():Promise<{app:ElectronApplication;page:Page;userData:string}> {
 const userData=await mkdtemp(join(tmpdir(),"urunler-"));
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importSourcePreview(monthProfitPackage());}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 const page=await app.firstWindow();await openWorkspace(page);
 await expect(page.getByRole("heading",{name:"Ekim 2025",level:1})).toBeVisible();
 return {app,page,userData};
}

test("Ürünler sorts every column with nulls last, filters from service flags and searches by name or ID",async()=>{
 const {app,page,userData}=await launch();
 try{
  await openSection(page,"Ürünler");
  await expect(page.getByRole("heading",{name:"Ürünler",level:1})).toBeVisible();
  await expect(page.locator(".viz-estimate")).toHaveCount(1);
  await expect(page.locator(".products-table thead th")).toHaveText(["Ürün","Satış","Maliyet","Kâr","Marj","Önceki aya göre"]);
  // Default: profit, highest first; unknown profit last.
  await expect(header(page,"Kâr")).toHaveAttribute("aria-sort","descending");
  await expect.poll(()=>order(page)).toEqual(["1","4","5","7","3","2"]);
  const row=(id:string)=>page.locator(`.products-table tr[data-product="${id}"]`);
  await expect(row("1").locator("td")).toHaveText(["SütSüt ürünleri","150,00 ₺","105,00 ₺","45,00 ₺","%30,00","−1,50 puan"]);
  await expect(row("2").locator("td")).toHaveText(["PeynirSüt ürünleri","50,00 ₺","Bilinmiyor","Bilinmiyor","Bilinmiyor","Bilinmiyor"].map(text=>text==="Bilinmiyor"?"—Bilinmiyor":text));
  await expect(row("4").locator("td").first()).toHaveText("Çay");
  const sorts:[string,string[],string[]][]=[
   ["Kâr",["3","7","5","4","1","2"],["1","4","5","7","3","2"]],
   ["Ürün",["4","3","2","1","5","7"],["7","5","1","2","3","4"]],
   ["Satış",["4","1","2","3","5","7"],["7","5","3","2","1","4"]],
   ["Maliyet",["4","1","3","5","7","2"],["7","5","3","1","4","2"]],
   ["Marj",["1","5","4","7","3","2"],["3","4","7","5","1","2"]],
   ["Önceki aya göre",["4","1","5","2","3","7"],["5","1","4","2","3","7"]],
  ];
  for(const [name,first,second] of sorts){
   await header(page,name).getByRole("button").click();
   expect(await order(page),`${name} first click`).toEqual(first);
   await header(page,name).getByRole("button").click();
   expect(await order(page),`${name} second click`).toEqual(second);
   await expect(page.locator(".products-table thead th[aria-sort]")).toHaveCount(1);
  }
  await header(page,"Kâr").getByRole("button").click();
  await expect(header(page,"Kâr")).toHaveAttribute("aria-sort","descending");
  // Quick filters: one row of toggle buttons; membership comes from the service flags.
  await expect(filters(page).getByRole("button")).toHaveText(["Tümü","Zarar edenler","Marjı %10’un altında","Marjı düşenler","Maliyeti eksik"]);
  for(const [name,ids] of [["Zarar edenler",["3"]],["Marjı %10’un altında",["4","7","3"]],["Marjı düşenler",["1","5"]],["Maliyeti eksik",["2"]],["Tümü",["1","4","5","7","3","2"]]] as const){
   await filters(page).getByRole("button",{name,exact:true}).click();
   await expect(filters(page).getByRole("button",{name,exact:true})).toHaveAttribute("aria-pressed","true");
   expect(await order(page),name).toEqual(ids);
  }
  const search=page.getByRole("searchbox",{name:"Ürün ara"});
  await search.fill("pey");await expect.poll(()=>order(page)).toEqual(["2"]);
  await search.fill("ŞEKER");await expect.poll(()=>order(page)).toEqual(["5"]);
  await search.fill("7");await expect.poll(()=>order(page)).toEqual(["7"]);
  await search.fill("#3");await expect.poll(()=>order(page)).toEqual(["3"]);
  await search.fill("yok böyle");await expect.poll(()=>order(page)).toEqual([]);
  await expect(page.getByText("Aramaya uyan ürün yok.",{exact:true})).toBeVisible();
  await search.fill("");
  await filters(page).getByRole("button",{name:"Zarar edenler",exact:true}).click();await search.fill("süt");
  await expect(page.getByText("Aramaya uyan ürün yok.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Aramayı ve süzgeci temizle",exact:true}).click();
  await expect.poll(()=>order(page)).toEqual(["1","4","5","7","3","2"]);
  await expect(search).toHaveValue("");
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});

test("the product card shows literal figures, a gap-aware margin line and the missing-cost state; keyboard opens and closes it",async()=>{
 const {app,page,userData}=await launch();
 try{
  await openSection(page,"Ürünler");
  await expect(card(page)).toContainText("Ayrıntı için tablodan bir ürün seçin.");
  await page.locator('.products-table tr[data-product="4"]').getByRole("button",{name:"Çay",exact:true}).click();
  await expect(card(page).getByRole("heading",{name:"Çay",level:2})).toBeFocused();
  await page.locator('.products-table tr[data-product="1"]').click();
  await expect(page.locator('.products-table tr[data-product="1"]')).toHaveAttribute("aria-current","true");
  await expect(card(page).getByRole("heading",{name:"Süt",level:2})).toBeVisible();
  await expect(card(page).locator(".product-card-margin")).toHaveText("%30,00");
  await expect(card(page)).toContainText("Her 100 ₺ satışta 30,00 ₺ brüt kâr. Eylül 2025: %31,50.");
  for(const [name,value] of [["Satış fiyatı","10,00 ₺"],["Birim maliyet","7,00 ₺"],["Birim kâr","3,00 ₺"],["Satılan","15 adet"],["Bu ay kâr","45,00 ₺"],["Toplam kârdaki payı","%78,26 · 1. sıra"]] as const)await expect(fact(page,name),name).toHaveText(value);
  // Only three months are in the package: no zero is drawn for months outside it.
  const line=card(page).getByRole("img",{name:"Süt son altı ay marj"});
  await expect(line.locator("circle")).toHaveCount(3);
  await card(page).getByRole("button",{name:"Tablo",exact:true}).click();
  await expect(card(page).getByRole("region",{name:"Aylara göre marj"}).locator("tbody tr")).toHaveText(["Ağustos 2025%20,00","Eylül 2025%31,50","Ekim 2025%30,00"]);
  // Keyboard: arrows move through rows, Enter opens.
  await page.locator('.products-table tr[data-product="1"]').focus();
  await page.keyboard.press("ArrowDown");await page.keyboard.press("ArrowDown");await page.keyboard.press("ArrowDown");await page.keyboard.press("ArrowDown");await page.keyboard.press("ArrowDown");
  await expect(page.locator('.products-table tr[data-product="2"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(card(page).getByRole("heading",{name:"Peynir",level:2})).toBeFocused();
  await expect(card(page)).toContainText("Bu ürünün maliyeti bilinmiyor; kâr hesaplanamadı.");
  await expect(fact(page,"Satış")).toHaveText("50,00 ₺");
  await expect(card(page).locator(".product-card-margin")).toHaveCount(0);
  await expect(fact(page,"Birim kâr")).toHaveCount(0);
  await page.locator('.products-table tr[data-product="2"]').focus();
  await page.keyboard.press("ArrowUp");
  await expect(page.locator('.products-table tr[data-product="3"]')).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(card(page).getByRole("heading",{name:"Ekmek",level:2})).toBeVisible();
  await expect(card(page)).toContainText("Her 100 ₺ satışta 10,00 ₺ zarar.");
  for(const [name,value] of [["Birim kâr","-1,00 ₺"],["Toplam kârdaki payı","-%6,96 · 5. sıra"]] as const)await expect(fact(page,name),name).toHaveText(value);
  // Narrow layout: the card stacks under the table and Escape closes it, returning focus to the row.
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setContentSize(900,760));
  await page.locator('.products-table tr[data-product="3"]').focus();await page.keyboard.press("Enter");
  await expect(card(page)).toBeVisible();
  const [table,box]=await Promise.all([page.locator(".products-table").boundingBox(),card(page).boundingBox()]);
  expect(box!.y).toBeGreaterThan(table!.y+table!.height-1);
  await page.keyboard.press("Escape");
  await expect(card(page)).toBeHidden();
  await expect(page.locator('.products-table tr[data-product="3"]')).toBeFocused();
  // Closing a card whose row a filter has since hidden moves focus to the search box.
  await page.locator('.products-table tr[data-product="3"]').focus();await page.keyboard.press("Enter");
  await page.getByRole("searchbox",{name:"Ürün ara"}).fill("süt");
  await card(page).getByRole("button",{name:"Kartı kapat",exact:true}).click();
  await expect(page.getByRole("searchbox",{name:"Ürün ara"})).toBeFocused();
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});

test("Bu ay attention opens the product card; Kaynak satırlar and back keep search, filter, sort, scroll and focus",async()=>{
 const {app,page,userData}=await launch();
 try{
  await page.getByRole("list",{name:"Dikkat edilecek ürünler"}).getByRole("button").nth(2).click();
  await expect(page.getByRole("heading",{name:"Ürünler",level:1})).toBeVisible();
  await expect(page.locator('.products-table tr[data-product="5"]')).toHaveAttribute("aria-current","true");
  await expect(page.locator('.products-table tr[data-product="5"]')).toBeFocused();
  await expect(card(page).getByRole("heading",{name:"Şeker",level:2})).toBeVisible();
  await expect(fact(page,"Toplam kârdaki payı")).toHaveText("%10,43 · 3. sıra");
  // A product without sales in the selected month: a short notice, no card figures.
  await page.getByLabel("Dönem",{exact:true}).fill("2025-08");
  await expect(page.getByText("Şeker bu ay satılmadı.",{exact:true})).toBeVisible();
  await page.getByLabel("Dönem",{exact:true}).fill("2025-10");
  await expect(card(page).getByRole("heading",{name:"Şeker",level:2})).toBeVisible();
  // Set up state worth keeping, in a short window so the page scrolls.
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setContentSize(1440,520));
  await filters(page).getByRole("button",{name:"Marjı düşenler",exact:true}).click();
  await page.getByRole("searchbox",{name:"Ürün ara"}).fill("e");
  await header(page,"Satış").getByRole("button").click();
  await expect.poll(()=>order(page)).toEqual(["5"]);
  await page.getByRole("searchbox",{name:"Ürün ara"}).fill("");
  await expect.poll(()=>order(page)).toEqual(["1","5"]);
  await page.locator('.products-table tr[data-product="1"]').click();
  const open=card(page).getByRole("button",{name:"Kaynak satırlar",exact:true});
  await open.scrollIntoViewIfNeeded();
  const scrollY=await page.evaluate(()=>window.scrollY);
  expect(scrollY).toBeGreaterThan(0);
  await open.click();
  await expect(page.getByRole("heading",{name:"Süt · kaynak satırlar · Ekim 2025",level:2})).toBeVisible();
  await expect(page.locator(".products-table")).toBeHidden();
  const docs=page.getByRole("table",{name:"Bu ürünün geçtiği satış belgeleri"});
  await expect(docs.getByRole("columnheader",{name:"Belge toplamı (KDV dahil)"})).toBeVisible();
  await expect(docs.locator("tbody tr")).toHaveCount(2);
  await docs.getByRole("button",{name:"101",exact:true}).click();
  await expect(page.getByRole("heading",{name:"Kaynak belge 101"})).toBeVisible();
  await page.getByRole("button",{name:"Belgelere dön",exact:true}).click();
  await expect(docs.getByRole("button",{name:"101",exact:true})).toBeFocused();
  await page.getByRole("button",{name:"Ürünlere dön",exact:true}).click();
  await expect(page.locator(".products-table")).toBeVisible();
  await expect(filters(page).getByRole("button",{name:"Marjı düşenler",exact:true})).toHaveAttribute("aria-pressed","true");
  await expect(header(page,"Satış")).toHaveAttribute("aria-sort","descending");
  await expect.poll(()=>order(page)).toEqual(["1","5"]);
  await expect(card(page).getByRole("button",{name:"Kaynak satırlar",exact:true})).toBeFocused();
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(scrollY);
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});
