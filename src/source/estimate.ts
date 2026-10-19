import Decimal from "decimal.js";
import type {RawPackage} from "./raw-package";
const D=Decimal.clone({precision:200});
export const ESTIMATE_VERSION="source-estimate-v1";
export const reasonLabels={TYPE_35:"Tür 35: olası çift sayım",OTHER_TYPE:"Diğer belge türü",CURRENCY:"Para birimi desteklenmiyor",STATUS:"Durum / aktif kodu desteklenmiyor",AMOUNT:"Tutar eksik veya negatif",RETURN_COST:"İade maliyeti eşleştirilmedi",QUANTITY:"Miktar eksik veya pozitif değil",MULTIPLIER:"Çarpan bir değil veya bilinmiyor",COST_MISSING:"Maliyet eksik",COST_ZERO:"Sıfır maliyet doğrulanmadı",COST_NEGATIVE:"Negatif maliyet"} as const;
export type EstimateReason=keyof typeof reasonLabels;
export const estimateAssumptions=[
 ["sale-type11","Tür 11 satış adayı; tamamlanmış satış olduğu doğrulanmadı."],
 ["return-type12","Tür 12 iade tutarı adayı; maliyet ve katkısı eşleştirilmedi."],
 ["exclude-type35","Tür 35 olası çift sayım nedeniyle dışlandı."],
 ["try-status1","Yalnız TRY, durum 1 ve aktif 1 kayıtları seçildi."],
 ["recorded-date","Ay, kaydedilmiş belge tarihiyle seçildi; iş tarihi anlamı doğrulanmadı."],
 ["recorded-amount","Tutar adayı TOPLAM_KDV_MATRAHI; KDV hariç satış anlamı doğrulanmadı."],
 ["candidate-cost","Pozitif miktar × pozitif tarihsel alış alanı; birim, vergi ve işlem zamanı aynı kabul edildi, doğrulanmadı."],
 ["multiplier1","Maliyet yalnız çarpan 1 için hesaplandı."],
 ["no-unit-claim","Fiziksel birim bilinmiyor; miktarlar toplanmadı."],
 ["partial-coverage","Eksik, sıfır ve negatif maliyet sıfır gider sayılmadı; katkı yalnız kapsanan satışları içerir."],
 ["return-warning","Katkı iadelerin ekonomik etkisini içermez ve sonucu yüksek gösterebilir."],
 ["unverified","Bu görünüm doğrulanmamış tahmindir; marketin net kârı değildir. Giderler dahil değildir."],
] as const;
export type EstimateTotals={totalLines:number;coveredLines:number;saleCandidateLines:number;returnCandidateLines:number;unknownSaleAmounts:number;unknownReturnAmounts:number;candidateSaleAmount:string|null;candidateReturnAmount:string|null;coveredSaleAmount:string|null;uncoveredSaleAmount:string|null;candidateCost:string|null;contribution:string|null;costCoveragePercent:string|null;exclusions:Record<EstimateReason,number>};
export type EstimateLine={lineId:string;documentId:string;productId:string;date:string;reason:EstimateReason|null;candidateSaleAmount:string|null;candidateReturnAmount:string|null;coveredSaleAmount:string|null;candidateCost:string|null;contribution:string|null;unknownSaleAmount:boolean;unknownReturnAmount:boolean;saleCandidate:boolean;returnCandidate:boolean};
export type SourceEstimate={format:typeof ESTIMATE_VERSION;calculationVersion:typeof ESTIMATE_VERSION;quality:"unverified-estimate";sourceHash:string;period:string;from:string;to:string;extractedAt:string;summary:EstimateTotals;emptyDocuments:number;assumptions:typeof estimateAssumptions;days:{date:string;totals:EstimateTotals|null}[];products:{productId:string;totals:EstimateTotals}[];lines:EstimateLine[]};
export type EstimateRequest={hash:string;period:string;view:"summary"|"products"|"evidence";offset:number;productId:string|null};
export type EstimateExportRequest={hash:string;period:string};
export type EstimateRankingRow={productId:string;coveredSaleAmount:string|null;contribution:string;candidateSaleAmount:string|null;candidateReturnAmount:string|null;uncoveredSaleAmount:string|null;costCoveragePercent:string|null};
export type EstimateResult={status:"source-estimate";report:Omit<SourceEstimate,"products"|"lines">;products:SourceEstimate["products"];ranking:EstimateRankingRow[];lines:EstimateLine[];total:number;offset:number;view:EstimateRequest["view"]}|{status:"source-unavailable";code:"SOURCE_CHANGED"|"ESTIMATE_UNAVAILABLE";message:string};
export function validEstimateRequest(value:unknown,exportOnly=false):value is EstimateRequest {
 if(!value||typeof value!=="object"||Array.isArray(value))return false;
 const v=value as Record<string,unknown>;
 return Object.keys(v).sort().join()===(exportOnly?"hash,period":"hash,offset,period,productId,view")&&typeof v.hash==="string"&&/^[a-f0-9]{64}$/.test(v.hash)&&typeof v.period==="string"&&/^(?:19|[2-9][0-9])[0-9]{2}-(?:0[1-9]|1[0-2])$/.test(v.period)&&(exportOnly||["summary","products","evidence"].includes(String(v.view))&&Number.isSafeInteger(v.offset)&&Number(v.offset)>=0&&Number(v.offset)<=100000&&(v.productId===null||v.view==="products"&&typeof v.productId==="string"&&/^-?(?:0|[1-9][0-9]{0,18})$/.test(v.productId)));
}
const sum=(lines:EstimateLine[],key:"candidateSaleAmount"|"candidateReturnAmount"|"coveredSaleAmount"|"candidateCost"|"contribution")=>{const values=lines.map(l=>l[key]).filter((v):v is string=>v!==null);return values.length?values.reduce((a,v)=>a.plus(v),new D(0)).toFixed():null;};
function totals(lines:EstimateLine[]):EstimateTotals {
 const candidateSaleAmount=sum(lines,"candidateSaleAmount"),candidateReturnAmount=sum(lines,"candidateReturnAmount"),coveredSaleAmount=sum(lines,"coveredSaleAmount");
 const exposure=new D(candidateSaleAmount??0).abs().plus(new D(candidateReturnAmount??0).abs());
 const exclusions=Object.fromEntries(Object.keys(reasonLabels).map(reason=>[reason,0])) as Record<EstimateReason,number>;
 for(const line of lines)if(line.reason)exclusions[line.reason]++;
 return {totalLines:lines.length,coveredLines:lines.filter(l=>l.reason===null).length,saleCandidateLines:lines.filter(l=>l.saleCandidate).length,returnCandidateLines:lines.filter(l=>l.returnCandidate).length,unknownSaleAmounts:lines.filter(l=>l.unknownSaleAmount).length,unknownReturnAmounts:lines.filter(l=>l.unknownReturnAmount).length,candidateSaleAmount,candidateReturnAmount,coveredSaleAmount,uncoveredSaleAmount:candidateSaleAmount===null?null:new D(candidateSaleAmount).minus(coveredSaleAmount??0).toFixed(),candidateCost:sum(lines,"candidateCost"),contribution:sum(lines,"contribution"),costCoveragePercent:!exposure.isZero()?new D(coveredSaleAmount??0).div(exposure).times(100).toFixed(2):null,exclusions};
}
export function calculateSourceEstimate(pkg:RawPackage,period:string,sourceHash:string):SourceEstimate {
 if(pkg.schemaVersion!=="sql-backup-estimate-v1")throw Error("ESTIMATE_UNAVAILABLE");
 if(!validEstimateRequest({hash:sourceHash,period},true))throw Error("INVALID_PAYLOAD");
 const headers=new Map(pkg.snapshot.headers.filter(h=>h.FIS_TARIHI!.startsWith(period)).map(h=>[h.ID!,h]));
 const lines:EstimateLine[]=[],days=new Map<string,EstimateLine[]>(),products=new Map<string,EstimateLine[]>(),used=new Set<string>();
 for(const row of pkg.snapshot.lines){const h=headers.get(row.FIS!);if(!h)continue;used.add(h.ID!);
  const l:EstimateLine={lineId:row.ID!,documentId:h.ID!,productId:row.STOK!,date:h.FIS_TARIHI!.slice(0,10),reason:null,candidateSaleAmount:null,candidateReturnAmount:null,coveredSaleAmount:null,candidateCost:null,contribution:null,unknownSaleAmount:false,unknownReturnAmount:false,saleCandidate:false,returnCandidate:false};
  const amount=row.TOPLAM_KDV_MATRAHI===null?null:new D(row.TOPLAM_KDV_MATRAHI!);
  if(h.FIS_TURU==="35")l.reason="TYPE_35";
  else if(h.FIS_TURU!=="11"&&h.FIS_TURU!=="12")l.reason="OTHER_TYPE";
  else if(h.CURRENCY!=="TRY")l.reason="CURRENCY";
  else if(h.DURUM!=="1"||h.AKTIF!=="1")l.reason="STATUS";
  else {
   l.saleCandidate=h.FIS_TURU==="11";l.returnCandidate=!l.saleCandidate;
   if(amount===null||amount.lt(0)){l.reason="AMOUNT";l.unknownSaleAmount=l.saleCandidate;l.unknownReturnAmount=l.returnCandidate;}
   else {
    if(l.saleCandidate)l.candidateSaleAmount=amount.toFixed();else l.candidateReturnAmount=amount.negated().toFixed();
    const quantity=row.MIKTAR_FIS===null?null:new D(row.MIKTAR_FIS!),multiplier=row.CARPAN===null?null:new D(row.CARPAN!),cost=row.BELGE_TARIHINDEKI_SON_ALIS_FIYATI===null?null:new D(row.BELGE_TARIHINDEKI_SON_ALIS_FIYATI!);
    if(l.returnCandidate)l.reason="RETURN_COST";
    else if(quantity===null||quantity.lte(0))l.reason="QUANTITY";
    else if(multiplier===null||!multiplier.equals(1))l.reason="MULTIPLIER";
    else if(cost===null)l.reason="COST_MISSING";
    else if(cost.isZero())l.reason="COST_ZERO";
    else if(cost.isNegative())l.reason="COST_NEGATIVE";
    else {l.coveredSaleAmount=amount.toFixed();l.candidateCost=quantity.times(cost).toFixed();l.contribution=amount.minus(l.candidateCost).toFixed();}
   }
  }
  lines.push(l);const dg=days.get(l.date)??[];dg.push(l);days.set(l.date,dg);const pg=products.get(l.productId)??[];pg.push(l);products.set(l.productId,pg);
 }
 const last=new Date(`${period}-01T00:00:00Z`);last.setUTCMonth(last.getUTCMonth()+1);last.setUTCDate(0);
 return {format:ESTIMATE_VERSION,calculationVersion:ESTIMATE_VERSION,quality:"unverified-estimate",sourceHash,period,from:pkg.snapshot.from,to:pkg.snapshot.to,extractedAt:pkg.snapshot.capturedAt,summary:totals(lines),emptyDocuments:[...headers.keys()].filter(id=>!used.has(id)).length,assumptions:estimateAssumptions,days:Array.from({length:last.getUTCDate()},(_,i)=>{const date=`${period}-${String(i+1).padStart(2,"0")}`;return {date,totals:date<pkg.snapshot.from||date>pkg.snapshot.to?null:totals(days.get(date)??[])};}),products:[...products].sort(([a],[b])=>BigInt(a)<BigInt(b)?-1:BigInt(a)>BigInt(b)?1:0).map(([productId,group])=>({productId,totals:totals(group)})),lines};
}
const rank=(products:SourceEstimate["products"]):EstimateRankingRow[]=>products.flatMap(({productId,totals:t})=>t.contribution===null?[]:[{productId,coveredSaleAmount:t.coveredSaleAmount,contribution:t.contribution,candidateSaleAmount:t.candidateSaleAmount,candidateReturnAmount:t.candidateReturnAmount,uncoveredSaleAmount:t.uncoveredSaleAmount,costCoveragePercent:t.costCoveragePercent}]).sort((a,b)=>new D(b.contribution).comparedTo(a.contribution)||(BigInt(a.productId)<BigInt(b.productId)?-1:BigInt(a.productId)>BigInt(b.productId)?1:0)).slice(0,10);
export function createSourceEstimateQuery(pkg:RawPackage,hash:string) {
 let cached:{period:string;estimate:SourceEstimate;ranking:EstimateRankingRow[]}|undefined;
 return (request:EstimateRequest):EstimateResult=>{
  if(!validEstimateRequest(request))throw Error("INVALID_PAYLOAD");
  if(hash!==request.hash)return {status:"source-unavailable",code:"SOURCE_CHANGED",message:"Kaynak sürümü değişti. Yeni sürümü açın."};
  if(pkg.schemaVersion!=="sql-backup-estimate-v1")return {status:"source-unavailable",code:"ESTIMATE_UNAVAILABLE",message:"Bu paket maliyet adayı içermiyor; tahmin hazırlanamadı."};
  if(cached?.period!==request.period){const estimate=calculateSourceEstimate(pkg,request.period,hash);cached={period:request.period,estimate,ranking:rank(estimate.products)};}
  const {products,lines,...report}=cached.estimate,rows=request.view==="products"?(request.productId===null?products:products.filter(p=>p.productId===request.productId)):request.view==="evidence"?lines:[],total=rows.length,offset=total?Math.min(request.offset,Math.floor((total-1)/50)*50):0;
  return structuredClone({status:"source-estimate",report,ranking:cached.ranking,products:request.view==="products"?rows.slice(offset,offset+50) as SourceEstimate["products"]:[],lines:request.view==="evidence"?lines.slice(offset,offset+50):[],total,offset,view:request.view});
 };
}
export function querySourceEstimate(pkg:RawPackage,hash:string,request:EstimateRequest):EstimateResult {
 return createSourceEstimateQuery(pkg,hash)(request);
}
