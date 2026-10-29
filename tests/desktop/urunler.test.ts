import {test,expect,_electron as electron,type ElectronApplication,type Page} from "@playwright/test";
import {mkdtemp,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {openStore} from "../../src/store/store";
import {executablePath} from "../helpers/desktop-executable";
import {monthLabel,openSection,openWorkspace,setMonth} from "../helpers/desktop-navigation";
import {monthProfitPackage} from "../helpers/month-profit-fixture";

// Synthetic month-profit fixture, October 2025 (hand-computed in tests/unit/month-profit.test.ts):
// 1 Süt 150/105/45 %30 (−1,50 puan) · 4 Çay 200/190/10 %5 (−1,40) · 5 Şeker 30/24/6 %20 (−20,00)
// 7 Tuz 10/9,5/0,5 %5 (—) · 3 Ekmek 40/44/−4 %−10 (—) · 2 Peynir 50/—/— (maliyeti eksik).
const order=(page:Page)=>page.locator(".products-table tbody tr[data-product]").evaluateAll(rows=>rows.map(row=>row.getAttribute("data-product")));
const header=(page:Page,name:string)=>page.locator(".products-table thead th").filter({has:page.getByRole("button",{name,exact:true})});
const filters=(page:Page)=>page.getByRole("group",{name:"Süzgeç"});
const rowButton=(page:Page,id:string)=>page.locator(`.products-table tr[data-product="${id}"] button`);
const drawer=(page:Page,name?:string)=>page.getByRole("dialog",name?{name}:undefined);
const fact=(page:Page,name:string)=>drawer(page).locator("dl > div").filter({has:page.locator("dt",{hasText:new RegExp(`^${name}$`)})}).locator("dd").first();

async function launch():Promise<{app:ElectronApplication;page:Page;userData:string}> {
 const userData=await mkdtemp(join(tmpdir(),"urunler-"));
 const store=openStore(join(userData,"analytics.sqlite"));try{store.importSourcePreview(monthProfitPackage());}finally{store.close();}
 const app=await electron.launch({executablePath,args:[`--user-data-dir=${userData}`]});
 const page=await app.firstWindow();await openWorkspace(page);
 await expect(page.getByRole("heading",{name:"Ekim 2025",level:1})).toBeVisible();
 return {app,page,userData};
}

test("the ledger sorts its four columns with unknown last, filters from the service flags and searches by name or ID",async()=>{
 const {app,page,userData}=await launch();
 try{
  await openSection(page,"Ürünler");
  await expect(page.getByRole("heading",{name:"Ürünler",level:1})).toBeVisible();
  await expect(page.getByRole("button",{name:"Tahmini",exact:true})).toHaveCount(1);
  await expect(page.getByText("6 ürün",{exact:true})).toBeVisible();
  await expect(filters(page).getByRole("button")).toHaveText(["Tümü6","Zarar · marj düştü3","Alış fiyatı yok1"]);
  // Default: profit, highest first; unknown profit last.
  await expect(header(page,"Kâr")).toHaveAttribute("aria-sort","descending");
  await expect.poll(()=>order(page)).toEqual(["1","4","5","7","3","2"]);
  const row=(id:string)=>page.locator(`.products-table tr[data-product="${id}"]`);
  await expect(row("1").locator("td")).toHaveText(["1","Süt marj düştü","150,00 ₺","45,00 ₺","%30,00",""]);
  await expect(row("3").locator("td")).toHaveText(["5","Ekmek zarar","40,00 ₺","-4,00 ₺","-%10,00",""]);
  await expect(row("2").locator("td")).toHaveText(["6","Peynir","50,00 ₺","bilinmiyor",""]);
  const sorts:[string,string[],string[]][]=[
   ["Kâr",["3","7","5","4","1","2"],["1","4","5","7","3","2"]],
   ["Ürün",["4","3","2","1","5","7"],["7","5","1","2","3","4"]],
   ["Satış",["4","1","2","3","5","7"],["7","5","3","2","1","4"]],
   ["Marj",["1","5","4","7","3","2"],["3","4","7","5","1","2"]],
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
  for(const [name,ids] of [["Zarar · marj düştü",["1","5","3"]],["Alış fiyatı yok",["2"]],["Tümü",["1","4","5","7","3","2"]]] as const){
   await filters(page).getByRole("button",{name:new RegExp(`^${name}`)}).click();
   await expect(filters(page).getByRole("button",{name:new RegExp(`^${name}`)})).toHaveAttribute("aria-pressed","true");
   expect(await order(page),name).toEqual(ids);
  }
  const search=page.getByRole("searchbox",{name:"Ürün ara"});
  await search.fill("pey");await expect.poll(()=>order(page)).toEqual(["2"]);
  await expect(page.getByText("1 ürün",{exact:true})).toBeVisible();
  await search.fill("ŞEKER");await expect.poll(()=>order(page)).toEqual(["5"]);
  await search.fill("7");await expect.poll(()=>order(page)).toEqual(["7"]);
  await search.fill("#3");await expect.poll(()=>order(page)).toEqual(["3"]);
  await search.fill("yok böyle");await expect.poll(()=>order(page)).toEqual([]);
  await expect(page.getByText("Aramaya uyan ürün yok.",{exact:true})).toBeVisible();
  await search.fill("");
  await filters(page).getByRole("button",{name:/^Zarar · marj düştü/}).click();await search.fill("çay");
  await expect(page.getByText("Aramaya uyan ürün yok.",{exact:true})).toBeVisible();
  await page.getByRole("button",{name:"Aramayı ve süzgeci temizle",exact:true}).click();
  await expect.poll(()=>order(page)).toEqual(["1","4","5","7","3","2"]);
  await expect(search).toHaveValue("");
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});

test("the drawer shows literal figures and a gap-aware margin line, pushes the table aside, and keyboard walks, opens and closes it",async()=>{
 const {app,page,userData}=await launch();
 try{
  await openSection(page,"Ürünler");
  await expect(drawer(page)).toHaveCount(0);
  // Only the focus stop of the ledger is in the tab order.
  await expect(page.locator(".products-table tbody button[tabindex='0']")).toHaveCount(1);
  await rowButton(page,"1").click();
  await expect(drawer(page,"Süt")).toBeVisible();
  await expect(drawer(page,"Süt")).toHaveAttribute("aria-modal","false");
  await expect(rowButton(page,"1")).toHaveAttribute("aria-pressed","true");
  await expect(drawer(page).getByText("Süt ürünleri",{exact:true})).toBeVisible();
  await expect(drawer(page).getByText("Ekim'de 15 adet satıldı.",{exact:true})).toBeVisible();
  for(const [name,value] of [["Satış fiyatı","10,00 ₺"],["Alış maliyeti","7,00 ₺"],["Marj","%30,00"]] as const)await expect(fact(page,name),name).toHaveText(value);
  await expect(drawer(page).getByText("Eylül'e göre −1,50 puan",{exact:true})).toBeVisible();
  // Only three months are in the package: no zero is drawn for months outside it.
  await expect(drawer(page).getByRole("img",{name:"Süt son altı ay marj"}).locator("circle")).toHaveCount(3);
  // The drawer pushes the table aside instead of covering it.
  const [table,box]=await Promise.all([page.locator(".products-table").boundingBox(),drawer(page).boundingBox()]);
  expect(table!.x+table!.width).toBeLessThanOrEqual(box!.x+1);
  // Arrow keys walk the products while the drawer is open; Home and End jump.
  await page.keyboard.press("ArrowDown");
  await expect(rowButton(page,"4")).toBeFocused();
  await expect(drawer(page,"Çay")).toBeVisible();
  await page.keyboard.press("End");
  await expect(rowButton(page,"2")).toBeFocused();
  await expect(drawer(page,"Peynir")).toBeVisible();
  await expect(drawer(page)).toContainText("Bu ürünün alış fiyatı kayıtlı değil, bu yüzden marjı bilinmiyor. Satışı kâra katılmadı; sıfır sayılmadı.");
  await expect(fact(page,"Marj")).toHaveText("bilinmiyor");
  await expect(drawer(page).getByRole("img")).toHaveCount(0);
  await page.keyboard.press("ArrowUp");
  await expect(rowButton(page,"3")).toBeFocused();
  await expect(drawer(page,"Ekmek")).toContainText("Bu ay zararına satıldı: alış fiyatı satış fiyatını geçti.");
  await expect(fact(page,"Marj")).toHaveText("-%10,00");
  await page.keyboard.press("Home");
  await expect(rowButton(page,"1")).toBeFocused();
  // Escape closes the drawer and keeps focus on the row.
  await page.keyboard.press("Escape");
  await expect(drawer(page)).toHaveCount(0);
  await expect(rowButton(page,"1")).toBeFocused();
  await expect(rowButton(page,"1")).toHaveAttribute("aria-pressed","false");
  // Arrow keys only move focus while it is closed; Enter opens.
  await page.keyboard.press("ArrowDown");
  await expect(rowButton(page,"4")).toBeFocused();
  await expect(drawer(page)).toHaveCount(0);
  await page.keyboard.press("Enter");
  await expect(drawer(page,"Çay")).toBeVisible();
  // Closing a drawer whose row a search has hidden moves focus to the search box.
  await page.getByRole("searchbox",{name:"Ürün ara"}).fill("süt");
  await drawer(page).getByRole("button",{name:"Ayrıntıyı kapat",exact:true}).click();
  await expect(page.getByRole("searchbox",{name:"Ürün ara"})).toBeFocused();
  // Below 1360px the margin bar column steps aside so the drawer does not clip the table.
  await page.getByRole("searchbox",{name:"Ürün ara"}).fill("");
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setContentSize(1200,760));
  await rowButton(page,"1").click();
  await expect(page.locator(".products-table td.bar-cell").first()).toBeHidden();
  const wrap=await page.locator(".tbl-wrap").evaluate(node=>node.scrollWidth<=node.clientWidth);
  expect(wrap).toBe(true);
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});

test("Bu ay attention opens the drawer; a product without sales in the month says so; Kaynak satırlar and back keep search, filter, sort and focus",async()=>{
 const {app,page,userData}=await launch();
 try{
  await page.getByRole("list",{name:"Dikkat edilecekler"}).getByRole("button").nth(2).click();
  await expect(page.getByRole("heading",{name:"Ürünler",level:1})).toBeVisible();
  await expect(drawer(page,"Şeker")).toBeVisible();
  await expect(rowButton(page,"5")).toBeFocused();
  // The aggregate missing-cost row opens the ledger filtered to products without a purchase price.
  await openSection(page,"Bu ay");
  await page.getByRole("list",{name:"Dikkat edilecekler"}).getByRole("button").last().click();
  await expect(filters(page).getByRole("button",{name:/^Alış fiyatı yok/})).toHaveAttribute("aria-pressed","true");
  expect(await order(page)).toEqual(["2"]);
  await filters(page).getByRole("button",{name:/^Tümü/}).click();
  // A product without sales in the selected month: a short notice, no figures.
  await rowButton(page,"5").click();
  await setMonth(page,"2025-08");
  await expect(page.getByText("Şeker bu ay satılmadı.",{exact:true})).toBeVisible();
  await setMonth(page,"2025-10");
  await expect(drawer(page,"Şeker")).toBeVisible();
  // State worth keeping, then Kaynak satırlar and back.
  await filters(page).getByRole("button",{name:/^Zarar · marj düştü/}).click();
  await header(page,"Satış").getByRole("button").click();
  await expect.poll(()=>order(page)).toEqual(["1","3","5"]);
  await rowButton(page,"1").click();
  const open=drawer(page,"Süt").getByRole("button",{name:"Kaynak satırlar",exact:true});
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
  await expect(filters(page).getByRole("button",{name:/^Zarar · marj düştü/})).toHaveAttribute("aria-pressed","true");
  await expect(header(page,"Satış")).toHaveAttribute("aria-sort","descending");
  await expect(drawer(page,"Süt").getByRole("button",{name:"Kaynak satırlar",exact:true})).toBeFocused();
  await expect(monthLabel(page)).toHaveAttribute("data-month","2025-10");
 }finally{await app.close().catch(()=>{});await rm(userData,{recursive:true,force:true});}
});
