import { validSelectedMonth, type SelectedMonth } from "../domain/month";
import { ExpenseNavigationProvider, useExpenseNavigation } from "./expense-navigation";
import { initialSourceQuery } from "./SourceWorkspace";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { createRoot } from "react-dom/client";
import { OperationProgress } from "./OperationProgress";
import type { Availability, ImportOutcome, RequestError, JobOutcome } from "../domain/contracts";
import { AppShell } from "./AppShell";
import { AppFrame, type FrameView, type LaunchRequest } from "./frame";
import { RecoveryWorkspace } from "./recovery/RecoveryWorkspace";
import { LiveBadge, SettingsPage } from "./settings/SettingsPage";
import { useLiveConnection } from "./settings/live";
import { importSqlSource } from "./sql-import";
import type { Coverage, NavigationState, PageProps, Section } from "./sections";
import { MonthPage } from "./pages/MonthPage";
import { ProductsPage } from "./pages/ProductsPage";
import { ExpensesPage } from "./pages/ExpensesPage";
import { ReportsPage } from "./pages/ReportsPage";

const pages: Record<Section, ComponentType<PageProps>> = { month: MonthPage, products: ProductsPage, expenses: ExpensesPage, reports: ReportsPage };
const unavailable = { status: "unavailable", code: "SERVICE_UNAVAILABLE", message: "Yerel hizmete ulaşılamadı. Uygulamayı yeniden açın." } satisfies Availability;
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
type Resolution = { status: "pending" | "resolved" } | { status: "failed"; message: string };

function App() {
  const expenseNavigation = useExpenseNavigation();
  const [selectedMonth, setSelectedMonth] = useState<SelectedMonth | null>(null);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const monthWrite = useRef(0);
  const [monthSaveError, setMonthSaveError] = useState("");
  useEffect(() => { let active = true; window.esmer.getPreferences().then(result => { if (active && result.status === "preferences") setSelectedMonth(result.preferences.selectedMonth ?? null); }).catch(() => {if(active)setMonthSaveError("Dönem tercihi okunamadı; dönem seçimini yeniden kaydedin.");}).finally(() => { if (active) setPreferencesReady(true); }); return () => { active = false; }; }, []);
  const selectMonth = useCallback((month: string) => {
    if(!validSelectedMonth(month))return;
    const write = ++monthWrite.current;
    setSelectedMonth(month); setMonthSaveError("");
    void window.esmer.setPreferences({selectedMonth: month}).then(result => { if (write === monthWrite.current && result.status !== "preferences") setMonthSaveError("Dönem bu oturumda seçildi; yeniden açılış için kaydedilemedi."); }).catch(() => {if(write===monthWrite.current)setMonthSaveError("Dönem bu oturumda seçildi; yeniden açılış için kaydedilemedi.");});
  }, []);
  const [frameView, setFrameView] = useState<FrameView>("workspace");
  const current = useRef<FrameView>("workspace");
  const launchSequence = useRef(0);
  const [section, setSection] = useState<Section>("month");
  const [navigationState, setNavigationState] = useState<NavigationState>({});
  const [launchRequest, setLaunchRequest] = useState<LaunchRequest | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const focusPending = useRef(false);
  const show = useCallback((next: FrameView, after?: () => void) => {
    if (current.current === next) {after?.();return;}
    const transition = () => {
      const previous = current.current;
      if (previous === next) return;
      if (previous === "workspace") opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      if (next === "settings") focusPending.current = true;
      if (next === "workspace") requestAnimationFrame(() => {
        if (document.activeElement && document.activeElement !== document.body) return;
        (opener.current?.isConnected ? opener.current : document.querySelector<HTMLElement>(".settings-entry"))?.focus();
      });
      current.current = next; setFrameView(next); after?.();
    };
    if (next === "settings" || current.current === "settings" && next === "workspace" && !after) transition(); else expenseNavigation.leave(transition);
  }, [expenseNavigation.leave]);
  const claimFocus = useCallback(() => { const pending = focusPending.current; focusPending.current = false; return pending; }, []);
  const sectionRef = useRef<Section>("month");
  const navigate = useCallback((next: Section, state: NavigationState = {}) => { if (next === sectionRef.current && !Object.keys(state).length) return; expenseNavigation.leave(() => {
    sectionRef.current = next;
    setSection(next); setNavigationState(state); setLaunchRequest({ destination: next, sequence: ++launchSequence.current });
  }); }, [expenseNavigation.leave]);

  const [availability, setAvailability] = useState<Availability | RequestError>();
  const [coverage, setCoverage] = useState<Coverage | null>(null);
  const [resolution, setResolution] = useState<Resolution>({ status: "pending" });
  const [importing, setImporting] = useState(false);
  const [sqlImporting, setSqlImporting] = useState(false);
  const [sqlNotice, setSqlNotice] = useState("");
  const [result, setResult] = useState<ImportOutcome | RequestError | JobOutcome>();
  const refreshAvailability = useCallback(() => { setResolution({ status: "pending" }); void window.esmer.getAvailability().then(setAvailability).catch(() => setAvailability(unavailable)); }, []);
  const live = useLiveConnection(refreshAvailability);
  useEffect(refreshAvailability, []);
  // The data range of the imported source, and the first-use month: the latest month of the package (or of the financial dataset).
  useEffect(() => {
    if (!preferencesReady || availability?.status !== "ready") return;
    let active = true;
    window.esmer.querySourceWorkspace({ ...initialSourceQuery }).then(async value => {
      if (!active) return;
      if (value.status === "source-workspace") { setCoverage({ from: value.from.slice(0, 10), to: value.to.slice(0, 10) }); if (selectedMonth === null) selectMonth(value.period); setResolution({ status: "resolved" }); return; }
      setCoverage(null);
      if (value.status !== "source-empty") { setResolution({ status: "failed", message: value.message }); return; }
      setResolution({ status: "resolved" });
      if (selectedMonth === null && availability.store === "loaded") {
        const sales = await window.esmer.openSales({ period: null }).catch(() => undefined);
        if (active && sales?.status === "report" && monthWrite.current === 0) selectMonth(sales.view.context.period);
      }
    }).catch(() => { if (active) { setCoverage(null); setResolution({ status: "failed", message: "Kaynak kayıtları okunamadı." }); } });
    return () => { active = false; };
  }, [availability, preferencesReady]);

  async function importPackage() {
    setImporting(true); setResult(undefined); setSqlNotice("");
    try {
      const imported = await window.esmer.importPackage(); setResult(imported);
      if (imported.status === "preview-imported" || imported.status === "active") show("workspace", () => navigate("month"));
      setResolution({ status: "pending" });
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
      else if (outcome?.status === "live" && outcome.live.phase === "idle" && !outcome.configurationError) show("workspace");
      else show("settings");
    } finally { setSqlImporting(false); }
  }
  function restored() { show("workspace", () => navigate("month")); refreshAvailability(); }
  const ready = availability?.status === "ready" ? availability : undefined;
  const notices = <>
    <OperationProgress />
    {monthSaveError && <p role="alert">{monthSaveError} <Button variant="outline" onClick={() => {if(selectedMonth)selectMonth(selectedMonth);}}>Dönemi kaydetmeyi yeniden dene</Button></p>}
    {(!result || result.status === "cancelled" || result.status === "historical") && ready?.lastImportError && <p role="alert">{previousImportMessage(ready)}</p>}
    {sqlNotice && <div className="import-outcome"><p role={sqlNotice === "SQL içe aktarma iptal edildi." ? "status" : "alert"}>{sqlNotice}</p><Button variant="ghost" onClick={() => setSqlNotice("")}>Bildirimi kapat</Button></div>}
    {result && <div className="import-outcome"><p role={result.status === "failed" || result.status === "rejected" ? "alert" : "status"}>{importMessage(result)}</p>{result.status !== "failed" && result.status !== "rejected" && <Button variant="ghost" onClick={() => setResult(undefined)}>Bildirimi kapat</Button>}</div>}
  </>;
  const overlay = frameView === "recovery"
    ? <RecoveryWorkspace embedded onClose={() => show("workspace")} onRestored={restored} />
    : <SettingsPage availability={availability} source={coverage ?? undefined} sourceResolution={availability && availability.status !== "ready" ? { status: "failed", message: availability.message } : resolution}
      live={live} importing={importing} sqlImporting={sqlImporting} onImportPackage={() => expenseNavigation.leave(() => void importPackage())} onImportSql={() => expenseNavigation.leave(() => void importSql())} onRecovery={() => show("recovery")} onClose={() => show("workspace")} claimFocus={claimFocus} />;
  const onMonth = useCallback((month: string) => { if (validSelectedMonth(month)) expenseNavigation.leave(() => selectMonth(month)); }, [expenseNavigation.leave, selectMonth]);
  const Page = pages[section];
  // Without any data there is no latest month to pick; pages read the current month until data arrives, without remembering it.
  const pageMonth = selectedMonth ?? (resolution.status !== "pending" && !coverage ? new Date().toISOString().slice(0, 7) : null);
  const reportsVisited = useRef(false);
  const reportsState = useRef<NavigationState>({});
  const lastReady = useRef<Extract<Availability, { status: "ready" }>>(undefined);
  if (ready) lastReady.current = ready;
  const loading = <main><h1>Yerel veriler açılıyor</h1><p role="status">Verileriniz hazırlanıyor…</p></main>;
  const failure = availability && availability.status !== "ready" ? <main><h1>Yerel veriler açılamadı</h1><p role="alert">{availability.message}</p><Button variant="outline" onClick={() => { setAvailability(undefined); refreshAvailability(); }}>Yeniden dene</Button><Button variant="outline" onClick={() => show("recovery")}>Yedekten geri yükle</Button></main> : undefined;
  // A page that was open stays mounted (hidden) through a failed or pending availability refresh, so its open detail survives a retry.
  const pageAvailability = ready ?? lastReady.current;
  if (section === "reports") reportsVisited.current = true;
  if (section === "reports") reportsState.current = navigationState;
  // Rapor ve Excel stays mounted (hidden, inactive) once visited, so an open report or document survives other sections.
  const reports = preferencesReady && pageAvailability && reportsVisited.current ? <div hidden={section !== "reports"}><ReportsPage month={pageMonth} onMonth={onMonth} coverage={coverage} availability={pageAvailability} active={section === "reports" && frameView === "workspace" && !!ready} state={reportsState.current} navigate={navigate} openSettings={() => show("settings")} openRecovery={() => show("recovery")} refresh={refreshAvailability} /></div> : undefined;
  const page = preferencesReady && pageAvailability && section !== "reports" ? <Page key={section} month={pageMonth} onMonth={onMonth} coverage={coverage} availability={pageAvailability} active={frameView === "workspace" && !!ready} state={navigationState} navigate={navigate} openSettings={() => show("settings")} openRecovery={() => show("recovery")} refresh={refreshAvailability} /> : undefined;
  const content = <>{!(ready && (page || reports)) && (failure ?? loading)}<div className="page-host" hidden={!(ready && (page || reports))}>{page}{reports}</div></>;
  return <AppFrame.Provider value={{ view: frameView, launchRequest, show, overlay, notices, connection: <LiveBadge state={live.state} onOpen={() => show("settings")} /> }}>
    <AppShell section={section} navigate={navigate} controls={<label className="period-label">Dönem<Input type="month" lang="tr" value={selectedMonth ?? ""} onChange={event => onMonth(event.target.value)} /></label>}>{content}</AppShell>
  </AppFrame.Provider>;
}
createRoot(document.getElementById("root")!).render(<ExpenseNavigationProvider><App /></ExpenseNavigationProvider>);
