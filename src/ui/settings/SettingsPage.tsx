import { useEffect, useRef, useState, type ReactNode } from "react";
import { textSizes, type Availability, type ImportHistoryEntry, type RequestError, type TextSize } from "../../domain/contracts";
import type { RecoveryStatus } from "../../recovery/contracts";
import { date } from "../format";
import { liveErrors, type LiveConnection, type LiveState } from "./live";

export type DataView = "source" | "financial";
type Props = {
  availability?: Availability | RequestError;
  source?: { from: string; to: string };
  view: DataView;
  onView?: (view: DataView) => void;
  live: LiveConnection;
  importing: boolean;
  sqlImporting: boolean;
  onImportPackage: () => void;
  onImportSql: () => void;
  onRecovery: () => void;
  onClose: () => void;
  claimFocus: () => boolean;
};

const count = (value: number) => value.toLocaleString("tr-TR");
const moment = (value: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
const day = (value: string) => Date.parse(`${value.slice(0, 10)}T00:00:00Z`);
const DAY = 86_400_000;
const sizeLabels: Record<TextSize, string> = { normal: "Normal", large: "Büyük", larger: "Çok büyük" };
const liveTitles: Record<LiveState, string> = { off: "Bağlantı kapalı", on: "Bağlantı açık", checking: "Kaynak kontrol ediliyor…", stale: "Güncellik doğrulanamadı", unknown: "Durum okunamadı" };
const importStates: Record<string, string> = { active: "İçe aktarıldı", failed: "Tamamlanamadı", cancelled: "Etkin veri değiştirilmedi" };
const recoveryTitles: Record<RecoveryStatus["state"], string> = { "setup-required": "Kurulum bekliyor", pending: "Yedek sırada", running: "Yedek alınıyor", ready: "Hazır", failed: "Dikkat gerekiyor" };

const badgeLabels: Record<LiveState, string> = { off: "Canlı bağlantı kapalı", on: "Canlı bağlantı açık", checking: "Canlı kaynak kontrol ediliyor…", stale: "Canlı kaynak doğrulanamadı", unknown: "Bağlantı durumu okunamadı" };
export function LiveBadge({ state, onOpen }: { state: LiveState; onOpen: () => void }) {
  return <div aria-live="polite"><button type="button" className="live-badge" data-state={state} onClick={onOpen}><span className="seal" data-seal={state} aria-hidden="true" />{badgeLabels[state]}</button></div>;
}

function Tile({ glaze, name, line, seal, status, className = "", children }: { glaze: string; name: string; line: string; seal: string; status?: ReactNode; className?: string; children: ReactNode }) {
  return <section className={`tile tile-${glaze} ${className}`} data-state={seal} aria-label={name}>
    <header className="tile-band">
      <span className="seal" data-seal={seal} aria-hidden="true" />
      <div><h2>{name}</h2><p>{line}</p></div>
      {status && <span className="tile-status">{status}</span>}
    </header>
    <div className="tile-body">{children}</div>
  </section>;
}

function Coverage({ source, cutoff }: { source?: { from: string; to: string }; cutoff?: string }) {
  const today = day(new Date().toISOString());
  const ends = [source && day(source.to), cutoff && day(cutoff)].filter((value): value is number => typeof value === "number");
  if (!ends.length) return <p className="coverage-empty">Henüz yerel veri yok. Kapsam şeridi ilk içe aktarmadan sonra görünür.</p>;
  const fromCutoff = !source || (cutoff !== undefined && day(cutoff) < day(source.from));
  const start = fromCutoff ? day(cutoff!) : day(source!.from);
  const span = Math.max(DAY, today - start);
  const share = (duration: number) => `${(100 * Math.min(duration, span) / span).toFixed(2)}%`;
  const at = (value: number) => share(value - start);
  const last = Math.max(...ends);
  const gap = Math.max(0, Math.round((today - last) / DAY));
  return <figure className="coverage">
    <p className="coverage-lead">{gap > 0 ? <><strong>{count(gap)} gün</strong> son kayıttan bugüne</> : <strong>Veriler bugüne kadar uzanıyor</strong>}</p>
    <div className="coverage-track" role="img" aria-label={`Yerel veriler ${source ? `${date(source.from)}–${date(source.to)} kaynak kapsamını` : ""}${source && cutoff ? " ve " : ""}${cutoff ? `${date(cutoff)} mali kesimini` : ""} içeriyor; bugüne ${gap} gün var.`}>
      {source && <span className="coverage-source" style={{ left: at(day(source.from)), width: `max(4px, ${share(day(source.to) + DAY - day(source.from))})` }} />}
      {cutoff && <span className="coverage-cutoff" style={{ left: `max(2px, ${at(day(cutoff))})` }} />}
      {gap > 0 && <span className="coverage-gap" style={{ left: at(last + DAY), right: 0 }} />}
    </div>
    <figcaption>
      <span>{fromCutoff ? `Kesim ${date(cutoff!)}` : date(source!.from)}</span>
      <span>Bugün</span>
    </figcaption>
  </figure>;
}

function ImportHistory({ entries, unread }: { entries?: ImportHistoryEntry[]; unread?: string }) {
  if (unread) return <p className="tile-quiet">İçe aktarma geçmişi: {unread}</p>;
  if (!entries?.length) return <p className="tile-quiet">Henüz içe aktarma denemesi yok.</p>;
  return <details className="tile-history"><summary>İçe aktarma geçmişi</summary>
    <p>Son 10 kayıtlı deneme. Açık rapor ayrıca yenilenene kadar sabit kalır.</p>
    <ol className="import-history">{entries.map(item => <li key={item.id} data-state={item.state}>
      <strong>{date(item.createdAt)}</strong>
      <span>{importStates[item.state] ?? "Hazırlanıyor"}{item.cutoff && ` · Veri: ${date(item.cutoff)}`}</span>
      {item.errorCode && <small>{item.errorCode === "INTERRUPTED" ? "İşlem yarıda kaldı." : item.errorCode === "STORAGE_FULL" ? "Disk alanı yetersiz." : "Paket içe aktarılamadı."}</small>}
    </li>)}</ol>
  </details>;
}

function LiveTile({ live, sqlImporting, onImportSql }: { live: LiveConnection; sqlImporting: boolean; onImportSql: () => void }) {
  const state = live.status;
  const busy = live.busy || sqlImporting || live.state === "checking";
  const enabled = live.state === "on" || live.state === "stale" || live.state === "checking";
  const outcome = live.outcome;
  return <Tile glaze="turquoise" name="Canlı bağlantı" line="İzole SQL kopyasını yalnızca okur. Mali veri setini etkinleştirmez." seal={live.state} status={<span role="status">{liveTitles[live.state]}</span>}>
    <dl className="tile-facts">
      <div><dt>Son başarılı kontrol</dt><dd>{state?.live.lastSuccessAt ? moment(state.live.lastSuccessAt) : state ? "Henüz yok" : "Okunamadı"}</dd></div>
      <div><dt>Yerel kesim tarihi</dt><dd>{state?.cutoff ? date(state.cutoff) : state ? "Henüz yok" : "Okunamadı"}</dd></div>
    </dl>
    {live.state === "stale" && <p className="tile-warning">{state?.cutoff ? "Son geçerli yerel veriler kullanılıyor." : "Henüz geçerli yerel veri yok."}</p>}
    {state?.live.phase === "stale" && state.live.error && <p role="alert">{liveErrors[state.live.error]}</p>}
    {state?.configurationError && <p role="alert">Bağlantı ayarı kaydedilemedi veya açılamadı. Bağlantı dosyasını yeniden seçin.</p>}
    {state?.live.persistenceError && <p role="alert">Kontrol geçmişi kaydedilemedi. Yeniden açılışta kaynak tekrar doğrulanmalıdır.</p>}
    {live.state === "unknown" && !outcome && <p role="alert">Bağlantı durumu okunamadı. Yerel raporlar kullanılabilir.</p>}
    {outcome && "message" in outcome && <p role="alert">{outcome.message}</p>}
    {outcome?.status === "busy" && <p role="status">Başka bir işlem sürüyor. Tamamlandığında yeniden deneyin.</p>}
    <div className="tile-actions">
      {!state?.configured && <button type="button" className="tile-action primary" disabled={busy} onClick={onImportSql}>{sqlImporting ? "SQL kaynağı okunuyor…" : "SQL kaynağını içe aktar"}</button>}
      {state?.configured && !enabled && <button type="button" className="tile-action primary" disabled={busy} onClick={() => void live.run(() => window.esmer.setLiveEnabled({ enabled: true }))}>Test bağlantısını aç</button>}
      {enabled && <button type="button" className="tile-action primary" disabled={busy} onClick={() => void live.run(() => window.esmer.refreshLiveSource())}>Kaynağı yeniden kontrol et</button>}
      {enabled && <button type="button" className="tile-action" disabled={live.busy || sqlImporting} onClick={() => void live.run(() => window.esmer.setLiveEnabled({ enabled: false }))}>Bağlantıyı kapat</button>}
      {state?.configured && <button type="button" className="tile-action quiet" disabled={busy} onClick={() => void live.run(() => window.esmer.configureLiveSource())}>Test bağlantısını ayarla</button>}
    </div>
  </Tile>;
}

function BackupTile({ onRecovery }: { onRecovery: () => void }) {
  const [status, setStatus] = useState<RecoveryStatus>();
  useEffect(() => { let active = true; window.esmer.getRecoveryStatus().then(value => { if (active && value.status === "recovery") setStatus(value); }).catch(() => undefined); return () => { active = false; }; }, []);
  const latest = status?.backups[0];
  return <Tile glaze="coral" name="Yedekleme ve kurtarma" line="Şifreli yedekler ayrı bir klasörde, anahtar ayrı bir yerde durur." seal={status?.state ?? "unknown"} status={status && recoveryTitles[status.state]}>
    <p className="tile-quiet">{latest ? `Son yedek: ${moment(latest.createdAt)}` : status?.state === "setup-required" ? "Yedek klasörü ve kurtarma anahtarı henüz seçilmedi." : "Yedek durumu kurtarma ekranında güncellenir."}</p>
    <div className="tile-actions"><button type="button" className="tile-action primary" onClick={onRecovery}>Yedekleme ve kurtarma</button></div>
  </Tile>;
}

function DisplayTile() {
  const [size, setSize] = useState<TextSize>();
  const [error, setError] = useState("");
  const confirmed = useRef<TextSize | undefined>(undefined);
  const latest = useRef(0);
  useEffect(() => { let active = true; window.esmer.getPreferences().then(value => { if (active && value.status === "preferences") { confirmed.current = value.preferences.textSize; setSize(value.preferences.textSize); } }).catch(() => undefined); return () => { active = false; }; }, []);
  async function choose(next: TextSize) {
    const request = ++latest.current;
    setSize(next); setError("");
    let message = "Görünüm tercihi kaydedilemedi. Önceki ayar korunuyor.";
    try {
      const result = await window.esmer.setPreferences({ textSize: next });
      if (result.status === "preferences") confirmed.current = result.preferences.textSize;
      else if ("message" in result) message = result.message;
      if (request !== latest.current) return;
      if (result.status === "preferences") { setSize(result.preferences.textSize); return; }
    } catch { if (request !== latest.current) return; }
    setSize(confirmed.current); setError(message);
  }
  return <Tile glaze="saffron" name="Görünüm" line="Yazı ve düğme boyutu bütün ekranlarda geçerli olur." seal={size ? "ready" : "unknown"}>
    <fieldset className="size-choice" disabled={!size}>
      <legend>Yazı boyutu</legend>
      {(Object.keys(textSizes) as TextSize[]).map(key => <label key={key} data-size={key}>
        <input type="radio" name="text-size" value={key} checked={size === key} onChange={() => void choose(key)} />
        <span aria-hidden="true">Aa</span>{sizeLabels[key]}
      </label>)}
    </fieldset>
    {error && <p role="alert">{error}</p>}
  </Tile>;
}

export function SettingsPage({ availability, source, view, onView, live, importing, sqlImporting, onImportPackage, onImportSql, onRecovery, onClose, claimFocus }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (claimFocus()) heading.current?.focus(); }, [claimFocus]);
  const ready = availability?.status === "ready" ? availability : undefined;
  const dataset = ready?.store === "loaded" ? ready.dataset : undefined;
  const unread = !availability ? "Yükleniyor…" : !ready ? "Okunamadı" : undefined;
  return <main className="settings-page" aria-busy={importing || sqlImporting}>
    <div className="settings-heading">
      <div><h1 ref={heading} tabIndex={-1}>Ayarlar</h1><p>Veri içe aktarma, canlı bağlantı ve uygulama tercihleri.</p></div>
      <button type="button" className="tile-action" onClick={onClose}>Ayarları kapat</button>
    </div>
    <div className="tile-panel">
      <Tile glaze="ink" className="tile-wide" name="Etkin veriler" line="Raporlar bu bilgisayardaki yerel verileri okur." seal={dataset || source ? "ready" : unread ? "unknown" : "empty"}>
        <dl className="tile-facts">
          <div><dt>Mali veri seti</dt><dd>{dataset ? <>Kesim {date(dataset.cutoff)}<small>Paket {date(dataset.extractedAt)} · {count(dataset.counts.documents)} belge · {count(dataset.counts.lines)} satır</small></> : unread ?? "Henüz yok"}</dd></div>
          <div><dt>Kaynak yedeği</dt><dd>{source ? <>{date(source.from)}–{date(source.to)}<small>Kayıt sayıları; mali anlam doğrulanmadı</small></> : unread ?? "Henüz yok"}</dd></div>
        </dl>
        {unread && !source ? <p className="coverage-empty">Yerel veri durumu: {unread}</p> : <Coverage source={source} cutoff={dataset?.cutoff} />}
        {onView && <div className="view-switch" role="group" aria-label="Görüntülenen veri">
          <button type="button" aria-pressed={view === "source"} onClick={() => onView("source")}>Gerçek yedek görünümü</button>
          <button type="button" aria-pressed={view === "financial"} onClick={() => onView("financial")}>Korunan mali veri görünümü</button>
        </div>}
      </Tile>
      <Tile glaze="cobalt" name="Veri içe aktarma" line="Hazırlanmış analiz paketini seçin. Başarısız bir içe aktarma son geçerli verileri değiştirmez." seal={importing ? "checking" : dataset ? "ready" : "empty"}>
        <div className="import-choice">
          <h3>Analiz veri paketi</h3>
          <p>Doğrulanmış .json paketi mali raporları etkinleştirir; ham kaynak paketi yalnızca kayıtları gösterir.</p>
        </div>
        <ImportHistory entries={ready?.recentImports} unread={unread} />
        <div className="tile-actions"><button type="button" className="tile-action primary" disabled={importing || sqlImporting} onClick={onImportPackage}>{importing ? "Veriler içe aktarılıyor…" : "Veri paketi içe aktar"}</button></div>
      </Tile>
      <LiveTile live={live} sqlImporting={sqlImporting} onImportSql={onImportSql} />
      <BackupTile onRecovery={onRecovery} />
      <DisplayTile />
      <Tile glaze="ink" name="Hakkında" line="Tek mağaza, tek bilgisayar için çevrimdışı analiz." seal="ready">
        <dl className="tile-facts">
          <div><dt>Uygulama</dt><dd>Esmer Market Analytics<small>Sürüm {process.env.APP_VERSION}</small></dd></div>
          <div><dt>Para birimi</dt><dd>Türk lirası (TRY)</dd></div>
          <div><dt>Veri konumu</dt><dd>Yalnızca bu bilgisayar<small>Kaynak bağlantısı salt okunurdur</small></dd></div>
        </dl>
      </Tile>
    </div>
  </main>;
}
