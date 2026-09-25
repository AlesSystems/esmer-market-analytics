import { useEffect, useState } from "react";
import type { RecoveryResult, RecoveryStatus, RestorePreview } from "../../recovery/contracts";

const date = (value: string) => new Intl.DateTimeFormat("tr-TR", {dateStyle: "medium", timeStyle: "short"}).format(new Date(value));
const cutoffDate = (value: string) => new Intl.DateTimeFormat("tr-TR", {timeZone: "UTC"}).format(new Date(`${value}T00:00:00Z`));

export function RecoveryWorkspace({onClose, onRestored, embedded = false}: {embedded?: boolean; onClose: () => void; onRestored: () => void}) {
  const [status, setStatus] = useState<RecoveryStatus>();
  const [preview, setPreview] = useState<RestorePreview>();
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function refresh() {
    try {
      const result = await window.esmer.getRecoveryStatus();
      if (result.status === "recovery") setStatus(result);
      else if ("message" in result) setError(result.message);
    } catch { setError("Yedekleme durumu okunamadı. Yeniden deneyin."); }
  }
  useEffect(() => {
    let active = true, reading = false;
    const tick = async () => { if (!active || reading) return; reading = true; try { await refresh(); } finally { reading = false; } };
    void tick();
    const timer = setInterval(() => void tick(), 2000);
    return () => { active = false; clearInterval(timer); };
  }, []);
  async function run(action: () => Promise<RecoveryResult | {status: "rejected"; message: string}>, success: string, label: string) {
    setBusy(true); setBusyAction(label); setError(""); setMessage("");
    try {
      const result = await action();
      if (result.status === "restore-preview") setPreview(result);
      else if (result.status === "recovery-failed" || result.status === "rejected") setError(result.message);
      else if (result.status !== "cancelled") setMessage(success);
      if (result.status === "restored") { setPreview(undefined); onRestored(); }
      else await refresh();
    } catch { setError("İşlem tamamlanamadı. Uygulamayı yeniden açıp tekrar deneyin."); }
    finally { setBusy(false); setBusyAction(""); }
  }
  return <div className={embedded ? "recovery-content" : "sales-app"}>{!embedded && <header className="app-header"><button className="brand" onClick={onClose}>ESMER <span>MARKET</span></button><span className="offline">Canlı bağlantı kapalı</span></header>}
    <main className="recovery-workspace"><nav aria-label="Kurtarma gezinmesi"><button onClick={onClose}>Ana sayfaya dön</button></nav>
      <h1>Yedekleme ve kurtarma</h1><p>Şifreli yedekleri ve kurtarma anahtarını bu bilgisayardan ayrı saklayın. Geri yükleme için ikisi de gereklidir.</p>
      {status?.error && <p role="alert">{status.error.message}</p>}
      {error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}
      <section className="recovery-section" aria-label="Yedekleme durumu"><h2>Yedekleme</h2>
        <p>{status?.state === "setup-required" ? "Yedekleme henüz kurulmadı." : status?.state === "failed" ? "Yedekleme başarısız oldu. Hedefi ve anahtarı kontrol edin." : status?.state === "running" ? "Yedek hazırlanıyor…" : status?.state === "pending" ? "Yedek bekliyor." : status?.state === "ready" ? "Yedekleme hazır." : "Durum okunuyor…"}</p>
        {status?.lastVerifiedAt && <p>Son doğrulanan yedek: {date(status.lastVerifiedAt)}</p>}
        <p>Son beş doğrulanan yedek, sabitlenen yedekler ve güncelleme öncesi kopyalar korunur. Saatler bu bilgisayarın yerel saatindedir.</p>
        <div className="recovery-actions"><button disabled={busy} onClick={() => void run(() => window.esmer.setupRecovery(), "Kurtarma anahtarı doğrulandı ve yedekleme kuruldu.", "Yedekleme kuruluyor…")}>{busyAction === "Yedekleme kuruluyor…" ? busyAction : "Yedeklemeyi kur"}</button><button disabled={busy || status?.state === "setup-required"} onClick={() => void run(() => window.esmer.backupNow(), "Yedekleme isteği kaydedildi.", "Yedek isteniyor…")}>{busyAction === "Yedek isteniyor…" ? busyAction : "Şimdi yedekle / yeniden dene"}</button></div>
        {!!status?.backups.length && <><h3>Doğrulanan yedekler</h3><ul className="recovery-backups">{status.backups.map(item => <li key={item.id}><span>{date(item.createdAt)}{item.kind === "pre-upgrade" ? " · Güncelleme öncesi" : ""}</span><button disabled={busy} onClick={() => void run(() => window.esmer.pinBackup({backupId: item.id, pinned: !item.pinned}), item.pinned ? "Yedek sabitlemesi kaldırıldı." : "Yedek sabitlendi.", "Sabitleme güncelleniyor…")}>{item.pinned ? "Sabitlemeyi kaldır" : "Sabitle"}</button></li>)}</ul></>}
      </section>
      <section className="recovery-section" aria-label="Geri yükleme"><h2>Yedekten geri yükle</h2><p>Yedek ve ayrı saklanan kurtarma anahtarını seçin. Önce içerik doğrulanır; mevcut kayıtlar onaydan önce değişmez.</p><button disabled={busy} onClick={() => void run(() => window.esmer.prepareRestore(), "Yedek doğrulandı.", "Yedek inceleniyor…")}>{busyAction === "Yedek inceleniyor…" ? busyAction : "Yedek ve anahtar seç"}</button>
        {preview && <div className="recovery-preview"><h3>Geri yükleme önizlemesi</h3><p>Yedek tarihi (yerel saat): {date(preview.createdAt)} · Veri kesim tarihi: {preview.cutoff ? cutoffDate(preview.cutoff) : "Bilinmiyor"}</p><p>{preview.revisions.toLocaleString("tr-TR")} kayıt revizyonu · {preview.reports.toLocaleString("tr-TR")} rapor</p><p>Onaylarsanız mevcut çalışma verileri bu sürümle değişir. Mevcut verilerin korunmuş kopyası saklanır.</p><div className="recovery-actions"><button disabled={busy} onClick={() => void run(() => window.esmer.confirmRestore({token: preview.token}), "Yedek geri yüklendi.", "Geri yükleniyor…")}>{busyAction === "Geri yükleniyor…" ? busyAction : "Geri yüklemeyi onayla"}</button><button disabled={busy} onClick={() => { void run(() => window.esmer.cancelRestore({token: preview.token}), "", "İptal ediliyor…"); setPreview(undefined); }}>Vazgeç</button></div></div>}
      </section>
    </main></div>;
}
