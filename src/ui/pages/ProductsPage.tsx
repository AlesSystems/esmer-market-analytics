import {useDeferredValue,useEffect,useMemo,useRef,useState} from "react";
import type {KeyboardEvent,ReactNode} from "react";
import type {MonthProfitProduct} from "../../source/month-profit";
import type {PageProps} from "../sections";
import {Button} from "../components/ui/button";
import {ArrowDownIcon,ArrowUpIcon,CloseIcon,SearchIcon} from "../icons";
import {amount,percent} from "../products/figures";
import {ProductDrawer} from "../products/ProductDrawer";
import {ProductSourceLines} from "../products/ProductSourceLines";
import {defaultSort,filterCounts,nextSort,productName,quickFilters,searchIndex,visibleProducts,type QuickFilter,type Sort,type SortKey} from "../products/product-rows";
import {MonthUnavailable,TrustChip} from "./MonthStates";
import {useMonthProfitContext} from "./month-profit-data";
import {monthName} from "./month-summary";

const columns:[SortKey,string,boolean][]=[["name","Ürün",false],["sales","Satış",true],["grossProfit","Kâr",true],["marginPct","Marj",true]];
const MARGIN_BAR_AT=40;

function Shell({busy=false,onKeyDown,children}:{busy?:boolean;onKeyDown?:(event:KeyboardEvent<HTMLElement>)=>void;children:ReactNode}) {
 return <main className="products-page" aria-busy={busy} onKeyDown={onKeyDown}><h1 className="sr-only">Ürünler</h1>{children}</main>;
}

export function ProductsPage({month,onMonth,coverage,state,importPackage}:PageProps) {
 const {read,loading,retry}=useMonthProfitContext();
 const [sort,setSort]=useState<Sort>(defaultSort),[filter,setFilter]=useState<QuickFilter>(state.filter??"all"),[query,setQuery]=useState("");
 const [selected,setSelected]=useState<string|null>(state.productId??null),[tabId,setTabId]=useState<string|null>(null),[source,setSource]=useState(false);
 const focusRow=useRef<string|null>(state.productId??null),searchBox=useRef<HTMLInputElement>(null),sourceButton=useRef<HTMLButtonElement>(null);
 const view=read&&"result" in read&&read.result.status==="month-profit"?read.result.view:null;
 const deferredQuery=useDeferredValue(query);
 const index=useMemo(()=>view?searchIndex(view.products):new Map<string,string>(),[view]);
 const rows=useMemo(()=>view?visibleProducts(view.products,{query:deferredQuery,filter,sort},index):[],[view,deferredQuery,filter,sort,index]);
 const counts=useMemo(()=>filterCounts(view?.products??[]),[view]);
 const chosen=view&&selected!==null?view.products.find(p=>p.id===selected)??null:null;
 const viewMonth=view?.month;
 // The source lines belong to one product in one month; losing either closes them.
 useEffect(()=>{if(chosen===null)setSource(false);},[chosen]);
 useEffect(()=>{setSource(false);},[viewMonth,month]);
 // A navigation from Bu ay opens that product, or starts with that filter.
 useEffect(()=>{
  if(state.productId){focusRow.current=state.productId;setSelected(state.productId);setSource(false);}
  if(state.filter){setFilter(state.filter);setQuery("");}
 },[state]);
 // Focus moves after the DOM has the row; a row hidden by a filter just drops the request.
 useEffect(()=>{
  const id=focusRow.current;if(id===null||!view||source)return;
  focusRow.current=null;
  const button=document.querySelector<HTMLElement>(`.products-table tr[data-product="${CSS.escape(id)}"] button`);
  button?.scrollIntoView({block:"center"});button?.focus({preventScroll:true});
 });
 const names=useRef(new Map<string,string>());
 if(chosen)names.current.set(chosen.id,productName(chosen));
 const tabStop=rows.some(p=>p.id===tabId)?tabId:rows[0]?.id;

 const open=(id:string)=>{setSelected(id);setTabId(id);};
 const close=()=>{
  if(selected!==null){if(rows.some(p=>p.id===selected))focusRow.current=selected;else searchBox.current?.focus();}
  setSelected(null);
 };
 const clear=()=>{setQuery("");setFilter("all");};
 const buttonOf=(id:string)=>document.querySelector<HTMLElement>(`.products-table tr[data-product="${CSS.escape(id)}"] button`);
 /** Arrow keys, Home and End move between the ledger's product buttons; while the drawer is open it follows the focus. */
 const walk=(event:KeyboardEvent<HTMLElement>)=>{
  const current=(event.target as HTMLElement).closest<HTMLElement>("tr[data-product]")?.dataset.product;
  if(current===undefined||!rows.length)return;
  const at=rows.findIndex(p=>p.id===current);
  const next=event.key==="ArrowDown"?rows[Math.min(rows.length-1,at+1)]:event.key==="ArrowUp"?rows[Math.max(0,at-1)]:event.key==="Home"?rows[0]:event.key==="End"?rows[rows.length-1]:undefined;
  if(!next)return;
  event.preventDefault();
  buttonOf(next.id)?.focus();setTabId(next.id);
  if(selected!==null)setSelected(next.id);
 };

 if(!month)return <Shell><p role="status">Veriler hazırlanıyor…</p></Shell>;
 if(!read)return <Shell busy><section className="card ledger is-loading" aria-label="Ürünler"><p className="muted tools-empty" role="status">Ürünler yükleniyor…</p></section></Shell>;
 if("failed" in read)return <Shell busy={loading}><div className="state" role="alert"><p>Ürünler okunamadı. {read.failed}</p><Button variant="outline" onClick={retry}>Yeniden dene</Button></div></Shell>;
 if(!view){
  const result=read.result;
  const code=result.status==="source-unavailable"?result.code as string:"";
  if(code&&code!=="MONTH_NOT_COVERED"&&code!=="ESTIMATE_UNAVAILABLE")return <Shell busy={loading}><div className="state" role="alert"><p>Ürünler okunamadı. Veri paketi değişmiş olabilir.</p><Button variant="outline" onClick={retry}>Yeniden dene</Button></div></Shell>;
  return <Shell busy={loading}>{result.status==="source-unavailable"&&<MonthUnavailable result={result} month={read.month} purpose="ayın ürünlerini ve kârlarını gösterir" coverage={coverage} onMonth={onMonth} importPackage={importPackage}/>}</Shell>;
 }

 const sortOf=(key:SortKey)=>sort.key===key?sort.direction:undefined;
 const rowOf=(p:MonthProfitProduct,i:number)=>{
  const unknown=p.grossProfit===null,neg=!unknown&&p.marginPct!==null&&p.marginPct.startsWith("-");
  const width=p.marginPct===null?0:Math.min(Math.abs(Number(p.marginPct)),MARGIN_BAR_AT)/MARGIN_BAR_AT*100;
  return <tr key={p.id} data-product={p.id} className={p.id===selected?"is-selected":undefined} onClick={()=>open(p.id)}>
   <td className="rank">{i+1}</td>
   <td className="name"><button type="button" className="row-btn" tabIndex={p.id===tabStop?0:-1} aria-pressed={p.id===selected} onFocus={()=>setTabId(p.id)}>{productName(p)}</button>{p.flags.loss&&<>{" "}<span className="rchip is-loss">zarar</span></>}{p.flags.marginDrop&&<>{" "}<span className="rchip is-drop">marj düştü</span></>}</td>
   <td className="num">{amount(p.sales)}</td>
   {unknown?<td className="num unk" colSpan={2}><span className="unk">bilinmiyor</span></td>
    :<><td className={`num${p.grossProfit!.startsWith("-")?" is-neg":""}`}>{amount(p.grossProfit)}</td><td className={`num${neg?" is-neg":""}`}>{percent(p.marginPct)}</td></>}
   <td className="bar-cell" aria-hidden="true">{!unknown&&p.marginPct!==null&&<span className="mbar"><i className={neg?"is-neg":undefined} style={{width:`${width}%`}}/></span>}</td>
  </tr>;
 };
 return <Shell busy={loading} onKeyDown={event=>{if(event.key==="Escape"&&selected!==null&&!source&&!(event.target instanceof HTMLInputElement)){event.preventDefault();close();}}}>
  <div hidden={source}>
   <section className="card ledger" aria-label="Ürünler">
    <div className="tools">
     <div className="search"><SearchIcon/><input ref={searchBox} type="search" placeholder="Ürün ara" aria-label="Ürün ara" autoComplete="off" spellCheck={false} value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button type="button" className="icon-btn sclear" aria-label="Aramayı temizle" onClick={()=>{setQuery("");searchBox.current?.focus();}}><CloseIcon/></button>}</div>
     <div className="seg" role="group" aria-label="Süzgeç">{quickFilters.map(([key,label])=><button key={key} type="button" aria-pressed={filter===key} onClick={()=>setFilter(key)}>{label}<span className="count">{counts[key]}</span></button>)}</div>
     <span className="grow"/>
     <span className="list-n">{rows.length} ürün</span>
     <TrustChip costKnownPct={view.totals.costKnownPct}/>
    </div>
    {view.products.length===0?<p className="chart-empty tools-empty">Bu ay satılan ürün yok.</p>:rows.length===0
     ?<div className="state-inline"><p>Aramaya uyan ürün yok.</p><Button variant="outline" onClick={clear}>Aramayı ve süzgeci temizle</Button></div>
     :<div className="tbl-wrap" role="region" aria-label="Ürün listesi"><table className="products-table" onKeyDown={walk}>
      <caption className="sr-only">{monthName(view.month)} ürünleri. Ürün adına basınca ayrıntı açılır; aşağı ve yukarı oklarla gezinilir.</caption>
      <thead><tr><th className="rank" scope="col"><span className="sr-only">Sıra</span></th>{columns.map(([key,label,numeric])=><th key={key} scope="col" className={numeric?"num":undefined} aria-sort={sortOf(key)}><button type="button" className={`sort${sortOf(key)?" is-on":""}`} onClick={()=>setSort(nextSort(sort,key))}>{label}{sortOf(key)==="ascending"?<ArrowUpIcon className="sort-ico"/>:<ArrowDownIcon className="sort-ico"/>}</button></th>)}<th className="bar-cell" aria-hidden="true"/></tr></thead>
      <tbody>{rows.map(rowOf)}</tbody>
     </table></div>}
   </section>
  </div>
  {!source&&selected!==null&&<>
   {chosen
    ?<ProductDrawer key={chosen.id} product={chosen} month={view.month} sourceButton={sourceButton} onClose={close} onSource={()=>setSource(true)}/>
    :<aside className="drawer" role="dialog" aria-modal="false" aria-label="Ürün ayrıntısı"><div className="dr-body"><p className="dr-note">{names.current.get(selected)??`Ürün #${selected}`} bu ay satılmadı.</p><Button variant="outline" onClick={close}>Ayrıntıyı kapat</Button></div></aside>}
  </>}
  {source&&chosen&&<ProductSourceLines key={`${view.source.hash}|${view.month}|${chosen.id}`} hash={view.source.hash} month={view.month} productId={chosen.id} name={productName(chosen)} onBack={()=>{setSource(false);requestAnimationFrame(()=>sourceButton.current?.focus());}}/>}
 </Shell>;
}
