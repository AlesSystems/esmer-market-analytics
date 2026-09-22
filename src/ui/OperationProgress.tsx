import { useEffect, useState } from "react";
import type { DesktopApi } from "../domain/contracts";
const phases: Record<string, string> = { reading: "Paket okunuyor", parsing: "Paket doğrulanıyor", persistence: "Kayıtlar hazırlanıyor", validation: "Kayıtlar doğrulanıyor", summary: "Özet hazırlanıyor", activation: "Veri sürümü etkinleştiriliyor", sales: "Satışlar hesaplanıyor", purchasing: "Maliyet ve alışlar hesaplanıyor", operating: "Giderler ve faaliyet sonucu hesaplanıyor", evidence: "Rapor kanıtları hazırlanıyor", report: "Rapor hazırlanıyor" };
export function OperationProgress() {
  const [operation, setOperation] = useState<Awaited<ReturnType<DesktopApi["getOperationStatus"]>>>(), [error, setError] = useState("");
  useEffect(() => { let active = true; let timer: ReturnType<typeof setTimeout>; async function poll() { try { const value = await window.esmer.getOperationStatus(); if (active) setOperation(value); } catch {  } finally { if (active) timer = setTimeout(() => void poll(), 300); } } void poll(); return () => { active = false; clearTimeout(timer); }; }, []);
  if (operation?.status !== "operation") return null;
  async function cancel() { if (operation?.status !== "operation") return; try { await window.esmer.cancelOperation({ id: operation.id }); setError(""); } catch { setError("İptal isteği iletilemedi. Yeniden deneyin."); } }
  return <div className="operation-progress" aria-label="Arka plan işlemi"><span role="status">{operation.cancelling ? "İptal isteği alındı…" : phases[operation.phase] ?? "Veriler işleniyor…"}</span><progress max={operation.total > 0 ? operation.total : undefined} value={operation.total > 0 ? operation.completed : undefined} aria-label="İşlem ilerlemesi" /><button disabled={operation.cancelling} onClick={() => void cancel()}>İşlemi iptal et</button>{error && <span role="alert">{error}</span>}</div>;
}
