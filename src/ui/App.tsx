import {SourceWorkspace, initialSourceQuery, type SourceView} from "./SourceWorkspace";
import { LiveStatus } from "./LiveStatus";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { OperationProgress } from "./OperationProgress";
import { ExpensesWorkspace } from "./ExpensesWorkspace";
import { SalesWorkspace } from "./SalesWorkspace";
import type { SalesView } from "../reports/contracts";
import type { Availability, ImportOutcome, RequestError, JobOutcome } from "../domain/contracts";
import { AppShell } from "./AppShell";
import { RecoveryWorkspace } from "./recovery/RecoveryWorkspace";
import { importSqlSource } from "./sql-import";

const unavailable = { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Yerel hizmete ulaşılamadı. Uygulamayı yeniden açın." } satisfies Availability;
const warnings: Record<string, string> = { SYNTHETIC_ONLY: "Sentetik gösterim verisi — gerçek market verisi değildir.", PARTIAL_COVERAGE: "Veri kapsamı eksik; bazı dönemler tamamlanmamış olabilir.", MISSING_COST: "Bazı kayıtlarda maliyet bilgisi yok. Eksik maliyet sıfır kabul edilmez." };
function date(value: string) { return new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC" }).format(new Date(value)); }
function importMessage(result: ImportOutcome | RequestError | JobOutcome): string {
  switch (result.status) {
    case "busy": return "Başka bir işlem sürüyor. Tamamlandığında yeniden deneyin.";
    case "preview-imported": return "Gerçek kaynak kayıtları içe aktarıldı. Mali raporlar değiştirilmedi.";
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
  const [source,setSource]=useState<SourceView>();
  const [sourceError,setSourceError]=useState("");
  const [sourceResolved,setSourceResolved]=useState(false);
  const [mode,setMode]=useState<"source"|"financial">("source");
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [expensePeriod, setExpensePeriod] = useState(new Date().toISOString().slice(0, 7));
  const [availability, setAvailability] = useState<Availability | RequestError>();
  const [sales, setSales] = useState<SalesView>();
  const [salesError, setSalesError] = useState("");
  const [importing, setImporting] = useState(false);
  const [sqlImporting, setSqlImporting] = useState(false);
  const [sqlNotice, setSqlNotice] = useState("");
  const [result, setResult] = useState<ImportOutcome | RequestError | JobOutcome>();
  useEffect(() => { window.esmer.getAvailability().then(setAvailability).catch(() => setAvailability(unavailable)); }, []);
  useEffect(()=>{if(availability?.status!=="ready")return;let active=true;
    window.esmer.querySourceWorkspace(initialSourceQuery).then(value=>{if(!active)return;setSource(value.status==="source-workspace"?value:undefined);setSourceError(value.status==="source-workspace"||value.status==="source-empty"?"":value.message);setSourceResolved(true);}).catch(()=>{if(active){setSource(undefined);setSourceError("Kaynak kayıtları okunamadı.");setSourceResolved(true);}});return()=>{active=false;};
  },[availability]);
  function restored(){setRecoveryOpen(false);setSales(undefined);setSource(undefined);setSourceResolved(false);setMode("source");void window.esmer.getAvailability().then(setAvailability);}
  useEffect(() => {
    if (!sourceResolved || ((source || sourceError) && mode==="source") || availability?.status !== "ready" || availability.store !== "loaded" || sales) return;
    let current = true;
    window.esmer.openSales({ period: null }).then(value => {
      if (!current) return;
      if (value.status === "report") { setSales(value.view); setSalesError(""); }
      else setSalesError(value.message);
    }).catch(() => { if (current) setSalesError(unavailable.message); });
    return () => { current = false; };
  }, [availability, sales, sourceResolved, source, sourceError, mode]);
  async function importPackage() {
    setImporting(true); setResult(undefined); setSqlNotice("");
    try {
      const imported=await window.esmer.importPackage();setResult(imported);
      if(imported.status==="preview-imported")setMode("source");
      else if(imported.status==="active")setMode("financial");
      setAvailability(await window.esmer.getAvailability());
    } catch { setResult({ status: "failed", code: "SERVICE_UNAVAILABLE", message: unavailable.message }); }
    finally { setImporting(false); }
  }
  async function importSql() {
    setSqlImporting(true); setResult(undefined); setSqlNotice("");
    try {
      const outcome = await importSqlSource({
        configureLiveSource: () => window.esmer.configureLiveSource(),
        setLiveEnabled: enabled => window.esmer.setLiveEnabled({ enabled }),
        refreshLiveSource: () => window.esmer.refreshLiveSource(),
      });
      void window.esmer.getAvailability().then(setAvailability).catch(() => setAvailability(unavailable));
      if (outcome.status === "cancelled") setSqlNotice("SQL içe aktarma iptal edildi.");
      else if (outcome.status === "busy") setSqlNotice("Başka bir işlem sürüyor. Tamamlandığında yeniden deneyin.");
      else if (outcome.status === "live" && outcome.configurationError) setSqlNotice("Bağlantı ayarı kaydedilemedi veya açılamadı. Bağlantı dosyasını yeniden seçin.");
      else if (outcome.status !== "live" && "message" in outcome) setSqlNotice(outcome.message);
    } catch { void window.esmer.getAvailability().then(setAvailability).catch(() => setAvailability(unavailable)); }
    finally { setSqlImporting(false); }
  }
  const messages = <>
    {source&&mode==="financial"&&<Button variant="outline" onClick={()=>setMode("source")}>Gerçek yedek görünümü</Button>}
    <OperationProgress />
    <LiveStatus onChanged={() => {void window.esmer.getAvailability().then(setAvailability).catch(() => setAvailability(unavailable));}} />
    {(!result || result.status === "cancelled" || result.status === "historical") && availability?.status === "ready" && availability.lastImportError && <p role="alert">{previousImportMessage(availability)}</p>}
    {sqlNotice && <div className="import-outcome"><p role={sqlNotice === "SQL içe aktarma iptal edildi." ? "status" : "alert"}>{sqlNotice}</p><Button variant="ghost" onClick={() => setSqlNotice("")}>Bildirimi kapat</Button></div>}
    {result && <div className="import-outcome"><p role={result.status === "failed" || result.status === "rejected" ? "alert" : "status"}>{importMessage(result)}</p>{result.status !== "failed" && result.status !== "rejected" && <Button variant="ghost" onClick={() => setResult(undefined)}>Bildirimi kapat</Button>}</div>}
  </>;

  if(source && mode==="source")return <SourceWorkspace source={source} importing={importing} importPackage={importPackage} messages={messages} onRestored={restored} onFinancial={availability?.status==="ready"&&availability.store==="loaded"?()=>setMode("financial"):undefined}/>;
  if ((!sales || sourceError && mode==="source") && (recoveryOpen || expensesOpen)) return <AppShell destination={expensesOpen ? "expenses" : undefined} controls={<span>Yerel veriler</span>}>
    {recoveryOpen ? <RecoveryWorkspace embedded onClose={() => setRecoveryOpen(false)} onRestored={restored} /> : <><Button variant="outline" onClick={() => setExpensesOpen(false)}>Ana sayfaya dön</Button><label className="period-label">Dönem<Input type="month" value={expensePeriod} onChange={event => { if (event.target.value) setExpensePeriod(event.target.value); }} /></label><OperationProgress /><ExpensesWorkspace key={expensePeriod} period={expensePeriod} /></>}
  </AppShell>;
  if(sourceError&&mode==="source")return <AppShell><h1>Kaynak kayıtları açılamadı</h1><p role="alert">{sourceError}</p>{messages}<Button variant="default" disabled={importing} onClick={()=>void importPackage()}>Veri paketi içe aktar</Button><Button variant="outline" onClick={()=>setExpensesOpen(true)}>Giderler</Button><Button variant="outline" onClick={()=>setRecoveryOpen(true)}>Yedekleme ve kurtarma</Button><Button variant="outline" onClick={()=>void window.esmer.getAvailability().then(setAvailability)}>Kaynağı yeniden aç</Button>{availability?.status==="ready"&&availability.store==="loaded"&&<Button variant="outline" onClick={()=>setMode("financial")}>Korunan mali veri görünümü</Button>}</AppShell>;
  if (sales) return <SalesWorkspace view={sales} setView={setSales} importing={importing} importPackage={importPackage} openRecovery={() => setRecoveryOpen(true)} recoveryOpen={recoveryOpen} closeRecovery={() => setRecoveryOpen(false)} onRestored={restored} stale={availability?.status === "ready" && availability.store === "loaded" && availability.dataset.datasetId !== sales.context.datasetId} messages={messages} recentImports={availability?.status === "ready" ? availability.recentImports : undefined} />;
  return (
    <AppShell controls={<span>Yerel analiz</span>}><main className="start-workspace">
      <section className="block start-state" aria-live="polite" aria-busy={importing || sqlImporting}>

        {!availability ? <h1>Yerel veriler açılıyor</h1> : availability.status === "ready" ? <>
          <h1>{availability.store === "loaded" ? "Verileriniz bu bilgisayarda hazır" : "Henüz mali rapor verisi yok"}</h1>
          {availability.store === "loaded" ? <>
            <p>Veri kesim tarihi: <strong>{date(availability.dataset.cutoff)}</strong><br />Paket hazırlanma tarihi: {date(availability.dataset.extractedAt)}</p>
            <p>{new Intl.NumberFormat("tr-TR").format(availability.dataset.counts.documents)} belge · {new Intl.NumberFormat("tr-TR").format(availability.dataset.counts.lines)} satır · {new Intl.NumberFormat("tr-TR").format(availability.dataset.counts.suppliers)} tedarikçi</p>
            <ul className="warnings">{availability.dataset.warnings.map(code => <li key={code}>{warnings[code] ?? "Veri kalitesi uyarısı bulunuyor."}</li>)}</ul>
            <Button variant="default" type="button" disabled={importing} onClick={() => void importPackage()}>{importing ? "Veriler içe aktarılıyor…" : "Veri paketi içe aktar"}</Button>
            <Button variant="outline" type="button" onClick={() => setExpensesOpen(true)}>Giderler</Button>
            <Button variant="outline" type="button" onClick={() => setRecoveryOpen(true)}>Yedekleme ve kurtarma</Button>
            <p className="note">Raporlar bu bilgisayardaki verileri kullanır. İsteğe bağlı izole test bağlantısı aşağıdan yönetilir.</p>
          </> : <>
            <p>İzole SQL bağlantı dosyasını seçerek kaynak kayıtlarını okuyun. Mali raporlar yalnızca doğrulanmış veri paketiyle açılır.</p>
            <Button variant="default" type="button" disabled={importing || sqlImporting} onClick={() => void importSql()}>{sqlImporting ? "SQL kaynağı okunuyor…" : "SQL kaynağını içe aktar"}</Button>
            <Button variant="outline" type="button" disabled={importing || sqlImporting} onClick={() => void importPackage()}>{importing ? "Veriler içe aktarılıyor…" : "Veri paketi içe aktar"}</Button>
            <Button variant="outline" type="button" onClick={() => setExpensesOpen(true)}>Giderler</Button>
            <Button variant="outline" type="button" onClick={() => setRecoveryOpen(true)}>Yedekleme ve kurtarma</Button>
            <p className="note">SQL okuması kaynak önizlemesi yazar. Mali veri setini etkinleştirmez.</p>
          </>}
        </> : <><h1>Yerel veriler açılamadı</h1><p>{availability.message}</p><Button variant="outline" onClick={() => { setAvailability(undefined); void window.esmer.getAvailability().then(setAvailability).catch(() => setAvailability(unavailable)); }}>Yeniden dene</Button><Button variant="outline" type="button" onClick={() => setRecoveryOpen(true)}>Yedekten geri yükle</Button></>}
        {salesError && <p role="status">Satış raporu kullanılamıyor. {salesError}</p>}
        {messages}
      </section>
      <footer>Esmer Market · Çevrimdışı analiz</footer>
    </main></AppShell>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
