import {expect,test} from "vitest";
import {openStore} from "../../src/store/store";
import {writeRawEstimatePackage,writeRawPackage} from "../../src/source/raw-package";
import {estimateSnapshot} from "../helpers/estimate-fixture";
import {namedSnapshot} from "../helpers/raw-fixture";
const request={hash:null,period:null,view:"overview" as const,scope:"all" as const,documentType:null,productId:null,documentId:null,offset:0};
test("store imports v2 preview without leaking the catalogue into preview metadata",()=>{
 const store=openStore(":memory:");try{
  expect(store.importSourcePreview(writeRawPackage(namedSnapshot(),"fixture:names","p-1"))).toMatchObject({status:"preview-imported"});
  const preview=store.readSourcePreview({stream:"headers",offset:0});if(preview.status!=="source-preview")throw Error("missing");
  expect(Object.hasOwn(preview.metadata,"products")).toBe(false);expect(preview.metadata.schemaVersion).toBe("sql-backup-preview-v2");
 }finally{store.close();}
});
test("store imports v2 estimate and reports its source format",()=>{
 const store=openStore(":memory:");try{
  expect(store.importSourcePreview(writeRawEstimatePackage(namedSnapshot(estimateSnapshot()),"fixture:names","e-1"))).toMatchObject({status:"preview-imported"});
  expect(store.querySourceWorkspace(request)).toMatchObject({status:"source-workspace",sourceFormat:"sql-backup-estimate-v2"});
  const preview=store.readSourcePreview({stream:"lines",offset:0});if(preview.status!=="source-preview")throw Error("missing");expect(Object.hasOwn(preview.metadata,"products")).toBe(false);
 }finally{store.close();}
});
