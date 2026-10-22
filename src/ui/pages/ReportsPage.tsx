import {useEffect,useRef,useState} from "react";
import type {PageProps,ReportView} from "../sections";
import type {SalesView} from "../../reports/contracts";
import {Button} from "../components/ui/button";
import {SourceWorkspace,initialSourceQuery,type SourceView} from "../SourceWorkspace";
import {SalesWorkspace} from "../SalesWorkspace";
import {EmbeddedFrame,type Destination} from "./EmbeddedScreen";

const views:[ReportView,string][]=[["report","Aylık rapor"],["data","Veri ve kaynak"],["invoices","Alış belgeleri"]];
const sourceScreens:Record<ReportView,Destination>={report:"versions",data:"monthly",invoices:"purchasing"};
const salesScreens:Record<ReportView,Destination>={report:"versions",data:"overview",invoices:"purchasing"};
type Loaded={kind:"source";source:SourceView}|{kind:"sales";sales:SalesView}|{kind:"none"}|{kind:"failed";message:string};

/** Rapor ve Excel: the existing report, export and source workspaces, until #107 redesigns this page. */
export function ReportsPage({month,onMonth,availability,active,state,openSettings}:PageProps) {
 const [view,setView]=useState<ReportView>(state.reportView??"report");
 const sequence=useRef(1),[launch,setLaunch]=useState(1);
 const [loaded,setLoaded]=useState<Loaded>();
 const [stale,setStale]=useState(false);
 const choose=(next:ReportView)=>{setView(next);setLaunch(++sequence.current);};
 useEffect(()=>{if(state.reportView)choose(state.reportView);},[state]);
 useEffect(()=>{
  if(!active||availability?.status!=="ready"||loaded&&loaded.kind!=="failed")return;
  let live=true;
  window.esmer.querySourceWorkspace({...initialSourceQuery,period:month}).then(async value=>{
   if(!live)return;
   if(value.status==="source-workspace"){setLoaded({kind:"source",source:value});return;}
   if(value.status!=="source-empty"){setLoaded({kind:"failed",message:value.message});return;}
   if(availability.store!=="loaded"){setLoaded({kind:"none"});return;}
   const sales=await window.esmer.openSales({period:month});
   if(live)setLoaded(sales.status==="report"?{kind:"sales",sales:sales.view}:{kind:"failed",message:sales.message});
  }).catch(()=>{if(live)setLoaded({kind:"failed",message:"Raporlar okunamadı."});});
  return()=>{live=false;};
 },[active,availability,loaded]);
 useEffect(()=>{if(availability?.status==="ready"&&loaded?.kind==="sales")setStale(availability.store==="loaded"&&availability.dataset.datasetId!==loaded.sales.context.datasetId);},[availability,loaded]);
 const selected=month??(loaded?.kind==="source"?loaded.source.period:loaded?.kind==="sales"?loaded.sales.context.period:"");
 return <main className="reports-page">
  <div className="reports-head"><h1>Rapor ve Excel</h1>
   <nav className="reports-views" aria-label="Rapor bölümleri">{views.map(([id,label])=><Button key={id} type="button" variant={view===id?"default":"outline"} aria-pressed={view===id} onClick={()=>choose(id)}>{label}</Button>)}</nav>
  </div>
  {!loaded&&<p role="status">Raporlar yükleniyor…</p>}
  {loaded?.kind==="failed"&&<div role="alert"><p>{loaded.message}</p><Button variant="outline" onClick={()=>setLoaded(undefined)}>Yeniden dene</Button></div>}
  {loaded?.kind==="none"&&<div className="month-state"><h2>Henüz rapor verisi yok</h2><p>Veri paketi içe aktarınca aylık rapor, Excel ve kaynak kayıtları burada açılır.</p><Button onClick={openSettings}>Veri paketi içe aktar</Button></div>}
  {loaded?.kind==="source"&&<EmbeddedFrame destination={sourceScreens[view]} sequence={launch}><SourceWorkspace source={loaded.source} selectedMonth={selected} onMonth={onMonth}/></EmbeddedFrame>}
  {loaded?.kind==="sales"&&<EmbeddedFrame destination={salesScreens[view]} sequence={launch}><SalesWorkspace view={loaded.sales} setView={sales=>setLoaded({kind:"sales",sales})} stale={stale} selectedMonth={selected} onMonth={onMonth}/></EmbeddedFrame>}
 </main>;
}
