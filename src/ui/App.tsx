import {SourceWorkspace, initialSourceQuery, type SourceView} from "./SourceWorkspace";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { OperationProgress } from "./OperationProgress";
import { ExpensesWorkspace } from "./ExpensesWorkspace";
import { SalesWorkspace } from "./SalesWorkspace";
import type { SalesView } from "../reports/contracts";
import type { Availability, ImportOutcome, RequestError, JobOutcome } from "../domain/contracts";
import { AppShell } from "./AppShell";
import { AppFrame, type FrameView } from "./frame";
import { RecoveryWorkspace } from "./recovery/RecoveryWorkspace";
import { LiveBadge, SettingsPage, type DataView } from "./settings/SettingsPage";
import { useLiveConnection } from "./settings/live";
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
  const [mode,setMode]=useState<DataView>("source");
  const [frameView, setFrameView] = useState<FrameView>("workspace");
  const current = useRef<FrameView>("workspace");
  const opener = useRef<HTMLElement | null>(null);
  const focusPending = useRef(false);
  const show = useCallback((next: FrameView) => {
    const previous = current.current;
    if (previous === next) return;
    if (previous === "workspace") opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (next === "settings") focusPending.current = true;
    if (next === "workspace") requestAnimationFrame(() => {
      if (document.activeElement && document.activeElement !== document.body) return;
      (opener.current?.isConnected ? opener.current : document.querySelector<HTMLElement>(".settings-entry"))?.focus();
    });
    current.current = next; setFrameView(next);
  }, []);
  const claimFocus = useCallback(() => { const pending = focusPending.current; focusPending.current = false; return pending; }, []);
  const [expensesOpen, setExpensesOpen] = useState(false);
  const [expensePeriod, setExpensePeriod] = useState(new Date().toISOString().slice(0, 7));
  const [availability, setAvailability] = useState<Availability | RequestError>();
  const [sales, setSales] = useState<SalesView>();
  const [salesError, setSalesError] = useState("");
  const [importing, setImporting] = useState(false);
  const [sqlImporting, setSqlImporting] = useState(false);
  const [sqlNotice, setSqlNotice] = useState("");
  const [result, setResult] = useState<ImportOutcome | RequestError | JobOutcome>();
  const refreshAvailability = () => { void window.esmer.getAvailability().then(setAvailability).catch(() => setAvailability(unavailable)); };
  const live = useLiveConnection(refreshAvailability);
  useEffect(refreshAvailability, []);
  useEffect(()=>{if(availability?.status!=="ready")return;let active=true;
    window.esmer.querySourceWorkspace(initialSourceQuery).then(value=>{if(!active)return;setSource(value.status==="source-workspace"?value:undefined);setSourceError(value.status==="source-workspace"||value.status==="source-empty"?"":value.message);setSourceResolved(true);}).catch(()=>{if(active){setSource(undefined);setSourceError("Kaynak kayıtları okunamadı.");setSourceResolved(true);}});return()=>{active=false;};
  },[availability]);
  function restored(){show("workspace");setSales(undefined);setSource(undefined);setSourceResolved(false);setMode("source");void window.esmer.getAvailability().then(setAvailability);}
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
      if(imported.status==="preview-imported"||imported.status==="active")show("workspace");
      setAvailability(await window.esmer.getAvailability());
    } catch { setResult({ status: "failed", code: "SERVICE_UNAVAILABLE", message: unavailable.message }); }
    finally { setImporting(false); }
  }
  async function importSql() {
    setSqlImporting(true); setResult(undefined); setSqlNotice("");
    try {
      const outcome = await live.run(() => importSqlSource({
        configureLiveSource: () => window.esmer.configureLiveSource(),
        setLiveEnabled: enabled => window.esmer.setLiveEnabled({ enabled }),
        refreshLiveSource: () => window.esmer.refreshLiveSource(),
      }));
      if (outcome?.status === "cancelled") setSqlNotice("SQL içe aktarma iptal edildi.");
      else if (outcome?.status === "live" && outcome.live.phase === "idle" && !outcome.configurationError) { setMode(outcome.live.lastRecord === "dataset" ? "financial" : "source"); show("workspace"); }
      else show("settings");
    } finally { setSqlImporting(false); }
  }
  const ready = availability?.status === "ready" ? availability : undefined;
  const loaded = ready?.store === "loaded";
  const notices = <>
    <OperationProgress />
    {(!result || result.status === "cancelled" || result.status === "historical") && ready?.lastImportError && <p role="alert">{previousImportMessage(ready)}</p>}
    {sqlNotice && <div className="import-outcome"><p role={sqlNotice === "SQL içe aktarma iptal edildi." ? "status" : "alert"}>{sqlNotice}</p><Button variant="ghost" onClick={() => setSqlNotice("")}>Bildirimi kapat</Button></div>}
    {result && <div className="import-outcome"><p role={result.status === "failed" || result.status === "rejected" ? "alert" : "status"}>{importMessage(result)}</p>{result.status !== "failed" && result.status !== "rejected" && <Button variant="ghost" onClick={() => setResult(undefined)}>Bildirimi kapat</Button>}</div>}
  </>;
  const overlay = frameView === "recovery"
    ? <RecoveryWorkspace embedded onClose={() => show("workspace")} onRestored={restored} />
    : <SettingsPage availability={availability} source={source && { from: source.from, to: source.to }} view={source && mode === "source" ? "source" : "financial"} onView={source && loaded ? next => { setMode(next); show("workspace"); } : undefined}
      live={live} importing={importing} sqlImporting={sqlImporting} onImportPackage={() => void importPackage()} onImportSql={() => void importSql()} onRecovery={() => show("recovery")} onClose={() => show("workspace")} claimFocus={claimFocus} />;

  let content: ReactNode;
  if (source && mode === "source") content = <SourceWorkspace source={source} />;
  else if ((!sales || sourceError && mode === "source") && expensesOpen) content = <AppShell destination="expenses" controls={<span>Yerel veriler</span>}>
    <Button variant="outline" onClick={() => setExpensesOpen(false)}>Ana sayfaya dön</Button><label className="period-label">Dönem<Input type="month" value={expensePeriod} onChange={event => { if (event.target.value) setExpensePeriod(event.target.value); }} /></label><ExpensesWorkspace key={expensePeriod} period={expensePeriod} />
  </AppShell>;
  else if (sourceError && mode === "source") content = <AppShell><h1>Kaynak kayıtları açılamadı</h1><p role="alert">{sourceError}</p><Button variant="default" disabled={importing} onClick={() => void importPackage()}>Veri paketi içe aktar</Button><Button variant="outline" onClick={() => setExpensesOpen(true)}>Giderler</Button><Button variant="outline" onClick={() => show("recovery")}>Yedekleme ve kurtarma</Button><Button variant="outline" onClick={refreshAvailability}>Kaynağı yeniden aç</Button>{loaded && <Button variant="outline" onClick={() => setMode("financial")}>Korunan mali veri görünümü</Button>}</AppShell>;
  else if (sales) content = <SalesWorkspace view={sales} setView={setSales} stale={loaded && ready.dataset.datasetId !== sales.context.datasetId} />;
  else content = <AppShell controls={<span>Yerel analiz</span>}><main className="start-workspace">
    <section className="block start-state" aria-live="polite" aria-busy={importing || sqlImporting}>
      {!availability ? <h1>Yerel veriler açılıyor</h1> : availability.status === "ready" ? <>
        <h1>{availability.store === "loaded" ? "Verileriniz bu bilgisayarda hazır" : "Henüz mali rapor verisi yok"}</h1>
        {availability.store === "loaded" ? <>
          <p>Veri kesim tarihi: <strong>{date(availability.dataset.cutoff)}</strong><br />Paket hazırlanma tarihi: {date(availability.dataset.extractedAt)}</p>
          <p>{new Intl.NumberFormat("tr-TR").format(availability.dataset.counts.documents)} belge · {new Intl.NumberFormat("tr-TR").format(availability.dataset.counts.lines)} satır · {new Intl.NumberFormat("tr-TR").format(availability.dataset.counts.suppliers)} tedarikçi</p>
          <ul className="warnings">{availability.dataset.warnings.map(code => <li key={code}>{warnings[code] ?? "Veri kalitesi uyarısı bulunuyor."}</li>)}</ul>
          <Button variant="default" type="button" disabled={importing} onClick={() => void importPackage()}>{importing ? "Veriler içe aktarılıyor…" : "Veri paketi içe aktar"}</Button>
          <Button variant="outline" type="button" onClick={() => setExpensesOpen(true)}>Giderler</Button>
          <Button variant="outline" type="button" onClick={() => show("recovery")}>Yedekleme ve kurtarma</Button>
          <p className="note">Raporlar bu bilgisayardaki verileri kullanır. İsteğe bağlı izole test bağlantısı Ayarlar bölümünden yönetilir.</p>
        </> : <>
          <p>İzole SQL bağlantı dosyasını seçerek kaynak kayıtlarını okuyun. Mali raporlar yalnızca doğrulanmış veri paketiyle açılır.</p>
          <Button variant="default" type="button" disabled={importing || sqlImporting} onClick={() => void importSql()}>{sqlImporting ? "SQL kaynağı okunuyor…" : "SQL kaynağını içe aktar"}</Button>
          <Button variant="outline" type="button" disabled={importing || sqlImporting} onClick={() => void importPackage()}>{importing ? "Veriler içe aktarılıyor…" : "Veri paketi içe aktar"}</Button>
          <Button variant="outline" type="button" onClick={() => setExpensesOpen(true)}>Giderler</Button>
          <Button variant="outline" type="button" onClick={() => show("recovery")}>Yedekleme ve kurtarma</Button>
          <p className="note">SQL okuması kaynak önizlemesi yazar. Mali veri setini etkinleştirmez.</p>
        </>}
      </> : <><h1>Yerel veriler açılamadı</h1><p>{availability.message}</p><Button variant="outline" onClick={() => { setAvailability(undefined); refreshAvailability(); }}>Yeniden dene</Button><Button variant="outline" type="button" onClick={() => show("recovery")}>Yedekten geri yükle</Button></>}
      {salesError && <p role="status">Satış raporu kullanılamıyor. {salesError}</p>}
    </section>
    <footer>Esmer Market · Çevrimdışı analiz</footer>
  </main></AppShell>;
  return <AppFrame.Provider value={{ view: frameView, show, overlay, notices, connection: <LiveBadge state={live.state} onOpen={() => show("settings")} /> }}>{content}</AppFrame.Provider>;
}
createRoot(document.getElementById("root")!).render(<App />);
