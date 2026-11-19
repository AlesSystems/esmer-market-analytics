import { readSheet } from "read-excel-file/node";
import { Expenses } from "../../src/expenses/import";
import { excelMonthProfit } from "../../src/source/month-profit-export";
import { november, novemberProfitPackage, novemberProfitSnapshot, novemberElectricityExcelRow } from "../helpers/november-bill-fixture";
import { workbook } from "../helpers/expense-fixtures";
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
 const run=(trusted:boolean,payload:unknown)=>handleRequest(trusted,"readMonthProfit",payload,async()=>({status:"ready",store:"empty",liveConnection:"disabled"}),undefined,undefined,undefined,undefined,undefined,undefined,undefined,service);
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

test("the November estimate and workbook deduct a manual bill in full after review", async () => {
 const store = openStore(":memory:");
 try {
  const expenses = new Expenses(store);
  store.importSourcePreview(novemberProfitPackage());
  const read = () => store.readMonthProfit({ month: november });
  expect(read()).toMatchObject({ status: "month-profit", view: { totals: { grossProfit: "10000", netProfit: null } } });
  const saved = expenses.create({ action: "save-bill", requestId: "electricity", fields: { period: november, category: "Elektrik", amount: "1.250,00" } });
  if (saved.status !== "saved") throw Error("Manual bill was not saved");
  expect(expenses.query({ period: november })).toMatchObject({ summary: { expenses: "1250" }, incurred: "1250", payments: "0" });
  expect(read()).toMatchObject({ view: { totals: { expenses: "1250", expensesComplete: false, netProfit: null, netProfitReason: "expensesIncomplete" } } });
  store.confirmExpensesComplete({ period: november, reviewedRevision: saved.revision, complete: true, reason: "İncelendi" });
  const result = read();
  if (result.status !== "month-profit") throw Error("November view unavailable");
  expect(result.view.totals).toMatchObject({ grossProfit: "10000", expenses: "1250", expensesComplete: true, netProfit: "8750" });
  const pinned = store.readMonthProfitPinned({ month: november, hash: result.view.source.hash });
  if (pinned.status !== "month-profit") throw Error("November export unavailable");
  const summary = await readSheet(await excelMonthProfit(pinned.view), "Özet");
  const amount = (label: string) => summary.find(row => row[0] === label)?.[1];
  expect([amount("Tahmini brüt kâr"), amount("Giderler"), amount("Tahmini net kâr")]).toEqual(["10000", "1250", "8750"]);
  expect(amount("Hesaplama sürümü")).toBe("month-profit-v2");

  const corrected = expenses.create({ action: "correct-bill", requestId: "electricity-correction", entityId: saved.entityId, expectedRevision: saved.revision,
   reason: "Tutar düzeltildi", fields: { period: november, category: "Elektrik", amount: "1.250,25" } });
  if (corrected.status !== "saved") throw Error("Manual bill was not corrected");
  expect(read()).toMatchObject({ view: { totals: { expenses: "1250.25", expensesComplete: false, netProfit: null, netProfitReason: "confirmationStale" } } });
  store.confirmExpensesComplete({ period: november, reviewedRevision: corrected.revision, complete: true, reason: "Yeniden incelendi" });
  expect(read()).toMatchObject({ view: { totals: { netProfit: "8749.75" } } });

  const partial = { ...novemberProfitSnapshot(), to: "2026-11-29" };
  store.importSourcePreview(novemberProfitPackage(partial));
  expect(read()).toMatchObject({ view: { totals: { grossProfit: "10000", netProfit: null, netProfitReason: "monthPartial" } } });

  const noCost = novemberProfitSnapshot();
  noCost.lines[0].BELGE_TARIHINDEKI_SON_ALIS_FIYATI = null;
  store.importSourcePreview(novemberProfitPackage(noCost));
  expect(read()).toMatchObject({ view: { totals: { grossProfit: null, netProfit: null, netProfitReason: "costUnknown" } } });

  store.importSourcePreview(novemberProfitPackage());
  const blocking = [...novemberElectricityExcelRow];
  blocking[8] = "unknown";
  blocking[9] = null;
  const preview = expenses.preview(await workbook([blocking]));
  expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
  expect(read()).toMatchObject({ view: { totals: { expenses: null, netProfit: null, netProfitReason: "unknownTax" } } });
 } finally { store.close(); }
});
