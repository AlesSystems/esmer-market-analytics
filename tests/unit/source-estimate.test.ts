import {expect,test} from "vitest";
import {writeRawPackage} from "../../src/source/raw-package";
import {calculateSourceEstimate,querySourceEstimate,validEstimateRequest} from "../../src/source/estimate";
import {estimateSnapshot,estimateParsed} from "../helpers/estimate-fixture";
const hash="a".repeat(64);
test("covered sales preserve loss; returns have separate signed exposure and no cost contribution",()=>{
 const s=estimateSnapshot();s.headers.push({...s.headers[0],ID:"3",FIS_TURU:"12"});s.lines.push({...s.lines[0],ID:"4",FIS:"3",FIS_TURU:"12",TOPLAM_KDV_MATRAHI:"30"});
 const r=calculateSourceEstimate(estimateParsed(s),"2025-10",hash);
 expect(r.summary).toMatchObject({candidateSaleAmount:"120",candidateReturnAmount:"-30",coveredSaleAmount:"120",candidateCost:"140",contribution:"-20",coveredLines:1,totalLines:2,costCoveragePercent:"80.00"});
 expect(r.lines[1]).toMatchObject({reason:"RETURN_COST",candidateCost:null,contribution:null});
 expect(()=>writeRawPackage(s,"fixture:estimate","batch-1")).toThrow();
 expect(r.products[0].totals).toEqual(r.summary);expect(r.days[0].totals).toEqual(r.summary);expect(r.days[12].totals).toBeNull();
});
test("each period line has one primary exclusion and unknown amounts stay explicit",()=>{
 const variants=[{FIS_TURU:"35"},{FIS_TURU:"1"},{CURRENCY:"USD"},{DURUM:"0"},{amount:null},{FIS_TURU:"12"},{quantity:"0"},{multiplier:"2"},{cost:null},{cost:"0"},{cost:"-1"}];
 const reasons=["TYPE_35","OTHER_TYPE","CURRENCY","STATUS","AMOUNT","RETURN_COST","QUANTITY","MULTIPLIER","COST_MISSING","COST_ZERO","COST_NEGATIVE"];
 const s=estimateSnapshot(),h=s.headers[0],l=s.lines[0];s.headers=[];s.lines=[];
 variants.forEach((v,i)=>{const id=String(i+1);s.headers.push({...h,ID:id,FIS_TURU:v.FIS_TURU??"11",CURRENCY:v.CURRENCY??"TRY",DURUM:v.DURUM??"1"});s.lines.push({...l,ID:id,FIS:id,FIS_TURU:v.FIS_TURU??"11",TOPLAM_KDV_MATRAHI:"amount"in v?v.amount!:"10",MIKTAR_FIS:v.quantity??"1",CARPAN:v.multiplier??"1",BELGE_TARIHINDEKI_SON_ALIS_FIYATI:"cost"in v?v.cost!:"5"});});
 const r=calculateSourceEstimate(estimateParsed(s),"2025-10",hash);
 expect(r.lines.map(l=>l.reason)).toEqual(reasons);expect(Object.values(r.summary.exclusions).reduce((a,b)=>a+b,0)).toBe(11);
 expect(r.summary).toMatchObject({contribution:null,candidateCost:null,coveredSaleAmount:null,unknownSaleAmounts:1,costCoveragePercent:"0.00"});
});
test("no operands is null, known zero and genuine zero contribution remain calculated",()=>{
 const s=estimateSnapshot();s.lines[0].TOPLAM_KDV_MATRAHI=null;
 expect(calculateSourceEstimate(estimateParsed(s),"2025-10",hash).summary).toMatchObject({candidateSaleAmount:null,contribution:null});
 s.lines[0].TOPLAM_KDV_MATRAHI="0";s.lines[0].BELGE_TARIHINDEKI_SON_ALIS_FIYATI=null;
 expect(calculateSourceEstimate(estimateParsed(s),"2025-10",hash).summary).toMatchObject({candidateSaleAmount:"0",contribution:null,costCoveragePercent:null});
 s.lines[0].TOPLAM_KDV_MATRAHI="140";s.lines[0].BELGE_TARIHINDEKI_SON_ALIS_FIYATI="70";
 expect(calculateSourceEstimate(estimateParsed(s),"2025-10",hash).summary.contribution).toBe("0");
 expect(calculateSourceEstimate(estimateParsed(s),"2025-11",hash).summary).toMatchObject({candidateSaleAmount:null,contribution:null,totalLines:0});
 s.headers[0].FIS_TURU="12";s.lines[0].FIS_TURU="12";
 expect(calculateSourceEstimate(estimateParsed(s),"2025-10",hash).summary).toMatchObject({candidateSaleAmount:null,candidateReturnAmount:"-140",candidateCost:null,contribution:null,costCoveragePercent:"0.00"});
});
test("200 digit arithmetic preserves smallest tail of 140 digit multiplication and exact sums",()=>{
 const s=estimateSnapshot();s.lines[0].MIKTAR_FIS=`${"9".repeat(40)}.${"9".repeat(30)}`;s.lines[0].BELGE_TARIHINDEKI_SON_ALIS_FIYATI=s.lines[0].MIKTAR_FIS;
 const r=calculateSourceEstimate(estimateParsed(s),"2025-10",hash);
 const scaled=BigInt("9".repeat(70));const square=(scaled*scaled).toString().padStart(61,"0");const expected=`${square.slice(0,-60)}.${square.slice(-60)}`;
 expect(r.summary.candidateCost).toBe(expected);expect(r.summary.candidateCost!.length).toBeGreaterThan(100);
});
test("hash-pinned requests are exact, bounded and never return replaced values",()=>{
 const q={hash,period:"2025-10",view:"products" as const,offset:0,productId:null};expect(validEstimateRequest(q)).toBe(true);
 for(const v of [{...q,offset:-1},{...q,sql:"SELECT"},{...q,period:"2025-13"},{...q,view:"arbitrary"}])expect(validEstimateRequest(v)).toBe(false);
 expect(querySourceEstimate(estimateParsed(),"b".repeat(64),q)).toMatchObject({status:"source-unavailable",code:"SOURCE_CHANGED"});
});
test("ranking lists top 10 products by decimal contribution, excludes unknown, ties by numeric productId, in every view",()=>{
 const s=estimateSnapshot(),l=s.lines[0];s.lines=[];
 const add=(productId:string,amount:string,cost:string|null)=>s.lines.push({...l,ID:String(s.lines.length+10),STOK:productId,MIKTAR_FIS:"1",TOPLAM_KDV_MATRAHI:amount,BELGE_TARIHINDEKI_SON_ALIS_FIYATI:cost});
 add("10","20.5","10");add("9","20.5","10");add("3","9.75","0");add("3","10","0.25");add("1","5",null);add("21","1","6");
 for(let i=1;i<=10;i++)add(String(10+i),String(i+1),"1");
 const expectedIds=["9","10","20","3","19","18","17","16","15","14"];
 for(const view of ["summary","products","evidence"] as const){
  const r=querySourceEstimate(estimateParsed(s),hash,{hash,period:"2025-10",view,offset:0,productId:null});
  if(r.status!=="source-estimate")throw Error("missing");
  expect(r.ranking.map(p=>p.productId)).toEqual(expectedIds);
  expect(r.ranking[0]).toEqual({productId:"9",coveredSaleAmount:"20.5",contribution:"10.5",candidateSaleAmount:"20.5",candidateReturnAmount:null,uncoveredSaleAmount:"0",costCoveragePercent:"100.00",productName:null,categoryName:null,unit:null});
 }
 const r=querySourceEstimate(estimateParsed(s),hash,{hash,period:"2025-10",view:"summary",offset:0,productId:null});
 if(r.status!=="source-estimate")throw Error("missing");
 expect(r.ranking.map(p=>p.contribution)).toEqual(["10.5","10.5","10","9.75","9","8","7","6","5","4"]);
 expect(r.ranking.every(p=>p.productId!=="1"&&p.productId!=="21")).toBe(true);
});
test("ranking is empty when no product has covered lines and keeps negative contributions ordered numerically",()=>{
 const s=estimateSnapshot();s.lines[0].BELGE_TARIHINDEKI_SON_ALIS_FIYATI=null;
 const q={hash,period:"2025-10",view:"summary" as const,offset:0,productId:null};
 const empty=querySourceEstimate(estimateParsed(s),hash,q);if(empty.status!=="source-estimate")throw Error("missing");expect(empty.ranking).toEqual([]);
 const t=estimateSnapshot(),l=t.lines[0];t.lines=[{...l,ID:"20",STOK:"2",TOPLAM_KDV_MATRAHI:"1",BELGE_TARIHINDEKI_SON_ALIS_FIYATI:"11"},{...l,ID:"21",STOK:"3",TOPLAM_KDV_MATRAHI:"1",BELGE_TARIHINDEKI_SON_ALIS_FIYATI:"2"}];
 const r=querySourceEstimate(estimateParsed(t),hash,q);if(r.status!=="source-estimate")throw Error("missing");expect(r.ranking.map(p=>[p.productId,p.contribution])).toEqual([["3","-3"],["2","-21"]]);
});
test("uncovered sale amount is candidate minus covered sale in the service for summary, days, products and ranking",()=>{
 const s=estimateSnapshot(),l=s.lines[0];s.lines=[];
 const add=(productId:string,amount:string|null,cost:string|null)=>s.lines.push({...l,ID:String(s.lines.length+10),STOK:productId,TOPLAM_KDV_MATRAHI:amount,BELGE_TARIHINDEKI_SON_ALIS_FIYATI:cost});
 add("1","100","10");add("1","40.5",null);add("2","0.3",null);add("3",null,"5");
 const r=calculateSourceEstimate(estimateParsed(s),"2025-10",hash),by=Object.fromEntries(r.products.map(p=>[p.productId,p.totals.uncoveredSaleAmount]));
 expect(r.summary).toMatchObject({candidateSaleAmount:"140.8",coveredSaleAmount:"100",uncoveredSaleAmount:"40.8"});
 expect(by).toEqual({"1":"40.5","2":"0.3","3":null});expect(r.days[0].totals!.uncoveredSaleAmount).toBe("40.8");expect(r.days[1].totals).toMatchObject({candidateSaleAmount:null,uncoveredSaleAmount:null});expect(r.days[12].totals).toBeNull();
 const q=querySourceEstimate(estimateParsed(s),hash,{hash,period:"2025-10",view:"summary",offset:0,productId:null});if(q.status!=="source-estimate")throw Error("missing");
 expect(q.ranking).toEqual([{productId:"1",coveredSaleAmount:"100",contribution:"80",candidateSaleAmount:"140.5",candidateReturnAmount:null,uncoveredSaleAmount:"40.5",costCoveragePercent:"71.17",productName:null,categoryName:null,unit:null}]);
});
