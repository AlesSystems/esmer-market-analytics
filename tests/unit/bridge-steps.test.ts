import {describe,expect,test} from "vitest";
import {monthBridgeSteps} from "../../src/ui/pages/month-summary";
import type {MonthProfitTotals} from "../../src/source/month-profit";
import {isZeroDecimal} from "../../src/ui/format";

const totals=(patch:Partial<MonthProfitTotals>={})=>({sales:"480",knownCostSales:"430",cost:"372.5",grossProfit:"57.5",unknownCostSales:"50",unknownSaleAmounts:0,expenses:null,netProfit:null,...patch}) as MonthProfitTotals;

describe("decimal zero check",()=>{
 test("matches decimal-string zeros only",()=>{
  for(const zero of ["0","0.00","-0","00.000","-0.0"])expect(isZeroDecimal(zero)).toBe(true);
  for(const other of ["0.01","10","-1","100.0","0.10","1e0"])expect(isZeroDecimal(other)).toBe(false);
 });
});

describe("month bridge",()=>{
 test("sets unknown-cost sales aside before the known-cost base, and keeps missing expenses and net as unknown steps",()=>{
  expect(monthBridgeSteps(totals())).toEqual([
   {label:"Satış",value:"480",kind:"total"},
   {label:"Maliyeti bilinmeyen satış",value:"50",kind:"unknown",detail:"kenara ayrıldı · kâra dahil değil"},
   {label:"Maliyeti bilinen satış",value:"430",kind:"total"},
   {label:"Mal maliyeti",value:"372.5",kind:"minus"},
   {label:"Brüt kâr",value:"57.5",kind:"total"},
   {label:"Giderler",value:null,kind:"minus",detail:"eksik"},
   {label:"Net kâr",value:null,kind:"result",detail:"hesaplanamadı"},
  ]);
 });
 test("without unknown-cost sales the bridge starts at sales; known expenses and net are drawn",()=>{
  expect(monthBridgeSteps(totals({sales:"510",knownCostSales:"510",cost:"408",grossProfit:"102",unknownCostSales:"0",expenses:"30",netProfit:"72"}))).toEqual([
   {label:"Satış",value:"510",kind:"total"},{label:"Mal maliyeti",value:"408",kind:"minus"},{label:"Brüt kâr",value:"102",kind:"total"},{label:"Giderler",value:"30",kind:"minus"},{label:"Net kâr",value:"72",kind:"result"},
  ]);
 });
 test("a zero known subtotal with unknown sale amounts still keeps the set-aside step",()=>{
  expect(monthBridgeSteps(totals({unknownCostSales:"0",unknownSaleAmounts:2}))[1]).toMatchObject({kind:"unknown",value:"0",detail:"kenara ayrıldı · kâra dahil değil · bilinen alt toplam"});
 });
});
