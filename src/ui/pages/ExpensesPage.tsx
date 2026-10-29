import type {PageProps} from "../sections";
import {ExpensesWorkspace} from "../ExpensesWorkspace";

/** Giderler: the selected month's totals, the "tamam" confirmation and the month's lines. Tahmini net kâr lives on Bu ay. */
export function ExpensesPage({month,onMonth,active,navigate}:PageProps) {
 // App passes null only while the dataset month is still resolving; reading today's month first would remount later.
 if(!month)return <p role="status">Veriler hazırlanıyor…</p>;
 return <ExpensesWorkspace key={month} active={active} period={month} onPeriod={onMonth} onNetProfit={()=>navigate("month")}/>;
}
