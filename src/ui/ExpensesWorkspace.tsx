import { useContext, useEffect, useRef, useState } from "react";
import { ManualExpenseEntry, pendingExpenseKey } from "./ManualExpenseEntry";
import { useExpenseNavigation } from "./expense-navigation";
import { ExpenseEditor, currentValue, type Run } from "./expenses/ExpenseEditor";
import { ImportPreview } from "./expenses/ImportPreview";
import { MonthDetails } from "./expenses/MonthDetails";
import { AlertIcon, ArrowRightIcon, CheckIcon, DownloadIcon, PlusIcon, UploadIcon } from "./icons";
import { classificationLabels, type ExpensePeriod, type ExpensePreview, type ExpenseRecord } from "../expenses/contracts";
import type { ExpenseGroupKey } from "../expenses/groups";
import { date, money } from "./format";
import { attentionText, blankSentence, confirmPlan, confirmReason, groupLabels, statusText } from "./expenses/copy";
import { AppFrame } from "./frame";
import { stepMonth } from "./month-step";
import { monthName } from "./pages/month-summary";
const failed = "Yerel hizmete ulaşılamadı. Yeniden deneyin.";
const recordId = (entityId: string) => `expense-record-${entityId}`;

/** "57,50 ₺" with the kuruş set smaller. The text is the service amount as formatted. */
function Amount({ value }: { value: string }) {
  const text = money(value), comma = text.lastIndexOf(",");
  return <>{text.slice(0, comma)}<span className="cents">{text.slice(comma)}</span></>;
}

/** Giderler for one month: the four monthly totals built from the month's lines, one confirmation, and the lines themselves. */
export function ExpensesWorkspace({ period, onPeriod, onNetProfit, active = true }: { active?: boolean; period: string; onPeriod?: (period: string) => void; onNetProfit?: () => void }) {
  const navigation = useExpenseNavigation();
  const frame = useContext(AppFrame);
  const [savedPeriod, setSavedPeriod] = useState<{ incurred: string; payment: string | null; related: string }>();
  const [task, setTask] = useState<"records" | "manual" | "import">("records");
  const opener = useRef<() => void>(() => undefined);
  const restoreFocus = useRef(false);
  const taskTitle = useRef<HTMLHeadingElement>(null);
  const cancelAsk = useRef<HTMLButtonElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [storedView, setView] = useState<ExpensePeriod>();
  const view = storedView?.period === period ? storedView : undefined;
  const [previous, setPrevious] = useState<ExpensePeriod>();
  const [preview, setPreview] = useState<ExpensePreview>();
  const [keep, setKeep] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ExpenseRecord>();
  const generation = useRef(0);
  function returnToRecords() { setTask("records"); setSelected(undefined); restoreFocus.current = true; }
  function open(row: ExpenseRecord, focusBack: string) { opener.current = () => document.getElementById(focusBack)?.focus(); setSelected(row); }
  useEffect(() => { if (active && restoreFocus.current && task === "records" && !selected && !busy && !loading) { restoreFocus.current = false; opener.current(); } }, [task, selected, busy, loading, active]);
  useEffect(() => { if (active && task === "import") taskTitle.current?.focus(); }, [task, active]);
  useEffect(() => { if (asking) cancelAsk.current?.focus(); }, [asking]);
  async function load(): Promise<boolean> {
    const id = ++generation.current;
    setLoading(true); setLoadError("");
    try {
      const result = await window.esmer.queryExpenses({ period });
      if (id !== generation.current) return false;
      if (result.status === "expenses") { setView(result); setAsking(false); return true; }
      else if ("message" in result) setLoadError(result.message);
    } catch { if (id === generation.current) setLoadError(failed); }
    finally { if (id === generation.current) setLoading(false); }
    return false;
  }
  // An open draft is kept while Kaynak belgeler, Canlı bağlantı or Hakkında cover the page; only recovery (which already asked the owner) drops it.
  useEffect(() => { if (!active) { if (task === "manual" && !busy && !localStorage.getItem(pendingExpenseKey) && frame?.view === "recovery") setTask("records"); return; } if (view?.period === period) return; restoreFocus.current = false; setTask(localStorage.getItem(pendingExpenseKey) ? "manual" : "records"); setView(undefined); setSelected(undefined); setPreview(undefined); setAsking(false); setError(""); setMessage(""); void load(); return () => { ++generation.current; }; }, [period, active]);
  // The month before is read once for the hints under the groups. It is shown only when the owner confirmed that month.
  const before = stepMonth(period, -1, null);
  const loaded = !!view;
  useEffect(() => {
    if (!active || !loaded || !before) return;
    let live = true;
    window.esmer.queryExpenses({ period: before }).then(result => { if (live && result.status === "expenses") setPrevious(result); }).catch(() => undefined);
    return () => { live = false; };
  }, [before, loaded, active]);
  const run: Run = async (action, success, mutation = false, focusId) => {
    navigation.protect({ dirty: false, locked: true });
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await action();
      if (result.status === "failed" || result.status === "unavailable" || result.status === "rejected") { setError(result.message); return; }
      if (result.status === "preview") { setPreview(result); setKeep([]); opener.current = () => document.getElementById("expense-import")?.focus(); setTask("import"); return; }
      if (result.status === "cancelled") { setMessage("İşlem iptal edildi. Kayıtlar değiştirilmedi."); return; }
      setMessage(result.status === "already-imported" ? "Bu Excel dosyası zaten içe aktarılmış. Kayıtlar değiştirilmedi." : success);
      if (mutation) { setPreview(undefined); setKeep([]); if (!focusId) returnToRecords(); await load(); if (focusId) setTimeout(() => document.getElementById(focusId)?.focus(), 0); }
    } catch { setError(failed); }
    finally { navigation.protect({ dirty: false, locked: false }); setBusy(false); }
  };
  const plan = view ? confirmPlan(view) : undefined;
  const confirm = (complete: boolean, explicit = false) => { if (!view || !plan) return; setAsking(false); void run(() => window.esmer.confirmExpenseCompleteness({ period, reviewedRevision: view.expenseRevision, complete, reason: complete ? confirmReason(plan, explicit) : "Onay kaldırıldı" }), "", true, "expense-confirm-action"); };
  // Lines present but a group blank: the first press asks, because a blank is not the same as "no expense".
  const press = () => { if (plan?.lines && plan.empty.length) setAsking(true); else confirm(true); };
  function closeAsk() { setAsking(false); requestAnimationFrame(() => document.getElementById("expense-confirm-action")?.focus()); }
  const importExcel = () => void run(() => window.esmer.previewExpenses(), "");
  const saveTemplate = () => void run(() => window.esmer.saveExpenseTemplate(), "Excel şablonu kaydedildi.");
  const invalid = preview && (preview.errors.length > 0 || preview.rows.some(row => row.errors.length > 0));
  const manual = task === "manual", showMonth = !selected && task !== "import";
  const locked = busy || manual;
  const hintView = previous?.period === before && previous.confirmation === "current" ? previous : undefined;
  const hintName = before ? monthName(before).split(" ")[0] : "";
  const hint = (key: ExpenseGroupKey) => {
    const group = hintView?.groups.find(item => item.key === key);
    if (!group) return null;
    if (group.count === 0) return `${hintName}: kayıt yok`;
    return group.amount === null ? null : `${hintName}: ${money(group.amount)}`;
  };
  const why = !plan ? null : manual ? "Önce elle ekleme formunu kapatın." : plan.blocked ? "Önce işaretli satırları düzeltin." : null;
  return <main className="gider" aria-busy={busy}>
    <header className="g-head">
      <div><h1>{monthName(period)} giderleri</h1><p className="g-say" aria-live="polite">{view && showMonth ? statusText(view) : ""}</p></div>
      {!showMonth && <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => navigation.leave(returnToRecords)}>Giderlere dön</button>}
    </header>
    {savedPeriod && showMonth && <p className="g-note">Gider ayı: {savedPeriod.incurred}{savedPeriod.payment && <> · Ödeme ayı: {savedPeriod.payment}</>}.{onPeriod && <button type="button" className="link link-inline" onClick={() => navigation.leave(() => onPeriod(savedPeriod.related))}>O aya git</button>}</p>}
    {busy && <p role="status" className="g-note">İşlem sürüyor…</p>}
    {message && <p className="g-note" role="status">{message}</p>}
    {error && <p className="g-note is-warn" role="alert">{error}</p>}
    {task === "import" && preview && <ImportPreview preview={preview} keep={keep} setKeep={setKeep} busy={busy} invalid={!!invalid} title={taskTitle} close={() => { setPreview(undefined); returnToRecords(); setMessage("Önizleme kapatıldı. Kayıtlar değiştirilmedi."); }} confirm={() => void run(() => window.esmer.confirmExpenses({ previewId: preview.previewId, keepCandidateRows: keep }), "Giderler içe aktarıldı. Kontrol edip “Bu ayın giderleri tamam” deyin.", true)} />}
    {loadError && <div className="g-note is-warn" role="alert"><span>{loadError}</span><button type="button" className="btn btn-secondary" disabled={loading} onClick={() => void load()}>Giderleri yeniden yükle</button></div>}
    {loading && !view && <p role="status" className="g-muted">Giderler yükleniyor…</p>}
    {showMonth && (view || manual) && <>
      {view && plan && <section className="card g-main" aria-labelledby="g-main-title">
        <div className="g-card-head"><h2 id="g-main-title">Aylık toplamlar</h2>
          <div className="g-links">
            <button type="button" className="link" id="expense-import" disabled={locked} onClick={importExcel}><UploadIcon />Excel’den içe aktar</button>
            <button type="button" className="link" disabled={locked} onClick={saveTemplate}><DownloadIcon />Şablonu indir</button>
          </div>
        </div>
        <ul className="g-grid" aria-label="Gider grupları">{view.groups.map(group => {
          const empty = group.count === 0, note = hint(group.key);
          return <li key={group.key} className="g-tile" data-group={group.key} data-state={empty ? "empty" : group.amount === null ? "missing" : "filled"}>
            <span className="g-lbl">{groupLabels[group.key]}</span>
            <span className="g-amt">{empty ? "Kayıt yok" : group.amount === null ? "Eksik" : <Amount value={group.amount} />}</span>
            {!empty && <small>{group.count.toLocaleString("tr-TR")} satır</small>}
            {note && <small className="g-hint">{note}</small>}
          </li>;
        })}</ul>
        {!plan.lines && plan.state !== "current" && <div className="g-empty">{view.rows.length > 0
          ? <p>Bu ay sayılan gider yok · {view.rows.length.toLocaleString("tr-TR")} kayıt toplam dışında veya geri alınmış.</p>
          : <><p>Kayıt bulunmaması, gider olmadığı anlamına gelmez.</p><p>Excel şablonunu indirin, ayın giderlerini doldurun ve “Excel’den içe aktar” ile yükleyin. Personel için yalnızca aylık toplamı girin.</p></>}</div>}
        {view.attention.length > 0 && <div className="g-attn" role="group" aria-labelledby="g-attn-title"><h3 id="g-attn-title">Düzeltilmesi gereken satırlar</h3><ul>{view.attention.map(item => {
          const row = view.rows.find(candidate => candidate.entityId === item.entityId), id = `expense-fix-${item.entityId}`;
          return <li key={item.entityId}><span><strong>{item.category}</strong> · {date(item.date)} · {attentionText[item.reason]}</span>{row && item.reason !== "legacy" && <button type="button" className="link" id={id} aria-label={`${item.category} satırını düzelt`} disabled={locked} onClick={() => open(row, id)}>Düzelt</button>}</li>;
        })}</ul></div>}
        <div className="g-foot">
          <p className="g-total">Toplam <b>{!plan.lines ? "—" : view.summary.expenses === null ? <span className="g-warn">Eksik</span> : money(view.summary.expenses)}</b></p>
          {!asking && <div className="g-act">
            {plan.state === "current" ? <>
              <p className="g-done"><CheckIcon />Onaylandı</p>
              <button type="button" className="link" id="expense-confirm-action" disabled={locked} onClick={() => confirm(false)}>Onayı kaldır</button>
              {onNetProfit && <button type="button" className="link" disabled={busy} onClick={onNetProfit}>Net kârı gör<ArrowRightIcon /></button>}
            </> : <>
              {plan.state === "stale" && <p className="g-stale"><AlertIcon />Onay eskidi</p>}
              {why && <p className="g-why" id="g-why">{why}</p>}
              {!plan.lines
                ? <button type="button" className="btn btn-secondary" id="expense-confirm-action" disabled={locked} onClick={() => confirm(true)}>Bu ay gider yok</button>
                : <button type="button" className="btn btn-primary" id="expense-confirm-action" disabled={locked || plan.blocked} aria-describedby={why ? "g-why" : undefined} onClick={press}>Bu ayın giderleri tamam</button>}
            </>}
          </div>}
          {asking && <div className="g-ask" role="alert" onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); closeAsk(); } }}>
            <AlertIcon />
            <p>{blankSentence(plan.empty)} Bu kalemlerde gerçekten gider yoksa onaylayın.</p>
            <div className="g-ask-act">
              <button type="button" className="btn btn-primary" disabled={locked} onClick={() => confirm(true, true)}>Bu kalemlerde gider yok, onayla</button>
              <button type="button" className="btn btn-secondary" ref={cancelAsk} onClick={closeAsk}>Vazgeç</button>
            </div>
          </div>}
        </div>
      </section>}
      <section className="card g-recs" aria-labelledby="g-recs-title">
        <div className="g-card-head"><h2 id="g-recs-title">Kayıtlar</h2>
          {!manual && <button type="button" className="btn btn-secondary" id="expense-manual" disabled={busy} onClick={() => { opener.current = () => document.getElementById("expense-manual")?.focus(); setTask("manual"); setMessage(""); }}><PlusIcon />Elle ekle</button>}
        </div>
        <p className="g-muted">Excel’den ya da elle girilen her satır burada. Toplamlar bu satırlardan hesaplanır.</p>
        {manual && <ManualExpenseEntry key={period} period={period} close={returnToRecords} reviewRecords={load} saved={(result, current) => { if (!current) return; setMessage(result.status === "already-present" ? "Bu gider zaten kayıtlı." : "Gider kaydedildi."); setSavedPeriod(result.incurredPeriod !== period || result.paymentPeriod && result.paymentPeriod !== period ? { incurred: result.incurredPeriod, payment: result.paymentPeriod, related: result.incurredPeriod !== period ? result.incurredPeriod : result.paymentPeriod! } : undefined); returnToRecords(); void load(); }} />}
        {!view ? null : view.rows.length === 0 ? <p className="g-none">Bu ay için kayıt yok.</p>
          : <div className="table-scroll g-table" tabIndex={0} aria-label="Gider kayıtları"><table><thead><tr><th>Tarih</th><th>Kategori</th><th className="number">Tutar</th><th>Durum</th><th><span className="sr-only">İşlem</span></th></tr></thead><tbody>{view.rows.map(row => {
            const value = currentValue(row);
            return <tr key={row.entityId}>
              <td>{date(row.value.date)}<small>{value?.paymentDate ? `Ödeme ${date(value.paymentDate)}` : "Ödeme tarihi yok"}</small></td>
              <td>{value?.category ?? "Eski kayıt"}<small>{value && classificationLabels[value.classification]}</small></td>
              <td className="number">{money(value ? value.gross : row.value.net)}<small>{value ? `net ${money(value.net)} · KDV ${money(value.tax)}` : "yalnızca net"}</small></td>
              <td>{value?.voided ? <span className="g-void">Geri alındı</span> : "Geçerli"}<small>{value && "kind" in value.origin ? "Elle girildi" : "Excel"} · sürüm {row.revision}</small></td>
              <td><button type="button" className="link" id={recordId(row.entityId)} disabled={locked} onClick={() => open(row, recordId(row.entityId))}>İncele / düzelt</button></td>
            </tr>;
          })}</tbody></table></div>}
      </section>
      {view && <MonthDetails view={view} />}
    </>}
    {view && selected && <ExpenseEditor key={selected.revision} row={selected} history={view.history.filter(row => row.entityId === selected.entityId)} busy={busy} close={returnToRecords} run={run} />}
  </main>;
}
