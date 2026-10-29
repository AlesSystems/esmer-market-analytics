import { useEffect, useRef, useState } from "react";
import type { LiveResult, RequestError } from "../../domain/contracts";

export const liveErrors: Record<string, string> = {
  SOURCE_UNAVAILABLE: "Kaynağa ulaşılamadı.",
  SOURCE_REJECTED: "Kaynak okuması reddedildi. Erişim izinlerini ve kaynak yapısını kontrol edin.",
  SOURCE_TOO_LARGE: "Bir aylık veri paket sınırını aşıyor.",
  PERMISSION_DENIED: "Kaynağı okuma izni doğrulanamadı.",
  SOURCE_CHANGED: "Kaynak kimliği değişti. Bağlantı ayarını yeniden inceleyin.",
  INVALID_CANDIDATE: "Kaynak verileri doğrulanamadı.",
  STORAGE_FULL: "Yeni veriler için disk alanı yetersiz.",
  INTERRUPTED: "Kaynak yeniden kontrol edilmeli.",
  REFRESH_TIMEOUT: "Kaynak kontrolü zaman aşımına uğradı.",
  UNSUPPORTED_MAPPING: "Bu kaynağın mali eşlemesi henüz onaylanmadı. Veriler içe aktarılmadı.",
};
const failed = { status: "live-failed", code: "LIVE_UNAVAILABLE", message: "Bağlantı durumu okunamadı. Yerel raporlar kullanılabilir." } as const;

export type LiveStatusResult = Extract<LiveResult, { status: "live" }>;
export type LiveState = "off" | "on" | "checking" | "stale" | "unknown";
export const liveTitles: Record<LiveState, string> = { off: "Bağlantı kapalı", on: "Bağlantı açık", checking: "Kaynak kontrol ediliyor…", stale: "Güncellik doğrulanamadı", unknown: "Durum okunamadı" };
export type LiveConnection = {
  status?: LiveStatusResult;
  outcome?: Exclude<LiveResult, LiveStatusResult> | RequestError;
  state: LiveState;
  busy: boolean;
  run: (action: () => Promise<LiveResult | RequestError>) => Promise<LiveResult | RequestError | undefined>;
};

export function liveState(status: LiveStatusResult | undefined, readable: boolean): LiveState {
  if (!status || !readable) return "unknown";
  return ({ disabled: "off", refreshing: "checking", stale: "stale" } as Record<string, LiveState>)[status.live.phase] ?? "on";
}

export function useLiveConnection(onDatasetChanged: () => void): LiveConnection {
  const [status, setStatus] = useState<LiveStatusResult>();
  const [readable, setReadable] = useState(true);
  const [outcome, setOutcome] = useState<LiveConnection["outcome"]>();
  const [busy, setBusy] = useState(false);
  const dataset = useRef<string | null | undefined>(undefined);
  const onChange = useRef(onDatasetChanged); onChange.current = onDatasetChanged;
  function track(value: LiveStatusResult) {
    if (dataset.current !== undefined && dataset.current !== value.live.lastDatasetId) onChange.current();
    dataset.current = value.live.lastDatasetId;
    setStatus(value); setReadable(true);
  }
  useEffect(() => {
    let mounted = true;
    const refresh = () => window.esmer.getLiveStatus()
      .then(value => { if (!mounted) return; if (value.status === "live") track(value); else setReadable(false); })
      .catch(() => { if (mounted) setReadable(false); });
    void refresh();
    const timer = setInterval(() => { void refresh(); }, 5000);
    return () => { mounted = false; clearInterval(timer); };
  }, []);
  async function run(action: () => Promise<LiveResult | RequestError>) {
    setBusy(true); setOutcome(undefined);
    try {
      const value = await action();
      if (value.status === "live") track(value); else setOutcome(value);
      onChange.current();
      return value;
    } catch { setOutcome(failed); return undefined; }
    finally { setBusy(false); }
  }
  return { status, outcome, state: liveState(status, readable), busy, run };
}
