import type { MonthProfitView } from "../../source/month-profit";
import { money } from "../format";
import { monthName, monthShort, percentText, wordMoney } from "../pages/month-summary";
import { niceTicks } from "./geometry";

const W = 440, H = 210, L = 58, R = 8, T = 26, B = 30;

/** Gross profit per month. The selected month is the accent bar; a month without a known figure is a hollow stub labelled "Bilinmiyor", never a zero bar. A hidden table repeats the exact values. */
export function MonthBars({ history, month }: { history: MonthProfitView["history"]; month: string }) {
  const values = history.map(row => row.grossProfit === null ? null : Number(row.grossProfit));
  const known = values.filter((value): value is number => value !== null);
  const scale = niceTicks(Math.min(0, ...known), Math.max(0, ...known), 3);
  const y = (value: number) => T + (H - T - B) * (1 - (value - scale.min) / (scale.max - scale.min || 1));
  const slot = (W - L - R) / Math.max(history.length, 3), bar = Math.min(48, slot * .56);
  const base = y(0);
  return <>
    <svg className="month-bars" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Son 6 ayın brüt kârı">
      {scale.ticks.map(tick => <g key={tick}><line className={tick === 0 ? "c-zero" : "c-grid"} x1={L} x2={W - R} y1={y(tick)} y2={y(tick)} /><text className="c-axis c-tick" x={L - 8} y={y(tick) + 4} textAnchor="end">{wordMoney(String(tick)).replace(" ₺", "")}</text></g>)}
      {history.map((row, i) => {
        const value = values[i], x = L + i * slot + (slot - bar) / 2, current = row.month === month, top = value === null ? base - 12 : Math.min(y(value), base);
        return <g key={row.month} data-month={row.month} data-state={value === null ? "unknown" : "value"}>
          <title>{`${monthName(row.month)} · brüt kâr ${row.grossProfit === null ? "bilinmiyor" : money(row.grossProfit)}`}</title>
          {value === null
            ? <rect className="bar is-empty" x={x} y={base - 12} width={bar} height={12} rx={3} />
            : <rect className={`bar${current ? " is-current" : ""}${value < 0 ? " is-neg" : ""}`} x={x} y={top} width={bar} height={Math.max(2, Math.abs(base - y(value)))} rx={3} />}
          <text className="c-val" x={x + bar / 2} y={top - 6} textAnchor="middle">{value === null ? "Bilinmiyor" : wordMoney(row.grossProfit!).replace(" ₺", "")}</text>
          <text className={`c-axis${current ? " is-cur" : ""}`} x={x + bar / 2} y={H - 8} textAnchor="middle">{monthShort(row.month)}</text>
        </g>;
      })}
    </svg>
    <table className="sr-only">
      <caption>Aylara göre satış, brüt kâr ve marj</caption>
      <thead><tr><th scope="col">Ay</th><th scope="col">Satış</th><th scope="col">Brüt kâr</th><th scope="col">Marj</th></tr></thead>
      <tbody>{history.map(row => <tr key={row.month}><th scope="row">{monthName(row.month)}</th><td>{row.sales === null ? "Bilinmiyor" : money(row.sales)}</td><td>{row.grossProfit === null ? "Bilinmiyor" : money(row.grossProfit)}</td><td>{row.marginPct === null ? "Bilinmiyor" : percentText(row.marginPct)}</td></tr>)}</tbody>
    </table>
  </>;
}
