import { useEffect, useRef, useState } from "react";
import type { PurchaseDocumentResult, PurchaseDocumentsResult, ReportContext } from "../../reports/contracts";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { date, decimal, money } from "../format";
import { captureReturn, restoreReturn, type ReturnReceipt } from "../navigation-receipt";
import { purchasingWarningLabels } from "./PurchasingWorkspace";
type List = Extract<PurchaseDocumentsResult, {status: "purchase-documents"}>;
type Detail = Extract<PurchaseDocumentResult, {status: "purchase-document"}>;
export function PurchaseDocuments({context, active, onParentBack, onDetailOpen}: {onDetailOpen?:(open:boolean)=>void;onParentBack?: (back: (() => void) | null) => void; context: ReportContext; active: boolean}) {
 const [query,setQuery]=useState({search:"",offset:0}),[list,setList]=useState<{key:string;value:List}>(),[storedDetail,setDetail]=useState<Detail>(),[error,setError]=useState(""),[busy,setBusy]=useState(false),[attempt,setAttempt]=useState(0);
 const parents=useRef<{detail:Detail;receipt:ReturnReceipt|null}[]>([]);
 const receipt=useRef<ReturnReceipt|null>(null),heading=useRef<HTMLHeadingElement>(null),detailHeading=useRef<HTMLHeadingElement>(null),sequence=useRef(0);
 const identity=JSON.stringify(context),key=JSON.stringify([identity,query,attempt]);
 const detail=storedDetail&&JSON.stringify(storedDetail.context)===identity?storedDetail:undefined;
 const rows=list?.key===key?list.value:undefined;
 useEffect(()=>{setDetail(undefined);setBusy(false);parents.current=[];++sequence.current;},[identity]);
 useEffect(()=>{if(!active){++sequence.current;setBusy(false);}},[active]);
 useEffect(()=>{
  if(!active||list?.key===key)return;
  const token=++sequence.current;setError("");setBusy(true);
  window.esmer.queryPurchaseDocuments({context,...query}).then(result=>{if(token!==sequence.current)return;if(result.status==="purchase-documents")setList({key,value:result});else setError(result.message);}).catch(()=>{if(token===sequence.current)setError("Faturalar okunamadı. Yeniden deneyin.");}).finally(()=>{if(token===sequence.current)setBusy(false);});
  return()=>{++sequence.current;};
 },[key,active]);
 useEffect(()=>{if(detail&&active)detailHeading.current?.focus();},[detail,active]);
 async function inspect(documentId:string,offset=0,button?:HTMLButtonElement,linked=false){
  const parent=linked&&detail?{detail,receipt:button?captureReturn(button):null}:null;
  if(!linked&&button)receipt.current=captureReturn(button);
  const token=++sequence.current;setBusy(true);setError("");
  try{const result=await window.esmer.inspectPurchaseDocument({context,documentId,offset});if(token!==sequence.current)return;if(result.status==="purchase-document"){if(parent)parents.current.push(parent);setDetail(result);}else setError(result.message);}catch{if(token===sequence.current)setError("Belge okunamadı. Yeniden seçin.");}finally{if(token===sequence.current)setBusy(false);}
 }
 function back(){++sequence.current;setBusy(false);setError("");const parent=parents.current.pop();if(parent){setDetail(parent.detail);restoreReturn(parent.receipt,detailHeading.current);}else{setDetail(undefined);restoreReturn(receipt.current,heading.current);}}
 useEffect(()=>{onDetailOpen?.(!!detail);},[detail,onDetailOpen]);
 useEffect(()=>{if(active)onParentBack?.(detail?back:null);return()=>{if(active)onParentBack?.(null);};},[active,detail,onParentBack]);
 const paging=(offset:number,total:number,onPage:(offset:number)=>void)=><nav className="report-actions" aria-label="Fatura sayfaları"><Button variant="outline" disabled={busy||offset===0} onClick={()=>onPage(Math.max(0,offset-50))}>Önceki 50 kayıt</Button><span>{total?`${offset+1}–${Math.min(offset+50,total)} / ${total}`:"Kayıt yok"}</span><Button variant="outline" disabled={busy||offset+50>=total} onClick={()=>onPage(offset+50)}>Sonraki 50 kayıt</Button></nav>;
 return <section aria-busy={busy}>
  {error&&<p role="alert">{error} <Button variant="outline" onClick={()=>setAttempt(value=>value+1)}>Faturaları yeniden yükle</Button></p>}
  {busy&&<p role="status">Fatura kayıtları yükleniyor…</p>}
  <div hidden={!!detail}><div className="section-heading"><div><h2 ref={heading} tabIndex={-1}>Faturalar</h2><p>Satırsız ve türü bilinmeyen alış belgeleri dahil.</p></div><label>Fatura ara<Input type="search" value={query.search} maxLength={160} onChange={event=>setQuery({search:event.target.value,offset:0})}/></label></div>
  {rows&&<>{paging(rows.offset,rows.total,offset=>setQuery({...query,offset}))}<div className="table-scroll" role="region" tabIndex={0} aria-label="Fatura kayıtları tablosu"><table><thead><tr><th>Tarih / belge kayıt ID’si</th><th>Tedarikçi</th><th>Kaydedilen belge toplamı</th><th>Satır / durum</th><th></th></tr></thead><tbody>{rows.documents.map(row=><tr key={row.id}><td>{date(row.date)}<small>{row.id} · {row.representation==="invoice"?"Fatura":"Diğer alış belgesi · türü bilinmiyor"}</small></td><td>{row.supplierName??"Tedarikçi bilgisi mevcut değil"}</td><td className="number">{row.recorded?money(row.recorded.gross):"Belge toplamı mevcut değil"}</td><td>{row.lineCount} satır<small>{row.recognition==="calculated"?"Hesapta tanınmış kayıt":row.recognition==="unsupported"?"Hesaplama kanıtı desteklenmiyor":"Tanınma durumu bilinmiyor"}</small></td><td><Button variant="link" aria-label={`Belgeyi aç ${row.id}`} onClick={event=>void inspect(row.id,0,event.currentTarget)}>Aç</Button></td></tr>)}</tbody></table></div>{!rows.total&&<p>Bu ay saklanan alış belgesi yok. Kaynak kapsamı dışında kayıt yokluğu sıfır faaliyet anlamına gelmez.</p>}</>}
  </div>
  {detail&&<section className="dedicated-detail" aria-label="Fatura ayrıntıları"><Button variant="outline" onClick={back}>{parents.current.length?"Önceki belgeye dön":"Faturalara dön"}</Button><h2 ref={detailHeading} tabIndex={-1}>{detail.document.representation==="dispatch"?"İrsaliye":detail.document.representation==="invoice"?"Fatura":"Alış belgesi"} · {detail.document.id}</h2><p>{date(detail.document.date)} · Belge kayıt ID’si {detail.document.id}</p>{!detail.document.date.startsWith(context.period)&&<p>Bağlı belge seçili ayın dışındadır. Çalışma dönemi değişmedi.</p>}<p>Fatura numarası mevcut değil</p><p>{detail.document.supplierName??"Tedarikçi bilgisi mevcut değil"}</p>
  <dl className="financial-ledger"><div><dt>Kaydedilen belge toplamı</dt><dd>{detail.document.recorded?money(detail.document.recorded.gross):"Belge toplamı mevcut değil"}</dd></div>{detail.document.recorded&&<><div><dt>Kaydedilen net</dt><dd>{money(detail.document.recorded.net)}</dd></div><div><dt>Kaydedilen KDV</dt><dd>{money(detail.document.recorded.tax)}</dd></div></>}</dl><p>Belge başlık tutarlarıdır; satır toplamı yerine kullanılmaz. Mali tanınma durumu {detail.document.recognition==="calculated"?"hesapta tanınmış":detail.document.recognition==="unsupported"?"desteklenmiyor":"bilinmiyor"}.</p>{detail.document.reasons.map(reason=><p className="notice warning" key={reason}>{purchasingWarningLabels[reason]??"Alış hesabı kanıtı desteklenmiyor"}</p>)}
  <h3>Belge satırları</h3>{paging(detail.offset,detail.total,offset=>void inspect(detail.document.id,offset))}<div className="table-scroll" role="region" tabIndex={0} aria-label="Fatura satırları tablosu"><table><thead><tr><th>Ürün</th><th>Kaydedilen miktar</th><th>Kaydedilen net tutar</th></tr></thead><tbody>{detail.lines.map(line=><tr key={line.id}><td>{line.sales?.productName??`Ürün kayıt ID’si ${line.sales?.productId??"mevcut değil"}`}</td><td>{decimal(line.quantity)} {line.sales?.unit==="kg"?"kg":line.sales?.unit==="piece"?"adet":"birim bilinmiyor"}</td><td>{money(line.net)}</td></tr>)}</tbody></table></div>{!detail.total&&<p>Bu belgenin saklanan satırı yok.</p>}
  {detail.linkedDocuments.length>0&&<><h3>Bağlı belgeler</h3>{detail.linkedDocuments.map(row=><Button variant="outline" key={row.id} data-focus-key={`linked-invoice-${row.id}`} onClick={event=>void inspect(row.id,0,event.currentTarget,true)}>{row.representation==="dispatch"?"İrsaliye":"Fatura"} · {row.id} · {date(row.date)}</Button>)}</>}
  <details><summary>Veri ve hesaplama ayrıntıları</summary><p>Veri sürümü {context.datasetId} · Oturum {context.sessionId} · {context.calculationVersion}</p><p>Bağlı irsaliye ve fatura mevcut alış hesabında tek olay sayılır; gezinme hesaplamayı değiştirmez.</p></details>
  </section>}
 </section>;
}
