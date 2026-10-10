import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource-variable/manrope";
import "@fontsource-variable/newsreader";
import "./welcome-prototype.css";

const names = { A: "Market defteri", B: "Çalışma masası" };
function Arrow(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>;}
function Mark(){return <svg className="mark" viewBox="0 0 40 40" aria-hidden="true"><path fill="currentColor" d="M4 4h32v8H13v5h19v7H13v5h23v8H4z"/></svg>;}
function App(){
 const [variant,setVariant]=useState<"A"|"B">(new URLSearchParams(location.search).get("variant")==="B"?"B":"A");
 const [destination,setDestination]=useState<string|null>(null);
 const [guide,setGuide]=useState(false);
 const toggle=()=>{setVariant(v=>v==="A"?"B":"A");setDestination(null);setGuide(false);};
 useEffect(()=>{const url=new URL(location.href);url.searchParams.set("variant",variant);history.replaceState(null,"",url);document.title=`${names[variant]} · Karşılama prototipi`;console.info("Welcome prototype state",{variant,destination,guide,data:"none",persistence:false});},[variant,destination,guide]);
 useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.target instanceof Element&&e.target.closest("input,textarea,select,[contenteditable]"))return;if(e.key==="ArrowLeft"||e.key==="ArrowRight"){e.preventDefault();toggle();}};const pop=()=>{setVariant(new URLSearchParams(location.search).get("variant")==="B"?"B":"A");setDestination(null);};window.addEventListener("keydown",key);window.addEventListener("popstate",pop);return()=>{window.removeEventListener("keydown",key);window.removeEventListener("popstate",pop);};},[]);
 const action=(name:string)=>setDestination(name);
 return <div className={`world variant-${variant}`}>
 <header className="masthead"><img src="/assets/esmer-market-logo.png" alt="Esmer Market"/><span className="local"><i/>Çevrimdışı çalışma alanı</span><button className="text-button" onClick={()=>action("Ayarlar")}>Ayarlar <Arrow/></button></header>
 {destination?<main className="destination"><button className="text-button" onClick={()=>setDestination(null)}>← Karşılamaya dön</button><h1>{destination}</h1><p>Çalışma alanına geçiş önizlemesi.</p><p className="demo-copy">Bu görsel prototip veri okumaz veya kaydetmez. Gerçek uygulamadaki {destination.toLocaleLowerCase("tr")} ekranı bu tasarıma bağlı değildir.</p></main>:variant==="A"?<main className="paper">
 <section className="paper-intro"><h1>Marketiniz.<br/><em>Daha net bir bakış.</em></h1><p>Satışlardan giderlere, marketin hikâyesi<br className="desktop-break"/> tek bir çalışma alanında.</p><button className="primary" onClick={()=>action("Özet")}>Özete geç <Arrow/></button><span className="private-note">Tek market. Tek bilgisayar. Size ait.</span></section>
 <section className="book" aria-label="Çalışma alanları"><div className="book-heading"><Mark/><span>Market defteri</span><span className="book-year">ESMER</span></div><h2>Her şey<br/>yerli yerinde.</h2><div className="book-links">{["Satışlar","Alışlar ve maliyet","Giderler","Raporlar"].map((name)=><button key={name} onClick={()=>action(name)}><span>{name}</span><Arrow/></button>)}</div><div className="book-foot"><span>Yerel analiz uygulaması</span><span>v0.5</span></div></section>
 <footer className="paper-footer"><span>Verileriniz bu bilgisayarda kalır.</span><button className="text-button" onClick={()=>setGuide(!guide)}>Nereden başlamalı? <span>{guide?"−":"+"}</span></button></footer>
 </main>:<main className="desk">
 <section className="blue-stage"><div className="stage-top"><Mark/><span>Esmer Market Analytics</span></div><h1>Marketinize<br/>bir bütün<br/><em>olarak bakın.</em></h1><div className="stage-bottom"><span>Satış. Maliyet. Gider.<br/>Hepsi aynı çalışma alanında.</span><span className="stage-seal">EM</span></div></section>
 <section className="launch"><div className="launch-intro"><h2>Hoş geldiniz.</h2><p>Bir bakışla başlayın.<br/>Ayrıntılara istediğiniz zaman geçin.</p><button className="primary" onClick={()=>action("Özet")}><span>Özeti aç</span><Arrow/></button></div><nav className="launch-links" aria-label="Doğrudan aç">{[["Satışlar","Ürünler ve satış kayıtları"],["Alışlar ve maliyet","Alış belgeleri ve maliyetler"],["Giderler","İçe aktarımlar ve gider kayıtları"],["Raporlar","Aylık inceleme ve Excel"]].map(([name,description])=><button key={name} onClick={()=>action(name)}><div><strong>{name}</strong><span>{description}</span></div><Arrow/></button>)}</nav><div className="launch-foot"><span><i/>Yerel çalışma</span><button className="text-button" onClick={()=>setGuide(!guide)}>Başlangıç rehberi <span>{guide?"−":"+"}</span></button></div></section>
 </main>}
 {guide&&!destination&&<section className="guide" aria-live="polite"><h2>Özet ile başlayın.</h2><p>Özet genel görünümü sunar. Satışlar ürünleri ve kayıtları incelemek içindir. Aylık ayrıntılar ve Excel çıktıları Raporlar’da bulunur.</p><button className="text-button" onClick={()=>setGuide(false)}>Rehberi kapat</button></section>}
 <footer className="prototype-footer">Görsel prototip · Veri bağlantısı yok · Değişiklikler kaydedilmez</footer>
 <div className="switcher" aria-label="Prototip seçimi"><span>PROTOTİP</span><button aria-label="Önceki tasarım" onClick={toggle}>←</button><strong aria-live="polite">{variant} · {names[variant]}</strong><button aria-label="Sonraki tasarım" onClick={toggle}>→</button><span>{variant==="A"?"1":"2"} / 2</span></div>
 </div>;
}
createRoot(document.getElementById("root")!).render(<App/>);
