import { useState } from "react";
import { createRoot } from "react-dom/client";
import { AppShell, type Destination } from "../ui/AppShell";
import { AppFrame, type FrameView } from "../ui/frame";
import { SourceEstimate } from "../ui/SourceEstimate";
import { WelcomePage } from "../ui/welcome/WelcomePage";
import type { EstimateRequest, EstimateResult } from "../source/estimate";

const hash = "a".repeat(64);
let failNext = false;
const data = await fetch("/synthetic.json").then(response => response.json()) as Record<string, EstimateResult>;
const read = async (request: EstimateRequest): Promise<EstimateResult> => {
  if (failNext) { failNext = false; throw new Error("Synthetic read interruption"); }
  const result = data[request.period];
  if (!result || result.status !== "source-estimate") return { status: "source-unavailable", code: "ESTIMATE_UNAVAILABLE", message: "Bu sentetik örnekte seçilen ay bulunmuyor." };
  const products = request.productId === null ? result.products : result.products.filter(row => row.productId === request.productId);
  return { ...result, products: products.slice(request.offset, request.offset + 50), offset: request.offset, total: products.length };
};
Object.defineProperty(window, "esmer", { value: { querySourceEstimate: read, exportSourceEstimate: async () => ({ status: "unavailable", message: "Excel dışa aktarma yalnız masaüstü uygulamasında kullanılabilir." }) } });

function Preview() {
  const [view, setView] = useState<FrameView>("welcome");
  const [destination, setDestination] = useState<Destination>("monthly");
  const [period, setPeriod] = useState("2025-10");
  const [generation, setGeneration] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const launch = (next: Destination) => { setDestination(next); setSelected(null); setView("workspace"); };
  const unsupported = destination === "purchasing" || destination === "expenses";
  const banner = <div className="preview-notice" role="note"><strong>Sentetik tasarım önizlemesi</strong><span>Gerçek market verisi değildir. İçe aktarma, Excel, yedekleme ve yerel veritabanı yalnız masaüstü uygulamasındadır.</span></div>;
  return <><style>{`.preview-notice{padding:12px 20px;background:#fff0d6;color:#694b17;display:flex;gap:16px;flex-wrap:wrap;font:13px/1.5 "Manrope Variable",sans-serif}.preview-notice strong{flex-shrink:0}.preview-actions{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px}.preview-detail{padding:32px;background:#fffef9;border-radius:14px}`}</style>{banner}{view === "welcome" ? <WelcomePage onLaunch={launch} onSettings={() => setView("settings")} connection="Sentetik örnek · çevrimiçi önizleme" /> : <AppFrame.Provider value={{ view, launchRequest: null, show: (next, after) => { setView(next); after?.(); }, connection: <span>Sentetik örnek</span>, notices: null, overlay: <section className="preview-detail"><h1>Masaüstü işlemleri</h1><p>Bu önizleme kaynak bağlantısı veya yerel dosya işlemi yapmaz. Ayarlar, veri içe aktarma ve kurtarma masaüstü uygulamasında korunur.</p><button onClick={() => setView("workspace")}>Çalışma alanına dön</button></section> }}><AppShell destination={destination} navigate={launch} controls={<label className="period-label">Çalışma ayı<select value={period} onChange={event => {setPeriod(event.target.value);setSelected(null);}}><option value="2025-08">Ağustos 2025</option><option value="2025-09">Eylül 2025</option><option value="2025-10">Ekim 2025</option></select></label>}>
    <div className="preview-actions"><button onClick={() => {failNext = true;setGeneration(value => value + 1);}}>Okuma hatasını dene</button><span>Kaynak veri sonu: 31.10.2025 · sentetik kayıtlar</span></div>
    {selected ? <section className="preview-detail"><h1>Ürün #{selected}</h1><p>Bu önizleme gerçek ürün adı veya kaynak belgesi içermez. Masaüstünde bu seçim kaynak belgelerine gider.</p><button onClick={() => setSelected(null)}>Önceki görünüme dön</button></section> : unsupported ? <section className="preview-detail"><h1>{destination === "expenses" ? "Giderler" : "Alışlar ve maliyet"}</h1><p>Bu işlem masaüstü uygulamasında kullanılabilir. Sentetik önizleme Özet, Satışlar ve Raporlar görünümünü gösterir.</p><button onClick={() => launch("monthly")}>Özete dön</button></section> : <SourceEstimate key={generation} hash={hash} period={period} presentation={destination === "monthly" ? "summary" : destination === "overview" ? "products" : "report"} heading={<h1>{destination === "monthly" ? "Ay bir bakışta" : destination === "overview" ? "Satışlar" : "Aylık rapor"}</h1>} onProduct={setSelected} />}
  </AppShell></AppFrame.Provider>}</>;
}
createRoot(document.getElementById("root")!).render(<Preview />);
