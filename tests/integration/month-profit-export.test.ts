import {expect,test} from "vitest";
import {readSheet} from "read-excel-file/node";
import {handleRequest} from "../../src/desktop/requests";
import {excelMonthProfit} from "../../src/source/month-profit-export";
import type {MonthProfitView,MonthProfitTotals} from "../../src/source/month-profit";

const totals=(over:Partial<MonthProfitTotals>={}):MonthProfitTotals=>({sales:"1000.5",knownCostSales:"800",cost:"600",grossProfit:"200",marginPct:"25.00",costKnownPct:"80.00",unknownCostSales:"200.5",unknownCostProducts:1,returns:null,unknownSaleAmounts:0,unknownReturnAmounts:0,receipts:12,averageBasket:"83.38",expenses:null,expensesComplete:false,netProfit:null,netProfitReason:"expensesMissing",...over});
const view:MonthProfitView={version:"month-profit-v1",month:"2025-10",dataFrom:"2025-10-01",dataUntil:"2025-10-20",confidence:"estimate",source:{hash:"a".repeat(64),extractedAt:"2025-10-21T08:00:00Z",from:"2025-08-01",to:"2025-10-20"},totals:totals(),previous:null,changes:null,history:[],
 products:[{id:"1",name:"Süt",category:"Süt ürünleri",unit:"adet",sales:"500",cost:"350",grossProfit:"150",marginPct:"30.00",previousMarginPct:null,unitPrice:"10.00",unitCost:"7.00",quantity:"50",history:[],marginChangePoints:null,unitProfit:null,profitSharePct:null,profitRank:1,flags:{loss:false,lowMargin10:false,marginDrop:false,missingCost:true}},
  {id:"2",name:null,category:null,unit:null,sales:"100.5",cost:null,grossProfit:null,marginPct:null,previousMarginPct:null,unitPrice:null,unitCost:null,quantity:null,history:[],marginChangePoints:null,unitProfit:null,profitSharePct:null,profitRank:null,flags:{loss:false,lowMargin10:false,marginDrop:false,missingCost:true}}],categories:[],attention:[]};

test("month profit workbook has Özet, Ürünler and Giderler with literal values and empty cells for unknowns",async()=>{
 const book=await excelMonthProfit(view);
 const summary=await readSheet(book,"Özet");
 const row=(rows:unknown[][],label:string)=>rows.find(r=>r[0]===label)!;
 expect(summary.flat()).toContain("Doğrulanmamış tahmin — kesin kâr değildir");
 expect(summary.flat()).toContain("2025-10");
 expect(row(summary,"Satış").slice(0,2)).toEqual(["Satış","1000.5"]);
 expect(row(summary,"Tahmini brüt kâr")[1]).toBe("200");
 expect(row(summary,"Marj (%)")[1]).toBe("25.00");
 expect(row(summary,"İadeler")[1]).toBeNull();
 expect(row(summary,"İadeler")[2]).toBe("Bilinmiyor");
 expect(row(summary,"Tahmini net kâr")[1]).toBeNull();
 expect(row(summary,"Tahmini net kâr")[2]).toBe("Bu ayın giderleri girilmedi");
 const products=await readSheet(book,"Ürünler");
 expect(row(products,"Süt").slice(0,6)).toEqual(["Süt","Süt ürünleri","500","350","150","30.00"]);
 const unnamed=row(products,"Ürün #2");
 expect(unnamed.slice(1,6)).toEqual([null,"100.5",null,null,null]);
 expect(unnamed.at(-1)).toContain("Maliyet bilinmiyor");
 expect(unnamed.at(-1)).toContain("Birim değerleri bilinmiyor");
 expect(row(products,"Süt").at(-1)).toBe("Bazı satışlarının maliyeti bilinmiyor; kâr yalnız maliyeti bilinen satışlardan hesaplandı");
 const expenses=await readSheet(book,"Giderler");
 expect(row(expenses,"Giderler toplamı")[1]).toBeNull();
 expect(row(expenses,"Giderler toplamı")[2]).toBe("Bilinmiyor");
 const paid=await readSheet(await excelMonthProfit({...view,totals:totals({expenses:"50",expensesComplete:true,netProfit:"150",netProfitReason:null})}),"Giderler");
 expect(row(paid,"Giderler toplamı")[1]).toBe("50");
 expect(row(paid,"Tahmini net kâr")[1]).toBe("150");
});

test("unknown sale and return amounts are exported with their counts and a bilinen alt toplam note, never as 0",async()=>{
 const book=await excelMonthProfit({...view,totals:totals({sales:null,unknownCostSales:"0",unknownSaleAmounts:2,returns:"-5",unknownReturnAmounts:1})});
 const summary=await readSheet(book,"Özet");
 const row=(label:string)=>summary.find(r=>r[0]===label)!;
 expect(row("Satış").slice(1)).toEqual([null,"Bilinmiyor"]);
 expect(row("Maliyeti bilinmeyen satış").slice(1)).toEqual([null,"Bilinmiyor"]);
 expect(row("İadeler").slice(1)).toEqual(["-5","bilinen alt toplam"]);
 expect(row("Tutarı bilinmeyen satış satırı")[1]).toBe("2");
 expect(row("Tutarı bilinmeyen iade satırı")[1]).toBe("1");
 const known=await readSheet(await excelMonthProfit({...view,totals:totals({unknownCostSales:"40",unknownSaleAmounts:1})}),"Özet");
 expect(known.find(r=>r[0]==="Maliyeti bilinmeyen satış")!.slice(1)).toEqual(["40","bilinen alt toplam"]);
 expect(known.find(r=>r[0]==="Satış")![2]).toBe("bilinen alt toplam");
});

test("named exportMonthProfit IPC denies sender, extra keys and bad months before calling the service",async()=>{
 let called=0;const service=async()=>{called++;return {status:"cancelled" as const};};
 const hash="a".repeat(64);const run=(trusted:boolean,payload:unknown)=>handleRequest(trusted,"exportMonthProfit",payload,async()=>({status:"ready",store:"empty",liveConnection:"disabled"}),undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,service);
 expect(await run(false,{month:"2025-10",hash})).toMatchObject({code:"UNTRUSTED_SENDER"});
 for(const payload of [{month:"2025-10"},{month:"2025-10",hash:"abc"},{month:"2025-10",hash:1},{hash},{month:"2025-10",hash,path:"/tmp/x"},{month:"2025-13",hash},{month:"2025-1",hash},{month:202510,hash},{},null,"2025-10",[]])expect(await run(true,payload)).toMatchObject({code:"INVALID_PAYLOAD"});
 expect(called).toBe(0);
 expect(await run(true,{month:"2025-10",hash})).toEqual({status:"cancelled"});expect(called).toBe(1);
});
