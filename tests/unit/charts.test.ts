import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import {
  bridgeLayout, compactMoney, niceTicks, toNumber,
} from "../../src/ui/charts/geometry";
import { Bridge } from "../../src/ui/charts/Bridge";

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
});

describe("bridge layout", () => {
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
});
