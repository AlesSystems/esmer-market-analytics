import { Button } from "../components/ui/button";
import { useEffect, useState } from "react";
import type { ReportContext } from "../../reports/contracts";
import type { MonthlyDisplay } from "../../reports/display";
import { MonthlyOverview } from "./MonthlyOverview";
import { ReportVersions } from "../reports/ReportVersions";
export function MonthlyWorkspace({ context, versions, refresh, revision, onSales, onExpenses, onPurchasing, onReport, onProduct, active = true, salesOnly = false, initialProductId, onParentBack, onDetailPeriod }: { context: ReportContext; versions: boolean; refresh: () => void; revision: number; onSales?: (categoryId?: string) => void; onExpenses?: () => void; onPurchasing?: () => void; onReport?: () => void; onProduct?: (id: string) => void; active?: boolean; salesOnly?: boolean; onDetailPeriod?: (period:string|null)=>void; onParentBack?: (back: (() => void) | null) => void; initialProductId?: string }) {
  const [report, setReport] = useState<MonthlyDisplay>(), [loading, setLoading] = useState(true), [error, setError] = useState(""), [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!active) return;
    let current = true; setLoading(true); setError("");
    window.esmer.queryMonthly({ context }).then(result => { if (!current) return; if (result.status === "monthly") setReport(result.report); else setError(result.status === "cancelled" ? "Rapor hesaplaması iptal edildi. Önceki rapor korundu." : result.status === "busy" ? "Başka bir işlem sürüyor. Tamamlandığında yeniden deneyin." : result.message); }).catch(() => { if (current) setError("Aylık rapor yüklenemedi. Yeniden deneyin."); }).finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [context, attempt, revision, active]);
  return <div aria-busy={loading}>{loading && <p role="status">Aylık rapor hesaplanıyor…</p>}{error && <div className="notice warning" role="alert"><span>{error}</span><Button variant="outline" onClick={() => setAttempt(value => value + 1)}>Aylık raporu yeniden yükle</Button></div>}{report && report.context.sessionId === context.sessionId && report.context.period === context.period && (versions ? <ReportVersions active={active} refresh={refresh} key={context.sessionId} onDetailPeriod={onDetailPeriod} candidate={report} onAccepted={setReport} /> : <MonthlyOverview active={active} onParentBack={onParentBack} salesOnly={salesOnly} initialProductId={initialProductId} onReport={onReport} onProduct={onProduct} report={report} refresh={refresh} onSales={onSales} onExpenses={onExpenses} onPurchasing={onPurchasing} />)}</div>;
}
