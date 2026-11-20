import { useId, type CSSProperties } from "react";
import type { MonthProfitHistoryEntry } from "../../source/month-profit";
import { date } from "../format";
import { monthName } from "../pages/month-summary";
import { toNumber } from "./geometry";

type MonthlyTrendProps = {
  title: string;
  history: MonthProfitHistoryEntry[];
  month: string;
  getValue: (row: MonthProfitHistoryEntry) => string | null;
  missingReason: (row: MonthProfitHistoryEntry) => string;
  formatValue: (value: string) => string;
};

/** The service supplies both the exact figures and their periods. Numeric conversions only place the marks. */
export function MonthlyTrend({ title, history, month, getValue, missingReason, formatValue }: MonthlyTrendProps) {
  const id = useId();
  const rows = history.map(row => {
    const value = getValue(row);
    return {
      month: row.month,
      name: monthName(row.month),
      current: row.month === month,
      partial: row.partial,
      period: `${date(row.dataFrom)} – ${date(row.dataUntil)}`,
      text: value === null ? missingReason(row) : formatValue(value),
      amount: toNumber(value),
    };
  });
  const figures = rows.flatMap(row => row.amount === null ? [] : [row.amount]);
  const min = Math.min(0, ...figures);
  const span = Math.max(0, ...figures) - min || 1;
  const position = (value: number) => (value - min) / span * 100;
  const zero = position(0);
  const range = rows.length > 1 ? `${rows[0].name} – ${rows[rows.length - 1].name}` : rows[0]?.name;

  return <section className="card monthly-trend section-wide" aria-labelledby={id}>
    <h2 id={id}>{title}</h2>
    <p className="monthly-trend-period">{range}</p>
    {figures.length > 0 && <p className="monthly-trend-legend" aria-hidden="true">Sıfır çizgisi</p>}
    <ol className="monthly-trend-list" role="list" style={{ "--trend-zero": `${zero}%` } as CSSProperties}>
      {rows.map(row => {
        const end = row.amount === null ? zero : position(row.amount);
        return <li key={row.month} aria-current={row.current ? "date" : undefined}>
          <div className="monthly-trend-month">
            <strong>{row.name}</strong>
            {row.current && <small className="monthly-trend-current">Seçili ay</small>}
            {row.partial && <small>Kısmi ay · {row.period}</small>}
          </div>
          <div className="monthly-trend-track" aria-hidden="true">
            {figures.length > 0 && <span className="monthly-trend-zero" />}
            {row.amount !== null && <span
              className={row.amount === 0 ? "monthly-trend-point" : "monthly-trend-bar"}
              data-negative={row.amount < 0 || undefined}
              style={{ left: `${Math.min(zero, end)}%`, width: `${Math.abs(end - zero)}%` }}
            />}
          </div>
          <span className={row.amount === null ? "monthly-trend-missing" : "monthly-trend-value"}>{row.text}</span>
        </li>;
      })}
    </ol>
    <details>
      <summary>Aylık değerleri göster</summary>
      <table className="monthly-trend-table" aria-labelledby={id}>
        <thead><tr><th scope="col">Ay</th><th scope="col">Dönem kapsamı</th><th scope="col">Sonuç</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.month} aria-current={row.current ? "date" : undefined}>
          <th scope="row">{row.name}{row.current && <small className="monthly-trend-current">Seçili ay</small>}</th>
          <td>{row.period}<small>{row.partial ? "Kısmi ay" : "Tam ay"}</small></td>
          <td>{row.text}</td>
        </tr>)}</tbody>
      </table>
    </details>
  </section>;
}
