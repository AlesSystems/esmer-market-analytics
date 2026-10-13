import { createElement as h, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import {
  bridgeLayout, compactMoney, dailyLayout, describeDay, formatShare, niceTicks, rankLayout, shares, toNumber,
  type DailyDay,
} from "../../src/ui/charts/geometry";
import { Bridge } from "../../src/ui/charts/Bridge";
import { ChartFrame } from "../../src/ui/charts/ChartFrame";
import { CompositionBar } from "../../src/ui/charts/CompositionBar";
import { DailyBars } from "../../src/ui/charts/DailyBars";
import { EstimateBadge } from "../../src/ui/charts/EstimateBadge";
import { RankBars } from "../../src/ui/charts/RankBars";

const money = (value: string) => `${value.replace(".", ",")} ₺`;
const series = [
  { key: "cost", label: "Maliyet", color: "var(--viz-cost)" },
  { key: "contribution", label: "Katkı", color: "var(--viz-contribution)" },
];
const day = (n: number, segments: DailyDay["segments"], extra: Partial<DailyDay> = {}): DailyDay =>
  ({ date: `2026-10-${String(n).padStart(2, "0")}`, segments, state: "value", ...extra });
const layoutOf = (days: DailyDay[], width = 720) => dailyLayout({ period: "2026-10", days, seriesKeys: ["cost", "contribution"], width });
const allMarks = (layout: ReturnType<typeof layoutOf>) => layout.columns.flatMap((column) => column.marks);

describe("compact money and numbers", () => {
  test("uses Turkish compact units and tr-TR separators", () => {
    expect(compactMoney(1200000)).toBe("1,2 Mn ₺");
    expect(compactMoney("845000")).toBe("845 B ₺");
    expect(compactMoney(12000)).toBe("12 B ₺");
    expect(compactMoney(845)).toBe("845 ₺");
    expect(compactMoney(1500000000)).toBe("1,5 Mr ₺");
    expect(compactMoney(0)).toBe("0 ₺");
    expect(compactMoney(-12500)).toBe("-12,5 B ₺");
    expect(compactMoney(999960)).toBe("1 Mn ₺");
  });

  test("toNumber keeps null and non-numeric input unknown instead of zero", () => {
    expect(toNumber("12.50")).toBe(12.5);
    expect(toNumber("0")).toBe(0);
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber("abc")).toBeNull();
    expect(toNumber("")).toBeNull();
  });

  test("niceTicks returns round ticks covering the domain and always includes zero", () => {
    expect(niceTicks(0, 1234)).toEqual({ ticks: [0, 500, 1000, 1500], min: 0, max: 1500 });
    expect(niceTicks(-300, 1000)).toEqual({ ticks: [-500, 0, 500, 1000], min: -500, max: 1000 });
    expect(niceTicks(0, 0)).toEqual({ ticks: [0], min: 0, max: 1 });
    expect(niceTicks(0, 0.3).ticks.every((tick) => Number.isFinite(tick))).toBe(true);
    const wide = niceTicks(0, 7300000);
    expect(wide.max).toBeGreaterThanOrEqual(7300000);
    expect(wide.ticks[0]).toBe(0);
    expect(Object.is(niceTicks(-10, 10).ticks.find((tick) => tick === 0), 0)).toBe(true);
  });

  test("shares and formatShare", () => {
    expect(shares([1, 3]).map((part) => part)).toEqual([25, 75]);
    expect(shares([0, 0])).toEqual([0, 0]);
    expect(formatShare(12.34)).toBe("%12,3");
    expect(formatShare(100)).toBe("%100");
  });
});

describe("daily layout", () => {
  test("stacks positive segments from the baseline and rounds only the far end", () => {
    const layout = layoutOf([day(1, [{ key: "cost", value: "100" }, { key: "contribution", value: "50" }])]);
    const [cost, contribution] = layout.columns[0].marks;
    expect(cost.key).toBe("cost");
    expect(cost.y + cost.h).toBeCloseTo(layout.zeroY, 5);
    expect(cost.round).toBeNull();
    expect(contribution.round).toBe("top");
    expect(contribution.y + contribution.h).toBeLessThan(cost.y);
    expect(cost.y - (contribution.y + contribution.h)).toBeCloseTo(2, 5);
    expect(cost.w).toBeLessThanOrEqual(24);
    expect(layout.ticks.some((tick) => tick.value === 0 && tick.y === layout.zeroY)).toBe(true);
  });

  test("builds a calendar of every day in the period and marks absent days out of range", () => {
    const layout = layoutOf([day(1, [{ key: "cost", value: "10" }])]);
    expect(layout.columns).toHaveLength(31);
    expect(layout.columns[1].state).toBe("out-of-range");
    expect(layout.columns[1].ghost).not.toBeNull();
    expect(layout.columns[1].marks).toEqual([]);
    expect(layout.columns.filter((column) => column.dayLabel).map((column) => column.dayLabel)).toEqual(["1", "5", "10", "15", "20", "25", "30"]);
    expect(layout.columns[3].weekend).toBe(true);
    expect(layout.columns[0].weekend).toBe(false);
  });

  test("null and unknown days become hatched ghosts and never a zero-height mark", () => {
    const layout = layoutOf([
      day(1, [{ key: "cost", value: "100" }]),
      day(2, [], { state: "unknown" }),
      day(3, [{ key: "cost", value: null }, { key: "contribution", value: null }]),
      day(4, [{ key: "cost", value: "100" }, { key: "contribution", value: null }]),
      day(5, [{ key: "cost", value: "0.00" }]),
    ]);
    expect(layout.columns[1].state).toBe("unknown");
    expect(layout.columns[1].ghost).toMatchObject({ y: layout.top, h: layout.plotH });
    expect(layout.columns[2].state).toBe("unknown");
    expect(layout.columns[2].ghost).not.toBeNull();
    expect(layout.columns[2].marks).toEqual([]);
    const partial = layout.columns[3];
    expect(partial.state).toBe("value");
    expect(partial.marks.map((mark) => [mark.key, mark.kind])).toEqual([["cost", "value"], ["contribution", "unknown"]]);
    expect(layout.columns[4].marks).toEqual([]);
    for (const mark of allMarks(layout)) expect(mark.h).toBeGreaterThan(0);
  });

  test("draws negatives below the baseline with a rounded far end and extends the scale", () => {
    const layout = layoutOf([
      day(1, [{ key: "cost", value: "100" }], { negative: "40" }),
      day(2, [{ key: "cost", value: "-30" }]),
      day(3, [{ key: "cost", value: "10" }], { negative: null }),
    ]);
    const [positive, returns] = layout.columns[0].marks;
    expect(positive.y + positive.h).toBeLessThanOrEqual(layout.zeroY + 0.0001);
    expect(returns.key).toBe("negative");
    expect(returns.y).toBeGreaterThanOrEqual(layout.zeroY);
    expect(returns.round).toBe("bottom");
    expect(layout.ticks.some((tick) => tick.value < 0)).toBe(true);
    const signed = layout.columns[1].marks[0];
    expect(signed.y).toBeGreaterThanOrEqual(layout.zeroY);
    const unknownReturns = layout.columns[2].marks.find((mark) => mark.kind === "unknown");
    expect(unknownReturns).toBeDefined();
    expect(unknownReturns!.y).toBeGreaterThanOrEqual(layout.zeroY);
    expect(unknownReturns!.h).toBeGreaterThan(0);
  });

  test("all-unknown input keeps a valid zero-only axis", () => {
    const layout = layoutOf([day(1, [], { state: "unknown" })]);
    expect(layout.ticks.map((tick) => tick.value)).toEqual([0]);
    expect(Number.isFinite(layout.zeroY)).toBe(true);
  });

  test("columns shrink with the container but bars stay thin and gapped", () => {
    const wide = layoutOf([day(1, [{ key: "cost", value: "10" }])], 1100);
    const narrow = layoutOf([day(1, [{ key: "cost", value: "10" }])], 440);
    expect(wide.columns[0].barW).toBe(24);
    expect(narrow.columns[0].barW).toBeLessThan(wide.columns[0].barW);
    expect(narrow.columns[0].barW).toBeGreaterThanOrEqual(3);
    expect(narrow.left + narrow.plotW).toBeLessThanOrEqual(440);
  });

  test("describeDay lists every segment and names unknown or out-of-range states", () => {
    const labels = { cost: "Maliyet", contribution: "Katkı" };
    const info = describeDay(
      day(4, [{ key: "cost", value: "100.00" }, { key: "contribution", value: null }], { negative: "5.00" }),
      series, money, "İade");
    expect(info.heading).toBe("04.10.2026");
    expect(info.rows).toEqual([
      { key: "cost", label: labels.cost, color: "var(--viz-cost)", text: "100,00 ₺", unknown: false },
      { key: "contribution", label: labels.contribution, color: "var(--viz-contribution)", text: "Bilinmiyor", unknown: true },
      { key: "negative", label: "İade", color: "var(--viz-negative)", text: "5,00 ₺", unknown: false },
    ]);
    expect(describeDay(day(5, [], { state: "unknown" }), series, money).rows).toEqual([{ key: "state", label: "", color: "unknown", text: "Bilinmiyor", unknown: true }]);
    expect(describeDay(day(6, [], { state: "out-of-range" }), series, money).rows[0].text).toBe("Kapsam dışı");
  });
});

describe("rank and bridge layout", () => {
  test("rank bars start at zero, extend negatives leftwards and stub unknown values", () => {
    const layout = rankLayout([{ id: "a", value: "100" }, { id: "b", value: "-50" }, { id: "c", value: null }, { id: "d", value: "0" }]);
    expect(layout.zero).toBeCloseTo((50 / 150) * 100, 5);
    const [a, b, c, d] = layout.rows;
    expect(a).toMatchObject({ kind: "value", negative: false });
    expect(a.left).toBeCloseTo(layout.zero, 5);
    expect(a.left + a.width).toBeCloseTo(100, 5);
    expect(b.negative).toBe(true);
    expect(b.left + b.width).toBeCloseTo(layout.zero, 5);
    expect(c.kind).toBe("unknown");
    expect(c.width).toBeGreaterThan(0);
    expect(d.width).toBe(0);
  });

  test("rank bars honour a shared max and survive all-unknown input", () => {
    expect(rankLayout([{ id: "a", value: "50" }], 200).rows[0].width).toBeCloseTo(25, 5);
    const none = rankLayout([{ id: "a", value: null }]);
    expect(none.rows[0].kind).toBe("unknown");
    expect(Number.isFinite(none.zero)).toBe(true);
  });

  test("bridge floats minus steps from the running total and keeps unknown separate", () => {
    const layout = bridgeLayout([
      { label: "Satış", value: "1000", kind: "total" },
      { label: "Maliyet", value: "600", kind: "minus" },
      { label: "Katkı", value: "400", kind: "result" },
      { label: "Bilinmeyen", value: "250", kind: "unknown" },
      { label: "Eksik", value: null, kind: "total" },
    ]);
    const [total, minus, result, unknown, missing] = layout.rows;
    expect(total).toMatchObject({ kind: "total", left: 0 });
    expect(total.width).toBeCloseTo(100, 5);
    expect(minus.left).toBeCloseTo(40, 5);
    expect(minus.width).toBeCloseTo(60, 5);
    expect(result.left).toBe(0);
    expect(result.width).toBeCloseTo(40, 5);
    expect(unknown.kind).toBe("unknown");
    expect(unknown.width).toBeCloseTo(25, 5);
    expect(missing.kind).toBe("unknown");
    expect(missing.value).toBeNull();
    expect(missing.width).toBeGreaterThan(0);
  });
});

describe("rendering", () => {
  const table = {
    caption: "Günlük satış tablosu",
    columns: [{ label: "Tarih" }, { label: "Tutar", numeric: true }],
    rows: [["01.10.2026", "1.234,50 ₺"], ["02.10.2026", "Bilinmiyor"]],
  };

  test("ChartFrame exposes a Grafik/Tablo toggle with aria-pressed and a real table", () => {
    const chart = renderToStaticMarkup(h(ChartFrame, { title: "Günlük satış", summary: "Ekim 2026", table }, h("p", null, "plot")));
    expect(chart).toContain("<figure");
    expect(chart).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Grafik<\/button>/);
    expect(chart).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Tablo<\/button>/);
    expect(chart).toContain("plot");
    expect(chart).not.toContain("<table");
    const tabular = renderToStaticMarkup(h(ChartFrame, { title: "Günlük satış", table, defaultView: "table" }, h("p", null, "plot")));
    expect(tabular).toMatch(/<button[^>]*aria-pressed="false"[^>]*>Grafik<\/button>/);
    expect(tabular).toMatch(/<button[^>]*aria-pressed="true"[^>]*>Tablo<\/button>/);
    expect(tabular).toContain("<table");
    expect(tabular).toContain("<caption");
    expect(tabular).toContain("Günlük satış tablosu");
    expect(tabular).toContain('scope="col"');
    expect(tabular).toContain("1.234,50 ₺");
    expect(tabular).toContain("Bilinmiyor");
    expect(tabular).not.toContain("plot");
  });

  test("ChartFrame shows a legend only for two or more series and omits the toggle without rows", () => {
    const one = renderToStaticMarkup(h(ChartFrame, { title: "T", legend: [{ key: "a", label: "Satış", color: "red" }] }, "x"));
    expect(one).not.toContain("viz-legend");
    expect(one).not.toContain("Tablo");
    const two = renderToStaticMarkup(h(ChartFrame, { title: "T", legend: [{ key: "a", label: "Satış", color: "red" }, { key: "u", label: "Bilinmiyor", color: "unknown" }] }, "x"));
    expect(two).toContain("viz-legend");
    expect(two).toContain("Bilinmiyor");
  });

  test("DailyBars is one focusable labelled image, hatches unknown days and gives unique pattern ids", () => {
    const props = {
      period: "2026-10",
      days: [day(1, [{ key: "cost", value: "100.00" }, { key: "contribution", value: "50.00" }]), day(2, [], { state: "unknown" })],
      series,
      formatValue: money,
      ariaLabel: "Ekim 2026 günlük satış",
    };
    const markup = renderToStaticMarkup(h(Fragment, null, h(DailyBars, props), h(DailyBars, props)));
    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label="Ekim 2026 günlük satış"');
    expect(markup).toContain('tabindex="0"');
    expect(markup).toContain('data-state="unknown"');
    expect(markup).toContain('data-state="out-of-range"');
    expect(markup).not.toContain("NaN");
    expect(markup).not.toMatch(/height="0(\.0+)?"/);
    const ids = [...markup.matchAll(/<pattern[^>]*id="([^"]+)"/g)].map((match) => match[1]);
    expect(ids).toHaveLength(2);
    expect(new Set(ids).size).toBe(2);
    expect(markup).toContain(`url(#${ids[0]})`);
    expect(markup).toContain("0 ₺");
  });

  test("a known zero day gets a visible baseline marker, distinct from unknown and out-of-range days", () => {
    const days = [day(1, [{ key: "cost", value: "0" }, { key: "contribution", value: "0.00" }]), day(2, [{ key: "cost", value: "10" }, { key: "contribution", value: "5" }]), day(3, [], { state: "unknown" })];
    const layout = dailyLayout({ period: "2026-10", days, seriesKeys: ["cost", "contribution"], width: 720 });
    expect(layout.columns.map((column) => column.zero)).toEqual([true, false, false, ...Array(28).fill(false)]);
    const markup = renderToStaticMarkup(h(DailyBars, { period: "2026-10", days, series, formatValue: money }));
    expect(markup.match(/class="viz-zero-marker"/g)).toHaveLength(1);
  });
  test("DailyBars summarises counts when no aria label is passed and shows caller empty text", () => {
    const markup = renderToStaticMarkup(h(DailyBars, {
      period: "2026-10", days: [day(1, [{ key: "cost", value: "10" }]), day(2, [], { state: "unknown" })], series, formatValue: money,
    }));
    expect(markup).toMatch(/aria-label="[^"]*Ekim 2026[^"]*1 gün[^"]*1 gün bilinmiyor[^"]*"/);
    const empty = renderToStaticMarkup(h(DailyBars, { period: "2026-10", days: [], series, formatValue: money, empty: "Bu ay için gün yok." }));
    expect(empty).toContain("Bu ay için gün yok.");
    expect(empty).not.toContain("<svg");
  });

  test("RankBars prints exact values, never draws null as a bar and names it Bilinmiyor", () => {
    const markup = renderToStaticMarkup(h(RankBars, {
      color: "var(--viz-sales)", formatValue: money, ariaLabel: "Ürün sıralaması",
      rows: [
        { id: "a", label: "Ürün A", value: "1234.50", detail: "3 satır" },
        { id: "b", label: "Ürün B", value: null },
        { id: "c", label: "Ürün C", value: "-5.00", onSelect: () => undefined },
      ],
    }));
    expect(markup).toContain('aria-label="Ürün sıralaması"');
    expect(markup).toContain("1234,50 ₺");
    expect(markup).toContain("3 satır");
    const unknownRow = markup.split("<li").find((part) => part.includes("Ürün B"))!;
    expect(unknownRow).toContain("Bilinmiyor");
    expect(unknownRow).toContain('data-state="unknown"');
    expect(unknownRow).not.toContain("viz-bar--value");
    expect(markup).toContain("<button");
    expect(markup).toContain("viz-bar--negative");
    expect(markup).not.toContain("NaN");
    expect(renderToStaticMarkup(h(RankBars, { rows: [], color: "red", formatValue: money, empty: "Ürün yok." }))).toContain("Ürün yok.");
  });

  test("Bridge renders every step with operator, value and a hatched unknown step", () => {
    const markup = renderToStaticMarkup(h(Bridge, {
      formatValue: money,
      steps: [
        { label: "Kapsanan satış", value: "1000.00", kind: "total" },
        { label: "Maliyet adayı", value: "600.00", kind: "minus" },
        { label: "Katkı", value: "400.00", kind: "result" },
        { label: "Maliyeti bilinmeyen satış", value: null, kind: "unknown" },
      ],
    }));
    expect(markup).toContain("Kapsanan satış");
    expect(markup).toContain("1000,00 ₺");
    expect(markup).toContain("600,00 ₺");
    expect(markup).toContain("Bilinmiyor");
    expect(markup).toContain('data-state="unknown"');
    expect(markup).toContain("<ol");
    expect(renderToStaticMarkup(h(Bridge, { steps: [], formatValue: money, empty: "Adım yok." }))).toContain("Adım yok.");
  });

  test("CompositionBar sizes parts by value, gaps them, and lists value plus percent", () => {
    const markup = renderToStaticMarkup(h(CompositionBar, {
      formatValue: (value: number) => `${value} satır`,
      parts: [
        { key: "covered", label: "Kapsanan", value: 75, color: "var(--viz-contribution)" },
        { key: "excluded", label: "Kapsam dışı", value: 25, color: "unknown" },
        { key: "none", label: "Yok", value: 0, color: "var(--viz-cost)" },
      ],
    }));
    expect(markup).toContain('role="img"');
    expect(markup).toContain("%75");
    expect(markup).toContain("%25");
    expect(markup).toContain("75 satır");
    expect(markup).toContain("viz-hatch");
    expect(markup.match(/viz-comp-part/g)!.length).toBe(2);
    expect(renderToStaticMarkup(h(CompositionBar, { parts: [], formatValue: String, empty: "Dağılım yok." }))).toContain("Dağılım yok.");
  });

  test("EstimateBadge is a details disclosure with the fixed chip text", () => {
    const markup = renderToStaticMarkup(h(EstimateBadge, null, h("p", null, "Sözleşme anlamı")));
    expect(markup).toContain("<details");
    expect(markup).toMatch(/<summary[^>]*>[^]*Doğrulanmamış tahmin[^]*<\/summary>/);
    expect(markup).toContain("Sözleşme anlamı");
    expect(markup).not.toContain(" open");
  });
});
