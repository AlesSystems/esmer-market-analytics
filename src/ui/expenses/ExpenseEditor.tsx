import { useEffect, useRef, useState } from "react";
import { classifications, classificationLabels, type ExpenseFields, type ExpenseRecord, type ExpenseResult, type ExpenseValue } from "../../expenses/contracts";
import type { RequestError } from "../../domain/contracts";
import { date, money } from "../format";

export type Run = (action: () => Promise<ExpenseResult | RequestError>, success: string, mutation?: boolean, focusId?: string) => Promise<void>;
export const currentValue = (row: ExpenseRecord): ExpenseValue | null => "format" in row.value ? row.value : null;

/** Correction, reversal and restore of one record. Every change appends a version with a reason; the original and earlier versions stay. */
export function ExpenseEditor({ row, history, busy, close, run }: { row: ExpenseRecord; history: ExpenseRecord[]; busy: boolean; close: () => void; run: Run }) {
  const original = currentValue(row);
  const [fields, setFields] = useState<ExpenseFields | null>(original ? { date: original.date, paymentDate: original.paymentDate, category: original.category, classification: original.classification, net: original.net, tax: original.tax, gross: original.gross, taxTreatment: original.taxTreatment, taxEvidence: original.taxEvidence, supportingReference: original.supportingReference, sourceReference: original.sourceReference, labourPeriod: original.labourPeriod, loss: original.loss } : null);
  const [reason, setReason] = useState("");
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, []);
  function update<K extends keyof ExpenseFields>(key: K, value: ExpenseFields[K]) { setFields(previous => previous ? { ...previous, [key]: value } : null); }
  const decimal = (key: string) => ["net", "tax", "gross"].includes(key);
  const textField = (key: "date" | "paymentDate" | "category" | "net" | "tax" | "gross" | "taxEvidence" | "supportingReference" | "sourceReference" | "labourPeriod", label: string, type = "text") => <label>{label}<input type={type} readOnly={key === "sourceReference"} inputMode={decimal(key) ? "decimal" : undefined} value={(decimal(key) ? fields?.[key]?.replace(".", ",") : fields?.[key]) ?? ""} onChange={event => update(key, (decimal(key) ? event.target.value.replace(",", ".") : event.target.value) || (["date", "category", "net", "tax", "gross"].includes(key) ? "" : null))} /></label>;
  return <section className="card g-task" aria-label="Gider düzeltmesi">
    <div className="g-card-head"><h2 ref={title} tabIndex={-1}>Gideri incele ve düzelt</h2></div>
    <p className="g-muted">{original ? ("kind" in original.origin ? "Elle girildi" : "Excel") : "Eski kayıt"} · sürüm {row.revision}</p>
    <p>Her değişiklik yeni bir sürüm oluşturur. İlk kayıt ve önceki sürümler korunur.</p>
    {fields && <form onSubmit={event => { event.preventDefault(); void run(() => window.esmer.correctExpense({ entityId: row.entityId, expectedRevision: row.revision, reason, replacement: fields }), "Düzeltme kaydedildi. Dönemi yeniden inceleyin.", true); }}>
      <fieldset disabled={busy} className="g-fields"><legend>Gider bilgileri</legend>
        {textField("date", "Gider tarihi", "date")}{textField("paymentDate", "Ödeme tarihi", "date")}{textField("category", "Kategori")}
        <label>Sınıflandırma<select value={fields.classification} onChange={event => { const classification = event.target.value as ExpenseFields["classification"]; setFields({ ...fields, classification, labourPeriod: classification === "labour" ? fields.date.slice(0, 7) : null, loss: classification === "inventory-loss" ? { evidence: "", recognition: "separate" } : null }); }}>{classifications.map(item => <option key={item} value={item}>{classificationLabels[item]}</option>)}</select></label>
        {fields.classification === "labour" && textField("labourPeriod", "İşçilik dönemi", "month")}
        {fields.loss && <><label>Kayıp kanıtı<input value={fields.loss.evidence} onChange={event => update("loss", { ...fields.loss!, evidence: event.target.value })} /></label><label>Kayıp işlemi<select value={fields.loss.recognition} onChange={event => update("loss", { ...fields.loss!, recognition: event.target.value as "separate" | "already-in-cost" })}><option value="separate">Ayrıca giderleştir</option><option value="already-in-cost">Maliyette zaten yer alıyor</option></select></label></>}
      </fieldset>
      <fieldset disabled={busy} className="g-fields"><legend>Tutar ve KDV</legend>
        {textField("net", "Net tutar")}{textField("tax", "KDV tutarı")}{textField("gross", "Brüt tutar")}
        <label>KDV işlemi<select value={fields.taxTreatment} onChange={event => update("taxTreatment", event.target.value as ExpenseFields["taxTreatment"])}><option value="unknown">Bilinmiyor</option><option value="recoverable">İndirilebilir</option><option value="non-recoverable">İndirilemez</option></select></label>
        {textField("taxEvidence", "KDV kanıtı")}
      </fieldset>
      <fieldset disabled={busy} className="g-fields"><legend>Referanslar</legend>{textField("supportingReference", "Destek referansı")}{textField("sourceReference", "Kayıt referansı")}</fieldset>
      <p className="g-cap">Tutarları virgüllü ondalık olarak girin (örnek: 1250,50). Net, KDV ve brüt ilişkisi kayıtta doğrulanır.</p>
      <label className="g-reason">Değişiklik gerekçesi<input required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} /></label>
      <div className="g-actions"><button type="submit" className="btn btn-primary" disabled={busy || !reason.trim()}>Düzeltmeyi kaydet</button><button type="button" className="btn btn-secondary" disabled={busy || !reason.trim() || original?.voided} onClick={() => void run(() => window.esmer.restoreExpense({ entityId: row.entityId, expectedRevision: row.revision, restoreRevision: null, reason }), "Gider geri alındı. Geçmişi korundu.", true)}>Gideri geri al</button><button type="button" className="btn btn-secondary" onClick={close}>Düzeltmeyi kapat</button></div>
    </form>}
    <h3>Kayıt geçmişi</h3>
    <div className="table-scroll" tabIndex={0} aria-label="Gider sürümleri"><table><thead><tr><th>Sürüm / gerekçe</th><th>Tarih / kategori</th><th className="number">Net / KDV / brüt</th><th>İşlem</th></tr></thead><tbody>{history.map(item => { const value = currentValue(item); return <tr key={item.revision}>
      <td>{item.revision} · {item.value.reason}<small>{item.revision === row.revision ? (value?.voided ? "Güncel sürüm · geri alınmış" : "Güncel sürüm") : value?.voided ? "Önceki sürüm · geri alınmış" : "Önceki sürüm"}</small></td>
      <td>{date(item.value.date)}<small>{value?.category}</small>{value && <details><summary>Sürüm ayrıntıları</summary><dl className="g-evidence"><dt>Ödeme tarihi</dt><dd>{value.paymentDate ? date(value.paymentDate) : "Yok"}</dd><dt>Sınıflandırma</dt><dd>{classificationLabels[value.classification]}</dd><dt>KDV işlemi / kanıtı</dt><dd>{value.taxTreatment === "recoverable" ? "İndirilebilir" : value.taxTreatment === "non-recoverable" ? "İndirilemez" : "Bilinmiyor"} · {value.taxEvidence ?? "Yok"}</dd><dt>Kayıt / destek referansı</dt><dd>{value.sourceReference ?? "Yok"} / {value.supportingReference ?? "Yok"}</dd><dt>İşçilik dönemi</dt><dd>{value.labourPeriod ?? "Uygulanmaz"}</dd><dt>Kayıp kanıtı / işlemi</dt><dd>{value.loss ? `${value.loss.evidence} · ${value.loss.recognition === "separate" ? "Ayrıca giderleştirilmiş" : "Maliyette yer alıyor"}` : "Uygulanmaz"}</dd><dt>İçe aktarma / satır</dt><dd>{"kind" in value.origin ? "Elle girildi" : `${value.origin.batchId} / ${value.origin.row}`}</dd></dl></details>}</td>
      <td className="number">{money(item.value.net)}<small>{value ? `${money(value.tax)} / ${money(value.gross)}` : "Kanıt yok"}</small></td>
      <td><button type="button" className="link" disabled={busy || !reason.trim() || item.revision === row.revision || !value || value.voided} onClick={() => void run(() => window.esmer.restoreExpense({ entityId: row.entityId, expectedRevision: row.revision, restoreRevision: item.revision, reason }), "Önceki sürüm yeni kayıt olarak geri yüklendi.", true)}>Sürüm {item.revision} geri yükle</button></td>
    </tr>; })}</tbody></table></div>
  </section>;
}
