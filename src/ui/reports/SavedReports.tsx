import {useEffect, useRef, useState} from "react";
import type {ReportSummary} from "../../reports/contracts";
import type {MonthlyDisplay} from "../../reports/display";
import {date} from "../format";
import {Button} from "../components/ui/button";
import {MonthlyOverview} from "../overview/MonthlyOverview";

export function SavedReports({period, onSourceSummary}:{period:string; onSourceSummary?:()=>void}) {
 const alive=useRef(true);
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const [history,setHistory]=useState<ReportSummary[]>([]);
 const [historyState,setHistoryState]=useState<"loading"|"failed"|"ready">("loading");
 const [attempt,setAttempt]=useState(0);
 const [report,setReport]=useState<MonthlyDisplay>();
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{if(report)heading.current?.focus();},[report]);
 useEffect(()=>{
  let active=true;
  setReport(undefined);setHistory([]);setMessage("");setHistoryState("loading");
  window.esmer.listReportVersions({period}).then(value=>{
   if(!active)return;
   if(value.status==="history"){setHistory(value.reports);setHistoryState("ready");}
   else {setMessage(value.message);setHistoryState("failed");}
  }).catch(()=>{if(active){setMessage("Kaydedilmiş raporlar okunamadı.");setHistoryState("failed");}});
  return()=>{active=false;};
 },[period,attempt]);
 async function read(reportId:string){setBusy(true);setMessage("");try{const value=await window.esmer.readReportVersion({reportId});if(!alive.current)return;if(value.status==="monthly")setReport(value.report);else setMessage(value.message);}catch{if(alive.current)setMessage("Rapor açılamadı.");}finally{if(alive.current)setBusy(false);}}
 async function exportReport(){if(!report)return;setBusy(true);try{const value=await window.esmer.exportReportVersion({reportId:report.id});if(!alive.current)return;setMessage(value.status==="saved"?"Kaydedilmiş rapor Excel dosyasına aktarıldı.":value.status==="cancelled"?"Dışa aktarma iptal edildi.":value.message);}catch{if(alive.current)setMessage("Rapor dışa aktarılamadı.");}finally{if(alive.current)setBusy(false);}}
 return <section aria-busy={busy||historyState==="loading"}><h1 ref={heading} tabIndex={-1}>Raporlar</h1>
  {report?<>
   <p className="notice warning">Bu kaydedilmiş rapor açık SQL yedeğinden üretilmedi; kendi kaynak sürümüne aittir.</p>
   {report.sales.warnings.includes("SYNTHETIC_ONLY")&&<p role="status" className="notice warning">Sentetik gösterim raporu — gerçek market sonuçları değildir.</p>}
   <div className="report-actions"><Button variant="outline" disabled={busy} onClick={()=>{setReport(undefined);heading.current?.focus();}}>Rapor listesine dön</Button><Button variant="outline" disabled={busy} onClick={()=>void exportReport()}>Kaydedilmiş raporu dışa aktar</Button></div>
   {message&&<p role="status">{message}</p>}
   <p>Kaydedilmiş rapor · Kaynak: {report.purchasing.lineage} · Veri sürümü: {report.context.datasetId} · Yöntem: {report.sales.mappingVersion} · Veri sonu: {date(report.sales.cutoff)}</p>
   <MonthlyOverview report={report} refresh={()=>void read(report.id)} embedded/>
  </>:<>
   <h2>Kaydedilmiş raporlar · {period}</h2>
   {historyState==="loading"?<p role="status">Raporlar yükleniyor…</p>:historyState==="failed"?<div className="notice warning" role="alert"><p>{message}</p><Button variant="outline" onClick={()=>setAttempt(value=>value+1)}>Raporları yeniden yükle</Button></div>:history.length===0?<div className="empty-state"><p>Bu dönem için kaydedilmiş rapor yok.</p><p>Doğrulanmış satış verisi henüz hazır değil. Açık SQL yedeği yalnızca kaynak kayıtlarını gösterir; buradan yeni mali rapor oluşturulamaz.</p>{onSourceSummary&&<Button variant="outline" onClick={onSourceSummary}>Kaynak kayıtlarının özetine dön</Button>}</div>:<>{message&&<p className="notice warning" role="alert">{message}</p>}<ul>{history.map(row=><li key={row.id}>{row.period} · Veri sonu {date(row.cutoff)} · Kaydedilme {date(row.acceptedAt)} · {row.reason} <Button variant="link" disabled={busy} onClick={()=>void read(row.id)}>Kaydedilmiş sürümü aç</Button></li>)}</ul></>}
  </>}
 </section>;
}
