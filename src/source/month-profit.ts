import Decimal from "decimal.js";
import type {RawPackage} from "./raw-package";
import {calculateSourceEstimate,type EstimateLine,type EstimateTotals,type ProductLabel,type SourceEstimate} from "./estimate";
import {validSelectedMonth} from "../domain/month";
import {calculateExpenseComponents} from "../analytics/operating";
import {relevantExpenseRevision} from "../expenses/adjustments";
import type {AppRecord} from "../store/revisions";

// Same precision as source-estimate-v1. Money keeps full precision except the declared 2-place
// rounding (ROUND_HALF_UP) of divisions: percentages, averageBasket, unitPrice and unitCost.
// Thresholds compare unrounded values; rounded values never feed amounts.
const D=Decimal.clone({precision:200,rounding:Decimal.ROUND_HALF_UP});
export const MONTH_PROFIT_VERSION="month-profit-v1";
export type Money=string;
export type Pct=string|null;
export type NetProfitReason="costUnknown"|"monthPartial"|"expensesMissing"|"expensesIncomplete"|"unknownTax"|"confirmationStale";
export type MonthProfitTotals={sales:Money|null;knownCostSales:Money;cost:Money|null;grossProfit:Money|null;marginPct:Pct;costKnownPct:Pct;unknownCostSales:Money;unknownCostProducts:number;returns:Money|null;unknownSaleAmounts:number;unknownReturnAmounts:number;receipts:number;averageBasket:Money|null;expenses:Money|null;expensesComplete:boolean;netProfit:Money|null;netProfitReason:NetProfitReason|null};
export type MonthProfitProduct={id:string;name:string|null;category:string|null;unit:ProductLabel["unit"];sales:Money|null;cost:Money|null;grossProfit:Money|null;marginPct:Pct;previousMarginPct:Pct;unitPrice:Money|null;unitCost:Money|null;quantity:string|null;history:{month:string;marginPct:Pct}[];
 /** Margin now minus last month, in points (2 places, from unrounded margins); null when either is unknown. */
 marginChangePoints:Pct;
 /** Gross profit per unit over cost-known lines (2 places); null without a known quantity or cost. */
 unitProfit:Money|null;
 /** Share of the month's gross profit (2 places); null when unknown or the month's gross profit is not positive. */
 profitSharePct:Pct;
 /** 1-based rank by gross profit, highest first (ties by ID); null when gross profit is unknown. */
 profitRank:number|null;
 /** Filter membership, decided on unrounded values: margin < 0, margin < 10 %, the marginDrop and missingCost attention rules. */
 flags:{loss:boolean;lowMargin10:boolean;marginDrop:boolean;missingCost:boolean};
};
/** Percent change (2 places) or margin points (2 places, from unrounded margins). */
export type MonthProfitChanges={salesPct:Pct;grossProfitPct:Pct;marginPoints:Pct;netProfitPct:Pct};
export type AttentionKind="loss"|"marginDrop"|"lowMarginHighVolume"|"missingCost";
export type MonthProfitView={
 version:typeof MONTH_PROFIT_VERSION;month:string;dataFrom:string;dataUntil:string;confidence:"estimate";
 source:{hash:string;extractedAt:string;from:string;to:string};
 totals:MonthProfitTotals;previous:MonthProfitTotals|null;
 /** Against the previous month; null without a covered previous month. Each entry is null when either side is unknown or the base is not positive; the amount changes are also null when either month is only partly loaded. */
 changes:MonthProfitChanges|null;
 history:{month:string;sales:Money|null;grossProfit:Money|null;marginPct:Pct}[];
 products:MonthProfitProduct[];
 categories:{name:string;sales:Money;grossProfit:Money|null;marginPct:Pct}[];
 attention:{kind:AttentionKind;productId:string}[];
};
export type MonthProfitRequest={month:string};
export type MonthProfitUnavailable={status:"source-unavailable";code:"ESTIMATE_UNAVAILABLE"|"MONTH_NOT_COVERED"|"SOURCE_CHANGED";message:string};
export type MonthProfitResult={status:"month-profit";view:MonthProfitView}|MonthProfitUnavailable;
export type MonthProfitExpenses={app:AppRecord[];history:AppRecord[]};
export const ATTENTION={marginDropPoints:"1.5",lowMarginPct:"8",highVolumeRank:5} as const;
export const PRODUCT_FILTERS={lowMarginPct:"10"} as const;
const COST_REASONS=new Set(["QUANTITY","MULTIPLIER","COST_MISSING","COST_ZERO","COST_NEGATIVE"]);

export function validMonthProfitRequest(value:unknown):value is MonthProfitRequest {
 return !!value&&typeof value==="object"&&!Array.isArray(value)&&Object.keys(value).join()==="month"&&validSelectedMonth((value as {month:unknown}).month);
}
const shift=(month:string,by:number)=>{const d=new Date(`${month}-01T00:00:00Z`);d.setUTCMonth(d.getUTCMonth()+by);return d.toISOString().slice(0,7);};
const lastDay=(month:string)=>{const d=new Date(`${shift(month,1)}-01T00:00:00Z`);d.setUTCDate(0);return d.toISOString().slice(0,10);};
const covered=(pkg:RawPackage,month:string)=>`${month}-01`<=pkg.snapshot.to&&lastDay(month)>=pkg.snapshot.from;
const isPartial=(pkg:RawPackage,month:string)=>pkg.snapshot.from>`${month}-01`||pkg.snapshot.to<lastDay(month);
const ratio=(num:Decimal,den:Decimal)=>den.gt(0)?num.div(den).times(100):null;
const pct=(value:Decimal|null):Pct=>value===null?null:value.toDecimalPlaces(2).toFixed(2);
const div2=(num:Decimal,den:Decimal)=>num.div(den).toDecimalPlaces(2).toFixed();
const byId=(a:string,b:string)=>BigInt(a)<BigInt(b)?-1:BigInt(a)>BigInt(b)?1:0;

const change=(now:string|null,before:string|null):Pct=>now===null||before===null||!new D(before).gt(0)?null:pct(new D(now).minus(before).div(before).times(100));
const unroundedMargin=(t:MonthProfitTotals)=>t.grossProfit===null?null:ratio(new D(t.grossProfit),new D(t.knownCostSales));
/** `partial`: either month is loaded only in part; amounts of a partial month are not comparable, margins (ratios) are. */
export function monthChanges(now:MonthProfitTotals,before:MonthProfitTotals|null,partial=false):MonthProfitChanges|null {
 if(!before)return null;
 const a=unroundedMargin(now),b=unroundedMargin(before),amount=(x:string|null,y:string|null)=>partial?null:change(x,y);
 return {salesPct:amount(now.sales,before.sales),grossProfitPct:amount(now.grossProfit,before.grossProfit),marginPoints:a===null||b===null?null:pct(a.minus(b)),netProfitPct:amount(now.netProfit,before.netProfit)};
}
function netProfit(month:string,grossProfit:string|null,partial:boolean,expenses:MonthProfitExpenses):Pick<MonthProfitTotals,"expenses"|"expensesComplete"|"netProfit"|"netProfitReason"> {
 const components=calculateExpenseComponents({period:month,expenses:expenses.app});
 const confirmation=expenses.app.find(row=>row.kind==="confirmation"&&row.entityId===`expense-complete:${month}`);
 const confirmed=confirmation?.kind==="confirmation"&&confirmation.value.complete&&confirmation.value.period===month;
 const complete=confirmed&&confirmation.value.reviewedRevision===relevantExpenseRevision(expenses.history,month);
 const anyAvailable=Object.values(components.breakdownCoverage).includes("available");
 const reason:NetProfitReason|null=grossProfit===null?"costUnknown":partial?"monthPartial":components.reasons.includes("UNKNOWN_TAX")?"unknownTax":confirmed&&!complete?"confirmationStale":!confirmed&&!anyAvailable&&!components.reasons.length?"expensesMissing":!complete||components.reasons.length?"expensesIncomplete":null;
 const value=components.reasons.length||!complete&&!anyAvailable?null:components.expenses;
 return {expenses:value,expensesComplete:complete,netProfit:reason===null&&grossProfit!==null?new D(grossProfit).minus(components.expenses).toFixed():null,netProfitReason:reason};
}
type Product={label:ProductLabel;lines:EstimateLine[];totals:EstimateTotals};
function monthTotals(pkg:RawPackage,estimate:SourceEstimate,products:Map<string,Product>,expenses:MonthProfitExpenses):MonthProfitTotals {
 const s=estimate.summary,sales=s.candidateSaleAmount===null?null:new D(s.candidateSaleAmount),known=new D(s.coveredSaleAmount??0),gross=s.contribution===null?null:new D(s.contribution);
 const partial=isPartial(pkg,estimate.period);
 const receipts=new Set(estimate.lines.filter(l=>l.saleCandidate&&l.reason!=="AMOUNT").map(l=>l.documentId)).size;
 return {sales:sales?.toFixed()??null,knownCostSales:known.toFixed(),cost:s.candidateCost,grossProfit:gross?.toFixed()??null,marginPct:gross===null?null:pct(ratio(gross,known)),costKnownPct:s.costCoveragePercent,unknownCostSales:s.uncoveredSaleAmount===null?"0":new D(s.uncoveredSaleAmount).toFixed(),unknownCostProducts:[...products.values()].filter(p=>p.lines.some(l=>l.saleCandidate&&l.reason!==null&&COST_REASONS.has(l.reason))).length,returns:s.candidateReturnAmount===null?null:new D(s.candidateReturnAmount).negated().toFixed(),unknownSaleAmounts:s.unknownSaleAmounts,unknownReturnAmounts:s.unknownReturnAmounts,receipts,averageBasket:receipts&&sales?div2(sales,new D(receipts)):null,...netProfit(estimate.period,gross?.toFixed()??null,partial,expenses)};
}
function productsOf(estimate:SourceEstimate):Map<string,Product> {
 const lines=new Map<string,EstimateLine[]>();for(const l of estimate.lines)if(l.saleCandidate){const g=lines.get(l.productId)??[];g.push(l);lines.set(l.productId,g);}
 return new Map(estimate.products.filter(p=>lines.has(p.productId)).map(p=>[p.productId,{label:{productName:p.productName,categoryName:p.categoryName,unit:p.unit},lines:lines.get(p.productId)!,totals:p.totals}]));
}
const productMargin=(p:Product|undefined)=>p?.totals.contribution==null?null:ratio(new D(p.totals.contribution),new D(p.totals.coveredSaleAmount??0));

export type MonthEstimateCache=Map<string,{estimate:SourceEstimate;products:Map<string,Product>}>;
export function buildMonthProfit(pkg:RawPackage,hash:string,month:string,expenses:MonthProfitExpenses,cache:MonthEstimateCache=new Map()):MonthProfitResult {
 if(pkg.schemaVersion!=="sql-backup-estimate-v1"&&pkg.schemaVersion!=="sql-backup-estimate-v2")return {status:"source-unavailable",code:"ESTIMATE_UNAVAILABLE",message:"Bu paket maliyet bilgisi içermiyor; kâr tahmini hazırlanamadı."};
 if(!validSelectedMonth(month))throw Error("INVALID_PAYLOAD");
 if(!covered(pkg,month))return {status:"source-unavailable",code:"MONTH_NOT_COVERED",message:"Seçili ay kaynak paketinin kapsamı dışında."};
 const quantities=new Map(pkg.snapshot.lines.map(row=>[row.ID!,row.MIKTAR_FIS]));
 const window=Array.from({length:6},(_,i)=>shift(month,i-5)).filter(m=>covered(pkg,m));
 const months=new Map(window.map(m=>{let entry=cache.get(m);if(!entry){const estimate=calculateSourceEstimate(pkg,m,hash);entry={estimate,products:productsOf(estimate)};cache.set(m,entry);}return [m,entry];}));
 const current=months.get(month)!,prevMonth=shift(month,-1),prev=months.get(prevMonth);
 const prevProducts=prev?.products;
 const missing=(p:Product)=>p.lines.some(l=>l.reason!==null&&COST_REASONS.has(l.reason));
 const totalGross=current.estimate.summary.contribution===null?null:new D(current.estimate.summary.contribution);
 const ranked=[...current.products].filter(([,p])=>p.totals.contribution!==null).map(([id,p])=>({id,gross:new D(p.totals.contribution!)})).sort((a,b)=>b.gross.comparedTo(a.gross)||byId(a.id,b.id)).map(r=>r.id);
 const rankOf=new Map(ranked.map((id,i)=>[id,i+1]));
 const products:MonthProfitProduct[]=[...current.products].map(([id,p])=>{
  const t=p.totals,known=new D(t.coveredSaleAmount??0),coveredLines=p.lines.filter(l=>l.reason===null);
  const quantity=coveredLines.length&&p.label.unit!==null?coveredLines.reduce((a,l)=>a.plus(quantities.get(l.lineId)!),new D(0)):null;
  const now=productMargin(p),before=productMargin(prevProducts?.get(id)),gross=t.contribution===null?null:new D(t.contribution);
  return {id,name:p.label.productName,category:p.label.categoryName,unit:p.label.unit,sales:t.candidateSaleAmount,cost:t.candidateCost,grossProfit:t.contribution,marginPct:pct(now),previousMarginPct:pct(before),unitPrice:quantity?.gt(0)?div2(known,quantity):null,unitCost:quantity?.gt(0)&&t.candidateCost!==null?div2(new D(t.candidateCost),quantity):null,quantity:quantity?.toFixed()??null,history:window.map(m=>({month:m,marginPct:pct(productMargin(months.get(m)!.products.get(id)))})),
   marginChangePoints:now===null||before===null?null:pct(now.minus(before)),
   unitProfit:quantity?.gt(0)&&gross!==null?div2(gross,quantity):null,
   profitSharePct:gross===null||totalGross===null?null:pct(ratio(gross,totalGross)),
   profitRank:gross===null?null:rankOf.get(id)!,
   flags:{loss:now?.lt(0)??false,lowMargin10:now?.lt(PRODUCT_FILTERS.lowMarginPct)??false,marginDrop:now!==null&&before!==null&&before.minus(now).gte(ATTENTION.marginDropPoints),missingCost:missing(p)}};
 }).map(p=>({p,sales:new D(p.sales??-1)})).sort((a,b)=>b.sales.comparedTo(a.sales)||byId(a.p.id,b.p.id)).map(r=>r.p);
 const categories=new Map<string,{sales:Decimal;gross:Decimal|null;known:Decimal}>();
 for(const p of current.products.values()){const name=p.label.categoryName;if(name===null)continue;const c=categories.get(name)??{sales:new D(0),gross:null,known:new D(0)};c.sales=c.sales.plus(p.totals.candidateSaleAmount??0);if(p.totals.contribution!==null){c.gross=(c.gross??new D(0)).plus(p.totals.contribution);c.known=c.known.plus(p.totals.coveredSaleAmount??0);}categories.set(name,c);}
 const margins=new Map(products.map(p=>[p.id,{now:productMargin(current.products.get(p.id)),before:productMargin(prev?.products.get(p.id))}]));
 const flag=(kind:AttentionKind,test:(p:MonthProfitProduct,rank:number)=>boolean)=>products.flatMap((p,rank)=>test(p,rank)?[{kind,productId:p.id}]:[]);
 const attention=[
  ...flag("loss",p=>p.flags.loss),
  ...flag("marginDrop",p=>p.flags.marginDrop),
  ...flag("lowMarginHighVolume",(p,rank)=>rank<ATTENTION.highVolumeRank&&(margins.get(p.id)!.now?.lt(ATTENTION.lowMarginPct)??false)),
  ...flag("missingCost",p=>p.flags.missingCost),
 ];
 const totalsByMonth=new Map(window.map(m=>[m,monthTotals(pkg,months.get(m)!.estimate,months.get(m)!.products,expenses)]));
 const totals=totalsByMonth.get(month)!;
 return {status:"month-profit",view:{version:MONTH_PROFIT_VERSION,month,dataFrom:pkg.snapshot.from>`${month}-01`?pkg.snapshot.from:`${month}-01`,dataUntil:pkg.snapshot.to<lastDay(month)?pkg.snapshot.to:lastDay(month),confidence:"estimate",source:{hash,extractedAt:pkg.snapshot.capturedAt,from:pkg.snapshot.from,to:pkg.snapshot.to},totals,previous:totalsByMonth.get(prevMonth)??null,changes:monthChanges(totals,totalsByMonth.get(prevMonth)??null,isPartial(pkg,month)||isPartial(pkg,prevMonth)),
  history:window.map(m=>{const t=totalsByMonth.get(m)!;return {month:m,sales:t.sales,grossProfit:t.grossProfit,marginPct:t.marginPct};}),
  products,categories:[...categories].map(([name,c])=>({name,sales:c.sales.toFixed(),grossProfit:c.gross?.toFixed()??null,marginPct:c.gross===null?null:pct(ratio(c.gross,c.known))})).sort((a,b)=>new D(b.sales).comparedTo(a.sales)||a.name.localeCompare(b.name,"tr")),attention}};
}
