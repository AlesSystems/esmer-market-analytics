import {expect,test} from "vitest";
import {createHash} from "node:crypto";
import {openStore} from "../../src/store/store";
import {canonical} from "../../src/source/package";
import {readRawPackage,writeRawPackage} from "../../src/source/raw-package";
import {excelSourceEstimate} from "../../src/source/estimate-export";
import {estimateSnapshot,estimatePackage} from "../helpers/estimate-fixture";
import {rawSnapshot} from "../helpers/raw-fixture";
import {sourcePackage} from "../helpers/store-fixtures";
import {SalesReports} from "../../src/reports/query";
import {handleRequest} from "../../src/desktop/requests";
import {readSheet} from "read-excel-file/node";
const digest=(bytes:Uint8Array)=>createHash("sha256").update(bytes).digest("hex");
test("new explicit schema rejects wrong columns, digest and nondecimals while keeping old preview",()=>{
 const bytes=estimatePackage();expect(readRawPackage(bytes)?.schemaVersion).toBe("sql-backup-estimate-v1");expect(readRawPackage(writeRawPackage(rawSnapshot(),"fixture:old","a"))?.schemaVersion).toBe("sql-backup-preview-v1");
 for(const mutate of [(v:Record<string,unknown>)=>{v.schemaVersion="sql-backup-preview-v1";},(v:Record<string,unknown>)=>{v.sha256="0".repeat(64);},(v:Record<string,unknown>)=>{const s=v.snapshot as ReturnType<typeof estimateSnapshot>;s.lines[0].CUSTOMER="private";},(v:Record<string,unknown>)=>{const s=v.snapshot as ReturnType<typeof estimateSnapshot>;delete s.lines[0].BELGE_TARIHINDEKI_SON_ALIS_FIYATI;}]){const value=JSON.parse(bytes.toString());mutate(value);expect(readRawPackage(Buffer.from(canonical(value)))).toBeNull();}
});
test("atomic estimate replacement leaves financial pins and rejects stale/corrupt/cancelled input",()=>{
 const store=openStore(":memory:");try{
  store.importPackage(sourcePackage("a"));const before=store.readSnapshot(),bytes=estimatePackage(),hash=digest(bytes),request={hash,period:"2025-10",view:"products" as const,offset:0,productId:null};
  store.importSourcePreview(bytes);expect(store.readSnapshot()).toEqual(before);const expected=store.querySourceEstimate(request);expect(expected.status).toBe("source-estimate");
  expect(store.importSourcePreview(Buffer.from("{}"))).toMatchObject({status:"failed"});expect(store.querySourceEstimate(request)).toEqual(expected);
  let checks=0;expect(store.importSourcePreview(estimatePackage(undefined,"replacement"),{checkCancelled(){if(++checks===3)throw Error("CANCELLED");}})).toEqual({status:"cancelled"});expect(store.querySourceEstimate(request)).toEqual(expected);
  store.importSourcePreview(estimatePackage(undefined,"replacement"));expect(store.querySourceEstimate(request)).toMatchObject({code:"SOURCE_CHANGED"});expect(()=>store.sourceEstimateForExport({hash,period:"2025-10"})).toThrow("SOURCE_CHANGED");expect(store.readSnapshot()).toEqual(before);
 }finally{store.close();}
 const empty=openStore(":memory:");try{empty.importSourcePreview(estimatePackage());expect(new SalesReports(empty).open({period:"2025-10"})).toMatchObject({code:"UNSUPPORTED_MAPPING"});}finally{empty.close();}
});
test("bounded product/evidence pages export all products with exact text and uncertainty on every sheet",async()=>{
 const s=estimateSnapshot();s.lines=Array.from({length:61},(_,i)=>({...s.lines[0],ID:String(i+2),STOK:String(i+1)}));s.lines[0].TOPLAM_KDV_MATRAHI="0.12345678901234567890123456789";
 const bytes=estimatePackage(s),store=openStore(":memory:");try{
  store.importSourcePreview(bytes);const request={hash:digest(bytes),period:"2025-10",view:"products" as const,offset:0,productId:null};const page=store.querySourceEstimate(request);expect(page.status).toBe("source-estimate");if(page.status!=="source-estimate")throw Error("missing");expect(page.products).toHaveLength(50);expect(page.total).toBe(61);const lookup=store.querySourceEstimate({...request,productId:"61"});expect(lookup).toMatchObject({total:1,products:[{productId:"61"}],report:{summary:page.report.summary}});expect(store.querySourceEstimate({...request,view:"evidence"}).status).toBe("source-estimate");
  const r=store.sourceEstimateForExport({hash:request.hash,period:request.period}),workbook=await excelSourceEstimate(r);for(const name of ["Özet","Günler","Ürünler","Yöntem","Dışlananlar"]){const rows=await readSheet(workbook,name);expect(rows.flat()).toContain(r.sourceHash);expect(rows.flat()).toContain("Doğrulanmamış tahmin — net kâr değildir");expect(rows.flat()).toContain(r.calculationVersion);}
  const products=await readSheet(workbook,"Ürünler");expect(products.find(row=>row[0]==="61")).toBeTruthy();expect(products.find(row=>row[0]==="1")?.[7]).toBe("0.12345678901234567890123456789");
 }finally{store.close();}
});
test("named estimate IPC denies sender and extra payload before calling service",async()=>{
 let called=0;const callback=async()=>{called++;return {status:"source-unavailable" as const,code:"ESTIMATE_UNAVAILABLE" as const,message:"fixture"};};
 const run=(trusted:boolean,op:string,payload:unknown)=>handleRequest(trusted,op,payload,async()=>({status:"ready",store:"empty",liveConnection:"disabled"}),undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,{query:callback,export:callback});
 const q={hash:"a".repeat(64),period:"2025-10",view:"products",offset:0,productId:null};expect(await run(false,"querySourceEstimate",q)).toMatchObject({code:"UNTRUSTED_SENDER"});expect(await run(true,"querySourceEstimate",{...q,sql:"SELECT"})).toMatchObject({code:"INVALID_PAYLOAD"});expect(await run(true,"exportSourceEstimate",q)).toMatchObject({code:"INVALID_PAYLOAD"});expect(called).toBe(0);await run(true,"querySourceEstimate",q);await run(true,"exportSourceEstimate",{hash:q.hash,period:q.period});expect(called).toBe(2);
});
test("encrypted recovery restores estimate inputs and same output without changing financial records",async()=>{
 const {mkdtemp,mkdir,rm}=await import("node:fs/promises"),{join}=await import("node:path"),{tmpdir}=await import("node:os"),{Recovery}=await import("../../src/recovery/backup"),{generateRecoveryKey}=await import("../../src/recovery/keys");
 const root=await mkdtemp(join(tmpdir(),"estimate-recovery-")),destination=join(root,"backups");await mkdir(destination);const key=generateRecoveryKey();let recovery=await Recovery.open(join(root,"original.sqlite"),{destination,key});
 try{const bytes=estimatePackage(),request={hash:digest(bytes),period:"2025-10",view:"products" as const,offset:0,productId:null};recovery.store!.importPackage(sourcePackage("a"));const before=recovery.store!.readSnapshot();recovery.store!.importSourcePreview(bytes);const expected=recovery.store!.querySourceEstimate(request);const status=await recovery.backupNow();await recovery.close();recovery=await Recovery.open(join(root,"restored.sqlite"));const prepared=await recovery.prepareRestore(join(destination,`${status.backups[0].id}.esmerbackup`),key);await recovery.confirmRestore(prepared.token);expect(recovery.store!.querySourceEstimate(request)).toEqual(expected);expect(recovery.store!.readSnapshot()).toEqual(before);}finally{await recovery.close();await rm(root,{recursive:true,force:true});}
});
