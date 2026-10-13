import { useEffect, useId, useRef, useState, type FocusEvent, type KeyboardEvent, type PointerEvent } from "react";
import { columnAt, dailyLayout, describeDay, NEGATIVE_KEY, OUT_OF_RANGE, roundedBarPath, UNKNOWN, type DailyDay, type DailySeries, type Mark } from "./geometry";
import { Swatch, type ChartTable } from "./ChartFrame";
import { date } from "../format";

export type { DailyDay, DailySeries };
export type DailyBarsProps = {
  /** Calendar month as "YYYY-MM". Every day of it gets a column; days not in `days` are out of range. */
  period: string;
  days: DailyDay[];
  series: DailySeries[];
  /** Exact display of a decimal string, e.g. money() from ../format. */
  formatValue: (value: string) => string;
  /** Label of the below-baseline `negative` bar. Default "İade". */
  negativeLabel?: string;
  /** Replaces the generated one-line summary used as the plot's aria-label. */
  ariaLabel?: string;
  plotHeight?: number;
  /** Axis tick labels; defaults to compact TRY. Pass a count formatter for non-money series. */
  formatTick?: (value: number) => string;
  empty?: string;
};

const FALLBACK_WIDTH = 720;
const monthName = new Intl.DateTimeFormat("tr-TR", { timeZone: "UTC", month: "long", year: "numeric" });

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => { const next = Math.floor(node.getBoundingClientRect().width); if (next > 0) setWidth(next); };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

/** Table twin for ChartFrame: one row per day with every series plus the negative bar. */
export function dailyTable({ days, series, formatValue, negativeLabel = "İade" }: Pick<DailyBarsProps, "days" | "series" | "formatValue" | "negativeLabel">): ChartTable {
  const hasNegative = days.some((day) => day.negative !== undefined);
  const cell = (value: string | null | undefined) => value === undefined ? "—" : value === null ? UNKNOWN : formatValue(value);
  return {
    caption: "Günlük değerler",
    columns: [{ label: "Tarih" }, ...series.map((item) => ({ label: item.label, numeric: true })), ...(hasNegative ? [{ label: negativeLabel, numeric: true }] : [])],
    rows: days.map((day) => {
      const state = day.state === "unknown" ? UNKNOWN : OUT_OF_RANGE;
      return [
        date(day.date),
        ...series.map((item) => day.state !== "value" ? state : cell(day.segments.find((segment) => segment.key === item.key)?.value)),
        ...(hasNegative ? [day.state !== "value" ? state : cell(day.negative)] : []),
      ];
    }),
  };
}

export function DailyBars({ period, days, series, formatValue, negativeLabel = "İade", ariaLabel, plotHeight, formatTick, empty = "Gösterilecek gün yok." }: DailyBarsProps) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [active, setActive] = useState<number | null>(null);
  const patternId = `viz-hatch-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  if (days.length === 0) return <p className="viz-empty">{empty}</p>;

  const layout = dailyLayout({ period, days, seriesKeys: series.map((item) => item.key), width, plotHeight, formatTick });
  const byDate = new Map(days.map((day) => [day.date, day]));
  const count = (state: string) => layout.columns.filter((column) => column.state === state).length;
  const label = ariaLabel ?? `${monthName.format(new Date(`${period}-01`))} günlük grafik: ${count("value")} gün değerli, ${count("unknown")} gün bilinmiyor, ${count("out-of-range")} gün kapsam dışı.`;
  const colorOf = (key: string) => key === NEGATIVE_KEY ? "var(--viz-negative)" : series.find((item) => item.key === key)?.color ?? "var(--viz-cost)";
  const info = active === null ? null : (() => {
    const column = layout.columns[active];
    return describeDay(byDate.get(column.date) ?? { date: column.date, segments: [], state: "out-of-range" }, series, formatValue, negativeLabel);
  })();
  const live = info ? `${info.heading}. ${info.rows.map((row) => `${row.label ? `${row.label}: ` : ""}${row.text}`).join(". ")}` : "";

  const move = (event: KeyboardEvent<HTMLDivElement>) => {
    const last = layout.columns.length - 1;
    if (event.key === "Escape") { setActive(null); return; }
    const next = { ArrowLeft: Math.max(0, (active ?? 1) - 1), ArrowRight: Math.min(last, (active ?? -1) + 1), Home: 0, End: last }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
  };
  const point = (event: PointerEvent<HTMLDivElement>) => setActive(columnAt(layout, event.clientX - event.currentTarget.getBoundingClientRect().left));
  const focus = (event: FocusEvent<HTMLDivElement>) => {
    if (active === null && event.currentTarget.matches(":focus-visible")) setActive(Math.max(0, layout.columns.findIndex((column) => column.state === "value")));
  };
  const paint = (mark: Mark, index: number) => {
    const fill = mark.kind === "unknown" ? `url(#${patternId})` : colorOf(mark.key);
    const key = `${index}-${mark.key}-${mark.kind}`;
    return mark.round
      ? <path key={key} data-key={mark.key} data-state={mark.kind} d={roundedBarPath(mark.x, mark.y, mark.w, mark.h, mark.round)} fill={fill} />
      : <rect key={key} data-key={mark.key} data-state={mark.kind} x={mark.x} y={mark.y} width={mark.w} height={mark.h} fill={fill} />;
  };

  const tipWidth = 220;
  const tipLeft = active === null ? 0 : Math.min(Math.max(layout.columns[active].cx, tipWidth / 2), Math.max(tipWidth / 2, layout.width - tipWidth / 2));
  return (
    <div className="viz-daily" ref={ref}>
      <div className="viz-plot" role="img" aria-label={label} tabIndex={0}
        onKeyDown={move} onFocus={focus} onBlur={() => setActive(null)}
        onPointerMove={point} onPointerDown={point}
        onPointerLeave={(event) => { if (!event.currentTarget.matches(":focus-visible")) setActive(null); }}>
        <svg width={layout.width} height={layout.height} viewBox={`0 0 ${layout.width} ${layout.height}`} aria-hidden="true" focusable="false">
          <defs>
            <pattern id={patternId} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="6" height="6" fill="var(--viz-unknown-fill)" />
              <line x1="0" y1="0" x2="0" y2="6" stroke="var(--viz-unknown-stroke)" strokeWidth="2" />
            </pattern>
          </defs>
          {layout.columns.map((column) => (column.weekend || column.index === active) && (
            <rect key={`band-${column.index}`} className={column.index === active ? "viz-band viz-band--active" : "viz-band"} x={column.x} y={layout.top} width={column.w} height={layout.plotH} />
          ))}
          {layout.ticks.map((tick) => (
            <g key={tick.value}>
              <line className={tick.value === 0 ? "viz-axis" : "viz-grid"} x1={layout.left} x2={layout.left + layout.plotW} y1={tick.y} y2={tick.y} />
              <text className="viz-tick" x={layout.left - 8} y={tick.y} textAnchor="end" dominantBaseline="central">{tick.label}</text>
            </g>
          ))}
          {layout.columns.map((column) => (
            <g key={column.date} data-date={column.date}>
              {column.ghost && <rect className={`viz-ghost viz-ghost--${column.state}`} data-state={column.state} x={column.ghost.x} y={column.ghost.y} width={column.ghost.w} height={column.ghost.h} fill={`url(#${patternId})`} />}
              {column.marks.map((mark) => paint(mark, column.index))}
              {column.zero && <circle className="viz-zero-marker" cx={column.cx} cy={layout.zeroY} r={3} />}
              {column.dayLabel && <text className="viz-tick" x={column.cx} y={layout.top + layout.plotH + layout.belowPad + 18} textAnchor="middle">{column.dayLabel}</text>}
            </g>
          ))}
        </svg>
        {info && (
          <div className="viz-tip" aria-hidden="true" style={{ left: tipLeft, width: tipWidth }}>
            <b>{info.heading}</b>
            {info.rows.map((row) => (
              <p key={row.key} className={row.unknown ? "viz-tip-row viz-tip-row--unknown" : "viz-tip-row"}>
                {row.label ? <Swatch color={row.unknown ? "unknown" : row.color} /> : null}
                <strong>{row.text}</strong>
                {row.label && <span>{row.label}</span>}
              </p>
            ))}
          </div>
        )}
      </div>
      <div className="viz-sr" aria-live="polite">{live}</div>
    </div>
  );
}
