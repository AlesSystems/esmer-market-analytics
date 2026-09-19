import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { SalesWorkspace } from "./SalesWorkspace";
import type { SalesView } from "../reports/contracts";
import type { Availability, ImportOutcome, RequestError } from "../domain/contracts";

const unavailable = { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Yerel hizmete ulaşılamadı. Uygulamayı yeniden açın." } satisfies Availability;
const warnings: Record<string, string> = { SYNTHETIC_ONLY: "Sentetik gösterim verisi — gerçek market verisi değildir.", PARTIAL_COVERAGE: "Veri kapsamı eksik; bazı dönemler tamamlanmamış olabilir.", MISSING_COST: "Bazı kayıtlarda maliyet bilgisi yok. Eksik maliyet sıfır kabul edilmez." };
function date(value: string) { return new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC" }).format(new Date(value)); }
function importMessage(result: ImportOutcome | RequestError): string {
  switch (result.status) {
    case "active": return "Veri paketi içe aktarıldı.";
    case "unchanged": return "Bu veri paketi zaten etkin. Veriler değiştirilmedi.";
    case "historical": return "Bu paket daha önce kullanılmış. Etkin veriler eski sürüme döndürülmedi.";
    case "cancelled": return "İçe aktarma iptal edildi.";
    default: return result.message;
  }
}
function previousImportMessage(availability: Extract<Availability, { status: "ready" }>): string {
  const preserved = availability.store === "loaded" ? "Son geçerli veriler korundu." : "Henüz etkin veri yok.";
  if (availability.lastImportError === "INTERRUPTED") return `Önceki içe aktarma yarıda kaldı. ${preserved} Paketi yeniden içe aktarın.`;
  if (availability.lastImportError === "STORAGE_FULL") return `Önceki içe aktarma için disk alanı yetersizdi. ${preserved} Yer açıp yeniden deneyin.`;
  return `Önceki içe aktarma tamamlanamadı. ${preserved} Geçerli bir paketle yeniden deneyin.`;
}
function App() {
  const [availability, setAvailability] = useState<Availability | RequestError>();
  const [sales, setSales] = useState<SalesView>();
  const [salesError, setSalesError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportOutcome | RequestError>();
  useEffect(() => { window.esmer.getAvailability().then(setAvailability).catch(() => setAvailability(unavailable)); }, []);
  useEffect(() => {
    if (availability?.status !== "ready" || availability.store !== "loaded" || sales) return;
    let current = true;
    window.esmer.openSales({ period: null }).then(value => {
      if (!current) return;
      if (value.status === "report") { setSales(value.view); setSalesError(""); }
      else setSalesError(value.message);
    }).catch(() => { if (current) setSalesError(unavailable.message); });
    return () => { current = false; };
  }, [availability, sales]);
  async function importPackage() {
    setImporting(true); setResult(undefined);
    try {
      setResult(await window.esmer.importPackage());
      setAvailability(await window.esmer.getAvailability());
    } catch { setResult({ status: "failed", code: "SERVICE_UNAVAILABLE", message: unavailable.message }); }
    finally { setImporting(false); }
  }
  const messages = <>
    {(!result || result.status === "cancelled" || result.status === "historical") && availability?.status === "ready" && availability.lastImportError && <p role="alert">{previousImportMessage(availability)}</p>}
    {result && <p role={result.status === "failed" || result.status === "rejected" ? "alert" : "status"}>{importMessage(result)}</p>}
  </>;
  if (sales) return <SalesWorkspace view={sales} setView={setSales} importing={importing} importPackage={importPackage} stale={availability?.status === "ready" && availability.store === "loaded" && availability.dataset.datasetId !== sales.context.datasetId} messages={messages} />;
  return (
    <main className="legacy">
      <header><span className="brand">ESMER MARKET</span><span>Yerel analiz</span></header>
      <section aria-live="polite" aria-busy={importing}>
        <p className="eyebrow">MARKETİNİZİN GENEL GÖRÜNÜMÜ</p>
        {!availability ? <h1>Yerel hizmet başlatılıyor…</h1> : availability.status === "ready" ? <>
          <h1>{availability.store === "loaded" ? "Verileriniz bu bilgisayarda hazır" : "Henüz veri içe aktarılmadı"}</h1>
          {availability.store === "loaded" ? <>
            <p>Veri kesim tarihi: <strong>{date(availability.dataset.cutoff)}</strong><br />Paket hazırlanma tarihi: {date(availability.dataset.extractedAt)}</p>
            <p>{new Intl.NumberFormat("tr-TR").format(availability.dataset.counts.documents)} belge · {new Intl.NumberFormat("tr-TR").format(availability.dataset.counts.lines)} satır · {new Intl.NumberFormat("tr-TR").format(availability.dataset.counts.suppliers)} tedarikçi</p>
            <ul className="warnings">{availability.dataset.warnings.map(code => <li key={code}>{warnings[code] ?? "Veri kalitesi uyarısı bulunuyor."}</li>)}</ul>
          </> : <p>Hazırlanmış veri paketini seçerek başlayın. Veriler bu bilgisayarda saklanır.</p>}
          <button type="button" disabled={importing} onClick={() => void importPackage()}>{importing ? "Veriler içe aktarılıyor…" : "Veri paketi içe aktar"}</button>
          <div><span className="status"><span aria-hidden="true">●</span> Canlı bağlantı kapalı</span></div>
          <p className="note">Uygulama çevrimdışı çalışır. Market sistemine bağlanmaz.</p>
        </> : <><h1>Yerel hizmet kullanılamıyor</h1><p>{availability.message}</p></>}
        {salesError && <p role="status">Satış raporu kullanılamıyor. {salesError}</p>}
        {messages}
      </section>
      <footer>Esmer Market · Çevrimdışı analiz</footer>
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
