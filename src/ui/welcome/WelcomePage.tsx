import { useEffect, useRef, useState } from "react";
import type { Destination } from "../AppShell";

function Arrow() { return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7" /></svg>; }
function Mark() { return <svg className="mark" viewBox="0 0 40 40" aria-hidden="true"><path fill="currentColor" d="M4 4h32v8H13v5h19v7H13v5h23v8H4z" /></svg>; }
const shortcuts = [
  ["overview", "Satışlar", "Ürünler ve satış kayıtları"],
  ["purchasing", "Alışlar ve maliyet", "Alış belgeleri ve maliyetler"],
  ["expenses", "Giderler", "İçe aktarımlar ve gider kayıtları"],
  ["versions", "Raporlar", "Aylık inceleme ve Excel"],
] as const;

export function WelcomePage({ onLaunch, onSettings, connection }: { onLaunch: (destination: Destination) => void; onSettings: () => void; connection: string }) {
  const [guide, setGuide] = useState(false);
  const guideTrigger = useRef<HTMLButtonElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <div className="welcome-page">
    <header className="masthead"><img src="/assets/esmer-market-logo.png" alt="Esmer Market" /><span className="local"><i />{connection}</span><button className="text-button" onClick={onSettings}>Ayarlar <Arrow /></button></header>
    <main className="desk">
      <section className="blue-stage"><div className="stage-top"><Mark /><span>Esmer Market Analytics</span></div><h1 ref={heading} tabIndex={-1}>Marketinize<br />bir bütün<br /><em>olarak bakın.</em></h1><div className="stage-bottom"><span>Satış. Maliyet. Gider.<br />Hepsi aynı çalışma alanında.</span><span className="stage-seal">EM</span></div></section>
      <section className="launch"><div className="launch-intro"><h2>Hoş geldiniz.</h2><p>Bir bakışla başlayın.<br />Ayrıntılara istediğiniz zaman geçin.</p><button className="primary" onClick={() => onLaunch("monthly")}><span>Özeti aç</span><Arrow /></button></div><nav className="launch-links" aria-label="Doğrudan aç">{shortcuts.map(([destination, name, description]) => <button key={destination} onClick={() => onLaunch(destination)}><div><strong>{name}</strong><span>{description}</span></div><Arrow /></button>)}</nav><div className="launch-foot"><span><i />Yerel çalışma</span><button className="text-button" ref={guideTrigger} aria-expanded={guide} aria-controls="welcome-guide" onClick={() => setGuide(!guide)}>Başlangıç rehberi <span>{guide ? "−" : "+"}</span></button></div></section>
    </main>
    {guide && <section id="welcome-guide" className="guide"><h2>Özet ile başlayın.</h2><p>Özet genel görünümü sunar. Satışlar ürünleri ve kayıtları incelemek içindir. Aylık ayrıntılar ve Excel çıktıları Raporlar’da bulunur.</p><button className="text-button" onClick={() => {setGuide(false);guideTrigger.current?.focus();}}>Rehberi kapat</button></section>}
  </div>;
}
