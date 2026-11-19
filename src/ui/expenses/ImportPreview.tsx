import { useState, type RefObject } from "react";
import { classificationLabels, type ConfirmExpensesRequest, type ExpensePreview } from "../../expenses/contracts";
import { date, money } from "../format";
import { monthName } from "../pages/month-summary";

/** The parsed workbook before anything is saved. Invalid rows block the whole file; similar existing lines need an explicit decision each. */
export function ImportPreview({ preview, busy, invalid, title, close, confirm }: { preview: ExpensePreview; busy: boolean; invalid: boolean; title: RefObject<HTMLHeadingElement | null>; close: () => void; confirm: (request: ConfirmExpensesRequest) => void }) {
  const [keep, setKeep] = useState<number[]>([]);
  const [matches, setMatches] = useState<Record<number, string>>({});
  const [openRow, setOpenRow] = useState<number>();
  const used = new Set(Object.values(matches));
  const blocked = busy || invalid || preview.alreadyImported || !preview.rows.length || preview.rows.some(row => !row.alreadyPresent && (row.matchKey || row.duplicates.length > 0) && !keep.includes(row.row) && !matches[row.row]);
  function decide(row: number, choice: string) {
    const next = { ...matches };
    delete next[row];
    if (choice && choice !== "separate") next[row] = choice;
    setMatches(next);
    setKeep(choice === "separate" ? [...keep.filter(id => id !== row), row] : keep.filter(id => id !== row));
  }
  const label = (bill: ExpensePreview["manualCandidates"][string][number]) =>
    `Elle kayıt no. ${bill.billNumber} · ${bill.category} · ${monthName(bill.period)} · ${money(bill.amount)}`;
  return <section className="card g-task" aria-label="Excel önizlemesi">
    <div className="g-card-head"><h2 ref={title} tabIndex={-1}>Excel önizlemesi</h2><button type="button" className="btn btn-secondary" disabled={busy} onClick={close}>Önizlemeyi kapat</button></div>
    <p>{preview.rows.length.toLocaleString("tr-TR")} satır · Aylar: {[...new Set(preview.rows.flatMap(row => row.value ? [row.value.date.slice(0, 7)] : []))].join(", ") || "Belirlenemiyor"}</p>
    <p className="g-cap">Henüz hiçbir şey kaydedilmedi. Hatalı satır varsa Excel dosyasını düzeltip yeniden seçin.</p>
    {preview.alreadyImported && <p className="g-note">Bu Excel dosyası zaten içe aktarılmış.</p>}
    {preview.errors.map((item, i) => <p role="alert" key={i}>{item}</p>)}
    <div className="table-scroll" tabIndex={0} aria-label="Önizleme satırları"><table><thead><tr><th>Satır / tarih</th><th>Kategori / tür</th><th className="number">Brüt tutar</th><th>Durum</th></tr></thead><tbody>{preview.rows.map(row => {
      const bills = row.matchKey ? preview.manualCandidates[row.matchKey] : undefined;
      const match = matches[row.row] ? bills?.find(bill => bill.entityId === matches[row.row]) : undefined;
      return <tr key={row.row}>
      <td>{row.row}{row.value && <small>{date(row.value.date)}</small>}</td>
      <td>{row.value?.category ?? "Geçersiz satır"}{row.value && <small>{classificationLabels[row.value.classification]}</small>}</td>
      <td className="number">{row.value ? <>{money(row.value.gross)}<small>net {money(row.value.net)} · KDV {money(row.value.tax)}</small></> : "—"}</td>
      <td>{row.errors.map((item, i) => <p key={i} role="alert">{item}</p>)}{row.alreadyPresent ? "Önceden kaydedilmiş" : bills ? <>
        <button type="button" className="link" disabled={busy} aria-expanded={openRow === row.row} onClick={() => setOpenRow(openRow === row.row ? undefined : row.row)}>Satır {row.row}: {bills.length} olası elle kayıt</button>
        {match ? <small>{label(match)}</small> : keep.includes(row.row) ? <small>Ayrı gider olarak eklenecek</small> : null}
        {openRow === row.row && <label className="g-check">Satır {row.row} eşleştirme kararı
          <select disabled={busy} value={matches[row.row] ?? (keep.includes(row.row) ? "separate" : "")} onChange={event => decide(row.row, event.target.value)}>
            <option value="">Karar seçin</option>
            <option value="separate">Ayrı gider olarak ekle</option>
            {bills.map(bill => <option key={bill.entityId} value={bill.entityId} disabled={used.has(bill.entityId) && bill.entityId !== matches[row.row]}>{label(bill)}</option>)}
          </select>
        </label>}
      </> : row.duplicates.length > 0 ? <label className="g-check"><input type="checkbox" disabled={busy} checked={keep.includes(row.row)} onChange={event => setKeep(event.target.checked ? [...keep, row.row] : keep.filter(id => id !== row.row))} />Satır {row.row}: benzer kayıt var, yine de ayrı gider olarak ekle</label> : row.errors.length === 0 ? "Hazır" : null}</td>
    </tr>; })}</tbody></table></div>
    <div className="g-actions"><button type="button" className="btn btn-primary" disabled={blocked} onClick={() => confirm({ previewId: preview.previewId, keepCandidateRows: keep, matches: Object.entries(matches).map(([row, entityId]) => ({ row: Number(row), entityId })) })}>İçe aktar</button></div>
  </section>;
}
