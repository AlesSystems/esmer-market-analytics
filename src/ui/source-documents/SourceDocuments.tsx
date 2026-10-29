import {useEffect,useRef,useState} from "react";
import type {SourceQuery,SourceWorkspaceResult} from "../../source/workspace";
import {Button} from "../components/ui/button";
import {SourceDocumentDetail} from "../SourceDocumentDetail";
import {captureReturn,restoreReturn,type ReturnReceipt} from "../navigation-receipt";
import {date,decimal} from "../format";
import {typeLabel} from "../source-fields";
import {monthName} from "../pages/month-summary";
import {initialSourceQuery} from "../source-query";

type Workspace=Extract<SourceWorkspaceResult,{status:"source-workspace"}>;
const base:SourceQuery=initialSourceQuery;
const PAGE=50;

/** Kaynak belgeler: the package's recorded documents for the month, opening the existing detail view. `availability` changes when the source changes. */
export function SourceDocuments({month,availability,onClose}:{month:string;availability:unknown;onClose:()=>void}) {
 const [list,setList]=useState<Workspace>();
 const [detail,setDetail]=useState<Workspace>();
 const [offset,setOffset]=useState(0);
 const [message,setMessage]=useState("");
 const [attempt,setAttempt]=useState(0);
 const receipt=useRef<ReturnReceipt|null>(null),heading=useRef<HTMLHeadingElement>(null),detailBox=useRef<HTMLDivElement>(null);
 const previous=useRef<HTMLButtonElement>(null),next=useRef<HTMLButtonElement>(null);
 const listHash=useRef<string|null>(null),pagerFocus=useRef<"previous"|"next"|null>(null),focusHeading=useRef(true);
 const read=(query:SourceQuery)=>window.esmer.querySourceWorkspace(query);
 // A new month or source starts the list again: nothing of the old source stays open.
 useEffect(()=>{setList(undefined);setDetail(undefined);setOffset(0);setMessage("");listHash.current=null;pagerFocus.current=null;focusHeading.current=true;},[month,availability]);
 useEffect(()=>{
  let live=true;setMessage("");
  (async()=>{
   // Paging stays on the source the list was opened on; a changed source answers SOURCE_CHANGED.
   const pinned=offset>0?listHash.current:null;
   let hash=pinned;
   if(hash===null){
    const first=await read({...base,period:month});
    if(first.status==="source-empty"){if(live){setList(undefined);setMessage("Bu pakette kaynak belge yok.");}return;}
    if(first.status!=="source-workspace"){if(live)setMessage(first.message);return;}
    hash=first.hash;
   }
   const page=await read({...base,view:"documents",period:month,hash,offset});
   if(!live)return;
   if(page.status==="source-workspace"){listHash.current=page.hash;setList(page);return;}
   if(page.status==="source-unavailable"&&page.code==="SOURCE_CHANGED"){listHash.current=null;setList(undefined);setDetail(undefined);if(offset!==0)setOffset(0);else setAttempt(value=>value+1);return;}
   setMessage(page.status==="source-empty"?"Bu pakette kaynak belge yok.":page.message);
  })().catch(()=>{if(live)setMessage("Kaynak belgeler okunamadı.");});
  return()=>{live=false;};
 },[month,availability,offset,attempt]);
 useEffect(()=>{
  if(!list||detail)return;
  if(focusHeading.current){focusHeading.current=false;heading.current?.focus();return;}
  const wanted=pagerFocus.current;if(!wanted)return;pagerFocus.current=null;
  const own=wanted==="previous"?previous.current:next.current,other=wanted==="previous"?next.current:previous.current;
  if(own&&!own.disabled)own.focus();else if(other&&!other.disabled)other.focus();else heading.current?.focus();
 },[list,detail]);
 useEffect(()=>{
  if(!detail)return;
  const title=detailBox.current?.querySelector("h2");
  if(title instanceof HTMLElement){title.tabIndex=-1;title.focus();}
 },[detail]);
 function open(id:string,button:HTMLButtonElement){
  if(!list)return;receipt.current=captureReturn(button);setMessage("");
  read({...base,view:"detail",period:month,hash:list.hash,documentId:id}).then(value=>{
   if(value.status==="source-workspace")setDetail(value);
   else if(value.status==="source-unavailable"&&value.code==="SOURCE_CHANGED"){listHash.current=null;setList(undefined);if(offset!==0)setOffset(0);else setAttempt(count=>count+1);}
   else setMessage(value.status==="source-empty"?"Bu pakette kaynak belge yok.":value.message);
  }).catch(()=>setMessage("Belge okunamadı."));
 }
 function back(){setDetail(undefined);restoreReturn(receipt.current,heading.current);}
 function page(to:number,button:"previous"|"next"){pagerFocus.current=button;setOffset(to);}
 return <main className="overlay-page" aria-label="Kaynak belgeler">
  <nav aria-label="Sayfa gezinmesi"><Button variant="secondary" onClick={onClose}>Ana sayfaya dön</Button></nav>
  {detail?<>
   <Button variant="secondary" onClick={back}>Belgelere dön</Button>
   <div ref={detailBox}><SourceDocumentDetail key={detail.document?.ID} document={detail.document} lines={detail.lines}/></div>
  </>:<>
   <h1 ref={heading} tabIndex={-1}>Kaynak belgeler</h1>
   <p>{monthName(month)} için veri paketindeki kayıtlı belgeler. Tutarlar kaynak kaydındandır ve doğrulanmamıştır.</p>
   {message&&<div role="alert"><p>{message}</p><Button variant="secondary" onClick={()=>setAttempt(value=>value+1)}>Yeniden dene</Button></div>}
   {!list&&!message&&<p role="status">Belgeler yükleniyor…</p>}
   {list&&(list.total===0?<p role="status">Bu ay için kaynak belge yok.</p>:<>
    <div className="table-scroll" tabIndex={0} aria-label="Kaynak belgeler tablosu"><table><thead><tr><th>Belge kayıt ID’si</th><th>Kaynak tarihi</th><th>Belge türü</th><th>Belge tutarı</th><th>Para birimi</th></tr></thead>
     <tbody>{list.documents.map(row=><tr key={row.ID}><td><Button variant="link" data-focus-key={`report-document-${list.hash}-${row.ID}`} aria-label={`Belgeyi aç ${row.ID}`} onClick={event=>open(row.ID!,event.currentTarget)}>{row.ID}</Button></td><td>{row.FIS_TARIHI?date(row.FIS_TARIHI.slice(0,10)):"—"}</td><td>{typeLabel(row.FIS_TURU)}</td><td className="number">{row.GENELTOPLAM?decimal(row.GENELTOPLAM):"—"}</td><td>{row.CURRENCY??"Bilinmiyor"}</td></tr>)}</tbody></table></div>
    <nav className="report-actions" aria-label="Belge sayfaları"><Button variant="secondary" ref={previous} disabled={list.offset===0} onClick={()=>page(Math.max(0,list.offset-PAGE),"previous")}>Önceki belgeler</Button><span role="status">{`${list.offset+1}–${Math.min(list.offset+PAGE,list.total)} / ${list.total}`}</span><Button variant="secondary" ref={next} disabled={list.offset+PAGE>=list.total} onClick={()=>page(list.offset+PAGE,"next")}>Sonraki belgeler</Button></nav>
   </>)}
  </>}
 </main>;
}

