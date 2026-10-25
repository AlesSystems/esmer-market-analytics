import {expect,test} from "vitest";
import {createHash} from "node:crypto";
import {openStore} from "../../src/store/store";
import {canonical} from "../../src/source/package";
import {readRawPackage,writeRawPackage} from "../../src/source/raw-package";
import {estimateSnapshot,estimatePackage} from "../helpers/estimate-fixture";
import {rawSnapshot} from "../helpers/raw-fixture";
import {sourcePackage} from "../helpers/store-fixtures";
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
  store.importSourcePreview(estimatePackage(undefined,"replacement"));expect(store.querySourceEstimate(request)).toMatchObject({code:"SOURCE_CHANGED"});expect(store.readSnapshot()).toEqual(before);
 }finally{store.close();}
});
test("encrypted recovery restores estimate inputs and same output without changing financial records",async()=>{
 const {mkdtemp,mkdir,rm}=await import("node:fs/promises"),{join}=await import("node:path"),{tmpdir}=await import("node:os"),{Recovery}=await import("../../src/recovery/backup"),{generateRecoveryKey}=await import("../../src/recovery/keys");
 const root=await mkdtemp(join(tmpdir(),"estimate-recovery-")),destination=join(root,"backups");await mkdir(destination);const key=generateRecoveryKey();let recovery=await Recovery.open(join(root,"original.sqlite"),{destination,key});
 try{const bytes=estimatePackage(),request={hash:digest(bytes),period:"2025-10",view:"products" as const,offset:0,productId:null};recovery.store!.importPackage(sourcePackage("a"));const before=recovery.store!.readSnapshot();recovery.store!.importSourcePreview(bytes);const expected=recovery.store!.querySourceEstimate(request);const status=await recovery.backupNow();await recovery.close();recovery=await Recovery.open(join(root,"restored.sqlite"));const prepared=await recovery.prepareRestore(join(destination,`${status.backups[0].id}.esmerbackup`),key);await recovery.confirmRestore(prepared.token);expect(recovery.store!.querySourceEstimate(request)).toEqual(expected);expect(recovery.store!.readSnapshot()).toEqual(before);}finally{await recovery.close();await rm(root,{recursive:true,force:true});}
});
