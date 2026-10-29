import type { RefObject } from "react";
import { classificationLabels, type ExpensePreview } from "../../expenses/contracts";
import { date, money } from "../format";

/** The parsed workbook before anything is saved. Invalid rows block the whole file; similar existing lines need an explicit decision each. */
export function ImportPreview({ preview, keep, setKeep, busy, invalid, title, close, confirm }: { preview: ExpensePreview; keep: number[]; setKeep: (rows: number[]) => void; busy: boolean; invalid: boolean; title: RefObject<HTMLHeadingElement | null>; close: () => void; confirm: () => void }) {
  const blocked = busy || invalid || preview.alreadyImported || !preview.rows.length || preview.rows.some(row => !row.alreadyPresent && row.duplicates.length > 0 && !keep.includes(row.row));
  return <section className="card g-task" aria-label="Excel önizlemesi">
    <div className="g-card-head"><h2 ref={title} tabIndex={-1}>Excel önizlemesi</h2><button type="button" className="btn btn-secondary" disabled={busy} onClick={close}>Önizlemeyi kapat</button></div>
    <p>{preview.rows.length.toLocaleString("tr-TR")} satır · Aylar: {[...new Set(preview.rows.flatMap(row => row.value ? [row.value.date.slice(0, 7)] : []))].join(", ") || "Belirlenemiyor"}</p>
    <p className="g-cap">Henüz hiçbir şey kaydedilmedi. Hatalı satır varsa Excel dosyasını düzeltip yeniden seçin.</p>
    {preview.alreadyImported && <p className="g-note">Bu Excel dosyası zaten içe aktarılmış.</p>}
    {preview.errors.map((item, i) => <p role="alert" key={i}>{item}</p>)}
    <div className="table-scroll" tabIndex={0} aria-label="Önizleme satırları"><table><thead><tr><th>Satır / tarih</th><th>Kategori / tür</th><th className="number">Brüt tutar</th><th>Durum</th></tr></thead><tbody>{preview.rows.map(row => <tr key={row.row}>
      <td>{row.row}{row.value && <small>{date(row.value.date)}</small>}</td>
      <td>{row.value?.category ?? "Geçersiz satır"}{row.value && <small>{classificationLabels[row.value.classification]}</small>}</td>
      <td className="number">{row.value ? <>{money(row.value.gross)}<small>net {money(row.value.net)} · KDV {money(row.value.tax)}</small></> : "—"}</td>
      <td>{row.errors.map((item, i) => <p key={i} role="alert">{item}</p>)}{row.alreadyPresent ? "Önceden kaydedilmiş" : row.duplicates.length > 0 ? <label className="g-check"><input type="checkbox" disabled={busy} checked={keep.includes(row.row)} onChange={event => setKeep(event.target.checked ? [...keep, row.row] : keep.filter(id => id !== row.row))} />Satır {row.row}: benzer kayıt var, yine de ayrı gider olarak ekle</label> : row.errors.length === 0 ? "Hazır" : null}</td>
    </tr>)}</tbody></table></div>
    <div className="g-actions"><button type="button" className="btn btn-primary" disabled={blocked} onClick={confirm}>İçe aktar</button></div>
  </section>;
}
