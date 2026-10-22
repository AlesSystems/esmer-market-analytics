import type {PageProps} from "../sections";
import {ExpensesWorkspace} from "../ExpensesWorkspace";

/** Giderler: the selected month's expenses, the "tamam" confirmation and the month's estimated net profit. */
export function ExpensesPage({month,onMonth,active,navigate}:PageProps) {
 const period=month??new Date().toISOString().slice(0,7);
 return <ExpensesWorkspace key={period} active={active} visible={active} period={period} onPeriod={onMonth} onMonthPage={()=>navigate("month")}/>;
}
