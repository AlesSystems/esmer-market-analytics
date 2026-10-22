import type {ReactNode} from "react";
import type {AttentionKind,MonthProfitProduct,MonthProfitView,NetProfitReason,Pct} from "../../source/month-profit";
import type {PageProps} from "../sections";
import {Button} from "../components/ui/button";
import {Bridge,ChartFrame,EstimateBadge,RankBars,niceTicks,type RankRow} from "../charts";
import {date,decimal,money} from "../format";
import {useMonthProfit} from "./month-profit-data";
import {monthBridgeSteps,monthName,monthShort,monthSummary,wordMoney} from "./month-summary";

/** Display helpers. Strings from the service pass through; null is an explicit unknown, never zero. */
const amount=(value:string|null)=>value===null?<Unknown/>:money(value);
const pct=(value:Pct)=>value===null?<Unknown/>:`%${decimal(value)}`;
function Unknown({text="Bilinmiyor"}:{text?:string}){return <><span aria-hidden="true">—</span><span className="sr-only">{text}</span></>;}
const productName=(p:Pick<MonthProfitProduct,"id"|"name">)=>p.name??`Ürün #${p.id}`;

function Change({value,unit}:{value:Pct;unit:"pct"|"points"}) {
 if(value===null)return <p className="month-change">Önceki ayla karşılaştırılamıyor</p>;
 const down=value.startsWith("-"),flat=/^-?0+(\.0+)?$/.test(value),abs=decimal(value.replace(/^-/,""));
 const text=unit==="pct"?`%${abs}`:`${abs} puan`;
 return <p className={`month-change${flat?"":down?" is-down":" is-up"}`}><b>{flat?"":down?"▼ ":"▲ "}{text}</b> önceki aya göre</p>;
}

const reasons:Record<NetProfitReason,string>={
 costUnknown:"Maliyetler bilinmediği için hesaplanamadı",
 monthPartial:"Ay henüz tamamlanmadı",
 expensesMissing:"Bu ayın giderleri girilmedi",
 expensesIncomplete:"Bu ayın giderleri tamamlanmadı",
 unknownTax:"Bazı giderlerin KDV durumu bilinmiyor",
 confirmationStale:"Giderler onaydan sonra değişti; yeniden onaylayın",
};
const toExpenses=new Set<NetProfitReason>(["expensesMissing","expensesIncomplete","unknownTax","confirmationStale"]);

const attentionTitles:Record<AttentionKind,string>={loss:"Zarar ediyor",marginDrop:"Marjı düştü",lowMarginHighVolume:"Çok satıyor ama marjı düşük",missingCost:"Maliyeti eksik"};
function attentionFigure(kind:AttentionKind,p:MonthProfitProduct):string {
 const margin=(value:Pct)=>value===null?"bilinmiyor":`%${decimal(value)}`;
 if(kind==="loss")return p.grossProfit===null?"Brüt kâr bilinmiyor":`Brüt zarar ${money(p.grossProfit.replace(/^-/,""))}`;
 if(kind==="marginDrop")return `Marj ${margin(p.previousMarginPct)} → ${margin(p.marginPct)}`;
 if(kind==="lowMarginHighVolume")return `Satış ${p.sales===null?"bilinmiyor":money(p.sales)} · marj ${margin(p.marginPct)}`;
 return `Satış ${p.sales===null?"bilinmiyor":money(p.sales)} · maliyet kaydı yok`;
}

/** Six-month gross profit columns. Unknown months are a hatched stub labelled "Bilinmiyor", never a zero bar. */
function MonthColumns({history,month}:{history:MonthProfitView["history"];month:string}) {
 const W=560,H=220,L=48,R=8,T=24,B=40;
 const values=history.map(row=>row.grossProfit===null?null:Number(row.grossProfit));
 const known=values.filter((v):v is number=>v!==null);
 const scale=niceTicks(Math.min(0,...known),Math.max(0,...known),3);
 const y=(v:number)=>T+(H-T-B)*(1-(v-scale.min)/(scale.max-scale.min||1));
 const slot=(W-L-R)/Math.max(history.length,3),bar=Math.min(56,slot*.56);
 return <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="month-columns" role="img" aria-label="Son aylar brüt kâr sütunları">
  {scale.ticks.map(t=><g key={t}><line className={t===0?"viz-axis":"viz-grid"} x1={L} x2={W-R} y1={y(t)} y2={y(t)}/><text className="viz-tick" x={L-8} y={y(t)+4} textAnchor="end">{wordMoney(String(t)).replace(" ₺","")}</text></g>)}
  {history.map((row,i)=>{const v=values[i],x=L+i*slot+(slot-bar)/2,current=row.month===month,base=y(0);
   return <g key={row.month} data-month={row.month} data-state={v===null?"unknown":"value"}>
    <title>{`${monthName(row.month)} · brüt kâr ${row.grossProfit===null?"bilinmiyor":money(row.grossProfit)} · marj ${row.marginPct===null?"bilinmiyor":`%${decimal(row.marginPct)}`} · satış ${row.sales===null?"bilinmiyor":money(row.sales)}`}</title>
    {v===null?<rect className="month-col month-col--unknown" x={x} y={base-14} width={bar} height={14} rx={3}/>
     :<rect className={`month-col${current?" is-current":""}${v<0?" is-negative":""}`} x={x} y={Math.min(y(v),base)} width={bar} height={Math.max(2,Math.abs(base-y(v)))} rx={3}/>}
    <text className="month-col-value" x={x+bar/2} y={(v===null?base-14:Math.min(y(v),base))-6} textAnchor="middle">{v===null?"Bilinmiyor":wordMoney(row.grossProfit!).replace(" ₺","")}</text>
    <text className={`viz-tick${current?" is-current":""}`} x={x+bar/2} y={H-22} textAnchor="middle">{monthShort(row.month)}</text>
    <text className="viz-tick" x={x+bar/2} y={H-7} textAnchor="middle">{row.marginPct===null?"—":`%${decimal(row.marginPct)}`}</text>
   </g>;})}
 </svg>;
}

function Shell({month,children,busy=false}:{month:string|null;children:ReactNode;busy?:boolean}) {
 return <main className="month-page" aria-busy={busy}><header className="month-head"><div><p className="month-eyebrow">Bu ay</p><h1>{month?monthName(month):"Bu ay"}</h1></div></header>{children}</main>;
}

export function MonthPage({month,onMonth,coverage,availability,active,navigate,openSettings}:PageProps) {
 const {read,loading,retry}=useMonthProfit(month,active,availability);
 if(!month)return <Shell month={null}><p role="status">Veriler hazırlanıyor…</p></Shell>;
 if(!read)return <Shell month={month} busy><p role="status">Bu ayın rakamları yükleniyor…</p></Shell>;
 if("failed" in read)return <Shell month={month} busy={loading}><div className="month-state" role="alert"><p>Bu ayın rakamları okunamadı. {read.failed}</p><Button variant="outline" onClick={retry}>Yeniden dene</Button></div></Shell>;
 const result=read.result;
 if(result.status==="source-unavailable"){
  const shown=read.month;
  return <Shell month={result.code==="ESTIMATE_UNAVAILABLE"?null:shown} busy={loading}>{result.code==="ESTIMATE_UNAVAILABLE"?<div className="month-state"><h2>Kâr tahmini için veri paketi gerekiyor</h2><p>Maliyet bilgisi içeren bir veri paketi içe aktarınca bu sayfa ayın satışını, kârını ve dikkat edilecek ürünleri gösterir.</p><div className="month-state-actions"><Button onClick={openSettings}>Veri paketi içe aktar</Button>{availability?.status==="ready"&&availability.store==="loaded"&&<Button variant="outline" onClick={()=>navigate("reports")}>Aylık raporlara git</Button>}</div></div>
   :<div className="month-state"><h2>{monthName(shown)} için veri yok</h2><p>{coverage?`Veri paketi ${date(coverage.from)} – ${date(coverage.to)} arasını kapsıyor. Bu aralıktan bir ay seçin.`:"Bu ay veri paketinin dışında. Kenar çubuğundaki Dönem alanından başka bir ay seçin."}</p>{coverage&&<div className="month-state-actions"><Button variant="outline" onClick={()=>onMonth(coverage.to.slice(0,7))}>Son aya git ({monthName(coverage.to.slice(0,7))})</Button></div>}</div>}</Shell>;
 }
 const v=result.view,t=v.totals,c=v.changes;
 const byId=new Map(v.products.map(p=>[p.id,p]));
 const top=v.products.filter(p=>p.grossProfit!==null).sort((a,b)=>Number(b.grossProfit)-Number(a.grossProfit)||a.id.localeCompare(b.id)).slice(0,8);
 const rankRows:RankRow[]=top.map(p=>({id:p.id,label:productName(p),value:p.grossProfit,detail:p.marginPct===null?"marj bilinmiyor":`%${decimal(p.marginPct)} marj`,onSelect:()=>navigate("products",{productId:p.id})}));
 const attention=v.attention.slice(0,8);
 const net=t.netProfit!==null?<strong>{money(t.netProfit)}</strong>:<>
  <strong className="is-unknown"><Unknown text="Hesaplanamadı"/></strong>
  <p className="month-reason">{t.netProfitReason==="monthPartial"?`Ay henüz tamamlanmadı (${date(v.dataUntil)} tarihine kadar veri)`:t.netProfitReason===null?"Hesaplanamadı":reasons[t.netProfitReason]}</p>
  {t.netProfitReason&&toExpenses.has(t.netProfitReason)&&<Button variant="link" className="month-link" onClick={()=>navigate("expenses")}>Giderlere git</Button>}
 </>;
 const history=v.history;
 return <main className="month-page" aria-busy={loading}>
  <header className="month-head"><div><p className="month-eyebrow">Bu ay</p><h1>{monthName(v.month)}</h1></div>
   <EstimateBadge label="Tahmini"><p>Son alış fiyatıyla tahmin · iadeler kâra dahil değil.</p><Button variant="link" className="month-link" onClick={()=>navigate("reports",{reportView:"report"})}>Ayrıntılar Rapor ve Excel’de</Button></EstimateBadge>
  </header>
  <p className="month-lead">{monthSummary(v.month,t)}</p>
  <section className="month-figures" aria-label="Ayın rakamları">
   <article className="month-figure"><h2>Satış</h2><strong>{amount(t.sales)}</strong>{c&&<Change value={c.salesPct} unit="pct"/>}</article>
   <article className="month-figure is-hero"><h2>Tahmini brüt kâr</h2><strong>{amount(t.grossProfit)}</strong>{c&&<Change value={c.grossProfitPct} unit="pct"/>}</article>
   <article className="month-figure"><h2>Marj</h2><strong>{pct(t.marginPct)}</strong>{c&&<Change value={c.marginPoints} unit="points"/>}</article>
   <article className="month-figure"><h2>Tahmini net kâr</h2>{net}{t.netProfit!==null&&c&&<Change value={c.netProfitPct} unit="pct"/>}</article>
  </section>
  <div className="month-grid">
   <section className="month-panel"><ChartFrame headingLevel="h2" title="Satıştan net kâra" summary="Satıştan maliyet ve giderler düşülünce kalan"><Bridge steps={monthBridgeSteps(t)} formatValue={money} ariaLabel="Satıştan net kâra köprü"/></ChartFrame></section>
   <section className="month-panel"><ChartFrame headingLevel="h2" title="Son altı ay brüt kâr" summary={history.length<6?`Paket yalnız ${history.length} ayı kapsıyor · altta ayın marjı`:"Altta ayın marjı"} table={{caption:"Aylara göre brüt kâr",columns:[{label:"Ay"},{label:"Satış",numeric:true},{label:"Brüt kâr",numeric:true},{label:"Marj",numeric:true}],rows:history.map(row=>[monthName(row.month),row.sales===null?"Bilinmiyor":money(row.sales),row.grossProfit===null?"Bilinmiyor":money(row.grossProfit),row.marginPct===null?"Bilinmiyor":`%${decimal(row.marginPct)}`])}}><MonthColumns history={history} month={v.month}/></ChartFrame></section>
   <section className="month-panel"><ChartFrame headingLevel="h2" title="En çok kazandıran ürünler" summary="Bu ay bıraktıkları tahmini brüt kâr · ürünü seçince Ürünler açılır"><RankBars rows={rankRows} color="var(--viz-contribution)" formatValue={money} ariaLabel="En çok kazandıran ürünler" empty="Kârı hesaplanabilen ürün yok."/></ChartFrame></section>
   <section className="month-panel month-attention" aria-labelledby="month-attention-title"><h2 id="month-attention-title">Dikkat edilecekler</h2>
    {attention.length===0?<p className="viz-empty">Bu ay öne çıkan bir sorun yok.</p>:<ul aria-label="Dikkat edilecek ürünler">{attention.map(row=>{const p=byId.get(row.productId);if(!p)return null;return <li key={`${row.kind}-${row.productId}`}><button type="button" className="month-alert" data-kind={row.kind} onClick={()=>navigate("products",{productId:row.productId})}><span className="month-alert-kind">{attentionTitles[row.kind]}</span><span className="month-alert-name">{productName(p)}</span><span className="month-alert-figure">{attentionFigure(row.kind,p)}</span></button></li>;})}</ul>}
    {v.attention.length>attention.length&&<Button variant="link" className="month-link" onClick={()=>navigate("products")}>{v.attention.length-attention.length} ürün daha · Ürünler’de gör</Button>}
   </section>
  </div>
 </main>;
}
