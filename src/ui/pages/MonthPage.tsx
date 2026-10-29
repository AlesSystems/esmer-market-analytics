import type {ReactNode} from "react";
import type {AttentionKind,MonthProfitProduct,Pct} from "../../source/month-profit";
import type {PageProps} from "../sections";
import {Button} from "../components/ui/button";
import {Bridge} from "../charts";
import {MonthBars} from "../charts/MonthBars";
import {AlertIcon,ArrowDownIcon,ArrowRightIcon,ArrowUpIcon,ChevronDownIcon,ChevronRightIcon,InfoIcon} from "../icons";
import {Popover} from "../shell/Popover";
import {money} from "../format";
import {Unknown} from "../products/figures";
import {productName} from "../products/product-rows";
import {useMonthProfitContext} from "./month-profit-data";
import {attentionRows,netCardState,netReasonText} from "./month-answer";
import {TrustChip,MonthUnavailable} from "./MonthStates";
import {changeArrow,marginLine,monthBridgeSteps,monthChange,monthLead,monthName,percentText} from "./month-summary";

/** "57,50 ₺" with the kuruş set smaller. The text is the service amount as formatted, nothing is rounded. */
function Amount({value,className}:{value:string;className:string}){
 const text=money(value),comma=text.lastIndexOf(",");
 return <p className={className}>{text.slice(0,comma)}<span className="cents">{text.slice(comma)}</span></p>;
}

const titles:Record<Exclude<AttentionKind,"missingCost">,string>={loss:"Zarar ediyor",marginDrop:"Marjı düştü",lowMarginHighVolume:"Çok satıyor ama marjı düşük"};
function attentionFigure(kind:keyof typeof titles,p:MonthProfitProduct):string {
 const margin=(value:Pct)=>value===null?"bilinmiyor":percentText(value);
 if(kind==="loss")return p.grossProfit===null?"Brüt kâr bilinmiyor":`Brüt zarar ${money(p.grossProfit.replace(/^-/,""))}`;
 if(kind==="marginDrop")return `Marj ${margin(p.previousMarginPct)} → ${margin(p.marginPct)}`;
 return `Satış ${p.sales===null?"bilinmiyor":money(p.sales)} · marj ${margin(p.marginPct)}`;
}

function Shell({title,children,busy=false}:{title:string;children:ReactNode;busy?:boolean}) {
 return <main className="month-page" aria-busy={busy}><h1 className="sr-only">{title}</h1>{children}</main>;
}

export function MonthPage({month,onMonth,coverage,navigate,importPackage}:PageProps) {
 const {read,loading,retry}=useMonthProfitContext();
 if(!month)return <Shell title="Bu ay"><p role="status">Veriler hazırlanıyor…</p></Shell>;
 if(!read)return <Shell title={monthName(month)} busy><div className="ay is-loading"><div className="col"><section className="card hero" aria-label="Ayın özeti"><p className="muted" role="status">Bu ayın rakamları yükleniyor…</p></section></div><div className="col"><section className="card netcard" aria-hidden="true"/><section className="card chart" aria-hidden="true"/></div></div></Shell>;
 if("failed" in read)return <Shell title={monthName(read.month)} busy={loading}><div className="state" role="alert"><p>Bu ayın rakamları okunamadı. {read.failed}</p><Button variant="secondary" onClick={retry}>Yeniden dene</Button></div></Shell>;
 const result=read.result;
 if(result.status==="source-unavailable"){
  if(result.code==="SOURCE_CHANGED")return <Shell title={monthName(read.month)} busy={loading}><div className="state" role="alert"><p>Bu ayın rakamları okunamadı. {result.message}</p><Button variant="secondary" onClick={retry}>Yeniden dene</Button></div></Shell>;
  return <Shell title={result.code==="ESTIMATE_UNAVAILABLE"?"Bu ay":monthName(read.month)} busy={loading}><MonthUnavailable result={result} month={read.month} purpose="ayın satışını, kârını ve dikkat edilecek ürünleri gösterir" coverage={coverage} onMonth={onMonth} importPackage={importPackage}/></Shell>;
 }
 const v=result.view,t=v.totals,c=v.changes;
 const byId=new Map(v.products.map(p=>[p.id,p]));
 const attention=attentionRows(v.attention),net=netCardState(t);
 const change=c===null?null:monthChange(v.month,c.grossProfitPct);
 const arrow=changeArrow(c?.grossProfitPct??null);
 const line=marginLine(t);
 return <Shell title={monthName(v.month)} busy={loading}>
  <div className="ay">
   <div className="col">
    <section className="card hero" aria-label="Ayın özeti">
     <p className="lead">{monthLead(v.month,t.sales)}</p>
     <div className="hero-row">
      {t.grossProfit===null?<p className="hero-num is-unknown"><Unknown/></p>:<Amount value={t.grossProfit} className="hero-num"/>}
      {c!==null&&(change!==null?<p className="delta">{arrow==="up"?<ArrowUpIcon/>:arrow==="down"?<ArrowDownIcon/>:null}{change}</p>:<p className="delta">Önceki ayla karşılaştırılamıyor</p>)}
     </div>
     {t.grossProfit===null?<p className="hero-sub">Maliyetler bilinmediği için brüt kâr hesaplanamadı.</p>:line!==null&&<p className="hero-sub">{line}</p>}
     <div className="disclose">
      <Popover buttonClass="link" dialogLabel="Nasıl hesaplandı" panelClass="pop-bridge" label={<>Nasıl hesaplandı?<ChevronDownIcon/></>}>
       <Bridge steps={monthBridgeSteps(t)} formatValue={money} ariaLabel="Satıştan net kâra köprü"/>
      </Popover>
      <TrustChip costKnownPct={t.costKnownPct}/>
     </div>
     <div className="att">
      <h2 className="h3">Dikkat edilecekler</h2>
      {attention.products.length===0&&attention.missingCost===0?<p className="muted">Bu ay dikkat isteyen bir şey yok.</p>
       :<ul aria-label="Dikkat edilecekler">
        {attention.products.map(row=>{const p=byId.get(row.productId);if(!p)return null;const kind=row.kind as keyof typeof titles;
         return <li key={`${row.kind}-${row.productId}`}><button type="button" className={`att-row is-${kind}`} onClick={()=>navigate("products",{productId:row.productId})}><AlertIcon className="att-i"/><span className="att-t"><b>{productName(p)}</b>{titles[kind]}</span><span className="att-x">{attentionFigure(kind,p)}</span><ChevronRightIcon className="att-go"/></button></li>;})}
        {attention.missingCost>0&&<li><button type="button" className="att-row is-missing" onClick={()=>navigate("products",{filter:"missingCost"})}><InfoIcon className="att-i"/><span className="att-t"><b>{attention.missingCost} ürünün alış fiyatı yok</b></span><span className="att-x">Satışları kâra katılmadı; sıfır sayılmadı</span><ChevronRightIcon className="att-go"/></button></li>}
       </ul>}
     </div>
    </section>
   </div>
   <div className="col">
    {net.kind==="missing"
     ?<section className="card netcard" aria-labelledby="net-title"><h2 id="net-title">Net kâr</h2>{net.toExpenses?<><p className="net-say">{netReasonText(net.reason,v.dataUntil)}</p><button type="button" className="btn btn-primary" onClick={()=>navigate("expenses")}>Giderleri gir<ArrowRightIcon/></button></>:<p className="muted">{netReasonText(net.reason,v.dataUntil)}</p>}</section>
     :<section className="card netcard" aria-labelledby="net-title"><h2 id="net-title">Tahmini net kâr</h2>
       {net.kind==="same"?<p className="net-same">Brüt kârla aynı</p>:<Amount value={t.netProfit!} className={`net${t.netProfit!.startsWith("-")?" is-neg":""}`}/>}
       <p className="net-line">{net.kind==="same"?"Bu ay gider yok":`Giderler: ${money(t.expenses!)}`} · <button type="button" className="link link-inline" onClick={()=>navigate("expenses")}>Düzelt</button></p></section>}
    <section className="card chart" aria-labelledby="chart-title">
     <h2 id="chart-title">Son 6 ay brüt kâr (₺)</h2>
     {v.history.length<6&&<p className="muted">Paket yalnız {v.history.length} ayı kapsıyor.</p>}
     <MonthBars history={v.history} month={v.month}/>
    </section>
   </div>
  </div>
 </Shell>;
}
