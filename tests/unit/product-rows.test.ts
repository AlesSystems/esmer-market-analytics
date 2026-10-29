import {expect,test} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {createElement} from "react";
import {readRawPackage} from "../../src/source/raw-package";
import {buildMonthProfit,type MonthProfitProduct} from "../../src/source/month-profit";
import {monthProfitPackage} from "../helpers/month-profit-fixture";
import {filterCounts,matchesSearch,quickFilters,searchIndex,visibleProducts,defaultSort} from "../../src/ui/products/product-rows";
import {ProductDrawer} from "../../src/ui/products/ProductDrawer";

const r=buildMonthProfit(readRawPackage(monthProfitPackage())!,"c".repeat(64),"2025-10",{app:[],history:[]});
if(r.status!=="month-profit")throw Error("fixture");
const products=r.view.products;
const unnamed=(id:string):MonthProfitProduct=>({...products[0],id,name:null});

test("search matches the displayed fallback name, with and without the index",()=>{
 const rows=[unnamed("12"),unnamed("30"),...products];
 const index=searchIndex(rows);
 expect(rows.filter(p=>matchesSearch(p,"ürün #12",index)).map(p=>p.id)).toEqual(["12"]);
 expect(matchesSearch(unnamed("12"),"Ürün #1")).toBe(true);
 expect(visibleProducts(rows,{query:"ürün #",filter:"all",sort:defaultSort},index).map(p=>p.id).sort()).toEqual(["12","30"]);
});

const ids=(filter:"all"|"attention"|"missingCost")=>visibleProducts(products,{query:"",filter,sort:defaultSort}).map(p=>p.id);

test("the ledger filters are Tümü, Zarar · marj düştü and Alış fiyatı yok, decided on the service flags",()=>{
 expect(quickFilters).toEqual([["all","Tümü"],["attention","Zarar · marj düştü"],["missingCost","Alış fiyatı yok"]]);
 expect(ids("all")).toEqual(["1","4","5","7","3","2"]);
 expect(ids("attention")).toEqual(["1","5","3"]);
 expect(ids("missingCost")).toEqual(["2"]);
 expect(filterCounts(products)).toEqual({all:6,attention:3,missingCost:1});
});

test("the default order is profit, highest first, with unknown profit last",()=>{
 expect(defaultSort).toEqual({key:"grossProfit",direction:"descending"});
 expect(visibleProducts(products,{query:"",filter:"all",sort:{key:"grossProfit",direction:"ascending"}}).map(p=>p.id)).toEqual(["3","7","5","4","1","2"]);
});

const render=(p:MonthProfitProduct)=>renderToStaticMarkup(createElement(ProductDrawer,{product:p,month:"2025-10",onSource:()=>{},onClose:()=>{}}));

test("the drawer shows the sold quantity with its unit and the three facts with their literal figures",()=>{
 const html=render(products.find(x=>x.id==="1")!);
 expect(html).toContain("Ekim&#x27;de 15 adet satıldı.");
 expect(html).toMatch(/<dt>Satış fiyatı<\/dt><dd>10,00 ₺<\/dd><dd class="per">adet başına<\/dd>/);
 expect(html).toMatch(/<dt>Alış maliyeti<\/dt><dd>7,00 ₺<\/dd>/);
 expect(html).toMatch(/<dt>Marj<\/dt><dd[^>]*>%30,00<\/dd><dd class="per">Eylül&#x27;e göre −1,50 puan<\/dd>/);
 expect(html).toContain("Son 6 ay marj");
});

test("a known gross profit with an uncalculable margin says so instead of claiming unknown cost",()=>{
 const p={...products.find(x=>x.id==="1")!,marginPct:null,flags:{loss:false,lowMargin10:false,marginDrop:false,missingCost:false}};
 const html=render(p);
 expect(html).toContain("Marj hesaplanamadı");
 expect(html).not.toContain("alış fiyatı kayıtlı değil");
});

test("a loss says it was sold at a loss and the minus sign comes from percentText",()=>{
 const html=render(products.find(x=>x.id==="3")!);
 expect(html).toContain("Bu ay zararına satıldı: alış fiyatı satış fiyatını geçti.");
 expect(html).toContain("-%10,00");
});

test("an unknown cost is never drawn as zero: no chart, a plain note, bilinmiyor",()=>{
 const html=render(products.find(x=>x.id==="2")!);
 expect(html).toContain("Bu ürünün alış fiyatı kayıtlı değil, bu yüzden marjı bilinmiyor. Satışı kâra katılmadı; sıfır sayılmadı.");
 expect(html).not.toContain("<svg class=\"margin-line\"");
 expect(html).not.toMatch(/(?<![\d.,])0,00 ₺/);
});
