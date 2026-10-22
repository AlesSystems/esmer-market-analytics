import type {PageProps} from "../sections";
import {ExpensesWorkspace} from "../ExpensesWorkspace";

/** Giderler: the existing expense workspace (import, entry, confirmation, draft protection) for the selected month. */
export function ExpensesPage({month,onMonth,active}:PageProps) {
 const period=month??new Date().toISOString().slice(0,7);
 return <ExpensesWorkspace key={period} active={active} visible={active} period={period} onPeriod={onMonth}/>;
}
