import {useEffect,useRef,useState} from "react";
import type {ReportSummary} from "../../reports/contracts";
import type {MonthlyDisplay} from "../../reports/display";
import {Button} from "../components/ui/button";
import {MonthlyOverview} from "../overview/MonthlyOverview";

export function SavedReports({period}:{period:string}) {
 const alive=useRef(true);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;};},[]);
 const [history,setHistory]=useState<ReportSummary[]>([]),[report,setReport]=useState<MonthlyDisplay>(),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;setReport(undefined);setHistory([]);setMessage("");setBusy(true);
  window.esmer.listReportVersions({period}).then(value=>{if(!active)return;if(value.status==="history")setHistory(value.reports);else setMessage(value.message);}).catch(()=>{if(active)setMessage("Kaydedilmiş raporlar okunamadı.");}).finally(()=>{if(active)setBusy(false);});return()=>{active=false;};
 },[period]);
 async function read(reportId:string){setBusy(true);setMessage("");try{const value=await window.esmer.readReportVersion({reportId});if(!alive.current)return;if(value.status==="monthly")setReport(value.report);else setMessage(value.message);}catch{if(alive.current)setMessage("Rapor açılamadı.");}finally{if(alive.current)setBusy(false);}}
 async function exportReport(){if(!report)return;setBusy(true);try{const value=await window.esmer.exportReportVersion({reportId:report.id});if(!alive.current)return;setMessage(value.status==="saved"?"Kaydedilmiş rapor Excel dosyasına aktarıldı.":value.status==="cancelled"?"Dışa aktarma iptal edildi.":value.message);}catch{if(alive.current)setMessage("Rapor dışa aktarılamadı.");}finally{if(alive.current)setBusy(false);}}
 return <section aria-busy={busy}><h1>Raporlar</h1><p>Bu SQL yedeğinin mali eşlemesi doğrulanmadığı için yeni mali rapor oluşturulamaz. Önceden kaydedilmiş raporlar kendi veri sürümleriyle korunur.</p>{message&&<p role="status">{message}</p>}
 {report?<><p className="notice warning">Bu kaydedilmiş rapor açık SQL yedeğinden üretilmedi; kendi kaynak sürümüne aittir.</p>{report.sales.warnings.includes("SYNTHETIC_ONLY")&&<p role="status" className="notice warning">Sentetik gösterim raporu — gerçek market sonuçları değildir.</p>}<Button variant="outline" disabled={busy} onClick={()=>setReport(undefined)}>Rapor listesine dön</Button><Button variant="outline" disabled={busy} onClick={()=>void exportReport()}>Kaydedilmiş raporu dışa aktar</Button><p>Kaydedilmiş rapor · Kaynak: {report.purchasing.lineage} · Veri sürümü: {report.context.datasetId} · Yöntem: {report.sales.mappingVersion} · Veri sonu: {report.sales.cutoff}</p><MonthlyOverview report={report} refresh={()=>void read(report.id)}/></>:<><h2>Kaydedilmiş raporlar · {period}</h2>{busy?<p role="status">Raporlar yükleniyor…</p>:history.length===0?<p>Bu dönem için kaydedilmiş rapor yok.</p>:<ul>{history.map(row=><li key={row.id}>{row.period} · {row.acceptedAt} · {row.reason} <Button variant="link" disabled={busy} onClick={()=>void read(row.id)}>Kaydedilmiş sürümü aç</Button></li>)}</ul>}</>}
 </section>;
}
