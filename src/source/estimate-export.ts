import writeXlsxFile,{type Row,type Cell} from "write-excel-file/node";
import {reasonLabels,type SourceEstimate,type EstimateTotals} from "./estimate";
const text=(value:unknown):Cell=>value===null?null:{type:String,value:String(value)};
const labels:Record<keyof EstimateTotals,string>={totalLines:"Tüm satırlar",coveredLines:"Kapsanan satış satırları",saleCandidateLines:"Satış adayı satırlar",returnCandidateLines:"İade adayı satırlar",unknownSaleAmounts:"Bilinmeyen satış tutarı",unknownReturnAmounts:"Bilinmeyen iade tutarı",candidateSaleAmount:"Kaydedilmiş satış tutarı adayı",candidateReturnAmount:"İade tutarı adayı",coveredSaleAmount:"Kapsanan satış tutarı adayı",candidateCost:"Tahmini maliyet adayı",contribution:"Tahmini satış katkısı (kapsanan satırlar)",costCoveragePercent:"Maliyet kapsamı (%)",exclusions:"Dışlananlar"};
export async function excelSourceEstimate(r:SourceEstimate):Promise<Buffer>{
 const metadata:Row[]=[[text("Doğrulanmamış tahmin — net kâr değildir")],[text("Kaynak sürümü"),text(r.sourceHash)],[text("Hesaplama sürümü"),text(r.calculationVersion)],[text("Dönem"),text(r.period)],[text("Kaynak kapsamı"),text(`${r.from} / ${r.to}`)],[text("Hazırlanma"),text(r.extractedAt)],[text("İadelerin maliyet ve katkısı dahil değildir; sonuç yüksek görünebilir. Giderler dahil değildir.")],[text("Tutarlar kesin ondalık metin olarak korunmuştur; boş hücre bilinmeyendir, sıfır değildir.")]];
 const keys=Object.keys(labels).filter((k):k is Exclude<keyof EstimateTotals,"exclusions">=>k!=="exclusions");
 const values=(t:EstimateTotals|null):Cell[]=>keys.map(k=>text(t?.[k]??null));
 const sections:[string,Row[]][]=[
  ["Özet",[[text("Gösterge"),text("Kesin değer")],...keys.map(k=>[text(labels[k]),text(r.summary[k])]),[text("Satırsız belgeler — tutar bilinmiyor"),text(r.emptyDocuments)]]],
  ["Günler",[[text("Tarih"),...keys.map(k=>text(labels[k]))],...r.days.map(d=>[text(d.date),...values(d.totals)])]],
  ["Ürünler",[[text("Ürün kayıt ID"),...keys.map(k=>text(labels[k]))],...r.products.map(p=>[text(p.productId),...values(p.totals)])]],
  ["Yöntem",[[text("Varsayım"),text("Açıklama")],...r.assumptions.map(([id,label])=>[text(id),text(label)])]],
  ["Dışlananlar",[[text("Kapsam"),text("Kimlik"),text("Neden"),text("Satır sayısı")],...Object.entries(r.summary.exclusions).map(([reason,n])=>[text("Ay"),text(r.period),text(reasonLabels[reason as keyof typeof reasonLabels]),text(n)]),...r.days.flatMap(d=>d.totals?Object.entries(d.totals.exclusions).map(([reason,n])=>[text("Gün"),text(d.date),text(reasonLabels[reason as keyof typeof reasonLabels]),text(n)]):[]),...r.products.flatMap(p=>Object.entries(p.totals.exclusions).map(([reason,n])=>[text("Ürün"),text(p.productId),text(reasonLabels[reason as keyof typeof reasonLabels]),text(n)]))]],
 ];
 const sheets=sections.map(([sheet,rows])=>({sheet,data:[...metadata,[],...rows]}));
 for(const sheet of sheets){if(sheet.data.length>1_048_576)throw Error("EXCEL_ROW_LIMIT");for(const row of sheet.data)for(const cell of row)if(cell&&typeof cell==="object"&&"value"in cell&&typeof cell.value==="string"&&cell.value.length>32767)throw Error("EXCEL_CELL_LIMIT");}
 return writeXlsxFile(sheets).toBuffer();
}
