import Decimal from "decimal.js";
import { expect, test } from "vitest";
import { calculateSourceEstimate, type EstimateLine } from "../../src/source/estimate";
import { estimateParsed, estimateSnapshot } from "../helpers/estimate-fixture";
const D=Decimal.clone({precision:200});
const fields=["candidateSaleAmount","candidateReturnAmount","coveredSaleAmount","candidateCost","contribution"] as const;
const originalSum=(lines:EstimateLine[],field:typeof fields[number])=>{const values=lines.map(line=>line[field]).filter((value):value is string=>value!==null);return values.length?values.reduce((total,value)=>total.plus(value),new D(0)).toFixed():null;};

test("singleton totals match the prior decimal aggregation at all admitted numeric boundaries",()=>{
 for(const amount of [null,"0","-0","-1","0.000000000000000000000000000001","120.00",`${"9".repeat(40)}.${"9".repeat(30)}`])for(const type of ["11","12"])for(const cost of [null,"0","-1","70.00",`${"9".repeat(40)}.${"9".repeat(30)}`]){
  const snapshot=estimateSnapshot();snapshot.headers[0].FIS_TURU=type;Object.assign(snapshot.lines[0],{FIS_TURU:type,TOPLAM_KDV_MATRAHI:amount,BELGE_TARIHINDEKI_SON_ALIS_FIYATI:cost,MIKTAR_FIS:`${"9".repeat(40)}.${"9".repeat(30)}`});
  const result=calculateSourceEstimate(estimateParsed(snapshot),"2025-10","a".repeat(64));
  for(const field of fields){expect(result.summary[field]).toBe(originalSum(result.lines,field));expect(result.products[0].totals[field]).toBe(originalSum(result.lines,field));}
 }
});
