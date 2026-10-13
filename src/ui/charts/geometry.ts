import { date } from "../format";

/** Pure chart math. Values arrive as decimal strings or null; Number() is used only for geometry. */

export const GAP = 2;
export const BAR_MAX = 24;
export const BAR_MIN = 3;
export const RADIUS = 4;
export const STUB = 14;
export const UNKNOWN = "Bilinmiyor";
export const OUT_OF_RANGE = "Kapsam dışı";
export const NEGATIVE_KEY = "negative";

export const toNumber = (value: string | null | undefined): number | null => {
  if (value === null || value === undefined || value.trim() === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const compactNumber = (value: number, digits: number) => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: digits }).format(value);

/** "1,2 Mn ₺", "845 B ₺", "845 ₺", "1,5 Mr ₺". Axis and tick text only; exact figures come from the caller's formatter. */
export function compactMoney(value: number | string): string {
  const number = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(number)) return "—";
  const abs = Math.abs(number);
  const units = ["", " B", " Mn", " Mr"];
  const round = (tier: number) => { const q = abs / 1000 ** tier; return Math.round(q * 10) / 10; };
  let tier = abs >= 1e9 ? 3 : abs >= 1e6 ? 2 : abs >= 1e3 ? 1 : 0;
  if (round(tier) >= 1000 && tier < 3) tier += 1;
  const q = abs / 1000 ** tier;
  const text = compactNumber(q, q >= 99.95 ? 0 : 1);
  const sign = number < 0 && text !== "0" ? "-" : "";
  return `${sign}${text}${units[tier]} ₺`;
}

/** Round ticks covering [min, max]; step is 1, 2 or 5 times a power of ten and zero is always a tick when inside the domain. */
export function niceTicks(min: number, max: number, intervals = 3): { ticks: number[]; min: number; max: number } {
  if (min === 0 && max === 0) return { ticks: [0], min: 0, max: 1 };
  if (!(max > min)) max = min + 1;
  const raw = (max - min) / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const ratio = raw / magnitude;
  const step = (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * magnitude;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const count = Math.round((end - start) / step);
  const clean = (value: number) => Number(value.toPrecision(12)) + 0;
  return { ticks: Array.from({ length: count + 1 }, (_, index) => clean(start + index * step)), min: clean(start), max: clean(end) };
}

export const shares = (values: number[]): number[] => {
  const total = values.reduce((sum, value) => sum + value, 0);
  return values.map((value) => total > 0 ? (value / total) * 100 : 0);
};
export const formatShare = (value: number) => `%${compactNumber(value, 1)}`;

/** SVG path for a bar whose far end is rounded and whose baseline end is square. */
export function roundedBarPath(x: number, y: number, w: number, h: number, round: "top" | "bottom"): string {
  const r = Math.max(0, Math.min(RADIUS, w / 2, h));
  const f = (n: number) => Number(n.toFixed(2));
  if (round === "top") return `M${f(x)} ${f(y + h)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h)}Z`;
  return `M${f(x)} ${f(y)}V${f(y + h - r)}Q${f(x)} ${f(y + h)} ${f(x + r)} ${f(y + h)}H${f(x + w - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w)} ${f(y + h - r)}V${f(y)}Z`;
}

/* ── Daily columns ─────────────────────────────────────────────── */

export type DailyState = "value" | "unknown" | "out-of-range";
export type DailyDay = {
  date: string;
  segments: { key: string; value: string | null }[];
  /** Magnitude drawn below the baseline (returns). null means unknown, undefined means none. */
  negative?: string | null;
  state: DailyState;
};
export type DailySeries = { key: string; label: string; color: string };
export type Rect = { x: number; y: number; w: number; h: number };
export type Mark = Rect & { key: string; kind: "value" | "unknown"; round: "top" | "bottom" | null };
export type DailyColumn = {
  date: string;
  index: number;
  x: number;
  w: number;
  cx: number;
  barX: number;
  barW: number;
  weekend: boolean;
  dayLabel: string | null;
  state: DailyState;
  ghost: Rect | null;
  marks: Mark[];
};
export type DailyLayout = {
  width: number;
  height: number;
  left: number;
  top: number;
  plotW: number;
  plotH: number;
  zeroY: number;
  belowPad: number;
  ticks: { value: number; y: number; label: string }[];
  columns: DailyColumn[];
};
type DailyInput = { period: string; days: DailyDay[]; seriesKeys: string[]; width: number; plotHeight?: number };

export const monthDates = (period: string): string[] => {
  const [year, month] = period.split("-").map(Number);
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return Array.from({ length: count }, (_, index) => `${period}-${String(index + 1).padStart(2, "0")}`);
};
const isWeekend = (value: string) => [0, 6].includes(new Date(`${value}T00:00:00Z`).getUTCDay());

type Raw = { key: string; value: number };
type DayParts = { state: DailyState; positives: Raw[]; negatives: Raw[]; unknownTop: string | null; unknownBelow: boolean };

function partsOf(day: DailyDay | undefined, seriesKeys: string[]): DayParts {
  if (!day) return { state: "out-of-range", positives: [], negatives: [], unknownTop: null, unknownBelow: false };
  if (day.state !== "value") return { state: day.state, positives: [], negatives: [], unknownTop: null, unknownBelow: false };
  const positives: Raw[] = [];
  const negatives: Raw[] = [];
  let unknownTop: string | null = null;
  let known = 0;
  for (const key of seriesKeys) {
    const segment = day.segments.find((candidate) => candidate.key === key);
    if (!segment) continue;
    const value = toNumber(segment.value);
    if (value === null) { unknownTop ??= key; continue; }
    known += 1;
    if (value > 0) positives.push({ key, value });
    else if (value < 0) negatives.push({ key, value: -value });
  }
  let unknownBelow = false;
  if (day.negative === null) unknownBelow = true;
  else if (day.negative !== undefined) {
    const value = toNumber(day.negative);
    if (value === null) unknownBelow = true;
    else { known += 1; if (value !== 0) negatives.push({ key: NEGATIVE_KEY, value: Math.abs(value) }); }
  }
  if (known === 0) return { state: "unknown", positives: [], negatives: [], unknownTop: null, unknownBelow: false };
  return { state: "value", positives, negatives, unknownTop, unknownBelow };
}

export function dailyLayout({ period, days, seriesKeys, width, plotHeight = 220 }: DailyInput): DailyLayout {
  const dates = monthDates(period);
  const byDate = new Map(days.map((day) => [day.date, day]));
  const parts = dates.map((value) => partsOf(byDate.get(value), seriesKeys));
  const sum = (items: Raw[]) => items.reduce((total, item) => total + item.value, 0);
  const hi = Math.max(0, ...parts.map((part) => sum(part.positives)));
  const lo = -Math.max(0, ...parts.map((part) => sum(part.negatives)));
  const belowPad = lo === 0 && parts.some((part) => part.unknownBelow) ? STUB + GAP : 0;
  const domain = niceTicks(lo, hi, 3);
  const left = 56;
  const right = 8;
  const top = 16;
  const plotW = Math.max(40, width - left - right);
  const plotH = plotHeight;
  const span = domain.max - domain.min;
  const y = (value: number) => top + ((domain.max - value) / span) * plotH;
  const zeroY = y(0);
  const colW = plotW / dates.length;
  const barW = Math.max(BAR_MIN, Math.min(BAR_MAX, colW - GAP));

  const stack = (items: Raw[], sign: 1 | -1, x: number): Mark[] => {
    let cumulative = 0;
    return items.map((item, index) => {
      const from = y(sign * cumulative);
      cumulative += item.value;
      const to = y(sign * cumulative);
      const h = Math.max(2, Math.abs(to - from));
      const last = index === items.length - 1;
      const gap = !last && h > GAP + 1 ? GAP : 0;
      const yTop = sign === 1 ? from - h + gap : from;
      return { key: item.key, kind: "value", x, y: yTop, w: barW, h: h - gap, round: last ? (sign === 1 ? "top" : "bottom") : null } satisfies Mark;
    });
  };

  const columns = dates.map((value, index): DailyColumn => {
    const part = parts[index];
    const x = left + index * colW;
    const barX = x + (colW - barW) / 2;
    const dayNumber = index + 1;
    const marks: Mark[] = [...stack(part.positives, 1, barX), ...stack(part.negatives, -1, barX)];
    if (part.unknownTop) {
      const topEdge = marks.filter((mark) => mark.y < zeroY).reduce((min, mark) => Math.min(min, mark.y), zeroY);
      marks.push({ key: part.unknownTop, kind: "unknown", x: barX, y: topEdge - STUB - (topEdge < zeroY ? GAP : 0), w: barW, h: STUB, round: null });
    }
    if (part.unknownBelow) {
      const bottomEdge = marks.filter((mark) => mark.y >= zeroY).reduce((max, mark) => Math.max(max, mark.y + mark.h), zeroY);
      marks.push({ key: NEGATIVE_KEY, kind: "unknown", x: barX, y: bottomEdge + (bottomEdge > zeroY ? GAP : 0), w: barW, h: STUB, round: null });
    }
    return {
      date: value, index, x, w: colW, cx: x + colW / 2, barX, barW,
      weekend: isWeekend(value),
      dayLabel: dayNumber === 1 || dayNumber % 5 === 0 ? String(dayNumber) : null,
      state: part.state,
      ghost: part.state === "value" ? null : { x: barX, y: top, w: barW, h: plotH },
      marks,
    };
  });

  return {
    width, left, top, plotW, plotH, zeroY, belowPad, columns,
    height: top + plotH + belowPad + 26,
    ticks: domain.ticks.map((tick) => ({ value: tick, y: y(tick), label: compactMoney(tick) })),
  };
}

/** Column under a horizontal position inside the plot, or null outside it. */
export function columnAt(layout: DailyLayout, x: number): number | null {
  if (x < layout.left || x > layout.left + layout.plotW) return null;
  return Math.min(layout.columns.length - 1, Math.floor((x - layout.left) / (layout.plotW / layout.columns.length)));
}

export type DayRow = { key: string; label: string; color: string; text: string; unknown: boolean };
export function describeDay(day: DailyDay, series: DailySeries[], formatValue: (value: string) => string, negativeLabel = "İade"): { heading: string; rows: DayRow[] } {
  const heading = date(day.date);
  if (day.state !== "value") return { heading, rows: [{ key: "state", label: "", color: "unknown", text: day.state === "unknown" ? UNKNOWN : OUT_OF_RANGE, unknown: true }] };
  const rows: DayRow[] = [];
  for (const item of series) {
    const segment = day.segments.find((candidate) => candidate.key === item.key);
    if (!segment) continue;
    const known = toNumber(segment.value) !== null;
    rows.push({ key: item.key, label: item.label, color: item.color, text: known ? formatValue(segment.value as string) : UNKNOWN, unknown: !known });
  }
  if (day.negative !== undefined) {
    const known = toNumber(day.negative) !== null;
    rows.push({ key: NEGATIVE_KEY, label: negativeLabel, color: "var(--viz-negative)", text: known ? formatValue(day.negative as string) : UNKNOWN, unknown: !known });
  }
  return { heading, rows };
}

/* ── Horizontal bars (rank, bridge) ────────────────────────────── */

export type Span = { left: number; width: number; negative: boolean; kind: "value" | "unknown" };
const UNKNOWN_STUB = 8;

export function rankLayout(rows: { id: string; value: string | null }[], max?: number): { zero: number; rows: (Span & { id: string })[] } {
  const values = rows.map((row) => toNumber(row.value));
  const known = values.filter((value): value is number => value !== null);
  const posMax = Math.max(0, ...known);
  const negMax = Math.max(0, ...known.map((value) => -value));
  const hi = posMax > 0 ? (max ?? posMax) : 0;
  const lo = negMax > 0 ? -(max ?? negMax) : 0;
  const span = hi - lo || 1;
  const zero = (-lo / span) * 100;
  return {
    zero,
    rows: rows.map((row, index) => {
      const value = values[index];
      if (value === null) return { id: row.id, kind: "unknown", negative: false, left: Math.min(zero, 100 - UNKNOWN_STUB), width: UNKNOWN_STUB };
      const width = Math.min(100, (Math.abs(value) / span) * 100);
      return value < 0
        ? { id: row.id, kind: "value", negative: true, left: zero - width, width }
        : { id: row.id, kind: "value", negative: false, left: zero, width };
    }),
  };
}

export type BridgeKind = "total" | "minus" | "result" | "unknown";
export type BridgeStep = { label: string; value: string | null; kind: BridgeKind; detail?: string };
export type BridgeRow = Omit<Span, "kind"> & { index: number; kind: BridgeKind; value: string | null };

export function bridgeLayout(steps: BridgeStep[]): { zero: number; rows: BridgeRow[] } {
  type Bar = { from: number; to: number } | null;
  const bars: Bar[] = [];
  let running: number | null = null;
  for (const step of steps) {
    const value = toNumber(step.value);
    if (value === null) { bars.push(null); continue; }
    if (step.kind === "minus") {
      const end: number = running ?? 0;
      const start = end - Math.abs(value);
      bars.push({ from: start, to: end });
      if (running !== null) running = start;
    } else {
      bars.push({ from: 0, to: step.kind === "unknown" ? Math.abs(value) : value });
      if (step.kind !== "unknown") running = value;
    }
  }
  const edges = bars.flatMap((bar) => bar ? [bar.from, bar.to] : []);
  const hi = Math.max(0, ...edges);
  const lo = Math.min(0, ...edges);
  const span = hi - lo || 1;
  const percent = (value: number) => ((value - lo) / span) * 100;
  const zero = percent(0);
  return {
    zero,
    rows: steps.map((step, index): BridgeRow => {
      const bar = bars[index];
      if (!bar) return { index, kind: "unknown", value: step.value, negative: false, left: Math.min(zero, 100 - UNKNOWN_STUB), width: UNKNOWN_STUB };
      const start = Math.min(bar.from, bar.to);
      const end = Math.max(bar.from, bar.to);
      return {
        index, kind: step.kind, value: step.value,
        negative: step.kind !== "minus" && bar.to < 0,
        left: percent(start), width: percent(end) - percent(start),
      };
    }),
  };
}
