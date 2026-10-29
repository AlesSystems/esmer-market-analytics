import { stepMonth } from "../month-step";
import { ChevronLeftIcon, ChevronRightIcon } from "../icons";
import { monthName } from "../pages/month-summary";
import type { Coverage } from "../sections";

/** Previous / next month through the draft-guarded `onMonth`. A step that would leave the data range stays visible but aria-disabled; with no range (Giderler, which keeps entering expenses for any month) every month is reachable. */
export function MonthStepper({ month, coverage, onMonth }: { month: string | null; coverage: Coverage | null; onMonth: (month: string) => void }) {
  const previous = month ? stepMonth(month, -1, coverage) : null, next = month ? stepMonth(month, 1, coverage) : null;
  const step = (target: string | null) => { if (target) onMonth(target); };
  return <div className="month-stepper" role="group" aria-label="Dönem">
    <button type="button" className="month-step" aria-label="Önceki ay" title={previous ? monthName(previous) : undefined} aria-disabled={previous === null} onClick={() => step(previous)}><ChevronLeftIcon /></button>
    <span className="month-label" aria-live="polite" data-month={month ?? ""}>{month ? monthName(month) : "Dönem seçiliyor…"}</span>
    <button type="button" className="month-step" aria-label="Sonraki ay" title={next ? monthName(next) : undefined} aria-disabled={next === null} onClick={() => step(next)}><ChevronRightIcon /></button>
  </div>;
}
