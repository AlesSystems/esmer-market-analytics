import type {EstimateTotals} from "../source/estimate";
import type {BridgeStep,DailyDay} from "./charts";
import {isZeroDecimal} from "./format";

export const dailySeries=[{key:"cost",label:"Tahmini maliyet adayı",color:"var(--viz-cost)"},{key:"contribution",label:"Tahmini katkı",color:"var(--viz-contribution)"},{key:"uncovered",label:"Maliyeti bilinmeyen satış",color:"var(--viz-sales)"},{key:"unknownAmount",label:"Tutarı bilinmeyen satış",color:"var(--viz-sales)"}];

/**
 * Service strings pass through untouched; unknown stays null. A day without any recorded line is unknown, never zero.
 * `uncoveredSaleAmount` is only the known subtotal when sale lines have unknown amounts, so such a day gets a hatched
 * segment; likewise a known return subtotal with unknown return amounts keeps a hatched stub below it.
 */
export function dailyDay(day:{date:string;totals:EstimateTotals|null}):DailyDay {
 const t=day.totals;
 if(t===null)return {date:day.date,segments:[],state:"out-of-range"};
 const sales=t.totalLines===0||t.saleCandidateLines===0?[]:[{key:"cost",value:t.candidateCost},{key:"contribution",value:t.contribution},{key:"uncovered",value:t.uncoveredSaleAmount},...(t.unknownSaleAmounts>0?[{key:"unknownAmount",value:null}]:[])];
 return {date:day.date,state:"value",segments:sales,...(t.returnCandidateLines>0?{negative:t.candidateReturnAmount,...(t.unknownReturnAmounts>0&&t.candidateReturnAmount!==null?{negativeUnknown:true}:{})}:{})};
}

/** Covered sales, less candidate cost, equals contribution. Sales without cost stay a hatched step that is omitted when its known subtotal is exactly zero. */
export function sourceBridgeSteps(t:EstimateTotals):BridgeStep[] {
 const uncovered=t.uncoveredSaleAmount;
 return [{label:"Kapsanan satış adayı",value:t.coveredSaleAmount,kind:"total"},{label:"Tahmini maliyet adayı",value:t.candidateCost,kind:"minus"},{label:"Tahmini katkı",value:t.contribution,kind:"result"},
  ...(uncovered!==null&&isZeroDecimal(uncovered)&&t.unknownSaleAmounts===0?[]:[{label:"Maliyeti bilinmeyen satış",value:uncovered,kind:"unknown" as const,detail:`maliyeti bilinmiyor · kâra dahil değil${t.unknownSaleAmounts>0?" · bilinen alt toplam":""}`}])];
}
