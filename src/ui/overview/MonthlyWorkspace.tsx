import { useEffect, useState } from "react";
import type { ReportContext } from "../../reports/contracts";
import type { MonthlyDisplay } from "../../reports/display";
import { MonthlyOverview } from "./MonthlyOverview";
import { ReportVersions } from "../reports/ReportVersions";
export function MonthlyWorkspace({ context, versions, refresh, revision, onSales }: { context: ReportContext; versions: boolean; refresh: () => void; revision: number; onSales?: (categoryId?: string) => void }) {
  const [report, setReport] = useState<MonthlyDisplay>(), [loading, setLoading] = useState(true), [error, setError] = useState(""), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let current = true; setLoading(true); setError("");
    window.esmer.queryMonthly({ context }).then(result => { if (!current) return; if (result.status === "monthly") setReport(result.report); else setError(result.status === "cancelled" ? "Rapor hesaplaması iptal edildi. Önceki rapor korundu." : result.status === "busy" ? "Başka bir işlem sürüyor. Tamamlandığında yeniden deneyin." : result.message); }).catch(() => { if (current) setError("Aylık rapor yüklenemedi. Yeniden deneyin."); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [context, attempt, revision]);
  return <div aria-busy={loading}>{loading && <p role="status">Aylık rapor hesaplanıyor…</p>}{error && <div className="notice warning" role="alert"><span>{error}</span><button onClick={() => setAttempt(value => value + 1)}>Aylık raporu yeniden yükle</button></div>}{report && (versions ? <ReportVersions candidate={report} onAccepted={setReport} /> : <MonthlyOverview report={report} refresh={refresh} onSales={onSales} />)}</div>;
}
