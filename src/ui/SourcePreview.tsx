import { useEffect, useState } from "react";
import type { SourcePreviewResult } from "../source/raw-package";
import { Button } from "./components/ui/button";

export function SourcePreview({revision}: {revision: unknown}) {
  const [stream, setStream] = useState<"headers" | "lines">("headers");
  const [offset, setOffset] = useState(0);
  const [result, setResult] = useState<SourcePreviewResult>();
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setResult(undefined); setError("");
    window.esmer.readSourcePreview({stream, offset}).then(value => {
      if (!active) return;
      if (value.status === "source-preview" && offset > 0 && offset >= value.total) { setOffset(0); return; }
      if (value.status === "source-preview" || value.status === "source-preview-empty") setResult(value);
      else setError(value.message);
    }).catch(() => { if (active) setError("Kaynak örneği okunamadı. Yeniden açın."); });
    return () => { active = false; };
  }, [stream, offset, revision]);
  if (error) return <p role="alert">{error}</p>;
  if (!result || result.status === "source-preview-empty") return null;
  const columns = Object.keys(result.rows[0] ?? {});
  return <section className="block source-preview" aria-label="Gerçek kaynak kayıtları">
    <h2>SQL yedeğinden gerçek kayıt örneği</h2>
    <p>Yalıtılmış yedekten alınan ham kayıtlar. Mali eşleme doğrulanmadı; bu kayıtlar satış veya kâr raporlarına katılmaz. Mevcut rapor verileri korunur.</p>
    <p>Kaynak tarih aralığı: {result.metadata.from} – {result.metadata.to} · Hazırlanma: {result.metadata.capturedAt}</p>
    <p>{result.counts.headers} belge kaydı · {result.counts.lines} satır kaydı · Çevrimdışı yerel kopya</p>
    {result.counts.emptyHeaders > 0 && <p role="status">{result.counts.emptyHeaders} belge kaydının satırı yok. Bu kayıtlar ham örnekte korunur.</p>}
    <details><summary>Kaynak izi</summary><p>Kaynak: {result.metadata.lineage}<br />İçe aktarma kimliği: {result.metadata.extractionId}<br />Veritabanı kimliği: {result.metadata.databaseId}<br />Paket özeti: {result.hash}</p></details>
    <label>Kayıt türü <select value={stream} onChange={event => {setStream(event.target.value as "headers" | "lines"); setOffset(0);}}><option value="headers">Belgeler (FIS)</option><option value="lines">Satırlar (FIS_DETAY)</option></select></label>
    <p>Alan adları kaynaktaki adlardır. Tutarlar ve miktarlar kaynak hassasiyetiyle gösterilir; boş alanlar “—” ile belirtilir. Tür ve durum kodları mali yorum içermez.</p>
    <div style={{overflowX: "auto"}}><table><thead><tr>{columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{result.rows.map(row => <tr key={row.ID}>{columns.map(column => <td key={column}>{row[column] ?? "—"}</td>)}</tr>)}</tbody></table></div>
    <p>{result.total === 0 ? "Kayıt yok" : `${offset + 1}–${Math.min(offset + 50, result.total)} / ${result.total}`}</p>
    <Button variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0,offset-50))}>Önceki kaynak kayıtları</Button>
    <Button variant="outline" disabled={offset+50 >= result.total} onClick={() => setOffset(offset+50)}>Sonraki kaynak kayıtları</Button>
  </section>;
}
