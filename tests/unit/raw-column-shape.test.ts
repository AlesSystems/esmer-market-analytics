import { expect, test } from "vitest";
import { createHash } from "node:crypto";
import { canonical } from "../../src/source/package";
import { readRawPackage, writeRawEstimatePackage } from "../../src/source/raw-package";
import { openStore } from "../../src/store/store";
import { estimatePackage, estimateSnapshot } from "../helpers/estimate-fixture";
const spoof=(snapshot:ReturnType<typeof estimateSnapshot>)=>{delete snapshot.lines[0].TOPLAM_KDV;delete snapshot.lines[0].TOPLAM_KDV_MATRAHI;snapshot.lines[0]["TOPLAM_KDV,TOPLAM_KDV_MATRAHI"]=null;};
test("writer rejects comma-bearing key that impersonates two required columns",()=>{
 const snapshot=estimateSnapshot();spoof(snapshot);expect(()=>writeRawEstimatePackage(snapshot,"fixture:shape","shape-1")).toThrow("INVALID_PACKAGE");
});
test("reader rejects malformed columns even with valid canonical encoding and digest",()=>{
 const value=JSON.parse(estimatePackage().toString());spoof(value.snapshot);value.sha256=createHash("sha256").update(canonical({lineage:value.lineage,extractionId:value.extractionId,snapshot:value.snapshot})).digest("hex");
 const bytes=Buffer.from(canonical(value));expect(readRawPackage(bytes)).toBeNull();
 const store=openStore(":memory:");try{expect(store.importSourcePreview(bytes)).toMatchObject({status:"failed",code:"INVALID_PACKAGE"});expect(store.hasSourcePreview()).toBe(false);const valid=store.importSourcePreview(estimatePackage());if(valid.status!=="preview-imported")throw Error("fixture");const request={hash:valid.hash,period:"2025-10",view:"products" as const,offset:0,productId:null};const previous=store.querySourceEstimate(request);expect(store.importSourcePreview(bytes)).toMatchObject({status:"failed",code:"INVALID_PACKAGE"});expect(store.querySourceEstimate(request)).toEqual(previous);}finally{store.close();}
});
