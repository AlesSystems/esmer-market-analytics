import {useEffect,useRef,useState} from "react";
import type {PageProps} from "../sections";
import type {SourceQuery,SourceWorkspaceResult} from "../../source/workspace";
import {Button} from "../components/ui/button";
import {SourceDocumentDetail} from "../SourceDocumentDetail";
import {captureReturn,restoreReturn,type ReturnReceipt} from "../navigation-receipt";
import {date,decimal} from "../format";
import {typeLabel} from "../source-fields";
import {useMonthProfit} from "./month-profit-data";
import {monthName} from "./month-summary";

type Workspace=Extract<SourceWorkspaceResult,{status:"source-workspace"}>;
const base:SourceQuery={hash:null,period:null,view:"overview",scope:"all",documentType:null,productId:null,documentId:null,offset:0};
const PAGE=50;

/** Kaynak belgeler: the package's recorded documents for the month, opening the existing detail view. */
function SourceDocuments({month,onClose}:{month:string;onClose:()=>void}) {
 const [list,setList]=useState<Workspace>();
 const [detail,setDetail]=useState<Workspace>();
 const [offset,setOffset]=useState(0);
 const [message,setMessage]=useState("");
 const [attempt,setAttempt]=useState(0);
 const receipt=useRef<ReturnReceipt|null>(null),heading=useRef<HTMLHeadingElement>(null);
 const read=(query:SourceQuery)=>window.esmer.querySourceWorkspace(query);
 useEffect(()=>{
  let live=true;setMessage("");
  (async()=>{
   const first=await read({...base,period:month});
   if(first.status==="source-empty"){if(live){setList(undefined);setMessage("Bu pakette kaynak belge yok.");}return;}
   if(first.status!=="source-workspace"){if(live)setMessage(first.message);return;}
   const page=await read({...base,view:"documents",period:month,hash:first.hash,offset});
   if(!live)return;
   if(page.status==="source-workspace"){setList(page);return;}
   setMessage(page.status==="source-empty"?"Bu pakette kaynak belge yok.":page.message);
  })().catch(()=>{if(live)setMessage("Kaynak belgeler okunamadı.");});
  return()=>{live=false;};
 },[month,offset,attempt]);
 function open(id:string,button:HTMLButtonElement){
  if(!list)return;receipt.current=captureReturn(button);setMessage("");
  read({...base,view:"detail",period:month,hash:list.hash,documentId:id}).then(value=>{
   if(value.status==="source-workspace")setDetail(value);else setMessage(value.status==="source-empty"?"Bu pakette kaynak belge yok.":value.message);
  }).catch(()=>setMessage("Belge okunamadı."));
 }
 function back(){setDetail(undefined);restoreReturn(receipt.current,heading.current);}
 return <section className="month-state" aria-label="Kaynak belgeler">
  {detail?<>
   <Button variant="outline" onClick={back}>Belgelere dön</Button>
   <SourceDocumentDetail key={detail.document?.ID} document={detail.document} lines={detail.lines}/>
  </>:<>
   <div className="reports-head"><h2 ref={heading} tabIndex={-1}>Kaynak belgeler</h2><Button variant="outline" onClick={onClose}>Rapora dön</Button></div>
   <p>{monthName(month)} için veri paketindeki kayıtlı belgeler. Tutarlar kaynak kaydındandır ve doğrulanmamıştır.</p>
   {message&&<div role="alert"><p>{message}</p><Button variant="outline" onClick={()=>setAttempt(value=>value+1)}>Yeniden dene</Button></div>}
   {!list&&!message&&<p role="status">Belgeler yükleniyor…</p>}
   {list&&(list.total===0?<p role="status">Bu ay için kaynak belge yok.</p>:<>
    <div className="table-scroll" tabIndex={0} aria-label="Kaynak belgeler tablosu"><table><thead><tr><th>Belge kayıt ID’si</th><th>Kaynak tarihi</th><th>Belge türü</th><th>Belge tutarı</th><th>Para birimi</th></tr></thead>
     <tbody>{list.documents.map(row=><tr key={row.ID}><td><Button variant="link" data-focus-key={`report-document-${list.hash}-${row.ID}`} aria-label={`Belgeyi aç ${row.ID}`} onClick={event=>open(row.ID!,event.currentTarget)}>{row.ID}</Button></td><td>{row.FIS_TARIHI?date(row.FIS_TARIHI.slice(0,10)):"—"}</td><td>{typeLabel(row.FIS_TURU)}</td><td className="number">{row.GENELTOPLAM?decimal(row.GENELTOPLAM):"—"}</td><td>{row.CURRENCY??"Bilinmiyor"}</td></tr>)}</tbody></table></div>
    <nav className="report-actions" aria-label="Belge sayfaları"><Button variant="outline" disabled={list.offset===0} onClick={()=>setOffset(Math.max(0,list.offset-PAGE))}>Önceki belgeler</Button><span role="status">{`${list.offset+1}–${Math.min(list.offset+PAGE,list.total)} / ${list.total}`}</span><Button variant="outline" disabled={list.offset+PAGE>=list.total} onClick={()=>setOffset(list.offset+PAGE)}>Sonraki belgeler</Button></nav>
   </>)}
  </>}
 </section>;
}

/** Rapor ve Excel: a method note, the month's Excel export and the source documents. The shell's Dönem drives `month`. */
export function ReportsPage({month,availability,active,openSettings}:PageProps) {
 const {read,loading}=useMonthProfit(month,active,availability);
 const [documents,setDocuments]=useState(false);
 const [exporting,setExporting]=useState(false);
 const [message,setMessage]=useState("");
 const opener=useRef<HTMLButtonElement>(null);
 const sequence=useRef(0);
 useEffect(()=>{sequence.current++;setMessage("");setDocuments(false);},[month]);
 const view=read&&month&&read.month===month&&"result" in read&&read.result.status==="month-profit"?read.result.view:null;
 const reason=!month?"Önce bir ay seçilmeli."
  :!read||read.month!==month?"Bu ayın rakamları yükleniyor."
  :"failed" in read?"Bu ayın rakamları okunamadı."
  :read.result.status==="source-unavailable"?read.result.message:null;
 async function exportMonth(){
  if(!month||!view)return;const id=++sequence.current;setExporting(true);setMessage("");
  try{
   const value=await window.esmer.exportMonthProfit({month});if(id!==sequence.current)return;
   if(value.status==="saved")setMessage("Doğrulanmamış tahmin Excel dosyasına kaydedildi.");
   else if(value.status!=="cancelled")setMessage(value.message);
  }catch{if(id===sequence.current)setMessage("Excel dosyası kaydedilemedi.");}
  finally{if(id===sequence.current)setExporting(false);}
 }
 function closeDocuments(){setDocuments(false);requestAnimationFrame(()=>opener.current?.focus());}
 return <main className="reports-page">
  <div className="reports-head"><h1>Rapor ve Excel</h1></div>
  <section className="month-state" aria-label="Yöntem notu">
   <h2>Bu rakamlar tahmindir</h2>
   <p>Doğrulanmış kâr değildir. Satış, veri paketindeki kayıtlı satış tutarıdır; maliyet belge tarihindeki son alış fiyatından tahmin edilir. İadeler kâra dahil değildir. Tahmini net kâr, ayın giderleri girilip tamamlandı olarak onaylandıktan sonra hesaplanır.</p>
  </section>
  {read&&"result" in read&&read.result.status==="source-unavailable"&&read.result.code==="ESTIMATE_UNAVAILABLE"&&<div className="month-state"><h2>Kâr tahmini için veri paketi gerekiyor</h2><p>Maliyet bilgisi içeren bir veri paketi içe aktarınca Excel dosyası ve kaynak belgeler burada açılır.</p><Button onClick={openSettings}>Veri paketi içe aktar</Button></div>}
  {!documents&&<section className="month-state" aria-label="Excel’e aktar">
   <h2>{month?monthName(month):"Seçili ay"}</h2>
   <p>Özet, Ürünler ve Giderler sayfalarıyla bu ayın tahminini Excel dosyası olarak kaydeder. Bilinmeyen değerler boş bırakılır, sıfır yazılmaz.</p>
   <div className="month-state-actions">
    <Button onClick={exportMonth} disabled={!view||exporting||loading&&!view} aria-describedby={reason?"export-reason":undefined}>{exporting?"Excel hazırlanıyor…":"Excel’e aktar"}</Button>
    <Button variant="outline" ref={opener} disabled={!month} onClick={()=>setDocuments(true)}>Kaynak belgeleri aç</Button>
   </div>
   {reason&&<p id="export-reason">{reason}</p>}
   {message&&<p role="status">{message}</p>}
  </section>}
  {documents&&month&&<SourceDocuments month={month} onClose={closeDocuments}/>}
 </main>;
}
