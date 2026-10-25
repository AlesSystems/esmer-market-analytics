import { useEffect, useRef, useState, type ReactNode } from "react";
import { textSizes, type Availability, type RequestError, type TextSize } from "../../domain/contracts";
import { date } from "../format";
import { liveErrors, type LiveConnection, type LiveState } from "./live";
import { limitations } from "./limitations-data";

type Props = {
  availability?: Availability | RequestError;
  source?: { from: string; to: string };
  sourceResolution?: { status: "pending" | "resolved" } | { status: "failed"; message: string };
  live: LiveConnection;
  importing: boolean;
  sqlImporting: boolean;
  onImportPackage: () => void;
  onImportSql: () => void;
  onRecovery: () => void;
  onClose: () => void;
  claimFocus: () => boolean;
};

const moment = (value: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
const sizeLabels: Record<TextSize, string> = { normal: "Normal", large: "Büyük", larger: "Çok büyük" };
const liveTitles: Record<LiveState, string> = { off: "Bağlantı kapalı", on: "Bağlantı açık", checking: "Kaynak kontrol ediliyor…", stale: "Güncellik doğrulanamadı", unknown: "Durum okunamadı" };
const importStates: Record<string, string> = { active: "İçe aktarıldı", failed: "Tamamlanamadı", cancelled: "Etkin veri değiştirilmedi" };

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

function ImportTile({ availability, source, importing, sqlImporting, onImportPackage }: { availability?: Availability | RequestError; source?: { from: string; to: string }; importing: boolean; sqlImporting: boolean; onImportPackage: () => void }) {
  const ready = availability?.status === "ready" ? availability : undefined;
  const dataset = ready?.store === "loaded" ? ready.dataset : undefined;
  const last = ready?.recentImports?.[0];
  const range = source ? `${date(source.from)}–${date(source.to)}` : dataset ? `Kesim ${date(dataset.cutoff)}` : !availability ? "Yükleniyor…" : ready ? "Henüz yok" : "Okunamadı";
  const result = !ready ? "—" : last ? `${importStates[last.state] ?? "Hazırlanıyor"} · ${date(last.createdAt)}` : "Henüz içe aktarma yok";
  return <Tile glaze="cobalt" name="Veri paketi" line="Başarısız içe aktarma mevcut verileri korur." seal={importing ? "checking" : dataset || source ? "ready" : "empty"}>
    <dl className="tile-facts">
      <div><dt>Etkin aylar</dt><dd>{range}</dd></div>
      <div><dt>Son içe aktarma</dt><dd>{result}</dd></div>
    </dl>
    <div className="tile-actions"><button type="button" className="tile-action primary" disabled={importing || sqlImporting} onClick={onImportPackage}>{importing ? "Veriler içe aktarılıyor…" : "Veri paketi içe aktar"}</button></div>
  </Tile>;
}

function LiveTile({ live, hasData, sqlImporting, onImportSql }: { live: LiveConnection; hasData: boolean; sqlImporting: boolean; onImportSql: () => void }) {
  const state = live.status;
  const busy = live.busy || sqlImporting || live.state === "checking";
  const enabled = live.state === "on" || live.state === "stale" || live.state === "checking";
  const outcome = live.outcome;
  return <Tile glaze="turquoise" name="Canlı bağlantı" line="Kaynağı yalnızca okur." seal={live.state} status={<span role="status">{liveTitles[live.state]}</span>}>
    <dl className="tile-facts">
      <div><dt>Son yenileme</dt><dd>{state?.live.lastSuccessAt ? moment(state.live.lastSuccessAt) : state ? "Henüz yok" : "Okunamadı"}</dd></div>
    </dl>
    {live.state === "stale" && <p className="tile-warning">{hasData ? "Son geçerli yerel veriler kullanılıyor." : "Henüz geçerli yerel veri yok."}</p>}
    {state?.live.phase === "stale" && state.live.error && <p role="alert">{liveErrors[state.live.error]}</p>}
    {state?.configurationError && <p role="alert">Bağlantı ayarı kaydedilemedi veya açılamadı. Bağlantıyı yeniden kurun.</p>}
    {live.state === "unknown" && !outcome && <p role="alert">Bağlantı durumu okunamadı. Yerel raporlar kullanılabilir.</p>}
    {outcome && "message" in outcome && <p role="alert">{outcome.message}</p>}
    {outcome?.status === "busy" && <p role="status">Başka bir işlem sürüyor. Tamamlandığında yeniden deneyin.</p>}
    <div className="tile-actions">
      {!state?.configured && <button type="button" className="tile-action primary" disabled={busy} onClick={onImportSql}>{sqlImporting ? "SQL kaynağı okunuyor…" : "SQL kaynağını içe aktar"}</button>}
      {state?.configured && !enabled && <button type="button" className="tile-action primary" disabled={busy} onClick={() => void live.run(() => window.esmer.setLiveEnabled({ enabled: true }))}>Bağlan</button>}
      {enabled && <button type="button" className="tile-action primary" disabled={busy} onClick={() => void live.run(() => window.esmer.refreshLiveSource())}>Şimdi yenile</button>}
    </div>
  </Tile>;
}

function BackupTile({ onRecovery }: { onRecovery: () => void }) {
  return <Tile glaze="coral" name="Yedekleme ve geri yükleme" line="Şifreli yedek alın veya bir yedeği geri yükleyin." seal="ready">
    <div className="tile-actions"><button type="button" className="tile-action primary" onClick={onRecovery}>Yedekleme ve kurtarma</button></div>
  </Tile>;
}

function AboutTile() {
  const [open, setOpen] = useState(false);
  const rows = limitations();
  return <Tile glaze="ink" name="Hakkında" line={`Esmer Market Analytics · Sürüm ${process.env.APP_VERSION}`} seal="ready">
    <div className="tile-actions"><button type="button" className="tile-action" aria-expanded={open} aria-controls="limitations" onClick={() => setOpen(value => !value)}>Bilinen sınırlar</button></div>
    {open && <ul id="limitations" className="limitations">{rows.map((row, index) => <li key={index} data-status={row.status}><span>{row.status}</span>{row.limit}</li>)}</ul>}
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
  return <Tile glaze="saffron" name="Görünüm" line="Tüm ekranlar için yazı boyutu." seal={size ? "ready" : "unknown"}>
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

export function SettingsPage({ availability, source, live, importing, sqlImporting, onImportPackage, onImportSql, onRecovery, onClose, claimFocus }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { if (claimFocus()) heading.current?.focus(); }, [claimFocus]);
  return <main className="settings-page" aria-busy={importing || sqlImporting}>
    <div className="settings-heading">
      <div><h1 ref={heading} tabIndex={-1}>Ayarlar</h1></div>
      <button type="button" className="tile-action" onClick={onClose}>Ayarları kapat</button>
    </div>
    <div className="tile-panel">
      <ImportTile availability={availability} source={source} importing={importing} sqlImporting={sqlImporting} onImportPackage={onImportPackage} />
      <BackupTile onRecovery={onRecovery} />
      <DisplayTile />
      <LiveTile live={live} hasData={!!source || (availability?.status === "ready" && availability.store === "loaded")} sqlImporting={sqlImporting} onImportSql={onImportSql} />
      <AboutTile />
    </div>
  </main>;
}
