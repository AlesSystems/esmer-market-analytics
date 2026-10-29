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
    <button type="button" className="btn btn-secondary btn-top" disabled={!view || exporting || (loading && !view)} onClick={() => void exportMonth()}>
      <DownloadIcon /><span className="hide-narrow">{exporting ? "Excel hazırlanıyor…" : "Excel’e aktar"}</span>
    </button>
    {message && <p className="toast" role="status"><span>{message}</span><button type="button" className="toast-close" onClick={() => setMessage("")}>Kapat</button></p>}
  </>;
}
