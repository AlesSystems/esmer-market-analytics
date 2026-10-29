import type { MonthProfitProduct } from "../../source/month-profit";
import { monthName, monthShort, percentText } from "../pages/month-summary";
import { productName } from "../products/product-rows";
import { niceTicks } from "./geometry";

const W = 384, H = 150, L = 40, R = 14, T = 16, B = 26;
const tick = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

/** Six-month margin line. One series; months without a margin break the line and get no point, never a zero. */
export function MarginLine({ product }: { product: MonthProfitProduct }) {
  const history = product.history;
  const values = history.map(row => row.marginPct === null ? null : Number(row.marginPct));
  const known = values.filter((value): value is number => value !== null);
  if (!known.length) return <p className="chart-empty">Son aylarda marjı hesaplanabilen ay yok.</p>;
  const scale = niceTicks(Math.min(0, ...known), Math.max(0, ...known), 3);
  const x = (i: number) => L + (history.length < 2 ? (W - L - R) / 2 : i * (W - L - R) / (history.length - 1));
  const y = (value: number) => T + (H - T - B) * (1 - (value - scale.min) / (scale.max - scale.min || 1));
  const path = values.reduce<{ d: string; open: boolean }>((acc, v, i) => v === null ? { d: acc.d, open: false } : { d: `${acc.d}${acc.open ? "L" : "M"}${x(i)},${y(v)}`, open: true }, { d: "", open: false }).d;
  return <svg className="margin-line" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`${productName(product)} son altı ay marj`}>
    {scale.ticks.map(t => <g key={t}><line className={t === 0 ? "c-zero" : "c-grid"} x1={L} x2={W - R} y1={y(t)} y2={y(t)} /><text className="c-axis c-tick" x={L - 6} y={y(t) + 4} textAnchor="end">%{tick.format(t)}</text></g>)}
    {path && <path className="c-line" d={path} fill="none" />}
    {history.map((row, i) => {
      const v = values[i], current = i === history.length - 1;
      return <g key={row.month} data-month={row.month} data-state={v === null ? "unknown" : "value"}>
        <title>{`${monthName(row.month)} · marj ${row.marginPct === null ? "bilinmiyor" : percentText(row.marginPct)}`}</title>
        {v !== null && <circle className={`c-dot${v < 0 ? " is-neg" : ""}`} cx={x(i)} cy={y(v)} r={current ? 5 : 4} />}
        <text className={`c-axis${current ? " is-cur" : ""}`} x={x(i)} y={H - 6} textAnchor="middle">{monthShort(row.month)}{v === null ? " —" : ""}</text>
      </g>;
    })}
  </svg>;
}
