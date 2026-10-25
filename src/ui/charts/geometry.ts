
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
  const nice = (ratio <= 1 ? 1 : ratio <= 2 ? 2 : ratio <= 5 ? 5 : 10) * magnitude;
  const step = nice;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const count = Math.round((end - start) / step);
  const clean = (value: number) => Number(value.toPrecision(12)) + 0;
  return { ticks: Array.from({ length: count + 1 }, (_, index) => clean(start + index * step)), min: clean(start), max: clean(end) };
}

/** SVG path for a bar whose far end is rounded and whose baseline end is square. */
export function roundedBarPath(x: number, y: number, w: number, h: number, round: "top" | "bottom"): string {
  const r = Math.max(0, Math.min(RADIUS, w / 2, h));
  const f = (n: number) => Number(n.toFixed(2));
  if (round === "top") return `M${f(x)} ${f(y + h)}V${f(y + r)}Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)}H${f(x + w - r)}Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}V${f(y + h)}Z`;
  return `M${f(x)} ${f(y)}V${f(y + h - r)}Q${f(x)} ${f(y + h)} ${f(x + r)} ${f(y + h)}H${f(x + w - r)}Q${f(x + w)} ${f(y + h)} ${f(x + w)} ${f(y + h - r)}V${f(y)}Z`;
}

/* ── Daily columns ─────────────────────────────────────────────── */
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
      const start = end - value;
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
