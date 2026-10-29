import { date } from "../format";
import { OverlayPage } from "../OverlayPage";
import { liveErrors, liveTitles, type LiveConnection } from "./live";

const moment = (value: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));

/** The isolated test connection: off by default and outside v1. Reads the source only. */
export function LivePanel({ live, hasData, cutoff, sqlImporting, onImportSql, onClose }: { live: LiveConnection; hasData: boolean; cutoff?: string; sqlImporting: boolean; onImportSql: () => void; onClose: () => void }) {
  const state = live.status;
  const busy = live.busy || sqlImporting || live.state === "checking";
  const enabled = live.state === "on" || live.state === "stale" || live.state === "checking";
  const outcome = live.outcome;
  return <OverlayPage title="Canlı bağlantı" onClose={onClose}>
    <section className="panel" aria-label="Canlı bağlantı" data-state={live.state} aria-busy={busy}>
      <p>Kaynağı yalnızca okur. Bağlantı varsayılan olarak kapalıdır; yerel veriler bağlantı olmadan kullanılır.</p>
      <p className="panel-status" role="status">{liveTitles[live.state]}</p>
      <dl className="facts">
        <div><dt>Son yenileme</dt><dd>{busy ? "Yenileniyor…" : state?.live.lastSuccessAt ? moment(state.live.lastSuccessAt) : state ? "Henüz yok" : "Okunamadı"}</dd></div>
        <div><dt>Son geçerli veri</dt><dd>{cutoff ? date(cutoff) : state ? "Henüz yok" : "Okunamadı"}</dd></div>
      </dl>
      {live.state === "stale" && <p className="panel-warning">{hasData ? "Son geçerli yerel veriler kullanılıyor." : "Henüz geçerli yerel veri yok."}</p>}
      {state?.live.phase === "stale" && state.live.error && <p role="alert">{liveErrors[state.live.error]}</p>}
      {state?.live.persistenceError && <p role="alert">Kontrol geçmişi kaydedilemedi. Yeniden açılışta kaynak tekrar doğrulanmalıdır.</p>}
      {state?.configurationError && <p role="alert">Bağlantı ayarı kaydedilemedi veya açılamadı. Bağlantıyı yeniden kurun.</p>}
      {live.state === "unknown" && !outcome && <p role="alert">Bağlantı durumu okunamadı. Yerel raporlar kullanılabilir.</p>}
      {outcome && "message" in outcome && <p role="alert">{outcome.message}</p>}
      {outcome?.status === "busy" && <p role="status">Başka bir işlem sürüyor. Tamamlandığında yeniden deneyin.</p>}
      <div className="panel-actions">
        {!state?.configured && <button type="button" className="btn btn-primary" disabled={busy} onClick={onImportSql}>{sqlImporting ? "SQL kaynağı okunuyor…" : "SQL kaynağını içe aktar"}</button>}
        {state?.configured && !enabled && <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void live.run(() => window.esmer.setLiveEnabled({ enabled: true }))}>Bağlan</button>}
        {enabled && <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void live.run(() => window.esmer.refreshLiveSource())}>Şimdi yenile</button>}
      </div>
      {state?.configured && <details className="panel-more">
        <summary>Bağlantı ayarı</summary>
        <div className="panel-actions">
          {enabled && <button type="button" className="btn btn-secondary" disabled={live.busy || sqlImporting} onClick={() => void live.run(() => window.esmer.setLiveEnabled({ enabled: false }))}>Bağlantıyı kapat</button>}
          <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void live.run(() => window.esmer.configureLiveSource())}>Bağlantıyı değiştir</button>
        </div>
      </details>}
    </section>
  </OverlayPage>;
}
