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
 for(const bad of [{...request(),sql:"SELECT *"},request({offset:-1}),request({period:"2025-13"}),request({view:"documents"}),request({productId:"private name"}),{...request({hash:"0".repeat(64),period:"2025-10"}),view:["documents"]},{...request(),scope:["all"]}])expect(validSourceQuery(bad)).toBe(false);
 expect(typeof querySource).toBe("function");
});


test("product drilldown pages all document lines and replacement invalidates pinned requests",()=>{
 const store=openStore(":memory:");try{
  const snapshot=rawSnapshot();snapshot.lines=Array.from({length:61},(_,i)=>({...snapshot.lines[0],ID:String(i+1),STOK:i===60?"4":"3"}));
  store.importSourcePreview(writeRawPackage(snapshot,"fixture:raw","batch-1"));
  const initial=store.querySourceWorkspace(request());if(initial.status!=="source-workspace")throw Error("missing");
  const context=request({hash:initial.hash,period:"2025-10",view:"detail",scope:"sales",productId:"3",documentId:"1",offset:50});
  const detail=store.querySourceWorkspace(context);expect(detail.status).toBe("source-workspace");if(detail.status!=="source-workspace")throw Error("missing");
  expect(detail.total).toBe(61);expect(detail.lines).toHaveLength(11);expect(detail.lines.at(-1)?.STOK).toBe("4");
  const products=store.querySourceWorkspace(request({hash:initial.hash,period:"2025-10",view:"products",scope:"sales"}));
  expect(products.status==="source-workspace"&&products.products).toEqual([{id:"3",documents:1,lines:60},{id:"4",documents:1,lines:1}]);
  const outside=store.querySourceWorkspace(request({hash:initial.hash,period:"2025-11"}));expect(outside.status==="source-workspace"&&outside.counts.documents).toBe(0);
  store.importSourcePreview(writeRawPackage(rawSnapshot(),"fixture:raw","batch-2"));
  expect(store.querySourceWorkspace(context)).toMatchObject({status:"source-unavailable",code:"SOURCE_CHANGED"});
  const updated=store.querySourceWorkspace(request());if(updated.status!=="source-workspace")throw Error("missing");
  expect(store.querySourceWorkspace({...context,hash:updated.hash,offset:500})).toMatchObject({status:"source-workspace",total:1,offset:0});
 }finally{store.close();}
});

test("type summaries disclose truncation while all source codes remain queryable",()=>{
 const snapshot=rawSnapshot();snapshot.headers=Array.from({length:60},(_,i)=>({...snapshot.headers[0],ID:String(i+1),FIS_TURU:String(i+1)}));snapshot.lines=[];
 const store=openStore(":memory:");try{store.importSourcePreview(writeRawPackage(snapshot,"fixture:raw","batch-1"));const result=store.querySourceWorkspace(request());if(result.status!=="source-workspace")throw Error("missing");expect(result.typeTotal).toBe(60);expect(result.types).toHaveLength(50);const page=store.querySourceWorkspace(request({hash:result.hash,period:result.period,view:"documents",documentType:"60"}));expect(page.status==="source-workspace"&&page.documents.map(row=>row.ID)).toEqual(["60"]);}finally{store.close();}
});

test("raw first-use month follows dated records rather than extraction boundary", () => {
 const snapshot=rawSnapshot(); snapshot.to="2025-11-30";
 const result=querySource({schemaVersion:"sql-backup-preview-v1",provenance:"isolated-sql-backup",sourceReconciled:false,sha256:"0".repeat(64),lineage:"fixture:raw",extractionId:"batch-1",snapshot},"0".repeat(64),request());
 expect(result).toMatchObject({status:"source-workspace",period:"2025-10"});
});

test("an imported empty source remains present and selects its declared end month",()=>{const snapshot=rawSnapshot();snapshot.headers=[];snapshot.lines=[];const store=openStore(":memory:");try{store.importSourcePreview(writeRawPackage(snapshot,"fixture:empty","empty-1"));expect(store.querySourceWorkspace(request())).toMatchObject({status:"source-workspace",period:"2025-10",counts:{documents:0,lines:0}});}finally{store.close();}});
