import {useEffect,useRef,useState} from "react";
import type {SourceQuery,SourceWorkspaceResult} from "../../source/workspace";
import {Button} from "../components/ui/button";
import {SourceDocumentDetail} from "../SourceDocumentDetail";
import {date,money} from "../format";
import {typeLabel} from "../source-fields";
import {monthName} from "../pages/month-summary";

type View=Extract<SourceWorkspaceResult,{status:"source-workspace"}>;
const PAGE=50;

/** Recorded sales documents that contain one product in one month, through the read-only querySourceWorkspace operation. */
export function ProductSourceLines({hash,month,productId,name,onBack}:{hash:string;month:string;productId:string;name:string;onBack:()=>void}) {
 const [offset,setOffset]=useState(0),[documentId,setDocumentId]=useState<string|null>(null);
 const [view,setView]=useState<View|null>(null),[busy,setBusy]=useState(true),[error,setError]=useState(""),[attempt,setAttempt]=useState(0);
 const heading=useRef<HTMLHeadingElement>(null),returnTo=useRef<string|null>(null);
 useEffect(()=>{
  let live=true;setBusy(true);setError("");
  const query:SourceQuery={hash,period:month,view:documentId===null?"documents":"detail",scope:"sales",documentType:"11",productId,documentId,offset:documentId===null?offset:0};
  window.esmer.querySourceWorkspace(query).then(result=>{if(!live)return;if(result.status==="source-workspace")setView(result);else{setView(null);setError(result.status==="source-unavailable"&&result.code==="SOURCE_CHANGED"?"Veri paketi değişti. Ürünlere dönüp yeniden açın.":"Kaynak satırları okunamadı.");}})
   .catch(()=>{if(live){setView(null);setError("Yerel hizmete ulaşılamadı.");}})
   .finally(()=>{if(live)setBusy(false);});
  return()=>{live=false;};
 },[hash,month,productId,documentId,offset,attempt]);
 useEffect(()=>{heading.current?.focus();},[]);
 useEffect(()=>{
  if(busy||!view||view.document!==null||documentId!==null||returnTo.current===null)return;
  const key=returnTo.current;returnTo.current=null;
  document.querySelector<HTMLElement>(`[data-focus-key="product-source-${CSS.escape(key)}"]`)?.focus();
 },[busy,view,documentId]);
 const detail=documentId!==null&&view?.document?view:null;
 return <section className="product-source" aria-labelledby="product-source-title" aria-busy={busy}>
  <div className="product-source-head">
   <h2 id="product-source-title" ref={heading} tabIndex={-1}>{name} · kaynak satırlar · {monthName(month)}</h2>
   <Button variant="outline" onClick={onBack}>Ürünlere dön</Button>
  </div>
  <p className="product-source-note">Bu ürünü içeren kaydedilmiş satış belgeleri. Belge toplamı KDV dahil, belgenin tamamının tutarıdır; kâr tahmini bu ürünün satır tutarlarından hesaplanır. Tutarlar kaynakta kaydedildiği gibidir; doğrulanmadı.</p>
  {error&&<div role="alert" className="state"><p>{error}</p><Button variant="outline" onClick={()=>setAttempt(value=>value+1)}>Yeniden dene</Button></div>}
  {busy&&!view&&<p role="status">Kaynak satırları yükleniyor…</p>}
  {detail?<>
   <Button variant="outline" onClick={()=>{returnTo.current=documentId;setDocumentId(null);}}>Belgelere dön</Button>
   <SourceDocumentDetail key={detail.document?.ID} document={detail.document} lines={detail.lines}/>
  </>:view&&documentId===null&&view.document===null&&<>
   {view.total===0?<p className="viz-empty">Bu ay bu ürünü içeren satış belgesi kaydı yok.</p>:<div className="table-scroll"><table className="product-source-table">
    <caption className="sr-only">Bu ürünün geçtiği satış belgeleri</caption>
    <thead><tr><th scope="col">Belge</th><th scope="col">Tarih</th><th scope="col">Belge türü</th><th scope="col" className="number">Belge toplamı (KDV dahil)</th></tr></thead>
    <tbody>{view.documents.map(row=><tr key={row.ID}>
     <td><Button variant="link" data-focus-key={`product-source-${row.ID}`} onClick={()=>setDocumentId(row.ID!)}>{row.ID}</Button></td>
     <td>{row.FIS_TARIHI?date(row.FIS_TARIHI.slice(0,10)):"—"}</td>
     <td>{typeLabel(row.FIS_TURU)}</td>
     <td className="number">{row.GENELTOPLAM?money(row.GENELTOPLAM):"—"}</td>
    </tr>)}</tbody>
   </table></div>}
   {view.total>PAGE&&<nav className="report-actions" aria-label="Belge sayfaları"><Button variant="outline" disabled={busy||offset===0} onClick={()=>setOffset(Math.max(0,offset-PAGE))}>Önceki belgeler</Button><span role="status">{offset+1}–{Math.min(offset+PAGE,view.total)} / {view.total}</span><Button variant="outline" disabled={busy||offset+PAGE>=view.total} onClick={()=>setOffset(offset+PAGE)}>Sonraki belgeler</Button></nav>}
  </>}
 </section>;
}
