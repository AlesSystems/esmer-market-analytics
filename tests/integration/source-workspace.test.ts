import {expect, test} from "vitest";
import {openStore} from "../../src/store/store";
import {writeRawPackage} from "../../src/source/raw-package";
import {rawSnapshot} from "../helpers/raw-fixture";
import {querySource, validSourceQuery, type SourceQuery} from "../../src/source/workspace";
const request = (override: Partial<SourceQuery> = {}): SourceQuery => ({hash:null,period:null,view:"overview",scope:"all",documentType:null,productId:null,documentId:null,offset:0,...override});
test("real source workspace filters observational types and pages without financial classification", () => {
 const snapshot=rawSnapshot();
 snapshot.headers=[{...snapshot.headers[0],ID:"1",FIS_TURU:"11"},{...snapshot.headers[0],ID:"2",FIS_TURU:"1"},{...snapshot.headers[0],ID:"3",FIS_TURU:"999"}];
 snapshot.lines=[{...snapshot.lines[0],ID:"1",FIS:"1",FIS_TURU:"11"},{...snapshot.lines[0],ID:"2",FIS:"2",FIS_TURU:"1"}];
 const store=openStore(":memory:");
 try {
  store.importSourcePreview(writeRawPackage(snapshot,"fixture:raw","batch-1"));
  const overview=store.querySourceWorkspace(request());
  expect(overview.status).toBe("source-workspace"); if(overview.status!=="source-workspace")throw Error("missing");
  expect(overview.counts).toEqual({documents:3,lines:2,products:1,emptyDocuments:1});
  expect(overview.types).toEqual([{code:"1",documents:1},{code:"11",documents:1},{code:"999",documents:1}]);
  const sales=store.querySourceWorkspace(request({hash:overview.hash,period:"2025-10",view:"documents",scope:"sales"}));
  expect(sales.status === "source-workspace" && sales.documents.map(x=>x.ID)).toEqual(["1"]);
  const purchases=store.querySourceWorkspace(request({hash:overview.hash,period:"2025-10",view:"documents",scope:"purchasing"}));
  expect(purchases.status === "source-workspace" && purchases.documents.map(x=>x.ID)).toEqual(["2"]);
  const detail=store.querySourceWorkspace(request({hash:overview.hash,period:"2025-10",view:"detail",scope:"sales",documentId:"2"}));
  expect(detail).toMatchObject({status:"source-unavailable",code:"NOT_FOUND"});
  expect(store.querySourceWorkspace(request({hash:"0".repeat(64)}))).toMatchObject({status:"source-unavailable",code:"SOURCE_CHANGED"});
 }finally{store.close();}
});
test("source query validates exact trust-boundary keys and required context",()=>{
 expect(validSourceQuery(request())).toBe(true);
 for(const bad of [{...request(),sql:"SELECT *"},request({offset:-1}),request({period:"2025-13"}),request({view:"documents"}),request({productId:"private name"})])expect(validSourceQuery(bad)).toBe(false);
 expect(typeof querySource).toBe("function");
});
