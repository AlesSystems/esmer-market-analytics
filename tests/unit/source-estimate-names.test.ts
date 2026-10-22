import {expect,test} from "vitest";
import {readRawPackage,writeRawEstimatePackage,writeRawPackage} from "../../src/source/raw-package";
import {calculateSourceEstimate,querySourceEstimate} from "../../src/source/estimate";
import type {SqlSnapshot} from "../../src/source/sql-server";
import {estimateSnapshot} from "../helpers/estimate-fixture";
import {namedSnapshot} from "../helpers/raw-fixture";
const hash="a".repeat(64),q={hash,period:"2025-10",view:"summary" as const,offset:0,productId:null};
const twoProducts=()=>{const s=estimateSnapshot();s.lines.push({...s.lines[0],ID:"5",STOK:"4"});return s;};
const v2=(s:SqlSnapshot,products=namedSnapshot(s).products)=>readRawPackage(writeRawEstimatePackage({...s,products} as SqlSnapshot,"fixture:names","n-1"))!;
const strip=(v:unknown):unknown=>JSON.parse(JSON.stringify(v,(k,x)=>["productName","categoryName","unit"].includes(k)?undefined:x));
test("v2 estimate carries name, category and unit on products, ranking and lines",()=>{
 const r=calculateSourceEstimate(v2(twoProducts()),"2025-10",hash),named={productName:"Süt 1 L",categoryName:"Süt ürünleri",unit:"adet"};
 expect(r.products.find(p=>p.productId==="3")).toMatchObject(named);expect(r.products.find(p=>p.productId==="4")).toMatchObject({productName:"Ürün 4",categoryName:null,unit:null});
 expect(r.lines[0]).toMatchObject({productId:"3",...named});
 const res=querySourceEstimate(v2(twoProducts()),hash,q);if(res.status!=="source-estimate")throw Error("missing");
 expect(res.ranking.find(p=>p.productId==="3")).toMatchObject(named);
});
test("products without a catalogue row and v1 packages yield null names",()=>{
 const s=twoProducts(),only=namedSnapshot(s).products!.filter(p=>p.ID==="3");
 const r=calculateSourceEstimate(v2(s,only),"2025-10",hash);const nulls={productName:null,categoryName:null,unit:null};
 expect(r.products.find(p=>p.productId==="4")).toMatchObject(nulls);expect(r.lines.find(l=>l.productId==="4")).toMatchObject(nulls);
 const v1=readRawPackage(writeRawEstimatePackage(twoProducts(),"fixture:old","o-1"))!,old=calculateSourceEstimate(v1,"2025-10",hash);
 for(const row of [...old.products,...old.lines])expect(row).toMatchObject(nulls);
 const res=querySourceEstimate(v1,hash,q);if(res.status!=="source-estimate")throw Error("missing");for(const row of res.ranking)expect(row).toMatchObject(nulls);
});
test("names never change money or counts between v1 and v2",()=>{
 const v1=readRawPackage(writeRawEstimatePackage(twoProducts(),"fixture:names","n-1"))!,named=v2(twoProducts());
 expect(strip(calculateSourceEstimate(named,"2025-10",hash))).toEqual(strip(calculateSourceEstimate(v1,"2025-10",hash)));
 for(const view of ["summary","products","evidence"] as const)expect(strip(querySourceEstimate(named,hash,{...q,view}))).toEqual(strip(querySourceEstimate(v1,hash,{...q,view})));
});
test("preview v2 without cost stays estimate unavailable",()=>{
 const p=readRawPackage(writeRawPackage(namedSnapshot(),"fixture:names","p-1"))!;expect(p.schemaVersion).toBe("sql-backup-preview-v2");
 expect(querySourceEstimate(p,hash,q)).toMatchObject({status:"source-unavailable",code:"ESTIMATE_UNAVAILABLE"});
});
