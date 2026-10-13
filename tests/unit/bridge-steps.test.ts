import {describe,expect,test} from "vitest";
import {bridgeSteps} from "../../src/ui/overview/financial-charts";
import {sourceBridgeSteps} from "../../src/ui/source-estimate-days";
import {isZeroDecimal} from "../../src/ui/format";
import type {MonthlyDisplay} from "../../src/reports/display";
import type {EstimateTotals} from "../../src/source/estimate";

const report=(excludedSales:string)=>({format:"monthly-report-v2",purchasing:{gross:{status:"unavailable"}},productProfit:{summary:{coveredSales:"100",coveredCost:"60",coveredGrossProfit:"40",exposures:{excludedSales,excludedReturns:"0"}}}}) as unknown as MonthlyDisplay;
const totals=(uncoveredSaleAmount:string|null,unknownSaleAmounts=0)=>({coveredSaleAmount:"100",candidateCost:"60",contribution:"40",uncoveredSaleAmount,unknownSaleAmounts}) as unknown as EstimateTotals;

describe("decimal zero check",()=>{
 test("matches decimal-string zeros only",()=>{
  for(const zero of ["0","0.00","-0","00.000","-0.0"])expect(isZeroDecimal(zero)).toBe(true);
  for(const other of ["0.01","10","-1","100.0","0.10","1e0"])expect(isZeroDecimal(other)).toBe(false);
 });
});

describe("financial bridge",()=>{
 test("omits the missing-cost step when excluded sales are a decimal zero",()=>{
  for(const zero of ["0","0.00","-0.000"])expect(bridgeSteps(report(zero))!.map(step=>step.kind)).toEqual(["total","minus","result"]);
 });
 test("keeps a known missing-cost step hatched with a cost-unknown detail and no zero claim",()=>{
  const step=bridgeSteps(report("25.50"))!.at(-1)!;
  expect(step).toMatchObject({kind:"unknown",value:"25.50",detail:"maliyeti bilinmiyor · kâra dahil değil"});
  expect(step.detail).not.toContain("sıfır");
 });
});

describe("source bridge",()=>{
 test("keeps the uncovered step when unknown sale amounts hide behind a zero known subtotal",()=>{
  const step=sourceBridgeSteps(totals("0",2)).at(-1)!;
  expect(step).toMatchObject({kind:"unknown",value:"0"});
  expect(step.detail).toContain("bilinen alt toplam");
 });
 test("omits the uncovered step when the known subtotal is a decimal zero",()=>{
  for(const zero of ["0","0.00"])expect(sourceBridgeSteps(totals(zero)).map(step=>step.kind)).toEqual(["total","minus","result"]);
 });
 test("keeps an unknown uncovered subtotal as a null step and a known one as a hatched amount",()=>{
  expect(sourceBridgeSteps(totals(null)).at(-1)).toMatchObject({kind:"unknown",value:null});
  expect(sourceBridgeSteps(totals("40.8")).at(-1)).toMatchObject({kind:"unknown",value:"40.8",detail:"maliyeti bilinmiyor · kâra dahil değil"});
  expect(sourceBridgeSteps(totals("40.8",2)).at(-1)!.detail).toContain("bilinen alt toplam");
 });
});
