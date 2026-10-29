import type {AttentionKind,MonthProfitTotals,MonthProfitView,NetProfitReason} from "../../source/month-profit";
import {date,isZeroDecimal} from "../format";

const shown=new Set<AttentionKind>(["loss","marginDrop","lowMarginHighVolume"]);
const MOST=4;

/** Bu ay lists at most four products worth a look (one row each, worst reason first) and counts the products without a purchase price once, never one row per product. */
export function attentionRows(attention:MonthProfitView["attention"]):{products:MonthProfitView["attention"];missingCost:number} {
 const seen=new Set<string>(),products:MonthProfitView["attention"]=[];
 for(const row of attention){
  if(!shown.has(row.kind)||seen.has(row.productId)||products.length===MOST)continue;
  seen.add(row.productId);products.push(row);
 }
 return {products,missingCost:new Set(attention.filter(row=>row.kind==="missingCost").map(row=>row.productId)).size};
}

export type NetCard={kind:"amount"}|{kind:"same"}|{kind:"missing";reason:NonNullable<MonthProfitTotals["netProfitReason"]>;toExpenses:boolean};
const expenseReasons=new Set(["expensesMissing","expensesIncomplete","expensesBlocked","unknownTax","confirmationStale"]);

/** Which of the three net-profit cards to draw. Only the entered expenses can fix the reasons that lead to Giderler. */
export function netCardState(t:Pick<MonthProfitTotals,"netProfit"|"expenses"|"netProfitReason">):NetCard {
 if(t.netProfit!==null)return t.expenses!==null&&isZeroDecimal(t.expenses)?{kind:"same"}:{kind:"amount"};
 const reason=t.netProfitReason??"costUnknown";
 return {kind:"missing",reason,toExpenses:expenseReasons.has(reason)};
}

const reasonText:Record<NetProfitReason,string>={
 costUnknown:"Maliyetler bilinmediği için hesaplanamadı",
 monthPartial:"Ay henüz tamamlanmadı",
 expensesMissing:"Bu ayın giderleri girilmedi",
 expensesIncomplete:"Bu ayın giderleri tamamlanmadı",
 expensesBlocked:"Bazı gider satırları net kârı engelliyor",
 unknownTax:"Bazı giderlerin KDV durumu bilinmiyor",
 confirmationStale:"Giderler onaydan sonra değişti; yeniden onaylayın",
};
/** The one sentence under "Net kâr" when no net figure exists. A part-way month also says how far the data goes. */
export const netReasonText=(reason:NetProfitReason,dataUntil:string)=>reason==="monthPartial"?`${reasonText[reason]} (${date(dataUntil)} tarihine kadar veri)`:reasonText[reason];
