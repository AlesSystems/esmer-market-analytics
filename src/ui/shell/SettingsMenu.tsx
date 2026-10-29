import { useCallback, useContext, useEffect, useRef, useState } from "react";
import type { RecoveryStatus } from "../../recovery/contracts";
import { textSizes, type Availability, type RequestError, type TextSize } from "../../domain/contracts";
import { ChevronLeftIcon, ChevronRightIcon, DatabaseIcon, GearIcon, InfoIcon, ShieldIcon, TextSizeIcon, DownloadIcon, FileIcon } from "../icons";
import { date } from "../format";
import { limitations } from "../settings/limitations-data";
import type { Limitation } from "../settings/limitations";
import { liveTitles, type LiveState } from "../settings/live";
import type { Coverage } from "../sections";
import { AppFrame } from "../frame";
import { useDismiss } from "../use-dismiss";

type Resolution = { status: "pending" | "resolved" } | { status: "failed"; message: string };
type Props = {
  availability?: Availability | RequestError;
  coverage: Coverage | null;
  resolution: Resolution;
  liveState: LiveState;
  /** The connection is switched on but stale or unreadable. */
  liveAttention: boolean;
  importing: boolean;
  sqlImporting: boolean;
  documentsEnabled: boolean;
  onImportPackage: () => void;
  onRecovery: () => void;
  onLive: () => void;
  onDocuments: () => void;
};

const moment = (value: string) => new Intl.DateTimeFormat("tr-TR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
const backupTitles: Record<RecoveryStatus["state"], string> = { "setup-required": "Yedekleme henüz kurulmadı", pending: "Yedek sırada", running: "Yedek alınıyor", ready: "Hazır", failed: "Dikkat gerekiyor" };
const sizeLabels: Record<TextSize, string> = { normal: "Normal", large: "Büyük", larger: "Çok büyük" };

function TextSizeControl() {
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
  return <li className="menu-size">
    <fieldset className="size-choice" disabled={!size}>
      <legend><TextSizeIcon />Yazı boyutu</legend>
      <div className="segmented">{(Object.keys(textSizes) as TextSize[]).map(key => <label key={key}><input type="radio" name="text-size" value={key} checked={size === key} onChange={() => void choose(key)} /><span>{sizeLabels[key]}</span></label>)}</div>
    </fieldset>
    {error && <p role="alert">{error}</p>}
  </li>;
}

function About({ coverage, availability, onBack }: { coverage: Coverage | null; availability?: Availability | RequestError; onBack: () => void }) {
  const [rows, setRows] = useState<Limitation[]>();
  const [failed, setFailed] = useState(false);
  useEffect(() => { try { setRows(limitations()); } catch { setFailed(true); } }, []);
  const dataset = availability?.status === "ready" && availability.store === "loaded" ? availability.dataset : undefined;
  const cutoff = coverage?.last ?? dataset?.cutoff;
  return <>
    <button type="button" className="menu-back" data-autofocus onClick={onBack}><ChevronLeftIcon />Hakkında ve bilinen sınırlar</button>
    <dl className="about-facts">
      <div><dt>Sürüm</dt><dd>{process.env.APP_VERSION}</dd></div>
      <div><dt>Veri paketi</dt><dd>{coverage ? `${date(coverage.from)}–${date(coverage.to)}` : "Henüz yok"}</dd></div>
      <div><dt>Veri sonu</dt><dd>{cutoff ? date(cutoff) : "Henüz yok"}</dd></div>
    </dl>
    {failed ? <p role="alert">Sınırlar listesi okunamadı.</p> : <ul id="limitations" className="limitations" tabIndex={0} role="region" aria-label="Bilinen sınırlar">{rows?.map((row, index) => <li key={index} data-status={row.status}><span>{row.status}</span>{row.limit}</li>)}</ul>}
  </>;
}

/** The gear: a non-modal popover with the app's few settings. Escape, a press outside or leaving it closes it; Escape returns focus to the gear. */
export function SettingsMenu({ availability, coverage, resolution, liveState, liveAttention, importing, sqlImporting, documentsEnabled, onImportPackage, onRecovery, onLive, onDocuments }: Props) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"main" | "about">("main");
  const [backup, setBackup] = useState<RecoveryStatus>();
  const frameView = useContext(AppFrame)?.view;
  const box = useRef<HTMLDivElement>(null), gear = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null), aboutItem = useRef<HTMLButtonElement>(null), fromAbout = useRef(false);
  const close = useCallback((viaKeyboard: boolean) => { setOpen(false); setView("main"); if (viaKeyboard) gear.current?.focus(); }, []);
  useDismiss(box, open, close);
  // The backup state also marks the gear, so it is read at start, whenever the menu opens or a full-page view closes, and once a minute.
  useEffect(() => {
    let active = true;
    const read = () => window.esmer.getRecoveryStatus().then(value => { if (active && value.status === "recovery") setBackup(value); }).catch(() => undefined);
    void read();
    const timer = setInterval(() => { void read(); }, 60_000);
    return () => { active = false; clearInterval(timer); };
  }, [open, frameView]);
  useEffect(() => {
    if (!open) return;
    if (view === "main" && fromAbout.current) { fromAbout.current = false; aboutItem.current?.focus(); return; }
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
  }, [open, view]);
  const run = (action: () => void) => () => { close(false); action(); };
  const ready = availability?.status === "ready" ? availability : undefined;
  const dataset = ready?.store === "loaded" ? ready.dataset : undefined;
  const cutoff = coverage?.last ?? dataset?.cutoff;
  const packageLine = resolution.status === "pending" ? "Kaynak durumu kontrol ediliyor…" : resolution.status === "failed" ? resolution.message : cutoff ? `Şu anki veri sonu: ${date(cutoff)}` : "Henüz veri paketi yok";
  const latest = backup?.backups[0];
  const lastBackup = latest ? `Son yedek: ${moment(latest.createdAt)}` : "Henüz yedek yok";
  const backupLine = !backup ? "Durum okunuyor…" : backup.state === "ready" ? lastBackup : backup.state === "setup-required" ? backupTitles["setup-required"] : latest ? `${backupTitles[backup.state]} · ${lastBackup}` : backupTitles[backup.state];
  const backupAttention = backup?.state === "failed";
  const attention = backupAttention || liveAttention;
  const gearName = attention ? "Ayarlar, dikkat gerekiyor" : "Ayarlar";
  return <div className="gear-wrap" ref={box}>
    <button ref={gear} type="button" className="icon-btn settings-entry" aria-label={gearName} title={gearName} aria-haspopup="dialog" aria-expanded={open} aria-controls={open ? "settings-menu" : undefined} onClick={() => open ? close(false) : setOpen(true)}><GearIcon />{attention && <span className="gear-dot" aria-hidden="true" />}</button>
    {open && <div className="menu" id="settings-menu" role="dialog" aria-label="Ayarlar" ref={panel}>
      {view === "about" ? <About coverage={coverage} availability={availability} onBack={() => { fromAbout.current = true; setView("main"); }} /> : <ul className="menu-list">
        <li><button type="button" className="menu-item" data-autofocus disabled={importing || sqlImporting} onClick={run(onImportPackage)}><DownloadIcon /><span>{importing ? "Veriler içe aktarılıyor…" : "Veri paketi içe aktar"}<small role={resolution.status === "failed" ? "alert" : undefined}>{packageLine}</small></span></button></li>
        <li><button type="button" className="menu-item" onClick={run(onRecovery)}><ShieldIcon /><span>Yedekle / Geri yükle<small className={backupAttention ? "menu-warn" : undefined}>{backupLine}</small></span><ChevronRightIcon className="menu-go" /></button></li>
        <TextSizeControl />
        <li><button type="button" className="menu-item" onClick={run(onLive)}><DatabaseIcon /><span>Canlı bağlantı<small className={liveAttention ? "menu-warn" : undefined}>{liveTitles[liveState]}</small></span><ChevronRightIcon className="menu-go" /></button></li>
        <li><button type="button" className="menu-item" disabled={!documentsEnabled} onClick={run(onDocuments)}><FileIcon /><span>Kaynak belgeler<small>Veri paketindeki kayıtlı belgeler</small></span><ChevronRightIcon className="menu-go" /></button></li>
        <li><button type="button" className="menu-item" ref={aboutItem} onClick={() => setView("about")}><InfoIcon /><span>Hakkında ve bilinen sınırlar</span><ChevronRightIcon className="menu-go" /></button></li>
      </ul>}
    </div>}
  </div>;
}
