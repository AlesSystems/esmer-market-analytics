import { useEffect, useRef, useState, type ReactNode } from "react";
import type { CreateExpenseResult, ExpenseRecord, ManualBill, ManualBillFields } from "../expenses/contracts";
import type { RequestError } from "../domain/contracts";
import { useExpenseNavigation } from "./expense-navigation";
import { monthName } from "./pages/month-summary";

export const pendingExpenseKey = "esmer.pending-manual-expense";
type Saved = Extract<CreateExpenseResult, { status: "saved" | "already-saved" | "already-present" }>;
type State =
  | { tag: "editing"; errors: Partial<Record<keyof ManualBillFields, string>>; message: string }
  | { tag: "review-required" | "reviewing-records"; message: string }
  | { tag: "submitting" | "checking" | "uncertain"; requestId: string };
const editing = { tag: "editing", errors: {}, message: "" } as const;
type Correction = { row: ExpenseRecord; bill: ManualBill; busy: boolean; history: (reason: string, blocked: boolean) => ReactNode };

export function ManualExpenseEntry({ period, close, saved, reviewRecords, correction }: {
  period: string;
  close: () => void;
  saved: (result: Saved) => void;
  reviewRecords: () => Promise<boolean>;
  correction?: Correction;
}) {
  const initial = {
    period: correction?.bill.period ?? period,
    category: correction?.bill.category ?? "",
    amount: correction?.bill.amount.replace(".", ",") ?? "",
  };
  const [fields, setFields] = useState(initial);
  const [reason, setReason] = useState("");
  const [state, setState] = useState<State>(editing);
  const recordsReview = useRef<HTMLButtonElement>(null), title = useRef<HTMLHeadingElement>(null), form = useRef<HTMLFormElement>(null);
  const requestId = useRef<string | null>(null), generation = useRef(0);
  const navigation = useExpenseNavigation();
  const locked = state.tag === "submitting" || state.tag === "checking" || state.tag === "uncertain" || state.tag === "reviewing-records" || !!correction?.busy;
  const reviewRequired = state.tag === "review-required";
  const dirty = fields.period !== initial.period || fields.category !== initial.category || fields.amount !== initial.amount || reason !== "";

  useEffect(() => { title.current?.focus(); }, []);
  useEffect(() => { if (reviewRequired) recordsReview.current?.focus(); }, [reviewRequired]);
  useEffect(() => { if (state.tag === "editing" && Object.keys(state.errors).length) form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(); }, [state]);
  useEffect(() => {
    navigation.protect({ dirty, locked });
    return () => navigation.protect({ dirty: false, locked: false });
  }, [dirty, locked, state.tag, navigation.protect]);
  useEffect(() => {
    const pending = localStorage.getItem(pendingExpenseKey);
    if (pending && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(pending)) { requestId.current = pending; void resolve(pending); }
    else localStorage.removeItem(pendingExpenseKey);
    return () => { ++generation.current; };
  }, []);

  function update(key: keyof ManualBillFields, value: string) {
    requestId.current = null;
    setFields(previous => ({ ...previous, [key]: value }));
    setState(editing);
  }
  function clearPending(token: string | null) {
    if (localStorage.getItem(pendingExpenseKey) === token) localStorage.removeItem(pendingExpenseKey);
  }
  function accept(result: CreateExpenseResult | RequestError, id: number, token: string) {
    if (id !== generation.current) return;
    if (result.status === "saved" || result.status === "already-saved" || result.status === "already-present") {
      clearPending(token);
      navigation.protect({ dirty: false, locked: false });
      saved(result);
    } else if (result.status === "failed" && result.code === "STALE_EXPENSE") {
      clearPending(token);
      setState({ tag: "review-required", message: result.message });
    } else if (result.status === "failed" || result.status === "unavailable") {
      setState({ tag: "uncertain", requestId: token });
    } else if (result.status === "not-saved") {
      setState({ tag: "review-required", message: "Bu veritabanında kayıt bulunamadı. Yeniden kaydetmeden önce mevcut kayıtları inceleyin. Eski bir yedekten dönüldüyse bu sonuç yalnızca o yedeği tanımlar." });
    } else {
      clearPending(token);
      setState(result.status === "invalid"
        ? { tag: "editing", errors: result.fieldErrors, message: "İşaretlenen alanları inceleyin." }
        : { ...editing, message: "message" in result ? result.message : "İstek tamamlanamadı." });
    }
  }
  async function resolve(token: string) {
    const id = ++generation.current;
    navigation.protect({ dirty, locked: true });
    setState({ tag: "checking", requestId: token });
    try { accept(await window.esmer.createExpense({ action: "resolve", requestId: token }), id, token); }
    catch { if (id === generation.current) setState({ tag: "uncertain", requestId: token }); }
  }
  async function inspectRecords() {
    if (state.tag !== "review-required") return;
    const id = ++generation.current;
    navigation.protect({ dirty, locked: true });
    setState({ tag: "reviewing-records", message: state.message });
    const reviewed = await reviewRecords();
    if (id !== generation.current) return;
    if (reviewed) {
      clearPending(requestId.current);
      navigation.protect({ dirty: false, locked: false });
      close();
    } else setState({ tag: "review-required", message: "Kayıtlar açılamadı. Yeniden kaydetmeden önce kayıtları tekrar inceleyin." });
  }
  async function submit() {
    if (locked || reviewRequired) return;
    const token = requestId.current ?? crypto.randomUUID();
    requestId.current = token;
    try { localStorage.setItem(pendingExpenseKey, token); }
    catch { setState({ ...editing, message: "Tekrar kontrol kimliği bu bilgisayarda saklanamadı. Kayıt gönderilmedi." }); return; }
    const id = ++generation.current;
    navigation.protect({ dirty, locked: true });
    setState({ tag: "submitting", requestId: token });
    const request = correction
      ? { action: "correct-bill" as const, requestId: token, entityId: correction.row.entityId, expectedRevision: correction.row.revision, reason, fields }
      : { action: "save-bill" as const, requestId: token, fields };
    try { accept(await window.esmer.createExpense(request), id, token); }
    catch { if (id === generation.current) setState({ tag: "uncertain", requestId: token }); }
  }
  const errors = state.tag === "editing" ? state.errors : {};
  const input = (key: "category" | "amount", label: string) => <label>{label}<input aria-label={label} id={`manual-${key}`} maxLength={key === "category" ? 80 : 100} inputMode={key === "amount" ? "decimal" : undefined} value={fields[key]} required aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `manual-${key}-error` : undefined} onChange={event => update(key, event.target.value)}/>{errors[key] && <span className="g-err" id={`manual-${key}-error`}>{errors[key]}</span>}</label>;
  const disabled = locked || reviewRequired;
  const cancel = <button type="button" className="btn btn-secondary" disabled={locked} onClick={() => navigation.leave(close)}>{correction ? "Düzeltmeyi kapat" : "Vazgeç"}</button>;
  return <section className={correction ? "card g-task" : "g-form"} aria-label={correction ? "Gider düzeltmesi" : "Elle gider girişi"}>
    <div className="g-form-head"><div>{correction
      ? <h2 ref={title} tabIndex={-1}>Gideri incele ve düzelt</h2>
      : <h3 ref={title} tabIndex={-1}>Elle gider ekle</h3>}
      <p>{monthName(initial.period)}</p></div>{cancel}</div>
    <form ref={form} noValidate onSubmit={event => { event.preventDefault(); void submit(); }}>
      <fieldset disabled={disabled} className="g-fields"><legend>Gider bilgileri</legend>
        {correction && <label>Gider ayı<input type="month" required aria-invalid={!!errors.period} value={fields.period} onChange={event => update("period", event.target.value)}/>{errors.period && <span className="g-err">{errors.period}</span>}</label>}
        {input("category", "Kategori")}
        {input("amount", "Tutar (TRY)")}
        {correction && <label>Değişiklik gerekçesi<input required maxLength={500} value={reason} onChange={event => { requestId.current = null; setReason(event.target.value); setState(editing); }}/></label>}
      </fieldset>
      {"message" in state && state.message && <p className="g-note is-warn" role="alert">{state.message}</p>}
      <p className="g-cap">Kaydetmek, dönemin giderlerinin eksiksiz olduğunu onaylamaz.</p>
      <div className="g-actions">
        {reviewRequired && <button type="button" className="btn btn-secondary" ref={recordsReview} onClick={() => void inspectRecords()}>Kayıtları incele</button>}
        {state.tag === "uncertain"
          ? <><p role="alert">Kaydın sonucu bilinmiyor. Yeniden kaydetmeden önce kontrol edin.</p><button type="button" className="btn btn-primary" onClick={() => void resolve(state.requestId)}>Kaydı kontrol et</button></>
          : <button type="submit" className="btn btn-primary" disabled={disabled || !!correction && (!reason.trim() || !fields.period)}>{state.tag === "submitting" ? "Gider kaydediliyor…" : state.tag === "checking" || state.tag === "reviewing-records" ? "Kayıt kontrol ediliyor…" : correction ? "Düzeltmeyi kaydet" : "Gideri kaydet"}</button>}
      </div>
    </form>
    {correction?.history(reason, disabled)}
  </section>;
}
