import { expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openStore } from "../../src/store/store";
import { querySourceEstimate, type EstimateRequest } from "../../src/source/estimate";
import { readRawPackage } from "../../src/source/raw-package";
import { estimatePackage, estimateSnapshot } from "../helpers/estimate-fixture";

test("cached pages preserve uncached month, filter, evidence and mutation isolation", () => {
 const snapshot=estimateSnapshot();snapshot.lines=Array.from({length:121},(_,i)=>({...snapshot.lines[0],ID:String(i+2),STOK:String(i+1)}));
 const bytes=estimatePackage(snapshot),pkg=readRawPackage(bytes)!,store=openStore(":memory:");
 try {
  const imported=store.importSourcePreview(bytes);if(imported.status!=="preview-imported")throw Error("fixture");
  const base:EstimateRequest={hash:imported.hash,period:"2025-10",view:"products",offset:0,productId:null};
  for(const patch of [{},{offset:50},{offset:100},{productId:"3"},{view:"evidence" as const},{period:"2025-11"},{}]){
   const request={...base,...patch},result=store.querySourceEstimate(request);
   expect(result).toEqual(querySourceEstimate(pkg,imported.hash,request));
   if(result.status==="source-estimate"){result.report.summary.contribution="999999";result.ranking.length=0;result.products.length=0;result.lines.length=0;}
  }
  const workspace=store.querySourceWorkspace({hash:imported.hash,period:"2025-10",scope:"all",view:"detail",offset:0,productId:null,documentId:String(snapshot.headers[0].ID),documentType:null});
  if(workspace.status==="source-workspace"&&workspace.lines[0]) workspace.lines[0].TOPLAM_KDV_MATRAHI="999999";
  expect(store.querySourceEstimate(base)).toEqual(querySourceEstimate(pkg,imported.hash,base));
  const replacement=store.importSourcePreview(estimatePackage(undefined,"replacement"));expect(replacement.status).toBe("preview-imported");
  expect(store.querySourceEstimate(base)).toMatchObject({code:"SOURCE_CHANGED"});
 } finally {store.close();}
});

test("persisted byte changes and deletion invalidate a warm estimate cache", () => {
 const directory=mkdtempSync(join(tmpdir(),"esmer-cache-")),path=join(directory,"synthetic.sqlite"),store=openStore(path),db=new DatabaseSync(path);
 try {
  const imported=store.importSourcePreview(estimatePackage());if(imported.status!=="preview-imported")throw Error("fixture");
  const request:EstimateRequest={hash:imported.hash,period:"2025-10",view:"products",offset:0,productId:null};
  expect(store.querySourceEstimate(request).status).toBe("source-estimate");
  db.prepare("UPDATE source_preview SET package_json='{}' WHERE singleton=1").run();
  expect(()=>store.querySourceEstimate(request)).toThrow("INVALID_PACKAGE");
  store.importSourcePreview(estimatePackage());expect(store.querySourceEstimate(request).status).toBe("source-estimate");
  db.prepare("DELETE FROM source_preview").run();expect(store.querySourceEstimate(request)).toMatchObject({code:"ESTIMATE_UNAVAILABLE"});
 } finally {db.close();store.close();rmSync(directory,{recursive:true,force:true});}
});
