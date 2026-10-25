import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import {
  bridgeLayout, compactMoney, formatShare, niceTicks, rankLayout, shares, toNumber,
} from "../../src/ui/charts/geometry";
import { Bridge } from "../../src/ui/charts/Bridge";
import { ChartFrame } from "../../src/ui/charts/ChartFrame";
import { CompositionBar } from "../../src/ui/charts/CompositionBar";
import { EstimateBadge } from "../../src/ui/charts/EstimateBadge";
import { RankBars } from "../../src/ui/charts/RankBars";

const money = (value: string) => `${value.replace(".", ",")} ₺`;

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

  test("RankBars passes the clicked button to onSelect and renders focusKey as data-focus-key", () => {
    const rows = [{ id: "a", label: "Ürün A", value: "10", focusKey: "rank-a", onSelect: () => undefined }, { id: "b", label: "Ürün B", value: "5" }];
    const markup = renderToStaticMarkup(h(RankBars, { rows, color: "red", formatValue: money }));
    expect(markup).toMatch(/<button[^>]*data-focus-key="rank-a"/);
    expect(markup.match(/data-focus-key/g)).toHaveLength(1);
    const element = h(RankBars, { rows, color: "red", formatValue: money }) as { type: (props: unknown) => { props: { children: { key: string; props: { children: { props: { onClick: (event: { currentTarget: string }) => void } } } }[] } } };
    let received: unknown;
    const tree = element.type({ rows: [{ ...rows[0], onSelect: (button: unknown) => { received = button; } }], color: "red", formatValue: money });
    tree.props.children[0].props.children.props.onClick({ currentTarget: "the-button" });
    expect(received).toBe("the-button");
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
