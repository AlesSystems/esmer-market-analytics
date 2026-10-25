import {expect,test} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {createElement} from "react";
import {readRawPackage} from "../../src/source/raw-package";
import {buildMonthProfit,type MonthProfitProduct} from "../../src/source/month-profit";
import {monthProfitPackage} from "../helpers/month-profit-fixture";
import {matchesSearch,searchIndex,visibleProducts,defaultSort} from "../../src/ui/products/product-rows";
import {ProductCard} from "../../src/ui/products/ProductCard";

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

const render=(p:MonthProfitProduct)=>renderToStaticMarkup(createElement(ProductCard,{product:p,month:"2025-10",onSource:()=>{},onClose:()=>{}}));

test("a known gross profit with an uncalculable margin says so instead of claiming unknown cost",()=>{
 const p={...products.find(x=>x.id==="1")!,marginPct:null,flags:{loss:false,lowMargin10:false,marginDrop:false,missingCost:false}};
 const html=render(p);
 expect(html).toContain("Marj hesaplanamadı");
 expect(html).not.toContain("maliyeti bilinmiyor");
});

test("loss wording follows the loss flag and the minus sign comes from percentText",()=>{
 const html=render(products.find(x=>x.id==="3")!);
 expect(html).toContain("zarar");
 expect(html).toContain("-%10,00");
});
