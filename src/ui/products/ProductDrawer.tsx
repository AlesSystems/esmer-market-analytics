import type {Ref} from "react";
import type {MonthProfitProduct} from "../../source/month-profit";
import {Button} from "../components/ui/button";
import {MarginLine} from "../charts/MarginLine";
import {CloseIcon} from "../icons";
import {decimal,money} from "../format";
import {monthDative,monthLocative,percentText} from "../pages/month-summary";
import {productName} from "./product-rows";

const units={adet:"adet",kg:"kg",other:"birim"} as const;
const per={adet:"adet başına",kg:"kg başına",other:"birim başına"} as const;
const unknown=<span className="unk">bilinmiyor</span>;
const previousOf=(month:string)=>{const d=new Date(`${month}-01T00:00:00Z`);d.setUTCMonth(d.getUTCMonth()-1);return d.toISOString().slice(0,7);};
/** Margin points as the service computed them; only the sign is read. */
function points(value:string,month:string){
 const flat=/^-?0+(\.0+)?$/.test(value);
 return `${monthDative(previousOf(month))} göre ${flat?"değişmedi":`${value.startsWith("-")?"−":"+"}${decimal(value.replace(/^-/,""),2)} puan`}`;
}

/** The right-hand push panel for one product. Non-modal: the ledger beside it keeps working. */
export function ProductDrawer({product,month,onSource,onClose,sourceButton,heading}:{heading?:Ref<HTMLHeadingElement>;product:MonthProfitProduct;month:string;onSource:()=>void;onClose:()=>void;sourceButton?:Ref<HTMLButtonElement>}) {
 const p=product,costKnown=p.grossProfit!==null,loss=p.flags.loss;
 const unit=p.unit;
 return <aside className="drawer" role="dialog" aria-modal="false" aria-labelledby="drawer-title">
  <header className="dr-head">
   <div>{p.category&&<p>{p.category}</p>}<h2 id="drawer-title" ref={heading} tabIndex={-1}>{productName(p)}</h2></div>
   <button type="button" className="icon-btn" aria-label="Ayrıntıyı kapat" title="Ayrıntıyı kapat" onClick={onClose}><CloseIcon/></button>
  </header>
  <div className="dr-body">
   <p className="dr-say">{p.quantity!==null&&unit!==null?`${monthLocative(month)} ${decimal(p.quantity)} ${units[unit]} satıldı.`:"Satılan miktar bilinmiyor."}</p>
   <dl className="dr-facts">
    <div><dt>Satış fiyatı</dt><dd>{p.unitPrice===null?unknown:money(p.unitPrice)}</dd>{p.unitPrice!==null&&unit!==null&&<dd className="per">{per[unit]}</dd>}</div>
    <div><dt>Alış maliyeti</dt><dd>{p.unitCost===null?unknown:money(p.unitCost)}</dd>{p.unitCost!==null&&unit!==null&&<dd className="per">{per[unit]}</dd>}</div>
    <div><dt>Marj</dt><dd className={loss?"is-neg":undefined}>{p.marginPct===null?(costKnown?"Marj hesaplanamadı":unknown):percentText(p.marginPct)}</dd>{p.marginChangePoints!==null&&<dd className="per">{points(p.marginChangePoints,month)}</dd>}</div>
   </dl>
   {loss&&<p className="dr-note is-loss">Bu ay zararına satıldı: alış fiyatı satış fiyatını geçti.</p>}
   {costKnown&&p.flags.missingCost&&<p className="dr-note">Bazı satışlarının alış fiyatı yok; marj yalnız alış fiyatı bilinen satışlardan hesaplandı.</p>}
   {costKnown
    ?<><h3>Son 6 ay marj</h3><div className="dr-chart"><MarginLine product={p}/></div></>
    :<p className="dr-note">Bu ürünün alış fiyatı kayıtlı değil, bu yüzden marjı bilinmiyor. Satışı kâra katılmadı; sıfır sayılmadı.</p>}
   <Button ref={sourceButton} variant="secondary" onClick={onSource}>Kaynak satırlar</Button>
  </div>
 </aside>;
}
