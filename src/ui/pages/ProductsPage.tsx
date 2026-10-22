import {useEffect,useRef} from "react";
import type {PageProps} from "../sections";
import {Button} from "../components/ui/button";
import {decimal,money} from "../format";
import {useMonthProfit} from "./month-profit-data";
import {monthName} from "./month-summary";

/** Minimal product list until #104 brings the product card. Sorted by gross profit; unknown profit last. */
export function ProductsPage({month,active,availability,state,openSettings}:PageProps) {
 const {read,loading,retry}=useMonthProfit(month,active,availability);
 const selected=useRef<HTMLTableRowElement>(null);
 const view=read&&"result" in read&&read.result.status==="month-profit"?read.result.view:null;
 useEffect(()=>{if(view&&state.productId&&selected.current){selected.current.scrollIntoView({block:"center"});selected.current.focus();}},[view,state]);
 const rows=view?[...view.products].sort((a,b)=>a.grossProfit===null?(b.grossProfit===null?0:1):b.grossProfit===null?-1:Number(b.grossProfit)-Number(a.grossProfit)):[];
 return <main className="products-page" aria-busy={loading}>
  <h1>Ürünler</h1>
  {view&&<p className="products-note">{monthName(view.month)} · {rows.length} ürün · tahmini kâra göre sıralı</p>}
  {!read&&<p role="status">Ürünler yükleniyor…</p>}
  {read&&"failed" in read&&<div role="alert"><p>Ürünler okunamadı. {read.failed}</p><Button variant="outline" onClick={retry}>Yeniden dene</Button></div>}
  {read&&"result" in read&&read.result.status==="source-unavailable"&&<div><p>{read.result.code==="ESTIMATE_UNAVAILABLE"?"Ürün kârı için maliyet bilgisi içeren bir veri paketi gerekiyor.":"Seçili ay veri paketinin dışında."}</p>{read.result.code==="ESTIMATE_UNAVAILABLE"&&<Button onClick={openSettings}>Veri paketi içe aktar</Button>}</div>}
  {view&&<div className="table-scroll" tabIndex={0} aria-label="Ürün listesi"><table><thead><tr><th>Ürün</th><th className="number">Satış</th><th className="number">Kâr</th><th className="number">Marj</th></tr></thead><tbody>
   {rows.map(p=>{const chosen=p.id===state.productId;return <tr key={p.id} ref={chosen?selected:undefined} tabIndex={chosen?-1:undefined} aria-selected={chosen||undefined} className={chosen?"is-selected":undefined} data-product={p.id}><td>{p.name??`Ürün #${p.id}`}</td><td className="number">{p.sales===null?"Bilinmiyor":money(p.sales)}</td><td className="number">{p.grossProfit===null?"Bilinmiyor":money(p.grossProfit)}</td><td className="number">{p.marginPct===null?"Bilinmiyor":`%${decimal(p.marginPct)}`}</td></tr>;})}
  </tbody></table></div>}
 </main>;
}
