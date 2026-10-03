import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { destinations } from "../../AppShell";
import { VariantA } from "./VariantA";
import { VariantB } from "./VariantB";
import { VariantC } from "./VariantC";
import { Arrow } from "./shared";
import { fixture as f, type Layer } from "./model";
import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";
import "./prototype.css";

const variants = [{id:"A",name:"Panorama",component:VariantA},{id:"B",name:"Market defteri",component:VariantB},{id:"C",name:"Kontrol masası",component:VariantC}] as const;
function currentVariant(){return Math.max(0,variants.findIndex(v=>v.id===new URLSearchParams(location.search).get("variant")));}
function Prototype(){
  const [index,setIndex]=useState(currentVariant),[selected,setSelected]=useState<Layer>("sales"),[inspect,setInspect]=useState<string|null>(null);
  const dialog=useRef<HTMLDialogElement>(null),opener=useRef<HTMLElement|null>(null);
  const choice=variants[index],View=choice.component;
  function open(section:string){opener.current=document.activeElement as HTMLElement;setInspect(section);}
  function close(){dialog.current?.close();setInspect(null);opener.current?.focus();}
  useEffect(()=>{if(inspect)dialog.current?.showModal();},[inspect]);
  useEffect(()=>{
    function key(event:KeyboardEvent){if(event.altKey||event.ctrlKey||event.metaKey||dialog.current?.open||(event.target instanceof Element&&event.target.closest("input,textarea,select,[contenteditable], [role=slider]")))return;if(event.key==="ArrowRight"||event.key==="ArrowLeft"){event.preventDefault();setIndex(v=>(v+(event.key==="ArrowRight"?1:2))%3);}}
    function pop(){setIndex(currentVariant());}
    window.addEventListener("keydown",key);window.addEventListener("popstate",pop);return()=>{window.removeEventListener("keydown",key);window.removeEventListener("popstate",pop);};
  },[]);
  useEffect(()=>{const url=new URL(location.href);url.searchParams.set("variant",choice.id);history.replaceState(null,"",url);document.title=`${choice.name} · Özet prototipi`;console.info("Özet prototype state",{variant:choice.id,period:"2025-09",data:"synthetic",selected,inspect});},[choice,selected,inspect]);
  return <div className={`prototype-world world-${choice.id}`}><aside className="proto-sidebar"><a className="proto-brand" href="?variant=A" aria-label="Esmer Market, Özet"><svg width="30" height="34" viewBox="0 0 30 34" fill="none" aria-hidden="true"><path d="M3 3h24v7H10v4h14v6H10v4h17v7H3z" fill="currentColor"/></svg><span>esmer<small>MARKET</small></span></a><div className="sidebar-location">Market analizi</div><nav aria-label="Ana gezinme">{destinations.map(([id,label],i)=><button key={id} aria-current={id==="monthly"?"page":undefined} onClick={()=>id==="monthly"?window.scrollTo({top:0}):open(label)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d={["M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z","M3 20V4 M3 20h18 M7 16l4-6 4 3 6-9","M3 7h18v14H3z M7 7V3h10v4 M3 12h18","M5 3h14v18l-3-2-4 2-4-2-3 2z M8 8h8 M8 12h8","M5 3h10l4 4v14H5z M14 3v5h5 M8 12h8 M8 16h6"][i]}/></svg>{label}{id==="monthly"&&<span className="nav-current"/>}</button>)}</nav><div className="sidebar-foot"><span><i/>Yerel çalışma alanı</span><small>Canlı bağlantı kapalı</small><button onClick={()=>open("Ayarlar")}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M3 7h18M3 17h18M8 4v6M16 14v6"/></svg>Ayarlar</button></div></aside>
  <div className="proto-body"><header className="proto-topbar"><span>Çalışma alanı <span className="slash">/</span> <strong>Özet</strong></span><div><span className="period-display"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M4 5h16v16H4zM8 2v6M16 2v6M4 10h16"/></svg>{f.period}</span><button onClick={()=>open("Aylık rapor")}>Raporu incele <Arrow/></button></div></header>
    <div className="prototype-notice"><span>Sentetik gösterim verisi · Gerçek market verisi değildir.</span><span>Veri sonu {f.cutoff} <b>·</b> Geçici rapor</span></div>
    <View selected={selected} onSelect={setSelected} onInspect={open}/><footer className="proto-footer"><span>1–30 Eylül 2025 · Tüm ürünler · TRY</span><button onClick={()=>open("Kaynak ve yöntem")}>Kaynak ve yöntem</button></footer>
  </div>
  {process.env.NODE_ENV!=="production"&&<div className="prototype-switcher" aria-label="Prototip seçimi"><span className="prototype-tag">PROTOTİP</span><button aria-label="Önceki tasarım" onClick={()=>setIndex(v=>(v+2)%3)}><Arrow back/></button><span aria-live="polite"><b>{choice.id}</b> {choice.name}</span><button aria-label="Sonraki tasarım" onClick={()=>setIndex(v=>(v+1)%3)}><Arrow/></button><span className="switcher-count">{index+1} / 3</span></div>}
  <dialog ref={dialog} className="proto-dialog" onCancel={event=>{event.preventDefault();close();}}><header><h2>{inspect}</h2><button onClick={close} aria-label="Ayrıntıları kapat">Kapat</button></header><p className="dialog-demo">Tasarım prototipi · Sentetik veriler</p><p>Bu örnek, Özet’ten ayrıntıya geçişi gösterir. Üretim verisine bağlı değildir; değişiklik kaydedilmez.</p>{inspect==="Giderler"||inspect==="Faaliyet kârı"?<><h3>Gider verileri eksik</h3><p>Faaliyet kârı hesaplanamıyor. Gider içe aktarımı ve dönem tamlık onayı, gerçek uygulamadaki gider çalışma alanında yapılır.</p></>:<><dl><div><dt>Net satış, KDV hariç</dt><dd>{f.netSales} ₺</dd></div><div><dt>Maliyeti kapsanan net satış</dt><dd>{f.coveredSales} ₺</dd></div><div><dt>Tarihsel tahmini maliyet</dt><dd>{f.cost} ₺</dd></div><div><dt>Kapsanan tahmini brüt kâr</dt><dd>{f.gross} ₺</dd></div><div><dt>Maliyet kapsamı</dt><dd>{f.coverage}</dd></div></dl><p>Eksik maliyet sıfır kabul edilmez. {f.excluded} ₺ satışın maliyeti eksiktir. Faaliyet kârı giderler eksik olduğu için hesaplanamaz.</p></>}<details><summary>Örnek verinin sınırları</summary><p>Fixture: ozet-visual-2025-09. Tutarlar tasarım karşılaştırması için yazılmıştır. Günlük grafik sentetik bir eğilim çizimidir; toplam tutarla mutabakat iddiası taşımaz. Önceki ay değişimi de örnek bir sunum değeridir. Kaynak paketi, doğrulanmış hesaplama sürümü veya gerçek rapor kimliği yoktur.</p></details></dialog></div>;
}
createRoot(document.getElementById("root")!).render(<Prototype/>);
