import type {ReactNode, Ref} from "react";
import type {MonthProfitProduct,Pct} from "../../source/month-profit";
import {Button} from "../components/ui/button";
import {ChartFrame,niceTicks} from "../charts";
import {decimal,money} from "../format";
import {monthName,monthShort,percentText} from "../pages/month-summary";
import {productName} from "./product-rows";

export function Unknown({text="Bilinmiyor"}:{text?:string}){return <><span aria-hidden="true">—</span><span className="sr-only">{text}</span></>;}
export const amount=(value:string|null)=>value===null?<Unknown/>:money(value);
export const percent=(value:Pct)=>value===null?<Unknown/>:percentText(value);
const positive=(value:string)=>value.replace(/^-/,"");
const previousMonth=(month:string)=>{const d=new Date(`${month}-01T00:00:00Z`);d.setUTCMonth(d.getUTCMonth()-1);return d.toISOString().slice(0,7);};
const tick=new Intl.NumberFormat("tr-TR",{maximumFractionDigits:1});
const units={adet:"adet",kg:"kg",other:"birim"} as const;

/** Six-month margin line. One series; months without a margin break the line and get no point, never a zero. */
function MarginLine({product}:{product:MonthProfitProduct}) {
 const W=360,H=150,L=40,R=14,T=16,B=26,history=product.history;
 const values=history.map(row=>row.marginPct===null?null:Number(row.marginPct));
 const known=values.filter((v):v is number=>v!==null);
 if(!known.length)return <p className="viz-empty">Son aylarda marjı hesaplanabilen ay yok.</p>;
 const scale=niceTicks(Math.min(0,...known),Math.max(0,...known),3);
 const x=(i:number)=>L+(history.length<2?(W-L-R)/2:i*(W-L-R)/(history.length-1));
 const y=(v:number)=>T+(H-T-B)*(1-(v-scale.min)/(scale.max-scale.min||1));
 const path=values.reduce<{d:string;open:boolean}>((acc,v,i)=>v===null?{d:acc.d,open:false}:{d:`${acc.d}${acc.open?"L":"M"}${x(i)},${y(v)}`,open:true},{d:"",open:false}).d;
 return <svg viewBox={`0 0 ${W} ${H}`} width="100%" className="product-margin-line" role="img" aria-label={`${productName(product)} son altı ay marj`}>
  {scale.ticks.map(t=><g key={t}><line className={t===0?"viz-axis":"viz-grid"} x1={L} x2={W-R} y1={y(t)} y2={y(t)}/><text className="viz-tick" x={L-6} y={y(t)+4} textAnchor="end">%{tick.format(t)}</text></g>)}
  {path&&<path className="product-margin-path" d={path}/>}
  {history.map((row,i)=>{const v=values[i],current=i===history.length-1;return <g key={row.month} data-month={row.month} data-state={v===null?"unknown":"value"}>
   <title>{`${monthName(row.month)} · marj ${row.marginPct===null?"bilinmiyor":percentText(row.marginPct)}`}</title>
   {v!==null&&<circle className={`product-margin-point${current?" is-current":""}`} cx={x(i)} cy={y(v)} r={current?4.5:3.5}/>}
   <text className={`viz-tick${current?" is-current":""}`} x={x(i)} y={H-6} textAnchor="middle">{monthShort(row.month)}{v===null?" —":""}</text>
  </g>;})}
 </svg>;
}

function Fact({term,children}:{term:string;children:ReactNode}){return <div><dt>{term}</dt><dd>{children}</dd></div>;}

export function ProductCard({product,month,onSource,onClose,sourceButton,heading}:{heading?:Ref<HTMLHeadingElement>;product:MonthProfitProduct;month:string;onSource:(button:HTMLButtonElement)=>void;onClose:()=>void;sourceButton?:Ref<HTMLButtonElement>}) {
 const p=product,costKnown=p.grossProfit!==null,loss=p.flags.loss;
 const unit=p.unit===null?null:units[p.unit];
 const previous=p.previousMarginPct===null?"":` ${monthName(previousMonth(month))}: ${percentText(p.previousMarginPct)}.`;
 const share=p.profitSharePct===null&&p.profitRank===null?<Unknown/>:<>{p.profitSharePct===null?"—":percentText(p.profitSharePct)}{p.profitRank!==null&&` · ${p.profitRank}. sıra`}</>;
 return <>
  <header className="product-card-head">
   <div>{p.category&&<p className="product-card-category">{p.category}</p>}<h2 ref={heading} tabIndex={-1}>{productName(p)}</h2></div>
   <Button variant="outline" className="product-card-close" onClick={onClose}>Kartı kapat</Button>
  </header>
  {costKnown?<>
   <p className={`product-card-margin${loss?" is-loss":""}`}>{p.marginPct===null?"Marj hesaplanamadı":percent(p.marginPct)}</p>
   {p.marginPct!==null&&<p className="product-card-says">{loss?<>Her 100 ₺ satışta <b>{decimal(positive(p.marginPct),2)} ₺</b> zarar.</>:<>Her 100 ₺ satışta <b>{decimal(p.marginPct,2)} ₺</b> brüt kâr.</>}{previous}</p>}
   {p.flags.missingCost&&<p className="product-card-note">Bazı satışlarının maliyeti bilinmiyor; kâr yalnız maliyeti bilinen satışlardan hesaplandı.</p>}
   <dl className="product-card-facts">
    <Fact term="Satış">{amount(p.sales)}</Fact>
    <Fact term="Bu ay kâr">{amount(p.grossProfit)}</Fact>
    <Fact term="Satış fiyatı">{amount(p.unitPrice)}</Fact>
    <Fact term="Birim maliyet">{amount(p.unitCost)}</Fact>
    <Fact term="Birim kâr">{amount(p.unitProfit)}</Fact>
    <Fact term="Satılan">{p.quantity===null||unit===null?<Unknown/>:`${decimal(p.quantity)} ${unit}`}</Fact>
    <Fact term="Toplam kârdaki payı">{share}</Fact>
   </dl>
  </>:<>
   <p className="product-card-missing">Bu ürünün maliyeti bilinmiyor; kâr hesaplanamadı.</p>
   <dl className="product-card-facts"><Fact term="Satış">{amount(p.sales)}</Fact></dl>
  </>}
  <ChartFrame headingLevel="h3" title="Son altı ay marj" summary={p.history.length<6?`Veri paketi ${p.history.length} ayı kapsıyor`:undefined} table={{caption:"Aylara göre marj",columns:[{label:"Ay"},{label:"Marj",numeric:true}],rows:p.history.map(row=>[monthName(row.month),row.marginPct===null?"Bilinmiyor":percentText(row.marginPct)])}}><MarginLine product={p}/></ChartFrame>
  <Button ref={sourceButton} variant="outline" className="product-card-source" onClick={event=>onSource(event.currentTarget)}>Kaynak satırlar</Button>
 </>;
}
