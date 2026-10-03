import {useEffect, useRef, useState} from "react";
import type {ReportSummary} from "../../reports/contracts";
import type {MonthlyDisplay} from "../../reports/display";
import {date} from "../format";
import {Button} from "../components/ui/button";
import {ReportArchive} from "./ReportArchive";
import {MonthlyOverview} from "../overview/MonthlyOverview";

export function SavedReports({period, onSourceSummary}:{period:string; onSourceSummary?:()=>void}) {
 const alive=useRef(true);
 const heading=useRef<HTMLHeadingElement>(null);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const [history,setHistory]=useState<ReportSummary[]>([]);
 const [historyState,setHistoryState]=useState<"loading"|"failed"|"ready">("loading");
 const [attempt,setAttempt]=useState(0);
 const [report,setReport]=useState<MonthlyDisplay>();
 const [reportOpen,setReportOpen]=useState(false);

 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{if(reportOpen)heading.current?.focus();},[reportOpen]);
 useEffect(()=>{
  let active=true;
  setReport(undefined);setReportOpen(false);setHistory([]);setMessage("");setHistoryState("loading");
  window.esmer.listReportVersions({period}).then(value=>{
   if(!active)return;
   if(value.status==="history"){setHistory(value.reports);setHistoryState("ready");}
   else {setMessage(value.message);setHistoryState("failed");}
  }).catch(()=>{if(active){setMessage("Kaydedilmiş raporlar okunamadı.");setHistoryState("failed");}});
  return()=>{active=false;};
 },[period,attempt]);
 async function read(reportId:string,button?:HTMLButtonElement){setBusy(true);setMessage("");try{const value=await window.esmer.readReportVersion({reportId});if(!alive.current)return;if(value.status==="monthly"){setReport(value.report);if(button)setReportOpen(true);}else setMessage(value.message);}catch{if(alive.current)setMessage("Rapor açılamadı.");}finally{if(alive.current)setBusy(false);}}
 async function exportReport(){if(!report)return;setBusy(true);try{const value=await window.esmer.exportReportVersion({reportId:report.id});if(!alive.current)return;setMessage(value.status==="saved"?"Kaydedilmiş rapor Excel dosyasına aktarıldı.":value.status==="cancelled"?"Dışa aktarma iptal edildi.":value.message);}catch{if(alive.current)setMessage("Rapor dışa aktarılamadı.");}finally{if(alive.current)setBusy(false);}}
 return <section className="report-workspace" aria-busy={busy||historyState==="loading"}><div className="page-heading"><div><h1 ref={heading} tabIndex={-1}>Raporlar</h1><p>Kaydedilmiş rapor arşivi · {period}</p></div></div>
  <p className="notice warning">Kaydedilmiş raporlar açık SQL yedeğinden üretilmedi; kendi kaynak sürümlerine aittir.</p>
  <p>Doğrulanmış satış verisi henüz hazır değil. Açık SQL yedeği yalnızca kaynak kayıtlarını gösterir; buradan yeni mali rapor oluşturulamaz.</p>
  {message&&historyState!=="failed"&&<p role={reportOpen?"status":"alert"} className="notice warning">{message}</p>}
  <div hidden={reportOpen}>
   {historyState==="loading"?<p role="status">Raporlar yükleniyor…</p>:historyState==="failed"?<div className="notice warning" role="alert"><p>{message}</p><Button variant="outline" onClick={()=>setAttempt(value=>value+1)}>Raporları yeniden yükle</Button></div>:<ReportArchive active={!reportOpen} history={history} report={report} busy={busy} onSelect={id=>void read(id)} onOpen={(id,button)=>void read(id,button)} onExport={()=>void exportReport()}/>}
   {historyState==="ready"&&history.length===0&&onSourceSummary&&<Button variant="outline" onClick={onSourceSummary}>Kaynak kayıtlarının özetine dön</Button>}
  </div>
  {reportOpen&&report&&<>
   {report.sales.warnings.includes("SYNTHETIC_ONLY")&&<p role="status" className="notice warning">Sentetik gösterim raporu — gerçek market sonuçları değildir.</p>}
   <div className="report-actions"><Button variant="outline" disabled={busy} onClick={()=>{setReportOpen(false);heading.current?.focus();}}>Rapor listesine dön</Button><Button variant="outline" disabled={busy} onClick={()=>void exportReport()}>Kaydedilmiş raporu dışa aktar</Button></div>
   <p>Kaydedilmiş rapor · Kaynak: {report.purchasing.lineage} · Veri sürümü: {report.context.datasetId} · Yöntem: {report.sales.mappingVersion} · Veri sonu: {date(report.sales.cutoff)}</p>
   <MonthlyOverview report={report} refresh={()=>void read(report.id)} embedded/>
  </>}
 </section>;
}
