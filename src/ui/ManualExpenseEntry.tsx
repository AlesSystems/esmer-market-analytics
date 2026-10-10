import { useEffect, useRef, useState } from "react";
import { classifications, classificationLabels, type CreateExpenseResult, type ExpenseFields, type ManualExpenseInput } from "../expenses/contracts";
import type { RequestError } from "../domain/contracts";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { money, date } from "./format";
import { useExpenseNavigation } from "./expense-navigation";
export const pendingExpenseKey = "esmer.pending-manual-expense";
const blank: ManualExpenseInput = { date: "", paymentDate: null, category: "", classification: "unclassified", net: "", tax: "", gross: "", taxTreatment: "unknown", taxEvidence: null, supportingReference: null, sourceReference: null, labourPeriod: null, loss: null };
type State = { tag: "review-required" | "reviewing-records"; message: string } | { tag: "editing"; errors: Partial<Record<keyof ExpenseFields, string>>; message: string } | { tag: "review"; review: Extract<CreateExpenseResult, {status: "duplicate-review"}>; acknowledged: boolean } | { tag: "submitting" | "checking" | "uncertain"; requestId: string };
export function ManualExpenseEntry({ period, close, saved, reviewRecords }: { period: string; close: () => void; reviewRecords: () => Promise<boolean>; saved: (result: Extract<CreateExpenseResult, {status: "saved" | "already-saved" | "already-present"}>, current: boolean) => void }) {
  const [fields, setFields] = useState<ManualExpenseInput>({ ...blank }), [lossRecognition, setLossRecognition] = useState("");
  const [state, setState] = useState<State>({ tag: "editing", errors: {}, message: "" });
  const recordsReview = useRef<HTMLButtonElement>(null);
  const reviewTitle = useRef<HTMLHeadingElement>(null);
  const title = useRef<HTMLHeadingElement>(null), form = useRef<HTMLFormElement>(null), requestId = useRef<string | null>(null), generation = useRef(0);
  const navigation = useExpenseNavigation();
  const currentPeriod = useRef(period); currentPeriod.current = period;
  const locked = state.tag === "submitting" || state.tag === "checking" || state.tag === "uncertain" || state.tag === "reviewing-records";
  const reviewRequired = state.tag === "review-required";
  const dirty = JSON.stringify(fields) !== JSON.stringify(blank);
  useEffect(() => { title.current?.focus(); }, []);
  useEffect(() => { if (state.tag === "review") reviewTitle.current?.focus(); if (state.tag === "review-required") recordsReview.current?.focus(); }, [state.tag]);
  useEffect(() => { if (state.tag === "editing" && Object.keys(state.errors).length) form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus(); }, [state]);
  useEffect(() => { navigation.protect({ dirty, locked }); return () => navigation.protect({ dirty: false, locked: false }); }, [dirty, locked, state.tag, navigation.protect]);
  useEffect(() => {
    const pending = localStorage.getItem(pendingExpenseKey);
    if (pending && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(pending)) { requestId.current = pending; void resolve(pending); }
    else localStorage.removeItem(pendingExpenseKey);
    return () => { ++generation.current; };
  }, []);
  function update<K extends keyof ManualExpenseInput>(key: K, value: ManualExpenseInput[K]) {
    if (reviewRequired) return;
    ++generation.current; requestId.current = null;
    setFields(previous => ({ ...previous, [key]: value, ...(key === "date" && previous.classification === "labour" ? { labourPeriod: String(value).slice(0, 7) || null } : {}) }));
    setState({ tag: "editing", errors: {}, message: "" });
  }
  function accept(result: CreateExpenseResult | RequestError, id: number, token: string, capturedPeriod: string) {
    if (result.status === "saved" || result.status === "already-saved" || result.status === "already-present") {
      if (localStorage.getItem(pendingExpenseKey) === token) localStorage.removeItem(pendingExpenseKey);
      const current = id === generation.current && currentPeriod.current === capturedPeriod;
      if (current) navigation.protect({ dirty: false, locked: false });
      saved(result, current); return;
    }
    if (id !== generation.current || currentPeriod.current !== capturedPeriod) return;
    if (result.status === "failed" || result.status === "unavailable") { setState({ tag: "uncertain", requestId: token }); return; }
    if (result.status === "not-saved") { requestId.current = token; setState({ tag: "review-required", message: "Bu veritabanında kayıt bulunamadı. Yeniden eklemeden önce mevcut kayıtları inceleyin. Yeniden açılışta kaydedilmemiş form bilgileri korunmaz; eski bir yedekten dönüldüyse bu sonuç yalnızca o yedeği tanımlar." }); return; }
    localStorage.removeItem(pendingExpenseKey);
    if (result.status === "duplicate-review") setState({ tag: "review", review: result, acknowledged: false });
    else if (result.status === "invalid") {
      setState({ tag: "editing", errors: result.fieldErrors, message: "İşaretlenen alanları inceleyin." });
      requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus());
    } else if (result.status === "reference-conflict") setState({ tag: "editing", errors: { sourceReference: "Bu referans mevcut veya geri alınmış bir kayda ait. Kayıtlarda gerekçeli düzeltme / geri yükleme kullanın." }, message: "Kayıt değiştirilmedi." });

    else setState({ tag: "editing", errors: {}, message: "message" in result ? result.message : "İstek tamamlanamadı." });
  }
  async function resolve(token: string) {
    const id = ++generation.current;
    navigation.protect({ dirty, locked: true }); setState({ tag: "checking", requestId: token });
    try { accept(await window.esmer.createExpense({ action: "resolve", requestId: token }), id, token, period); }
    catch { if (id === generation.current) setState({ tag: "uncertain", requestId: token }); }
  }
  async function inspectRecords() {
    if (state.tag !== "review-required") return;
    const message = state.message, id = ++generation.current, token = requestId.current;
    navigation.protect({ dirty, locked: true }); setState({ tag: "reviewing-records", message });
    const reviewed = await reviewRecords();
    if (id !== generation.current) return;
    if (reviewed) {
      if (localStorage.getItem(pendingExpenseKey) === token) localStorage.removeItem(pendingExpenseKey);
      navigation.protect({ dirty: false, locked: false }); close();
    } else setState({ tag: "review-required", message: "Kayıtlar açılamadı. Yeniden eklemeden önce kayıtları tekrar inceleyin." });
  }
  async function submit() {
    if (locked || reviewRequired) return;
    if (fields.classification === "inventory-loss" && !lossRecognition) { setState({ tag: "editing", errors: { loss: "Kayıp işlemini seçin." }, message: "İşaretlenen alanları inceleyin." }); requestAnimationFrame(() => document.getElementById("manual-loss-recognition")?.focus()); return; }
    const referenceErrors: Partial<Record<keyof ExpenseFields, string>> = {};
    for (const key of ["taxEvidence", "supportingReference", "sourceReference"] as const) if (fields[key] !== null && !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(fields[key]!)) referenceErrors[key] = "1–128 karakterlik kod kullanın: harf, rakam, nokta, alt çizgi, iki nokta veya kısa çizgi.";
    if (fields.loss && !/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(fields.loss.evidence)) referenceErrors.loss = "Geçerli bir kayıp kanıtı kodu girin.";
    if (Object.keys(referenceErrors).length) { setState({ tag: "editing", errors: referenceErrors, message: "İşaretlenen alanları inceleyin." }); requestAnimationFrame(() => form.current?.querySelector<HTMLElement>("[aria-invalid=true]")?.focus()); return; }
    const token = requestId.current ?? crypto.randomUUID(); requestId.current = token;
    const review = state.tag === "review" && state.acknowledged ? { fingerprint: state.review.fingerprint, keepSeparate: true as const } : null;
    const id = ++generation.current;
    try { localStorage.setItem(pendingExpenseKey, token); } catch { setState({ tag: "editing", errors: {}, message: "Tekrar kontrol kimliği bu bilgisayarda saklanamadı. Kayıt gönderilmedi." }); return; }
    navigation.protect({ dirty, locked: true }); setState({ tag: "submitting", requestId: token });
    try { accept(await window.esmer.createExpense({ action: "save", requestId: token, fields, duplicateReview: review }), id, token, period); }
    catch { if (id === generation.current) setState({ tag: "uncertain", requestId: token }); }
  }
  const errors = state.tag === "editing" ? state.errors : {};
  const input = (key: "date" | "paymentDate" | "category" | "net" | "tax" | "gross" | "taxEvidence" | "sourceReference" | "supportingReference", label: string, type = "text") => <label htmlFor={`manual-${key}`}>{label}<Input aria-label={label} id={`manual-${key}`} type={type} maxLength={key === "category" ? 80 : ["net", "tax", "gross"].includes(key) ? 100 : 128} inputMode={["net", "tax", "gross"].includes(key) ? "decimal" : undefined} value={fields[key] ?? ""} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `manual-${key}-error` : undefined} onChange={event => update(key, event.target.value || (["date", "category", "net", "tax", "gross"].includes(key) ? "" : null))}/>{errors[key] && <span className="field-error" id={`manual-${key}-error`}>{errors[key]}</span>}</label>;
  return <section className="block expense-section workspace-task manual-expense" aria-label="Elle gider girişi"><div className="section-heading"><div><h2 ref={title} tabIndex={-1}>Elle gider ekle</h2><p>Dönem: {period}</p></div><Button variant="outline" disabled={locked} onClick={() => navigation.leave(close)}>Vazgeç</Button></div>
    <form ref={form} noValidate onSubmit={event => { event.preventDefault(); void submit(); }}>
      <fieldset disabled={locked || reviewRequired} className="expense-fields manual-expense-fields"><legend>Gider bilgileri</legend>{input("date", "Gider tarihi", "date")}{input("paymentDate", "Ödeme tarihi (isteğe bağlı)", "date")}{input("category", "Kategori")}<label>Sınıflandırma<select aria-label="Sınıflandırma" value={fields.classification} aria-invalid={!!errors.classification} aria-describedby={errors.classification ? "manual-classification-error" : undefined} onChange={event => { const classification = event.target.value as ExpenseFields["classification"]; setLossRecognition(""); update("classification", classification); setFields(previous => ({ ...previous, classification, labourPeriod: classification === "labour" ? previous.date.slice(0, 7) || null : null, loss: classification === "inventory-loss" ? { evidence: "", recognition: "separate" } : null })); }}>{classifications.map(value => <option key={value} value={value}>{classificationLabels[value]}</option>)}</select>{errors.classification && <span className="field-error" id="manual-classification-error">{errors.classification}</span>}</label>{input("net", "Net tutar (TRY)")}{input("tax", "KDV tutarı (TRY)")}{input("gross", "Brüt tutar (TRY)")}<label>KDV işlemi<select aria-label="KDV işlemi" value={fields.taxTreatment} onChange={event => update("taxTreatment", event.target.value as ExpenseFields["taxTreatment"])}><option value="unknown">Bilinmiyor</option><option value="recoverable">İndirilebilir</option><option value="non-recoverable">İndirilemez</option></select><small>KDV işlemi bilinmiyorsa faaliyet kârı hesaplanamaz.</small></label>{fields.taxTreatment !== "unknown" && input("taxEvidence", "KDV kanıtı")}
      {fields.classification === "labour" && <p className="manual-guidance">İşçilik dönemi: <strong>{fields.labourPeriod || "Gider tarihini girin"}</strong>. Yalnızca aylık toplam girin; kişi veya bordro bilgisi eklemeyin.</p>}
      {fields.classification === "inventory-loss" && <><label>Kayıp kanıtı<Input aria-label="Kayıp kanıtı" value={fields.loss?.evidence ?? ""} maxLength={128} aria-invalid={!!errors.loss} aria-describedby={errors.loss ? "manual-loss-error" : undefined} onChange={event => update("loss", { evidence: event.target.value, recognition: fields.loss?.recognition ?? "separate" })}/></label><label>Kayıp işlemi<select aria-label="Kayıp işlemi" id="manual-loss-recognition" value={lossRecognition} aria-invalid={!!errors.loss} aria-describedby={errors.loss ? "manual-loss-error" : undefined} onChange={event => { setLossRecognition(event.target.value); update("loss", { evidence: fields.loss?.evidence ?? "", recognition: event.target.value as "separate" | "already-in-cost" }); }}><option value="">Seçin</option><option value="separate">Ayrı gider</option><option value="already-in-cost">Maliyete dahil</option></select>{errors.loss && <span className="field-error" id="manual-loss-error">{errors.loss}</span>}</label></>}
      </fieldset><p className="caption">TRY tutarlarını 1250,50 veya 1.250,50 biçiminde girin. Net ile KDV toplamı brüte eşit olmalı. Boş KDV, sıfır sayılmaz. Ödeme tarihi ödeme hareketlerini ayrıca belirler.</p>
      <details open={!!errors.sourceReference || !!errors.supportingReference || !!errors.taxEvidence && fields.taxTreatment === "unknown"}><summary>Referanslar (isteğe bağlı)</summary><p>Kişisel bilgi yerine kısa kod kullanın. Aynı kayıt referansı, Excel ve elle girişte aynı gideri tanımlar.</p><fieldset disabled={locked || reviewRequired} className="expense-fields">{input("sourceReference", "Kayıt referansı")}{input("supportingReference", "Destek referansı")}{fields.taxTreatment === "unknown" && input("taxEvidence", "KDV kanıtı (isteğe bağlı)")}</fieldset></details>
      {(state.tag === "editing" || state.tag === "review-required" || state.tag === "reviewing-records") && state.message && <p className="notice warning" role="alert">{state.message}</p>}
      {state.tag === "review" && <section className="notice warning" aria-label="Benzer giderleri incele"><h3 ref={reviewTitle} tabIndex={-1}>Benzer tarih ve tutarda {state.review.totalCount} kayıt var</h3><ul>{state.review.candidates.map(row => <li key={row.entityId}>{date(row.date)} · {row.category} · {money(row.gross)} · sürüm {row.revision}</li>)}</ul>{state.review.totalCount > 5 && <p>İlk beş kayıt gösteriliyor. Kayıtlar bölümünde tüm giderleri inceleyebilirsiniz.</p>}<label className="expense-check"><input type="checkbox" checked={state.acknowledged} onChange={event => setState({ ...state, acknowledged: event.target.checked })}/>Benzer kayıtları inceledim; bu ayrı bir gider</label></section>}
      <p className="caption">Kaydetmek, dönemin giderlerinin eksiksiz olduğunu onaylamaz.</p><div className="expense-actions">{reviewRequired && <Button ref={recordsReview} type="button" variant="outline" onClick={() => navigation.leave(() => void inspectRecords())}>Kayıtları incele</Button>}{state.tag === "uncertain" ? <><p role="alert">Kaydın sonucu bilinmiyor. Yeniden eklemeden önce kontrol edin.</p><Button type="button" onClick={() => void resolve(state.requestId)}>Kaydı kontrol et</Button></> : <Button disabled={locked || reviewRequired || state.tag === "review" && !state.acknowledged}>{state.tag === "submitting" ? "Gider kaydediliyor…" : state.tag === "checking" || state.tag === "reviewing-records" ? "Kayıt kontrol ediliyor…" : state.tag === "review" ? "Ayrı gider olarak kaydet" : "Gideri kaydet"}</Button>}</div>
    </form></section>;
}
