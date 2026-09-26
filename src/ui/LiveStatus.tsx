import { useEffect, useRef, useState } from "react";
import type { LiveResult, RequestError } from "../domain/contracts";
import { Button } from "./components/ui/button";

const errors: Record<string, string> = {
  SOURCE_UNAVAILABLE: "Kaynağa ulaşılamadı.",
  PERMISSION_DENIED: "Kaynağı okuma izni doğrulanamadı.",
  SOURCE_CHANGED: "Kaynak kimliği değişti. Bağlantı ayarını yeniden inceleyin.",
  INVALID_CANDIDATE: "Kaynak verileri doğrulanamadı.",
  STORAGE_FULL: "Yeni veriler için disk alanı yetersiz.",
  INTERRUPTED: "Kaynak yeniden kontrol edilmeli.",
  REFRESH_TIMEOUT: "Kaynak kontrolü zaman aşımına uğradı.",
  UNSUPPORTED_MAPPING: "Bu kaynağın mali eşlemesi henüz onaylanmadı. Veriler içe aktarılmadı.",
};
const failed = {status: "live-failed", code: "LIVE_UNAVAILABLE", message: "Bağlantı durumu okunamadı. Yerel raporlar kullanılabilir."} as const;
const date = (value: string) => new Intl.DateTimeFormat("tr-TR", {dateStyle: "short", timeStyle: "short"}).format(new Date(value));
export function LiveStatus({onChanged}: {onChanged: () => void}) {
  const [result, setResult] = useState<LiveResult | RequestError>();
  const [busy, setBusy] = useState(false);
  const dataset = useRef<string | null | undefined>(undefined);
  const onChange = useRef(onChanged); onChange.current = onChanged;
  function receive(value: LiveResult | RequestError) {
    if (value.status === "live") {
      if (dataset.current !== undefined && dataset.current !== value.live.lastDatasetId) onChange.current();
      dataset.current = value.live.lastDatasetId;
    }
    setResult(value);
  }
  useEffect(() => {
    let mounted = true;
    const refresh = () => window.esmer.getLiveStatus().then(value => {if (mounted) receive(value);}).catch(() => {if (mounted) setResult(failed);});
    void refresh();
    const timer = setInterval(() => {void refresh();}, 5000);
    return () => {mounted = false; clearInterval(timer);};
  }, []);
  async function run(action: () => Promise<LiveResult | RequestError>) {
    setBusy(true);
    try { receive(await action()); onChange.current(); } catch { setResult(failed); }
    finally { setBusy(false); }
  }
  const state = result?.status === "live" ? result : undefined;
  const enabled = !!state && state.live.phase !== "disabled";
  return <section aria-label="İzole test bağlantısı" className="import-outcome">
    <p role="status">{enabled ? state.live.phase === "refreshing" ? "İzole test kaynağı kontrol ediliyor…" : state.live.phase === "stale" ? (state.cutoff ? "Kaynak güncelliği doğrulanamadı. Son geçerli yerel veriler kullanılıyor." : "Kaynak güncelliği doğrulanamadı. Henüz geçerli yerel veri yok.") : "İzole test bağlantısı açık." : "Canlı bağlantı kapalı. Raporlar yerel verileri kullanır."}</p>
    {state?.live.lastSuccessAt && <p>Son başarılı kaynak kontrolü: {date(state.live.lastSuccessAt)}</p>}
    {state?.cutoff && <p>Yerel verilerin kesim tarihi: {new Intl.DateTimeFormat("tr-TR", {timeZone: "UTC"}).format(new Date(state.cutoff))}</p>}
    {state?.live.phase === "stale" && state.live.error && <p role="alert">{errors[state.live.error]}</p>}
    {state?.configurationError && <p role="alert">Bağlantı ayarı kaydedilemedi veya açılamadı. Bağlantı dosyasını yeniden seçin.</p>}
    {state?.live.persistenceError && <p role="alert">Kontrol geçmişi kaydedilemedi. Yeniden açılışta kaynak tekrar doğrulanmalıdır.</p>}
    {result && "message" in result && <p role="alert">{result.message}</p>}
    {result?.status === "busy" && <p role="status">Başka bir işlem sürüyor. Tamamlandığında yeniden deneyin.</p>}
    <details className="data-status"><summary>Bağlantı ayarları</summary><div className="report-actions">
      <Button variant="outline" disabled={busy || state?.live.phase === "refreshing"} onClick={() => void run(() => window.esmer.configureLiveSource())}>Test bağlantısını ayarla</Button>
      {state?.configured && <Button variant="outline" disabled={busy} onClick={() => void run(() => window.esmer.setLiveEnabled({enabled: !enabled}))}>{enabled ? "Bağlantıyı kapat" : "Test bağlantısını aç"}</Button>}
      {enabled && <Button variant="outline" disabled={busy || state.live.phase === "refreshing"} onClick={() => void run(() => window.esmer.refreshLiveSource())}>Kaynağı yeniden kontrol et</Button>}
    </div></details>
  </section>;
}
