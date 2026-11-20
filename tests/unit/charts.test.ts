import { describe, expect, test } from "vitest";
import {
  compactMoney, niceTicks, toNumber,
} from "../../src/ui/charts/geometry";

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
