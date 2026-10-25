import {expect,test} from "vitest";
import {openStore} from "../../src/store/store";
import {handleRequest} from "../../src/desktop/requests";
import {monthProfitPackage,monthProfitSnapshot} from "../helpers/month-profit-fixture";
import {writeRawEstimatePackage} from "../../src/source/raw-package";
import {rawSnapshot} from "../helpers/raw-fixture";
import {writeRawPackage} from "../../src/source/raw-package";

test("store reads the active estimate package and expense records for one month",()=>{
 const store=openStore(":memory:");try{
  expect(store.readMonthProfit({month:"2025-10"})).toMatchObject({status:"source-unavailable",code:"ESTIMATE_UNAVAILABLE"});
  store.importSourcePreview(writeRawPackage(rawSnapshot(),"fixture:preview","preview-1"));
  expect(store.readMonthProfit({month:"2025-10"})).toMatchObject({status:"source-unavailable",code:"ESTIMATE_UNAVAILABLE"});
  store.importSourcePreview(monthProfitPackage());
  const r=store.readMonthProfit({month:"2025-10"});
  expect(r).toMatchObject({status:"month-profit",view:{month:"2025-10",totals:{sales:"480",grossProfit:"57.5",marginPct:"13.37",netProfit:null,netProfitReason:"monthPartial"}}});
  expect(store.readMonthProfit({month:"2025-12"})).toMatchObject({status:"source-unavailable",code:"MONTH_NOT_COVERED"});
  expect(()=>store.readMonthProfit({month:"2025-10",extra:1} as never)).toThrow("INVALID_PAYLOAD");
 }finally{store.close();}
});

test("a pinned month export answers SOURCE_CHANGED for another source hash and the month view for the loaded one",()=>{
 const store=openStore(":memory:");try{
  expect(store.readMonthProfitPinned({month:"2025-10",hash:"0".repeat(64)})).toMatchObject({status:"source-unavailable",code:"ESTIMATE_UNAVAILABLE"});
  store.importSourcePreview(monthProfitPackage());
  const read=store.readMonthProfit({month:"2025-10"});if(read.status!=="month-profit")throw Error("NO_VIEW");
  expect(store.readMonthProfitPinned({month:"2025-10",hash:read.view.source.hash})).toEqual(read);
  expect(()=>store.readMonthProfitPinned({month:"2025-10",hash:"0".repeat(64)})).toThrow("SOURCE_CHANGED");
  expect(()=>store.readMonthProfitPinned({month:"2025-10"} as never)).toThrow("INVALID_PAYLOAD");
 }finally{store.close();}
});

test("named readMonthProfit IPC denies sender, extra keys and bad months before calling the service",async()=>{
 let called=0;const service=async()=>{called++;return {status:"source-unavailable" as const,code:"ESTIMATE_UNAVAILABLE" as const,message:"fixture"};};
 const run=(trusted:boolean,payload:unknown)=>handleRequest(trusted,"readMonthProfit",payload,async()=>({status:"ready",store:"empty",liveConnection:"disabled"}),undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,service);
 expect(await run(false,{month:"2025-10"})).toMatchObject({code:"UNTRUSTED_SENDER"});
 for(const payload of [{month:"2025-10",sql:"SELECT"},{month:"2025-13"},{month:"2025-1"},{month:202510},{},null,"2025-10",[]])expect(await run(true,payload)).toMatchObject({code:"INVALID_PAYLOAD"});
 expect(called).toBe(0);
 expect(await run(true,{month:"2025-10"})).toMatchObject({code:"ESTIMATE_UNAVAILABLE"});expect(called).toBe(1);
});

test("cached month estimates are reused for one package hash and dropped when the package is replaced",()=>{
 const store=openStore(":memory:");try{
  store.importSourcePreview(monthProfitPackage());
  const first=store.readMonthProfit({month:"2025-10"});expect(store.readMonthProfit({month:"2025-10"})).toEqual(first);
  const s=monthProfitSnapshot();for(const l of s.lines)if(l.ID==="1031")l.BELGE_TARIHINDEKI_SON_ALIS_FIYATI="180";
  store.importSourcePreview(writeRawEstimatePackage(s,"fixture:month-profit","replacement"));
  expect(store.readMonthProfit({month:"2025-10"})).toMatchObject({status:"month-profit",view:{totals:{grossProfit:"67.5"}}});
 }finally{store.close();}
});
