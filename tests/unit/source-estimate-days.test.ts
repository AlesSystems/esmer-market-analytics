import {expect,test} from "vitest";
import {calculateSourceEstimate} from "../../src/source/estimate";
import {dailyDay,dailySeries} from "../../src/ui/source-estimate-days";
import {estimateParsed,estimateSnapshot} from "./../helpers/estimate-fixture";

const hash="a".repeat(64);
function build(add:(push:(productId:string,amount:string|null,cost:string|null)=>void)=>void){
 const s=estimateSnapshot(),l=s.lines[0];s.lines=[];
 add((productId,amount,cost)=>{s.lines.push({...l,ID:String(s.lines.length+10),STOK:productId,TOPLAM_KDV_MATRAHI:amount,BELGE_TARIHINDEKI_SON_ALIS_FIYATI:cost});});
 return calculateSourceEstimate(estimateParsed(s),"2025-10",hash).days[0];
}

test("a day with unknown sale amounts keeps a null segment so the chart cannot look complete",()=>{
 const day=build(push=>{push("1","100","10");push("2",null,"5");});
 expect(day.totals!.unknownSaleAmounts).toBe(1);
 const chart=dailyDay(day);
 expect(chart.state).toBe("value");
 expect(chart.segments.find(segment=>segment.key==="unknownAmount")).toEqual({key:"unknownAmount",value:null});
 expect(chart.segments.find(segment=>segment.key==="uncovered")!.value).toBe(day.totals!.uncoveredSaleAmount);
 expect(dailySeries.find(item=>item.key==="unknownAmount")!.label).toBe("Tutarı bilinmeyen satış");
});

test("a day without unknown amounts has no unknown segment",()=>{
 const chart=dailyDay(build(push=>{push("1","100","10");push("2","40",null);}));
 expect(chart.segments.map(segment=>segment.key)).toEqual(["cost","contribution","uncovered"]);
 expect(chart.negativeUnknown).toBeUndefined();
});

test("a known return subtotal with unknown return amounts is flagged for the hatched stub",()=>{
 const s=estimateSnapshot(),l=s.lines[0],header=s.headers[0];
 expect(header.FIS_TURU).toBe("11");
 const returnHeader={...header,ID:"900",FIS_TURU:"12"};s.headers.push(returnHeader);
 s.lines=[{...l,ID:"10",FIS:header.ID,TOPLAM_KDV_MATRAHI:"100",BELGE_TARIHINDEKI_SON_ALIS_FIYATI:"10"},{...l,ID:"11",FIS:"900",FIS_TURU:"12",TOPLAM_KDV_MATRAHI:"20",BELGE_TARIHINDEKI_SON_ALIS_FIYATI:"10"},{...l,ID:"12",FIS:"900",FIS_TURU:"12",TOPLAM_KDV_MATRAHI:null,BELGE_TARIHINDEKI_SON_ALIS_FIYATI:"10"}];
 const day=calculateSourceEstimate(estimateParsed(s),"2025-10",hash).days[0];
 expect(day.totals).toMatchObject({unknownReturnAmounts:1,candidateReturnAmount:"-20"});
 expect(dailyDay(day)).toMatchObject({negative:"-20",negativeUnknown:true});
});
