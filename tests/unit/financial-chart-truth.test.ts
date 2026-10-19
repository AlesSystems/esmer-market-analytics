import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import type { MonthlyDisplay } from "../../src/reports/display";
import { DailyNetSales, CoverageBridge } from "../../src/ui/overview/financial-charts";
import { bridgeLayout, type BridgeStep } from "../../src/ui/charts/geometry";
import { Bridge } from "../../src/ui/charts/Bridge";
import { ChartFrame } from "../../src/ui/charts/ChartFrame";
import { money } from "../../src/ui/format";

const steps = (sales: string, cost: string | null, result: string): BridgeStep[] => [
  { label: "Kapsanan satış", value: sales, kind: "total" },
  { label: "Kapsanan maliyet", value: cost, kind: "minus" },
  { label: "Kapsanan tahmini brüt kâr", value: result, kind: "result" },
];

describe("signed financial bridge", () => {
  test("return-only cost reversal moves toward the service result", () => {
    const layout = bridgeLayout(steps("-100", "-60", "-40"));
    expect(layout.zero).toBe(100);
    expect(layout.rows[1]).toMatchObject({ left: 0, width: 60 });
    expect(layout.rows[2]).toMatchObject({ left: 60, width: 40 });
    const markup = renderToStaticMarkup(h(Bridge, { steps: steps("-100", "-60", "-40"), formatValue: money }));
    expect(markup).toContain("+ 60,00 ₺");
    expect(markup).not.toContain("− 60,00 ₺");
    const frame = CoverageBridge({ steps: steps("-100", "-60", "-40") });
    const table = renderToStaticMarkup(h(ChartFrame, { ...frame.props, defaultView: "table" }));
    expect(table).toContain("-60,00 ₺");
  });
  test("mixed activity with negative net cost adds the reversal", () => {
    const layout = bridgeLayout(steps("100", "-60", "160"));
    expect(layout.rows[1]).toMatchObject({ left: 62.5, width: 37.5 });
    expect(layout.rows[2]).toMatchObject({ left: 0, width: 100 });
  });
  test.each([["60", "40", 40, 60], ["0", "100", 100, 0]] as const)("preserves positive or zero cost %s", (cost, result, left, width) => {
    expect(bridgeLayout(steps("100", cost, result)).rows[1]).toMatchObject({ left, width });
    expect(renderToStaticMarkup(h(Bridge, { steps: steps("100", cost, result), formatValue: money }))).toContain(`− ${money(cost)}`);
  });
  test("null cost remains unknown", () => {
    expect(bridgeLayout(steps("100", null, "40")).rows[1].kind).toBe("unknown");
    expect(renderToStaticMarkup(h(Bridge, { steps: steps("100", null, "40"), formatValue: money }))).toContain("Bilinmiyor");
  });
});

describe("daily activity meaning", () => {
  const report = (format: "monthly-report-v1" | "monthly-report-v2", status: string, value: string | null) => ({
    format, context: { period: "2026-09" },
    sales: { from: "2026-09-01", to: "2026-09-01", daily: value === null ? [] : [{ date: "2026-09-01", netSales: value }] },
    productProfit: { daily: [{ date: "2026-09-01", status, sourceCoverage: "complete" }] },
  }) as unknown as MonthlyDisplay;
  test.each(["0", "0.00", "-0.00"])("ready zero amount %s is recorded activity", value => {
    const frame = DailyNetSales({ report: report("monthly-report-v2", "ready", value) });
    expect(frame.props.table.rows[0][2]).toBe("Kayıtlı satış");
  });
  test("only authoritative empty status identifies inactivity", () => {
    expect(DailyNetSales({ report: report("monthly-report-v2", "empty", null) }).props.table.rows[0][2]).toBe("İşlemsiz gün");
    expect(DailyNetSales({ report: report("monthly-report-v1", "ready", "0") }).props.table.rows[0][2]).toBe("Kayıtlı satış");
  });
  test("unknown and outside days keep their distinct explanations", () => {
    const frame = DailyNetSales({ report: report("monthly-report-v1", "ready", null) });
    expect(frame.props.table.rows[0][2]).toBe("Kayıt kanıtı eksik");
    expect(frame.props.table.rows[1][2]).toBe("Yedek kapsamı dışında");
  });
});
