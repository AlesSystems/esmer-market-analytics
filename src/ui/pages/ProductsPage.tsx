import {useDeferredValue,useEffect,useLayoutEffect,useMemo,useRef,useState} from "react";
import type {KeyboardEvent} from "react";
import type {MonthProfitProduct,Pct} from "../../source/month-profit";
import type {PageProps} from "../sections";
import {Button} from "../components/ui/button";
import {Input} from "../components/ui/input";
import {decimal} from "../format";
import {ProductCard,Unknown,amount,percent} from "../products/ProductCard";
import {ProductSourceLines} from "../products/ProductSourceLines";
import {defaultSort,nextSort,productName,quickFilters,searchIndex,visibleProducts,type QuickFilter,type Sort,type SortKey} from "../products/product-rows";
import {MonthUnavailable,TrustChip} from "./MonthStates";
import {useMonthProfit} from "./month-profit-data";
import {monthName} from "./month-summary";

const columns:[SortKey,string,boolean][]=[["name","Ürün",false],["sales","Satış",true],["cost","Maliyet",true],["grossProfit","Kâr",true],["marginPct","Marj",true],["marginChangePoints","Önceki aya göre",true]];

/** Signed points as the service computed them; the renderer does no arithmetic. */
function PointsChange({value}:{value:Pct}) {
 if(value===null)return <Unknown/>;
 const flat=/^-?0+(\.0+)?$/.test(value),down=value.startsWith("-");
 return <span className={flat?undefined:down?"is-down":"is-up"}>{flat?"":down?"−":"+"}{decimal(value.replace(/^-/,""),2)} puan</span>;
}

function Shell({busy=false,children,chip}:{busy?:boolean;children:React.ReactNode;chip?:React.ReactNode}) {
 return <main className="products-page" aria-busy={busy}><header className="month-head"><div><p className="month-eyebrow">Ürünler</p><h1>Ürünler</h1></div>{chip}</header>{children}</main>;
}

export function ProductsPage({month,onMonth,coverage,active,availability,state,navigate,openSettings}:PageProps) {
 const {read,loading,retry}=useMonthProfit(month,active,availability);
 const [sort,setSort]=useState<Sort>(defaultSort),[filter,setFilter]=useState<QuickFilter>("all"),[query,setQuery]=useState("");
 const [selected,setSelected]=useState<{id:string;name:string|null}|null>(state.productId?{id:state.productId,name:null}:null);
 const [source,setSource]=useState(false),[dismissed,setDismissed]=useState(false);
 useEffect(()=>{if(selected)setDismissed(false);},[selected]);
 const focusRow=useRef<string|null>(state.productId??null),searchBox=useRef<HTMLInputElement>(null),cardHeading=useRef<HTMLHeadingElement>(null),focusCard=useRef(false),sourceButton=useRef<HTMLButtonElement>(null),scrollY=useRef(0);
 const view=read&&"result" in read&&read.result.status==="month-profit"?read.result.view:null;
 const deferredQuery=useDeferredValue(query);
 const index=useMemo(()=>view?searchIndex(view.products):new Map<string,string>(),[view]);
 const rows=useMemo(()=>view?visibleProducts(view.products,{query:deferredQuery,filter,sort},index):[],[view,deferredQuery,filter,sort,index]);
 const chosen=view&&selected?view.products.find(p=>p.id===selected.id)??null:null;
 const chosenName=chosen?productName(chosen):null,hasChosen=chosen!==null,viewMonth=view?.month;
 // The drill-down belongs to one product in one month; losing either closes it.
 useEffect(()=>{if(!hasChosen)setSource(false);},[hasChosen]);
 useEffect(()=>{setSource(false);},[viewMonth,month]);
 useEffect(()=>{if(hasChosen&&focusCard.current){focusCard.current=false;cardHeading.current?.focus();}},[hasChosen,selected?.id]);
 const tabStop=rows.some(p=>p.id===selected?.id)?selected?.id:rows[0]?.id;

 // Navigation from Bu ay (or another page) opens that product's card and focuses its row.
 useEffect(()=>{if(state.productId){focusRow.current=state.productId;setSelected({id:state.productId,name:null});setSource(false);}},[state]);
 useEffect(()=>{if(chosenName&&selected&&selected.name!==chosenName)setSelected({id:selected.id,name:chosenName});},[chosenName,selected]);
 // Focus moves after the DOM has the row; a row hidden by a filter just drops the request.
 useEffect(()=>{
  const id=focusRow.current;if(id===null||!view||source)return;
  focusRow.current=null;
  const row=document.querySelector<HTMLElement>(`.products-table tr[data-product="${CSS.escape(id)}"]`);
  row?.scrollIntoView({block:"center"});row?.focus({preventScroll:true});
 });
 // Back from Kaynak satırlar: same scroll position, focus on the button that opened it.
 const wasSource=useRef(false);
 useLayoutEffect(()=>{
  if(wasSource.current&&!source){window.scrollTo(0,scrollY.current);sourceButton.current?.focus({preventScroll:true});}
  wasSource.current=source;
 },[source]);

 const open=(id:string)=>{focusCard.current=true;setSelected({id,name:null});};
 const closeCard=()=>{
  if(selected){if(rows.some(p=>p.id===selected.id))focusRow.current=selected.id;else searchBox.current?.focus();}
  setSelected(null);setDismissed(true);
 };
 const clear=()=>{setQuery("");setFilter("all");};
 const move=(event:KeyboardEvent<HTMLTableRowElement>,id:string)=>{
  if(event.key==="Enter"||event.key===" "){event.preventDefault();open(id);return;}
  const step=event.key==="ArrowDown"?1:event.key==="ArrowUp"?-1:0;
  if(!step)return;
  event.preventDefault();
  const next=rows[rows.findIndex(p=>p.id===id)+step];
  if(next)document.querySelector<HTMLElement>(`.products-table tr[data-product="${CSS.escape(next.id)}"]`)?.focus();
 };

 if(!month)return <Shell><p role="status">Veriler hazırlanıyor…</p></Shell>;
 if(!read)return <Shell busy><p role="status">Ürünler yükleniyor…</p></Shell>;
 if("failed" in read)return <Shell busy={loading}><div className="month-state" role="alert"><p>Ürünler okunamadı. {read.failed}</p><Button variant="outline" onClick={retry}>Yeniden dene</Button></div></Shell>;
 if(!view){
  const result=read.result;
  const code=result.status==="source-unavailable"?result.code as string:"";
  if(code&&code!=="MONTH_NOT_COVERED"&&code!=="ESTIMATE_UNAVAILABLE")return <Shell busy={loading}><div className="month-state" role="alert"><p>Ürünler okunamadı. Veri paketi değişmiş olabilir.</p><Button variant="outline" onClick={retry}>Yeniden dene</Button></div></Shell>;
  return <Shell busy={loading}>{result.status==="source-unavailable"&&<MonthUnavailable result={result} month={read.month} purpose="ayın ürünlerini ve kârlarını gösterir" coverage={coverage} availability={availability} onMonth={onMonth} navigate={navigate} openSettings={openSettings}/>}</Shell>;
 }
 if(source&&chosen)return <main className="products-page" aria-busy={loading}><ProductSourceLines key={`${view.source.hash}|${view.month}|${chosen.id}`} hash={view.source.hash} month={view.month} productId={chosen.id} name={productName(chosen)} onBack={()=>setSource(false)}/></main>;

 const sortOf=(key:SortKey)=>sort.key===key?sort.direction:undefined;
 const row=(p:MonthProfitProduct)=><tr key={p.id} data-product={p.id} tabIndex={p.id===tabStop?0:-1} aria-current={p.id===selected?.id||undefined} className={p.id===selected?.id?"is-selected":undefined} onClick={()=>open(p.id)} onKeyDown={event=>move(event,p.id)}>
  <td><button type="button" className="product-name product-open" onClick={event=>{event.stopPropagation();open(p.id);}}>{productName(p)}</button>{p.category&&<span className="product-category">{p.category}</span>}</td>
  <td className="number">{amount(p.sales)}</td><td className="number">{amount(p.cost)}</td><td className="number">{amount(p.grossProfit)}</td><td className="number">{percent(p.marginPct)}</td><td className="number"><PointsChange value={p.marginChangePoints}/></td>
 </tr>;
 return <Shell busy={loading} chip={<TrustChip navigate={navigate}/>}>
  <p className="products-note">{monthName(view.month)} · {view.products.length} ürün</p>
  <div className="products-tools">
   <div role="group" aria-label="Hızlı süzgeçler" className="products-filters">{quickFilters.map(([key,label])=><Button key={key} variant={filter===key?"default":"outline"} aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}</Button>)}</div>
   <Input ref={searchBox} type="search" aria-label="Ürün ara" placeholder="Ürün adı veya numarası" className="products-search" value={query} onChange={event=>setQuery(event.target.value)}/>
  </div>
  <div className="products-layout" onKeyDown={event=>{if(event.key==="Escape"&&selected&&!(event.target instanceof HTMLInputElement)){event.preventDefault();closeCard();}}}>
   <div className="products-list">
    {view.products.length===0?<p className="viz-empty">Bu ay satılan ürün yok.</p>:rows.length===0?<div className="month-state"><p>Aramaya uyan ürün yok.</p><Button variant="outline" onClick={clear}>Aramayı ve süzgeci temizle</Button></div>
    :<div className="table-scroll" role="region" aria-label="Ürün listesi"><table className="products-table"><caption className="sr-only">Ürünler, seçili sıralamayla</caption><thead><tr>{columns.map(([key,label,numeric])=><th key={key} scope="col" className={numeric?"number":undefined} aria-sort={sortOf(key)}><button type="button" className="products-sort" onClick={()=>setSort(nextSort(sort,key))}>{label}</button></th>)}</tr></thead><tbody>{rows.map(row)}</tbody></table></div>}
   </div>
   <section role="region" aria-label="Ürün kartı" className="product-card" hidden={!selected&&dismissed}>
    {chosen?<ProductCard key={chosen.id} heading={cardHeading} product={chosen} month={view.month} sourceButton={sourceButton} onClose={closeCard} onSource={()=>{scrollY.current=window.scrollY;setSource(true);}}/>
     :selected?<><p className="product-card-missing">{selected.name??`Ürün #${selected.id}`} bu ay satılmadı.</p><Button variant="outline" onClick={closeCard}>Kartı kapat</Button></>
     :<p className="viz-empty">Ayrıntı için tablodan bir ürün seçin.</p>}
   </section>
  </div>
 </Shell>;
}
