import {expect,test} from "vitest";
import {createHash} from "node:crypto";
import {canonical,MAX_ROWS} from "../../src/source/package";
import {rawColumns,readRawPackage,writeRawEstimatePackage,writeRawPackage} from "../../src/source/raw-package";
import type {SqlSnapshot} from "../../src/source/sql-server";
import {namedSnapshot,rawSnapshot} from "../helpers/raw-fixture";
import {estimateSnapshot} from "../helpers/estimate-fixture";
type Snap=SqlSnapshot&{products?:Record<string,unknown>[]};
const rehash=(value:{lineage:string;extractionId:string;snapshot:unknown;sha256:string})=>{value.sha256=createHash("sha256").update(canonical({lineage:value.lineage,extractionId:value.extractionId,snapshot:value.snapshot})).digest("hex");return Buffer.from(canonical(value));};
const mutated=(bytes:Buffer,mutate:(s:Snap)=>void)=>{const value=JSON.parse(bytes.toString());mutate(value.snapshot);return rehash(value);};
const rejections:[string,(s:Snap)=>void][]=[
 ["extra CARI column",s=>{s.products![0].CARI="x";}],["extra SUPPLIER column",s=>{s.products![0].SUPPLIER="x";}],["extra CUSTOMER column",s=>{s.products![0].CUSTOMER="x";}],
 ["missing UNIT column",s=>{delete s.products![0].UNIT;}],["untrimmed NAME",s=>{s.products![0].NAME=" Süt";}],["empty NAME",s=>{s.products![0].NAME="";}],
 ["161 char NAME",s=>{s.products![0].NAME="a".repeat(161);}],["control char NAME",s=>{s.products![0].NAME="Süt\u0007";}],["control char CATEGORY",s=>{s.products![0].CATEGORY="a\u007fb";}],
 ["UNIT litre",s=>{s.products![0].UNIT="litre";}],["bad ID",s=>{s.products![0].ID="03";}],["duplicate ID",s=>{s.products!.push({...s.products![0]});}],
 ["unreferenced product",s=>{s.products!.push({ID:"999",NAME:"Yok",CATEGORY:null,UNIT:null});}],["products not array",s=>{(s as Record<string,unknown>).products={};}],
];
test("v2 preview and estimate packages round trip product names",()=>{
 const p=readRawPackage(writeRawPackage(namedSnapshot(),"fixture:names","n-1"));expect(p?.schemaVersion).toBe("sql-backup-preview-v2");expect((p?.snapshot as Snap).products).toEqual([{ID:"3",NAME:"Süt 1 L",CATEGORY:"Süt ürünleri",UNIT:"adet"}]);
 const e=readRawPackage(writeRawEstimatePackage(namedSnapshot(estimateSnapshot()),"fixture:names","n-2"));expect(e?.schemaVersion).toBe("sql-backup-estimate-v2");expect((e?.snapshot as Snap).products).toHaveLength(1);
 const u=namedSnapshot() as Snap;u.products![0]={ID:"3",NAME:"a".repeat(160),CATEGORY:null,UNIT:"kg"};expect(readRawPackage(writeRawPackage(u,"fixture:names","n-3"))?.schemaVersion).toBe("sql-backup-preview-v2");
});
test("snapshots without products keep writing and reading v1",()=>{
 const p=readRawPackage(writeRawPackage(rawSnapshot(),"fixture:old","o-1"));expect(p?.schemaVersion).toBe("sql-backup-preview-v1");expect(Object.hasOwn(p!.snapshot,"products")).toBe(false);
 expect(readRawPackage(writeRawEstimatePackage(estimateSnapshot(),"fixture:old","o-2"))?.schemaVersion).toBe("sql-backup-estimate-v1");
});
test.each(rejections)("writer and reader reject %s",(_,mutate)=>{
 const s=namedSnapshot() as Snap;mutate(s);expect(()=>writeRawPackage(s,"fixture:bad","b-1")).toThrow("INVALID_PACKAGE");
 const e=namedSnapshot(estimateSnapshot()) as Snap;mutate(e);expect(()=>writeRawEstimatePackage(e,"fixture:bad","b-2")).toThrow("INVALID_PACKAGE");
 expect(readRawPackage(mutated(writeRawPackage(namedSnapshot(),"fixture:bad","b-3"),mutate))).toBeNull();
});
test("v1 must not carry products and v2 must carry them",()=>{
 expect(readRawPackage(mutated(writeRawPackage(rawSnapshot(),"fixture:v","v-1"),s=>{s.products=[{ID:"3",NAME:null,CATEGORY:null,UNIT:null}];}))).toBeNull();
 expect(readRawPackage(mutated(writeRawEstimatePackage(estimateSnapshot(),"fixture:v","v-2"),s=>{s.products=[];}))).toBeNull();
 expect(readRawPackage(mutated(writeRawPackage(namedSnapshot(),"fixture:v","v-3"),s=>{delete s.products;}))).toBeNull();
});
test("header, line and product rows share the row limit",()=>{
 const s=rawSnapshot(),l=s.lines[0];s.lines=Array.from({length:MAX_ROWS-2},(_,i)=>({...l,ID:String(i+1),STOK:i%2?"4":"3"}));
 const named=namedSnapshot(s);expect(named.headers.length+named.lines.length+(named as Snap).products!.length).toBe(MAX_ROWS+1);
 expect(()=>writeRawPackage(named,"fixture:max","m-1")).toThrow("INVALID_PACKAGE");
});
test("raw column allowlist is exactly pinned",()=>{
 expect(rawColumns.headers).toEqual(["ID","FIS_TURU","DOVIZ_AD","DURUM","AKTIF","SATIR_TOPLAM","SATIR_ISKONTO_TOPLAM","FIS_ISKONTO_TOPLAM","KDV_TOPLAM","OTV_TOPLAM","TEFKIFAT_TOPLAM","GENELTOPLAM","FIS_TARIHI","CURRENCY"]);
 expect(rawColumns.lines).toEqual(["ID","FIS","STOK","FIS_TURU","CARPAN","MIKTAR_FIS","TOPLAM_KDV_MATRAHI","TOPLAM_KDV","TOPLAM_OTV","TOPLAM_TEVKIF"]);
 expect((rawColumns as Record<string,unknown>).products).toEqual(["ID","NAME","CATEGORY","UNIT"]);
 expect(Object.keys(rawColumns).sort()).toEqual(["headers","lines","products"]);
});
