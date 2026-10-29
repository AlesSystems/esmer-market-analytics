import { useEffect, useRef, useState } from "react";
import { DownloadIcon } from "../icons";
import { useMonthProfitContext } from "../pages/month-profit-data";

/** Exports the month on screen, pinned to the source its numbers came from. The outcome shows as a status line under the bar. */
export function ExcelExport({ month, revision }: { month: string | null; revision: unknown }) {
  const { read, loading, retry } = useMonthProfitContext();
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState("");
  const sequence = useRef(0);
  useEffect(() => { sequence.current++; setMessage(""); setExporting(false); }, [month, revision]);
  const view = read && month && read.month === month && "result" in read && read.result.status === "month-profit" ? read.result.view : null;
  const result = read && "result" in read ? read.result : null;
  // Why the button cannot be used right now; it stays focusable and says so instead of vanishing from the tab order.
  const why = !month ? "Dönem seçiliyor." : exporting ? null : !read ? (loading ? "Bu ayın rakamları yükleniyor." : null)
    : "failed" in read ? "Bu ayın rakamları okunamadı."
    : result?.status === "source-unavailable" ? (result.code === "ESTIMATE_UNAVAILABLE" ? "Önce maliyet bilgisi içeren bir veri paketi içe aktarın." : result.code === "MONTH_NOT_COVERED" ? "Bu ay veri paketinin dışında." : "Bu ayın rakamları okunamadı.") : null;
  const blocked = !view || exporting;
  async function exportMonth() {
    if (!month || !view) return;
    const id = ++sequence.current; setExporting(true); setMessage("");
    try {
      const value = await window.esmer.exportMonthProfit({ month, hash: view.source.hash });
      if (id !== sequence.current) return;
      if (value.status === "saved") setMessage("Doğrulanmamış tahmin Excel dosyasına kaydedildi.");
      else if (value.status !== "cancelled") { setMessage(value.message); if (value.status === "source-unavailable" && value.code === "SOURCE_CHANGED") retry(); }
    } catch { if (id === sequence.current) setMessage("Excel dosyası kaydedilemedi."); }
    finally { if (id === sequence.current) setExporting(false); }
  }
  return <>
    <button type="button" className="btn btn-secondary btn-top" aria-disabled={blocked} aria-describedby={blocked && why ? "export-why" : undefined} title={blocked && why ? why : undefined} onClick={() => { if (!blocked) void exportMonth(); }}>
      <DownloadIcon /><span className="hide-narrow">{exporting ? "Excel hazırlanıyor…" : "Excel’e aktar"}</span>
    </button>
    {blocked && why && <span id="export-why" className="sr-only">{why}</span>}
    {message && <p className="toast" role="status"><span>{message}</span><button type="button" className="toast-close" onClick={() => setMessage("")}>Kapat</button></p>}
  </>;
}
