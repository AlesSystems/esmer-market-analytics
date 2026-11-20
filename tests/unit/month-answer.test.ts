import {expect,test} from "vitest";
import {attentionRows,netCardState} from "../../src/ui/pages/month-answer";

test("attention shows at most four product rows, one per product, and counts missing-cost products once",()=>{
 const rows=attentionRows([
  {kind:"loss",productId:"3"},{kind:"marginDrop",productId:"1"},{kind:"marginDrop",productId:"5"},
  {kind:"lowMarginHighVolume",productId:"4"},{kind:"lowMarginHighVolume",productId:"3"},{kind:"lowMarginHighVolume",productId:"9"},
  {kind:"missingCost",productId:"2"},{kind:"missingCost",productId:"8"},
 ]);
 expect(rows.products).toEqual([{kind:"loss",productId:"3"},{kind:"marginDrop",productId:"1"},{kind:"marginDrop",productId:"5"},{kind:"lowMarginHighVolume",productId:"4"}]);
 expect(rows.missingCost).toBe(2);
});

test("attention with nothing to show is empty",()=>{
 expect(attentionRows([])).toEqual({products:[],missingCost:0});
 expect(attentionRows([{kind:"missingCost",productId:"2"}])).toEqual({products:[],missingCost:1});
});

test("the net card follows service amounts and directs expense-related reasons to Giderler",()=>{
 const totals={grossProfit:"57.50",expenses:"10",netProfit:"47.50",netProfitReason:null};
 expect(netCardState(totals)).toEqual({kind:"amount",grossProfit:"57.50",expenses:"10",netProfit:"47.50"});
 expect(netCardState({...totals,netProfit:"57.50",expenses:"0.00"})).toEqual({kind:"amount",grossProfit:"57.50",expenses:"0.00",netProfit:"57.50"});
 const missing={grossProfit:"57.50",netProfit:null,expenses:null};
 expect(netCardState({...missing,netProfitReason:"expensesMissing"})).toEqual({kind:"missing",reason:"expensesMissing",toExpenses:true});
 expect(netCardState({...missing,netProfitReason:"confirmationStale"})).toEqual({kind:"missing",reason:"confirmationStale",toExpenses:true});
 expect(netCardState({...missing,netProfitReason:"monthPartial"})).toEqual({kind:"missing",reason:"monthPartial",toExpenses:false});
 expect(netCardState({...missing,grossProfit:null,netProfitReason:"costUnknown"})).toEqual({kind:"missing",reason:"costUnknown",toExpenses:false});
});
