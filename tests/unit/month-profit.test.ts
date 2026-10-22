import {expect,test} from "vitest";
import {readRawPackage,type RawPackage} from "../../src/source/raw-package";
import type {AppRecord} from "../../src/store/revisions";
import type {ExpenseValue} from "../../src/expenses/contracts";
import {buildMonthProfit,monthChanges,type MonthProfitTotals,type MonthProfitView} from "../../src/source/month-profit";
import {monthProfitPackage,monthProfitSnapshot} from "../helpers/month-profit-fixture";
import {writeRawEstimatePackage} from "../../src/source/raw-package";
import type {SqlSnapshot} from "../../src/source/sql-server";

const hash="c".repeat(64);
const pkg=():RawPackage=>readRawPackage(monthProfitPackage())!;
const parse=(s:SqlSnapshot)=>readRawPackage(writeRawEstimatePackage(s,"fixture:month-profit","variant"))!;
const fullOctober=()=>parse({...monthProfitSnapshot(),to:"2025-10-31"});
const none={app:[] as AppRecord[],history:[] as AppRecord[]};
function view(month:string,expenses=none,source=pkg()):MonthProfitView{const r=buildMonthProfit(source,hash,month,expenses);if(r.status!=="month-profit")throw Error(r.code);return r.view;}

test("October totals, previous month and history use literal hand-computed decimals",()=>{
 const v=view("2025-10");
 expect(v).toMatchObject({month:"2025-10",dataFrom:"2025-10-01",dataUntil:"2025-10-20",confidence:"estimate",source:{hash,extractedAt:"2026-09-26T00:00:00.000Z",from:"2025-08-01",to:"2025-10-20"}});
 expect(v.totals).toEqual({sales:"480",knownCostSales:"430",cost:"372.5",grossProfit:"57.5",marginPct:"13.37",costKnownPct:"86.87",unknownCostSales:"50",unknownCostProducts:1,returns:"15",unknownSaleAmounts:0,unknownReturnAmounts:0,receipts:3,averageBasket:"160",expenses:null,expensesComplete:false,netProfit:null,netProfitReason:"monthPartial"});
 expect(v.previous).toEqual({sales:"510",knownCostSales:"510",cost:"408",grossProfit:"102",marginPct:"20.00",costKnownPct:"100.00",unknownCostSales:"0",unknownCostProducts:0,returns:null,unknownSaleAmounts:0,unknownReturnAmounts:0,receipts:2,averageBasket:"255",expenses:null,expensesComplete:false,netProfit:null,netProfitReason:"expensesMissing"});
 expect(v.history).toEqual([{month:"2025-08",sales:"100",grossProfit:"20",marginPct:"20.00"},{month:"2025-09",sales:"510",grossProfit:"102",marginPct:"20.00"},{month:"2025-10",sales:"480",grossProfit:"57.5",marginPct:"13.37"}]);
});

test("products: missing cost stays null, loss stays negative, unit values only over cost-known lines",()=>{
 const v=view("2025-10");
 expect(v.products.map(p=>p.id)).toEqual(["4","1","2","3","5","7"]);
 const by=Object.fromEntries(v.products.map(p=>[p.id,p]));
 expect(by["4"]).toEqual({id:"4",name:"Çay",category:null,unit:"adet",sales:"200",cost:"190",grossProfit:"10",marginPct:"5.00",previousMarginPct:"6.40",unitPrice:"200",unitCost:"190",quantity:"1",history:[{month:"2025-08",marginPct:null},{month:"2025-09",marginPct:"6.40"},{month:"2025-10",marginPct:"5.00"}]});
 expect(by["1"]).toMatchObject({sales:"150",cost:"105",grossProfit:"45",marginPct:"30.00",previousMarginPct:"31.50",unitPrice:"10",unitCost:"7",quantity:"15",history:[{month:"2025-08",marginPct:"20.00"},{month:"2025-09",marginPct:"31.50"},{month:"2025-10",marginPct:"30.00"}]});
 expect(by["2"]).toMatchObject({name:"Peynir",unit:"kg",sales:"50",cost:null,grossProfit:null,marginPct:null,previousMarginPct:"33.33",unitPrice:null,unitCost:null,quantity:null});
 expect(by["3"]).toMatchObject({sales:"40",cost:"44",grossProfit:"-4",marginPct:"-10.00",previousMarginPct:null,unitPrice:"10",unitCost:"11",quantity:"4"});
 expect(by["5"]).toMatchObject({grossProfit:"6",marginPct:"20.00",previousMarginPct:"40.00"});
 expect(by["7"]).toMatchObject({sales:"10",cost:"9.5",grossProfit:"0.5",marginPct:"5.00",unitCost:"9.5"});
});

test("categories group named products; uncategorised products are left out",()=>{
 expect(view("2025-10").categories).toEqual([{name:"Süt ürünleri",sales:"200",grossProfit:"45",marginPct:"30.00"},{name:"Fırın",sales:"40",grossProfit:"-4",marginPct:"-10.00"},{name:"Kuru gıda",sales:"40",grossProfit:"6.5",marginPct:"16.25"}]);
});

test("attention: literal thresholds and deterministic order (kind, then sales rank)",()=>{
 // P1 drops exactly 1.5 pts (31.5 -> 30) and is flagged; P4 drops 1.4 pts and is not; P7 has 5 % margin but is sixth by sales.
 expect(view("2025-10").attention).toEqual([{kind:"loss",productId:"3"},{kind:"marginDrop",productId:"1"},{kind:"marginDrop",productId:"5"},{kind:"lowMarginHighVolume",productId:"4"},{kind:"lowMarginHighVolume",productId:"3"},{kind:"missingCost",productId:"2"}]);
});

test("a month with no covered previous month has previous null and a one-month history",()=>{
 const v=view("2025-08");
 expect(v.previous).toBeNull();expect(v.dataFrom).toBe("2025-08-01");expect(v.dataUntil).toBe("2025-08-31");
 expect(v.history).toEqual([{month:"2025-08",sales:"100",grossProfit:"20",marginPct:"20.00"}]);
 expect(v.products).toEqual([{id:"1",name:"Süt",category:"Süt ürünleri",unit:"adet",sales:"100",cost:"80",grossProfit:"20",marginPct:"20.00",previousMarginPct:null,unitPrice:"10",unitCost:"8",quantity:"10",history:[{month:"2025-08",marginPct:"20.00"}]}]);
 expect(v.attention).toEqual([]);
});

test("uncovered months and non-estimate packages are explicit unavailable results, never zeros",()=>{
 for(const month of ["2025-07","2025-11"])expect(buildMonthProfit(pkg(),hash,month,none)).toMatchObject({status:"source-unavailable",code:"MONTH_NOT_COVERED"});
 const preview={...pkg(),schemaVersion:"sql-backup-preview-v2"} as RawPackage;
 expect(buildMonthProfit(preview,hash,"2025-10",none)).toMatchObject({status:"source-unavailable",code:"ESTIMATE_UNAVAILABLE"});
});

const fields={paymentDate:null,category:"Kira",classification:"operating-expense",net:"20",tax:"3.6",gross:"23.6",taxTreatment:"recoverable",taxEvidence:"fatura-1",supportingReference:null,sourceReference:null,labourPeriod:null,loss:null} as const;
const expense=(revision:number,entityId:string,value:Partial<ExpenseValue>):AppRecord=>({revision,kind:"expense",entityId,value:{...fields,date:"2025-10-05",format:"expense-v1",origin:{kind:"manual",requestId:entityId},reason:"Elle kayıt oluşturuldu",evidence:entityId,replacesRevision:null,voided:false,...value} as ExpenseValue});
const confirm=(revision:number,reviewedRevision:number):AppRecord=>({revision,kind:"confirmation",entityId:"expense-complete:2025-10",value:{period:"2025-10",reviewedRevision,complete:true,reason:"Ay tamam",evidence:"owner-review"}});
const rent=expense(1,"rent",{}),labour=expense(2,"labour",{category:"Personel toplamı",classification:"labour",net:"10",tax:"0",gross:"10",taxTreatment:"non-recoverable",taxEvidence:"bordro-ozet"});

test("net profit: confirmed complete month subtracts counted expenses (recoverable net, non-recoverable gross)",()=>{
 const t=view("2025-10",{app:[rent,labour,confirm(3,2)],history:[rent,labour]},fullOctober()).totals;
 expect(t).toMatchObject({grossProfit:"57.5",expenses:"30",expensesComplete:true,netProfit:"27.5",netProfitReason:null});
});
test("net profit: unconfirmed month shows expenses but withholds net",()=>{
 expect(view("2025-10",{app:[rent,labour],history:[rent,labour]},fullOctober()).totals).toMatchObject({expenses:"30",expensesComplete:false,netProfit:null,netProfitReason:"expensesIncomplete"});
});
test("net profit: unknown tax treatment blocks the net figure even when confirmed",()=>{
 const unknown=expense(2,"labour",{...labour.value as ExpenseValue,taxTreatment:"unknown",taxEvidence:null});
 expect(view("2025-10",{app:[rent,unknown,confirm(3,2)],history:[rent,unknown]},fullOctober()).totals).toMatchObject({expenses:null,expensesComplete:true,netProfit:null,netProfitReason:"unknownTax"});
});
test("net profit: a revision after confirmation invalidates it",()=>{
 const revised=expense(4,"rent",{net:"25",tax:"4.5",gross:"29.5",replacesRevision:1,reason:"Düzeltme"});
 expect(view("2025-10",{app:[labour,confirm(3,2),revised],history:[rent,labour,revised]},fullOctober()).totals).toMatchObject({expenses:"35",expensesComplete:false,netProfit:null,netProfitReason:"confirmationStale"});
});

test("net profit: a month the window covers only partly withholds net even when confirmed",()=>{
 expect(view("2025-10",{app:[rent,labour,confirm(3,2)],history:[rent,labour]}).totals).toMatchObject({grossProfit:"57.5",expenses:"30",expensesComplete:true,netProfit:null,netProfitReason:"monthPartial"});
 const late=parse({...monthProfitSnapshot(),from:"2025-08-02",to:"2025-10-31"});
 expect(view("2025-08",none,late)).toMatchObject({dataFrom:"2025-08-02",dataUntil:"2025-08-31",totals:{netProfitReason:"monthPartial"}});
});

test("a month without any known cost has null cost, gross profit and net (costUnknown), never zero",()=>{
 const s=monthProfitSnapshot();for(const l of s.lines)if(l.FIS==="301")l.BELGE_TARIHINDEKI_SON_ALIS_FIYATI=null;
 const august=expense(1,"rent-aug",{date:"2025-08-05"}),ok={app:[august,{...confirm(2,1),entityId:"expense-complete:2025-08",value:{period:"2025-08",reviewedRevision:1,complete:true,reason:"Ay tamam",evidence:"owner-review"}} as AppRecord],history:[august]};
 const v=view("2025-08",ok,parse(s));
 expect(v.totals).toMatchObject({sales:"100",knownCostSales:"0",cost:null,grossProfit:null,marginPct:null,unknownCostSales:"100",unknownCostProducts:1,expenses:"20",expensesComplete:true,netProfit:null,netProfitReason:"costUnknown"});
 expect(v.history).toEqual([{month:"2025-08",sales:"100",grossProfit:null,marginPct:null}]);
 expect(v.categories).toEqual([{name:"Süt ürünleri",sales:"100",grossProfit:null,marginPct:null}]);
 expect(view("2025-09",none,parse(s)).history[0]).toEqual({month:"2025-08",sales:"100",grossProfit:null,marginPct:null});
});

test("unknown sale and return amounts are counted, and an all-unknown amount is null, not zero",()=>{
 const s=monthProfitSnapshot();for(const l of s.lines)if(l.FIS==="301"||l.FIS==="104")l.TOPLAM_KDV_MATRAHI=null;
 const aug=view("2025-08",none,parse(s)).totals,oct=view("2025-10",none,parse(s)).totals;
 expect(aug).toMatchObject({sales:null,knownCostSales:"0",grossProfit:null,unknownSaleAmounts:1,unknownReturnAmounts:0,receipts:0,averageBasket:null});
 expect(oct).toMatchObject({sales:"480",returns:null,unknownSaleAmounts:0,unknownReturnAmounts:1});
});

test("a package without the products stream has null labels and quantities and no categories",()=>{
 const {products:_omit,...s}=monthProfitSnapshot();void _omit;
 const v=view("2025-10",none,parse(s as SqlSnapshot));
 expect(v.products.every(p=>p.name===null&&p.category===null&&p.unit===null&&p.quantity===null&&p.unitPrice===null&&p.unitCost===null)).toBe(true);
 expect(v.categories).toEqual([]);
 expect(v.products.find(p=>p.id==="1")).toMatchObject({sales:"150",grossProfit:"45",marginPct:"30.00"});
});

test("thresholds compare unrounded margins: a 1.495-point drop is not flagged, 7.995 % is under 8",()=>{
 const s=monthProfitSnapshot();
 for(const l of s.lines){if(l.ID==="2011")l.BELGE_TARIHINDEKI_SON_ALIS_FIYATI="13.701";if(l.ID==="1031")l.BELGE_TARIHINDEKI_SON_ALIS_FIYATI="184.01";}
 const v=view("2025-10",none,parse(s));
 // P1: Sep 62.99/200 = 31.495 % (shown 31.50), Oct 30 %. P4: Oct 15.99/200 = 7.995 % (shown 8.00).
 expect(v.products.find(p=>p.id==="1")).toMatchObject({marginPct:"30.00",previousMarginPct:"31.50"});
 expect(v.products.find(p=>p.id==="4")).toMatchObject({marginPct:"8.00"});
 expect(v.attention).toEqual([{kind:"loss",productId:"3"},{kind:"marginDrop",productId:"5"},{kind:"lowMarginHighVolume",productId:"4"},{kind:"lowMarginHighVolume",productId:"3"},{kind:"missingCost",productId:"2"}]);
});

test("changes against the previous month come from the service as rounded decimal strings",()=>{
 // Sales 480 vs 510 -> -5.882..%; gross 57.5 vs 102 -> -43.627..%; margin 13.3720.. vs 20 -> -6.6279.. points; net unknown.
 expect(view("2025-10").changes).toEqual({salesPct:"-5.88",grossProfitPct:"-43.63",marginPoints:"-6.63",netProfitPct:null});
 // September vs August: 510 vs 100 -> 410 %; 102 vs 20 -> 410 %; margin 20 vs 20 -> 0 points.
 expect(view("2025-09").changes).toEqual({salesPct:"410.00",grossProfitPct:"410.00",marginPoints:"0.00",netProfitPct:null});
 expect(view("2025-08").changes).toBeNull();
});

test("margin points subtract unrounded margins, then round once",()=>{
 // 13.375 % vs 20.004 %: unrounded -6.629 -> -6.63. Rounding first (13.38 - 20.00) would give -6.62.
 const t=(gross:string)=>({sales:"100",knownCostSales:"100",grossProfit:gross,netProfit:null} as MonthProfitTotals);
 expect(monthChanges(t("13.375"),t("20.004"))).toEqual({salesPct:"0.00",grossProfitPct:"-33.14",marginPoints:"-6.63",netProfitPct:null});
});

test("net profit change needs both months' net profit and a positive previous base",()=>{
 // Sep full month with 20 expenses confirmed: net 102-20=82; Oct full month with 30 expenses: net 57.5-30=27.5 -> (27.5-82)/82 = -66.4634..%.
 const sep=expense(5,"rent-sep",{date:"2025-09-05",net:"20",tax:"0",gross:"20"});
 const sepOk={...confirm(6,5),entityId:"expense-complete:2025-09",value:{period:"2025-09",reviewedRevision:5,complete:true,reason:"Ay tamam",evidence:"owner-review"}} as AppRecord;
 const v=view("2025-10",{app:[rent,labour,sep,confirm(3,2),sepOk],history:[rent,labour,sep]},fullOctober());
 expect(v.previous).toMatchObject({netProfit:"82"});expect(v.totals).toMatchObject({netProfit:"27.5"});
 expect(v.changes).toMatchObject({netProfitPct:"-66.46"});
});
