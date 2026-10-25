type ExpenseTask = "records" | "manual" | "import";
import { ManualExpenseEntry, pendingExpenseKey } from "./ManualExpenseEntry";
import { useExpenseNavigation } from "./expense-navigation";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { useEffect, useRef, useState, type RefObject } from "react";
import { classifications, classificationLabels, type ExpenseFields, type ExpensePeriod, type ExpensePreview, type ExpenseRecord, type ExpenseResult, type ExpenseValue } from "../expenses/contracts";
import type { RequestError } from "../domain/contracts";
import { date, money } from "./format";
import { attentionText, confirmationState, groupLabels, netReasonText } from "./expenses/copy";
import { useMonthProfit } from "./pages/month-profit-data";
import { monthName } from "./pages/month-summary";
const failed = "Yerel hizmete ulaşılamadı. Yeniden deneyin.";
const currentValue = (row: ExpenseRecord): ExpenseValue | null => "format" in row.value ? row.value : null;
const recordId = (entityId: string) => `expense-record-${entityId}`;

/** Giderler for one month: Excel import first, the four monthly groups, one "tamam" confirmation and the month's estimated net profit. */
export function ExpensesWorkspace({ period, onChange, embedded = false, onPeriod, onMonthPage, active = true, visible = true }: { visible?: boolean; active?: boolean; period: string; onPeriod?: (period: string) => void; onMonthPage?: () => void; onChange?: () => void; embedded?: boolean }) {
  const navigation = useExpenseNavigation();
  const [savedPeriod, setSavedPeriod] = useState<{ incurred: string; payment: string | null; related: string }>();
  const [task, setTask] = useState<ExpenseTask>("records");
  const opener = useRef<() => void>(() => undefined);
  const restoreFocus = useRef(false);
  const taskTitle = useRef<HTMLHeadingElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [storedView, setView] = useState<ExpensePeriod>();
  const view = storedView?.period === period ? storedView : undefined;
  const [preview, setPreview] = useState<ExpensePreview>();
  const [keep, setKeep] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ExpenseRecord>();
  const [recordsOpen, setRecordsOpen] = useState(false);
  const generation = useRef(0);
  const profit = useMonthProfit(period, active && visible && !embedded, view);
  function returnToRecords() { setTask("records"); setSelected(undefined); restoreFocus.current = true; }
  function open(row: ExpenseRecord, focusBack: string) { opener.current = () => document.getElementById(focusBack)?.focus(); setSelected(row); }
  useEffect(() => { if (visible && restoreFocus.current && task === "records" && !selected && !busy && !loading) { restoreFocus.current = false; opener.current(); } }, [task, selected, busy, loading, visible]);
  useEffect(() => { if (visible && task !== "records") taskTitle.current?.focus(); }, [task, visible]);
  async function load(): Promise<boolean> {
    const id = ++generation.current;
    setLoading(true); setLoadError("");
    try {
      const result = await window.esmer.queryExpenses({ period });
      if (id !== generation.current) return false;
      if (result.status === "expenses") { setView(result); return true; }
      else if ("message" in result) setLoadError(result.message);
    } catch { if (id === generation.current) setLoadError(failed); }
    finally { if (id === generation.current) setLoading(false); }
    return false;
  }
  useEffect(() => { if (!active) { if (task === "manual" && !busy && !localStorage.getItem(pendingExpenseKey)) setTask("records"); return; } if (!visible) return; if (view?.period === period) return; restoreFocus.current = false; setTask(localStorage.getItem(pendingExpenseKey) ? "manual" : "records"); setView(undefined); setSelected(undefined); setPreview(undefined); setError(""); setMessage(""); void load(); return () => { ++generation.current; }; }, [period, active, visible]);
  async function run(action: () => Promise<ExpenseResult | RequestError>, success: string, mutation = false, focusId?: string) {
    navigation.protect({ dirty: false, locked: true });
    setBusy(true); setError(""); setMessage("");
    try {
      const result = await action();
      if (result.status === "failed" || result.status === "unavailable" || result.status === "rejected") { setError(result.message); return; }
      if (result.status === "preview") { setPreview(result); setKeep([]); opener.current = () => document.getElementById("expense-import")?.focus(); setTask("import"); return; }
      if (result.status === "cancelled") { setMessage("İşlem iptal edildi. Kayıtlar değiştirilmedi."); return; }
      setMessage(result.status === "already-imported" ? "Bu Excel dosyası zaten içe aktarılmış. Kayıtlar değiştirilmedi." : success);
      if (mutation) { setPreview(undefined); setKeep([]); if (!focusId) returnToRecords(); await load(); onChange?.(); if (focusId) setTimeout(() => document.getElementById(focusId)?.focus(), 0); }
    } catch { setError(failed); }
    finally { navigation.protect({ dirty: false, locked: false }); setBusy(false); }
  }
  const confirm = (complete: boolean) => { if (view) void run(() => window.esmer.confirmExpenseCompleteness({ period, reviewedRevision: view.expenseRevision, complete, reason: complete ? "Bu ayın giderleri tamam" : "Onay kaldırıldı" }), complete ? "Bu ayın giderleri onaylandı." : "Onay kaldırıldı.", true, "expense-confirm-action"); };
  const importExcel = () => void run(() => window.esmer.previewExpenses(), "");
  const saveTemplate = () => void run(() => window.esmer.saveExpenseTemplate(), "Excel şablonu kaydedildi.");
  const invalid = preview && (preview.errors.length > 0 || preview.rows.some(row => row.errors.length > 0));
  const Container = embedded ? "section" : "main";
  const records = task === "records" && !selected;
  return <Container className="expenses-workspace" aria-busy={busy}>
    <header className="expenses-head"><div><h1>Giderler</h1><p className="expenses-month">{monthName(period)}</p></div>
      {records ? <div className="expense-actions"><Button id="expense-import" disabled={busy} onClick={importExcel}>Excel’den içe aktar</Button><Button variant="outline" disabled={busy} onClick={saveTemplate}>Şablonu indir</Button><Button variant="ghost" className="expense-quiet" id="expense-manual" disabled={busy} onClick={() => { opener.current = () => document.getElementById("expense-manual")?.focus(); setTask("manual"); setMessage(""); }}>Elle ekle</Button></div>
        : <Button variant="outline" disabled={busy} onClick={() => navigation.leave(returnToRecords)}>Giderlere dön</Button>}
    </header>

    {task === "manual" && <ManualExpenseEntry key={period} period={period} close={returnToRecords} reviewRecords={load} saved={(result, current) => { onChange?.(); if (!current) return; setMessage(result.status === "already-present" ? "Bu gider zaten kayıtlı." : "Gider kaydedildi."); setSavedPeriod(result.incurredPeriod !== period || result.paymentPeriod && result.paymentPeriod !== period ? { incurred: result.incurredPeriod, payment: result.paymentPeriod, related: result.incurredPeriod !== period ? result.incurredPeriod : result.paymentPeriod! } : undefined); returnToRecords(); void load(); }} />}
    {savedPeriod && records && <p className="notice">Gider ayı: {savedPeriod.incurred}{savedPeriod.payment && <> · Ödeme ayı: {savedPeriod.payment}</>}.{onPeriod && <Button variant="link" onClick={() => navigation.leave(() => onPeriod(savedPeriod.related))}>O aya git</Button>}</p>}
    {busy && <p role="status" className="expense-busy">İşlem sürüyor…</p>}
    {message && <p className="notice" role="status">{message}</p>}
    {error && <p className="notice warning" role="alert">{error}</p>}
    {task === "import" && preview && <ImportPreview preview={preview} keep={keep} setKeep={setKeep} busy={busy} invalid={!!invalid} title={taskTitle} close={() => { setPreview(undefined); returnToRecords(); setMessage("Önizleme kapatıldı. Kayıtlar değiştirilmedi."); }} confirm={() => void run(() => window.esmer.confirmExpenses({ previewId: preview.previewId, keepCandidateRows: keep }), "Giderler içe aktarıldı. Kontrol edip “Bu ayın giderleri tamam” deyin.", true)} />}
    {loadError && <div className="notice warning" role="alert"><span>{loadError}</span><Button variant="outline" disabled={loading} onClick={() => void load()}>Giderleri yeniden yükle</Button></div>}
    {loading && !view && <p role="status">Giderler yükleniyor…</p>}
    {view && records && <>
      <div className="expense-month">
        <section className="expense-groups" aria-labelledby="expense-groups-title">
          <h2 id="expense-groups-title">Bu ayın giderleri</h2>
          {!view.groups.some(group => group.count) && !view.attention.length ? <div className="expense-empty"><p><strong>{view.rows.length > 0 ? `Bu ay sayılan gider yok · ${view.rows.length.toLocaleString("tr-TR")} kayıt toplam dışında veya geri alınmış.` : "Bu ay için gider girilmedi."}</strong></p>{view.rows.length === 0 && <p>Kayıt bulunmaması, gider olmadığı anlamına gelmez.</p>}<p>Excel şablonunu indirin, ayın giderlerini doldurun ve “Excel’den içe aktar” ile yükleyin. Personel için yalnızca aylık toplamı girin.</p></div>
            : <dl className="expense-group-list">{view.groups.map(group => <div key={group.key} data-group={group.key}><dt>{groupLabels[group.key]}<small>{group.count ? `${group.count.toLocaleString("tr-TR")} satır` : "satır yok"}</small></dt><dd>{group.count === 0 ? "Girilmedi" : group.amount === null ? <span className="expense-blocked">Eksik</span> : money(group.amount)}</dd></div>)}<div className="expense-group-total"><dt>Toplam</dt><dd>{view.summary.expenses === null ? <span className="expense-blocked">Eksik</span> : money(view.summary.expenses)}</dd></div></dl>}
          {view.attention.length > 0 && <div className="expense-attention" role="group" aria-labelledby="expense-attention-title"><h3 id="expense-attention-title">Düzeltilmesi gereken satırlar</h3><ul>{view.attention.map(item => { const row = view.rows.find(candidate => candidate.entityId === item.entityId); const id = `expense-fix-${item.entityId}`; return <li key={item.entityId}><span><strong>{item.category}</strong> · {date(item.date)} · {attentionText[item.reason]}</span>{row && item.reason !== "legacy" && <Button variant="outline" id={id} disabled={busy} onClick={() => open(row, id)}>Düzelt</Button>}</li>; })}</ul></div>}
          <ConfirmBlock view={view} busy={busy} confirm={confirm} />
        </section>
        {!embedded && <NetProfitPanel profit={profit} onMonthPage={onMonthPage} />}
      </div>
      <details className="expense-more" open={recordsOpen} onToggle={event => setRecordsOpen(event.currentTarget.open)}><summary>Tüm kayıtlar ({view.rows.length.toLocaleString("tr-TR")})</summary>
        {view.rows.length === 0 ? <p className="caption">Bu ay için kayıt yok.</p> : <div className="table-scroll" tabIndex={0} aria-label="Gider kayıtları"><table><thead><tr><th>Tarih</th><th>Kategori</th><th className="number">Tutar</th><th>Durum</th><th><span className="sr-only">İşlem</span></th></tr></thead><tbody>{view.rows.map(row => { const value = currentValue(row); return <tr key={row.entityId}><td>{date(row.value.date)}<small>{value?.paymentDate ? `Ödeme ${date(value.paymentDate)}` : "Ödeme tarihi yok"}</small></td><td>{value?.category ?? "Eski kayıt"}<small>{value && classificationLabels[value.classification]}</small></td><td className="number">{money(value ? value.gross : row.value.net)}<small>{value ? `net ${money(value.net)} · KDV ${money(value.tax)}` : "yalnızca net"}</small></td><td>{value?.voided ? "Geri alındı" : "Geçerli"}<small>{value && "kind" in value.origin ? "Elle girildi" : "Excel"} · sürüm {row.revision}</small></td><td><Button variant="link" id={recordId(row.entityId)} disabled={busy} onClick={() => open(row, recordId(row.entityId))}>İncele / düzelt</Button></td></tr>; })}</tbody></table></div>}
      </details>
      <details className="expense-more"><summary>Hesap ayrıntıları ve içe aktarma geçmişi</summary>
        <p>Toplam, gider tarihine göre bu aya düşen giderlerdir. İndirilebilir KDV’li giderlerde net, diğerlerinde brüt tutar sayılır. Varlık alımı, vergi, kredi, işletme sahibinin katkı ve çekişleri ile transferler gider toplamına girmez.</p>
        {view.summary.excluded.length > 0 && <><h3>Gider toplamı dışında</h3><ul>{view.summary.excluded.map(item => <li key={item.entityId}>{item.classification === "already-in-cost" ? "Maliyette yer alan stok kaybı" : classificationLabels[item.classification as keyof typeof classificationLabels]} · {money(item.amount)}</li>)}</ul></>}
        <dl className="expense-totals"><div><dt>Gider tarihine göre kayıtlı brüt</dt><dd>{money(view.incurred)}</dd></div><div><dt>Ödeme tarihine göre kayıtlı brüt</dt><dd>{money(view.payments)}</dd></div></dl>
        <h3>İçe aktarma geçmişi ({view.batches.length.toLocaleString("tr-TR")})</h3>{view.batches.length ? <ul>{view.batches.map(batch => <li key={batch.batchId}>{date(batch.createdAt)} · {batch.count} kayıt · sürümler {batch.firstRevision}–{batch.lastRevision}<small>{batch.batchId}</small></li>)}</ul> : <p className="caption">Henüz içe aktarma yok.</p>}
        <TemplateHelp />
      </details>
    </>}
    {view && selected && <ExpenseEditor key={selected.revision} row={selected} history={view.history.filter(row => row.entityId === selected.entityId)} busy={busy} close={returnToRecords} run={run} />}
  </Container>;
}

function ConfirmBlock({ view, busy, confirm }: { view: ExpensePeriod; busy: boolean; confirm: (complete: boolean) => void }) {
  const state = view.confirmation;
  return <div className="expense-confirm" data-state={state} role="group" aria-labelledby="expense-confirm-title">
    <div><h3 id="expense-confirm-title">{confirmationState(state)}</h3>
      <p>{state === "current" ? "Bu ayın giderlerini tamam olarak onayladınız. Bir gider değişirse onay yeniden istenir." : state === "stale" ? "Onaydan sonra giderler değişti. Kontrol edip yeniden onaylayın." : "Bu ayın tüm giderleri girildiyse onaylayın. Net kâr ancak onaydan sonra hesaplanır."}</p></div>
    {state === "current" ? <Button variant="link" id="expense-confirm-action" disabled={busy} onClick={() => confirm(false)}>Onayı kaldır</Button> : <Button id="expense-confirm-action" disabled={busy} onClick={() => confirm(true)}>Bu ayın giderleri tamam</Button>}
  </div>;
}

function NetProfitPanel({ profit, onMonthPage }: { profit: ReturnType<typeof useMonthProfit>; onMonthPage?: () => void }) {
  const read = profit.read;
  let body;
  if (!read) body = <p role="status">Hesaplanıyor…</p>;
  else if ("failed" in read) body = <p role="alert">{read.failed} <Button variant="link" onClick={profit.retry}>Yeniden dene</Button></p>;
  else if (read.result.status !== "month-profit") body = <p>{read.result.message}</p>;
  else {
    const view = read.result.view, t = view.totals;
    body = <><dl className="expense-net-list">
      <div><dt>Tahmini brüt kâr</dt><dd>{t.grossProfit === null ? "Bilinmiyor" : money(t.grossProfit)}</dd></div>
      <div><dt>Giderler</dt><dd>{t.expenses === null ? "Eksik" : money(t.expenses)}</dd></div>
      <div className="expense-net-result"><dt>Tahmini net kâr</dt><dd>{t.netProfit === null ? <span className="expense-blocked">Hesaplanamadı</span> : money(t.netProfit)}</dd></div>
    </dl>{t.netProfit === null && t.netProfitReason && <p className="expense-net-reason" data-reason={t.netProfitReason}>{netReasonText(t.netProfitReason, view.dataUntil)}</p>}</>;
  }
  return <aside className="expense-net" aria-labelledby="expense-net-title" aria-busy={profit.loading}><h2 id="expense-net-title">Bu ayın net kârı</h2>{body}{onMonthPage && <Button variant="link" onClick={onMonthPage}>Bu aya dön</Button>}</aside>;
}

function ImportPreview({ preview, keep, setKeep, busy, invalid, title, close, confirm }: { preview: ExpensePreview; keep: number[]; setKeep: (rows: number[]) => void; busy: boolean; invalid: boolean; title: RefObject<HTMLHeadingElement | null>; close: () => void; confirm: () => void }) {
  const blocked = busy || invalid || preview.alreadyImported || !preview.rows.length || preview.rows.some(row => !row.alreadyPresent && row.duplicates.length > 0 && !keep.includes(row.row));
  return <section className="block expense-section" aria-label="Excel önizlemesi"><div className="section-heading"><h2 ref={title} tabIndex={-1}>Excel önizlemesi</h2><Button variant="outline" disabled={busy} onClick={close}>Önizlemeyi kapat</Button></div>
    <p>{preview.rows.length.toLocaleString("tr-TR")} satır · Aylar: {[...new Set(preview.rows.flatMap(row => row.value ? [row.value.date.slice(0, 7)] : []))].join(", ") || "Belirlenemiyor"}</p>
    <p className="caption">Henüz hiçbir şey kaydedilmedi. Hatalı satır varsa Excel dosyasını düzeltip yeniden seçin.</p>
    {preview.alreadyImported && <p className="notice">Bu Excel dosyası zaten içe aktarılmış.</p>}{preview.errors.map((item, i) => <p role="alert" key={i}>{item}</p>)}
    <div className="table-scroll" tabIndex={0} aria-label="Önizleme satırları"><table><thead><tr><th>Satır / tarih</th><th>Kategori / tür</th><th className="number">Brüt tutar</th><th>Durum</th></tr></thead><tbody>{preview.rows.map(row => <tr key={row.row}><td>{row.row}{row.value && <small>{date(row.value.date)}</small>}</td><td>{row.value?.category ?? "Geçersiz satır"}{row.value && <small>{classificationLabels[row.value.classification]}</small>}</td><td className="number">{row.value ? <>{money(row.value.gross)}<small>net {money(row.value.net)} · KDV {money(row.value.tax)}</small></> : "—"}</td><td>{row.errors.map((item, i) => <p key={i} role="alert">{item}</p>)}{row.alreadyPresent ? "Önceden kaydedilmiş" : row.duplicates.length > 0 ? <label className="expense-check"><input type="checkbox" disabled={busy} checked={keep.includes(row.row)} onChange={event => setKeep(event.target.checked ? [...keep, row.row] : keep.filter(id => id !== row.row))} />Satır {row.row}: benzer kayıt var, yine de ayrı gider olarak ekle</label> : row.errors.length === 0 ? "Hazır" : null}</td></tr>)}</tbody></table></div>
    <Button disabled={blocked} onClick={confirm}>İçe aktar</Button>
  </section>;
}

function TemplateHelp() {
  return <details className="expense-help"><summary>Excel şablonu nasıl doldurulur?</summary><p>Tek sayfayı ve sütun başlıklarını koruyun. Formül veya ek sütun eklemeyin.</p><dl className="evidence"><dt>Kategori</dt><dd>Kira için “Kira”, elektrik ve su için “Elektrik” veya “Su” yazın. Diğer giderler “Diğer” altında toplanır.</dd><dt>Sınıflandırma</dt><dd>{classifications.map(item => classificationLabels[item]).join("; ")}</dd><dt>Personel</dt><dd>“İşçilik” sınıfıyla yalnızca aylık toplamı girin; kişi veya bordro bilgisi eklemeyin. İşçilik dönemi gider ayıyla aynı olmalı (örnek: 2026-01).</dd><dt>KDV işlemi</dt><dd>İndirilebilir; İndirilemez; Bilinmiyor. İlk ikisinde KDV kanıtı zorunlu. “Bilinmiyor” net kârı durdurur.</dd><dt>Tarih ve tutar</dt><dd>Gider tarihi: 15.01.2026 veya 2026-01-15. Tutar: 1250,50. Net ile KDV toplamı brüte eşit olmalı.</dd><dt>Referanslar</dt><dd>Kişisel bilgi yerine kısa kod kullanın (harf, rakam, nokta, alt çizgi, iki nokta, kısa çizgi).</dd><dt>Stok kaybı</dt><dd>Kayıp kanıtı ve Kayıp işlemi (Ayrı gider veya Maliyete dahil) zorunlu.</dd></dl></details>;
}

function ExpenseEditor({ row, history, busy, close, run }: { row: ExpenseRecord; history: ExpenseRecord[]; busy: boolean; close: () => void; run: (action: () => Promise<ExpenseResult | RequestError>, success: string, mutation?: boolean, focusId?: string) => Promise<void> }) {
  const original = currentValue(row);
  const [fields, setFields] = useState<ExpenseFields | null>(original ? { date: original.date, paymentDate: original.paymentDate, category: original.category, classification: original.classification, net: original.net, tax: original.tax, gross: original.gross, taxTreatment: original.taxTreatment, taxEvidence: original.taxEvidence, supportingReference: original.supportingReference, sourceReference: original.sourceReference, labourPeriod: original.labourPeriod, loss: original.loss } : null);
  const [reason, setReason] = useState("");
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, []);
  function update<K extends keyof ExpenseFields>(key: K, value: ExpenseFields[K]) { setFields(previous => previous ? { ...previous, [key]: value } : null); }
  const textField = (key: "date" | "paymentDate" | "category" | "net" | "tax" | "gross" | "taxEvidence" | "supportingReference" | "sourceReference" | "labourPeriod", label: string, type = "text") => <label>{label}<Input type={type} readOnly={key === "sourceReference"} inputMode={["net", "tax", "gross"].includes(key) ? "decimal" : undefined} value={(["net", "tax", "gross"].includes(key) ? fields?.[key]?.replace(".", ",") : fields?.[key]) ?? ""} onChange={event => update(key, (["net", "tax", "gross"].includes(key) ? event.target.value.replace(",", ".") : event.target.value) || (["date", "category", "net", "tax", "gross"].includes(key) ? "" : null))} /></label>;
  return <section className="block expense-section" aria-label="Gider düzeltmesi"><div className="section-heading"><h2 ref={title} tabIndex={-1}>Gideri incele ve düzelt</h2><Button variant="outline" onClick={close}>Düzeltmeyi kapat</Button></div><p>Her değişiklik yeni bir sürüm oluşturur. İlk kayıt ve önceki sürümler korunur.</p>{fields && <form onSubmit={event => { event.preventDefault(); void run(() => window.esmer.correctExpense({ entityId: row.entityId, expectedRevision: row.revision, reason, replacement: fields }), "Düzeltme kaydedildi. Dönemi yeniden inceleyin.", true); }}><fieldset disabled={busy} className="expense-fields"><legend>Gider bilgileri</legend>{textField("date", "Gider tarihi", "date")}{textField("paymentDate", "Ödeme tarihi", "date")}{textField("category", "Kategori")}<label>Sınıflandırma<select value={fields.classification} onChange={event => { const classification = event.target.value as ExpenseFields["classification"]; setFields({ ...fields, classification, labourPeriod: classification === "labour" ? fields.date.slice(0, 7) : null, loss: classification === "inventory-loss" ? { evidence: "", recognition: "separate" } : null }); }}>{classifications.map(item => <option key={item} value={item}>{classificationLabels[item]}</option>)}</select></label>{textField("net", "Net tutar")}{textField("tax", "KDV tutarı")}{textField("gross", "Brüt tutar")}<label>KDV işlemi<select value={fields.taxTreatment} onChange={event => update("taxTreatment", event.target.value as ExpenseFields["taxTreatment"])}><option value="unknown">Bilinmiyor</option><option value="recoverable">İndirilebilir</option><option value="non-recoverable">İndirilemez</option></select></label>{textField("taxEvidence", "KDV kanıtı")}{textField("supportingReference", "Destek referansı")}{textField("sourceReference", "Kayıt referansı")}{fields.classification === "labour" && textField("labourPeriod", "İşçilik dönemi", "month")}{fields.loss && <><label>Kayıp kanıtı<Input value={fields.loss.evidence} onChange={event => update("loss", { ...fields.loss!, evidence: event.target.value })} /></label><label>Kayıp işlemi<select value={fields.loss.recognition} onChange={event => update("loss", { ...fields.loss!, recognition: event.target.value as "separate" | "already-in-cost" })}><option value="separate">Ayrıca giderleştir</option><option value="already-in-cost">Maliyette zaten yer alıyor</option></select></label></>}</fieldset><p className="caption">Tutarları virgüllü ondalık olarak girin (örnek: 1250,50). Net, KDV ve brüt ilişkisi kayıtta doğrulanır.</p><label className="expense-reason">Değişiklik gerekçesi<Input required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></label><div className="expense-actions"><Button variant="default" disabled={busy || !reason.trim()}>Düzeltmeyi kaydet</Button><Button variant="outline" type="button" disabled={busy || !reason.trim() || original?.voided} onClick={() => void run(() => window.esmer.restoreExpense({ entityId: row.entityId, expectedRevision: row.revision, restoreRevision: null, reason }), "Gider geri alındı. Geçmişi korundu.", true)}>Gideri geri al</Button></div></form>}
    <h3>Kayıt geçmişi</h3><div className="table-scroll" tabIndex={0} aria-label="Gider sürümleri"><table><thead><tr><th>Sürüm / gerekçe</th><th>Tarih / kategori</th><th className="number">Net / KDV / brüt</th><th>İşlem</th></tr></thead><tbody>{history.map(item => { const value = currentValue(item); return <tr key={item.revision}><td>{item.revision} · {item.value.reason}<small>{item.revision === row.revision ? (value?.voided ? "Güncel sürüm · geri alınmış" : "Güncel sürüm") : value?.voided ? "Önceki sürüm · geri alınmış" : "Önceki sürüm"}</small></td><td>{date(item.value.date)}<small>{value?.category}</small>{value && <details><summary>Sürüm ayrıntıları</summary><dl className="evidence"><dt>Ödeme tarihi</dt><dd>{value.paymentDate ? date(value.paymentDate) : "Yok"}</dd><dt>Sınıflandırma</dt><dd>{classificationLabels[value.classification]}</dd><dt>KDV işlemi / kanıtı</dt><dd>{value.taxTreatment === "recoverable" ? "İndirilebilir" : value.taxTreatment === "non-recoverable" ? "İndirilemez" : "Bilinmiyor"} · {value.taxEvidence ?? "Yok"}</dd><dt>Kayıt / destek referansı</dt><dd>{value.sourceReference ?? "Yok"} / {value.supportingReference ?? "Yok"}</dd><dt>İşçilik dönemi</dt><dd>{value.labourPeriod ?? "Uygulanmaz"}</dd><dt>Kayıp kanıtı / işlemi</dt><dd>{value.loss ? `${value.loss.evidence} · ${value.loss.recognition === "separate" ? "Ayrıca giderleştirilmiş" : "Maliyette yer alıyor"}` : "Uygulanmaz"}</dd><dt>İçe aktarma / satır</dt><dd>{"kind" in value.origin ? "Elle girildi" : `${value.origin.batchId} / ${value.origin.row}`}</dd></dl></details>}</td><td className="number">{money(item.value.net)}<small>{value ? `${money(value.tax)} / ${money(value.gross)}` : "Kanıt yok"}</small></td><td><Button variant="link" disabled={busy || !reason.trim() || item.revision === row.revision || !value || value.voided} onClick={() => void run(() => window.esmer.restoreExpense({ entityId: row.entityId, expectedRevision: row.revision, restoreRevision: item.revision, reason }), "Önceki sürüm yeni kayıt olarak geri yüklendi.", true)}>Sürüm {item.revision} geri yükle</Button></td></tr>; })}</tbody></table></div>
  </section>;
}
