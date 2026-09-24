export type RecoveryConfig = { destination: string; key: Uint8Array };
export type BackupEntry = { id: string; createdAt: string; pinned: boolean; kind: "ordinary" | "pre-upgrade" };
export type RecoveryStatus = { status: "recovery"; state: "setup-required" | "pending" | "running" | "ready" | "failed"; lastVerifiedAt: string | null; error?: {code: string; message: string}; backups: BackupEntry[] };
export type RestorePreview = { status: "restore-preview"; token: string; createdAt: string; cutoff: string | null; revisions: number; reports: number };
export type RecoveryResult = RecoveryStatus | RestorePreview | {status: "restored" | "cancelled" | "saved"} | {status: "recovery-failed"; code: string; message: string};
export type RecoveryServiceRequest = {operation: "getRecoveryStatus" | "backupNow"} | {operation: "setupRecovery"; payload: RecoveryConfig} | {operation: "pinBackup"; payload: {backupId: string; pinned: boolean}} | {operation: "prepareRestore"; payload: {backupPath: string; key: Uint8Array}} | {operation: "confirmRestore" | "cancelRestore"; payload: {token: string}};
export const recoveryOperations = ["getRecoveryStatus", "setupRecovery", "backupNow", "pinBackup", "prepareRestore", "confirmRestore", "cancelRestore"];
export function recoveryFailure(code = "RECOVERY_FAILED"): Extract<RecoveryResult,{status:"recovery-failed"}> {
  const messages:Record<string,string>={
    RESTORE_RECOVERY_REQUIRED:"Kurtarma tamamlanamadı; çalışan veri doğrulanamadı. Kurtarma dosyalarını koruyun. Uygulamayı yeniden başlatın; sorun sürerse teknik destek alın.",
    RESTORE_COMMITTED_RESTART_REQUIRED:"Geri yüklenen veriler ve sonuç kaydı kaydedildi; işlem sonlandırılamadı. Dosyaları koruyun ve uygulamayı yeniden başlatın.",
    AUDIT_UNAVAILABLE:"Kurtarma denetim kaydı yazılamadı. Geri yükleme başlatılmadı; yerel diskin erişimini ve boş alanını kontrol edin.",
    RECOVERY_CONFIG_UNAVAILABLE:"Yerel kurtarma ayarları okunamadı. Veriler yükseltilmedi; ayrı saklanan anahtarla kurtarma ayarlarını yeniden oluşturun.",
  };
  return {status:"recovery-failed",code,message: messages[code] ?? (code === "RESTORE_STALE" ? "Önizlemeden sonra kayıtlar değişti. Yedeği yeniden seçip inceleyin." : "Kurtarma işlemi tamamlanamadı. Mevcut kayıtlar korundu; kurtarma anahtarını, yedeği ve hedef diski kontrol edip yeniden deneyin.")};
}
