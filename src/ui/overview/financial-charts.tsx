import { useEffect, useState } from "react";
import type { MonthlyDisplay, ReportProductsPage, ReportProductsRequest } from "../../reports/display";
import { Bridge, ChartFrame, CompositionBar, DailyBars, monthDates, RankBars, type BridgeStep, type ChartTable, type DailyDay, type RankRow } from "../charts";
import { count, date, isZeroDecimal, money, percent } from "../format";

/**
 * Chart wiring for the financial path. Every figure is a service string passed through money()/percent();
 * nothing here adds, subtracts or divides amounts. Null stays unknown and is never drawn as zero.
 */
type V2 = Extract<MonthlyDisplay, { format: "monthly-report-v2" }>;
type ProductRow = ReportProductsPage["rows"][number];
const amount = (value: string | null) => value === null ? "Hesaplanamıyor" : money(value);

const isV2 = (report: MonthlyDisplay): report is V2 => report.format === "monthly-report-v2";

/**
 * Daily net sales for every calendar day.
 * v2: the profit calendar decides the state ("unavailable" is unknown, "empty" is a known zero day) and
 * sales.daily supplies the amount. v1 reports only know sales.daily, so an absent day is unknown.
 * Days outside the report window are out of range.
 */
function netSalesDays(report: MonthlyDisplay): DailyDay[] {
  const sales = report.sales, byDate = new Map(sales.daily.map(day => [day.date, day.netSales]));
  const profit = isV2(report) ? new Map(report.productProfit.daily.map(day => [day.date, day])) : null;
  return monthDates(report.context.period).map((day): DailyDay => {
    const outside = day < sales.from || day > sales.to || profit?.get(day)?.sourceCoverage === "unavailable";
    if (outside) return { date: day, segments: [], state: "out-of-range" };
    const value = (net: string | null): DailyDay => net === null ? { date: day, segments: [], state: "unknown" } : { date: day, segments: [{ key: "net", value: net }], state: "value" };
    const known = byDate.get(day) ?? null;
    if (!profit) return value(known);
    const entry = profit.get(day);
    if (!entry) return value(known);
    if (entry.status === "empty") return value("0");
    // A day whose cost evidence is missing still has recorded sales when its source coverage is complete.
    if (entry.status === "unavailable") return entry.sourceCoverage === "complete" ? value(known) : value(null);
    return value(known);
  });
}

/** Daily covered gross profit: null trend is a gap, "empty" days carry the service's zero. */
function profitDays(report: V2): DailyDay[] {
  return report.productProfit.daily.map((day): DailyDay => {
    if (day.sourceCoverage === "unavailable") return { date: day.date, segments: [], state: "out-of-range" };
    if (day.trend === null) return { date: day.date, segments: [], state: "unknown" };
    return { date: day.date, segments: [{ key: "profit", value: day.trend }], state: "value" };
  });
}

const salesSeries = [{ key: "net", label: "Net satış", color: "var(--viz-sales)" }];
const profitSeries = [{ key: "profit", label: "Kapsanan tahmini brüt kâr", color: "var(--viz-contribution)" }];

export function DailyNetSales({ report }: { report: MonthlyDisplay }) {
  const emptyDays = new Set(isV2(report) ? report.productProfit.daily.filter(day => day.status === "empty").map(day => day.date) : []);
  const days = netSalesDays(report), negative = days.some(day => day.segments.some(segment => segment.value?.startsWith("-")));
  const table: ChartTable = { caption: "Günlük net satış", columns: [{ label: "Gün" }, { label: "Net satış", numeric: true }, { label: "Durum" }], rows: days.map(day => [date(day.date), day.state === "value" ? money(day.segments[0].value as string) : day.state === "unknown" ? "Hesaplanamıyor" : "Kapsam dışı", day.state === "value" ? (emptyDays.has(day.date) ? "İşlemsiz gün" : "Kayıtlı satış") : day.state === "unknown" ? "Kayıt kanıtı eksik" : "Yedek kapsamı dışında"]) };
  return <ChartFrame title="Ay içindeki satışlar" summary={`Günlük net satış · ₺ · müşteri iadeleri dahil${negative ? " · çizginin altı negatif net satış" : ""}`} table={table} headingLevel="h2" className="c-viz c-viz-daily">
    <DailyBars period={report.context.period} days={days} series={salesSeries} formatValue={money} ariaLabel="Günlük net satış grafiği" />
  </ChartFrame>;
}

export function DailyProfit({ report, partial }: { report: V2; partial: boolean }) {
  const days = profitDays(report), source = new Map(report.productProfit.daily.map(day => [day.date, day]));
  const table: ChartTable = { caption: "Günlük tutarlar", columns: [{ label: "Gün" }, { label: "Tahmini katkı", numeric: true }, { label: "Kapsam" }], rows: days.map(day => { const entry = source.get(day.date)!; if (day.state === "out-of-range") return [date(day.date), "Kapsam dışı", "Kaynak kapsamı dışında"]; return [date(day.date), day.state === "value" ? money(day.segments[0].value as string) : "Hesaplanamıyor", entry.status === "empty" ? "İşlemsiz gün" : entry.trend === null ? "Hesaplanamıyor" : entry.sourceCoverage === "complete" && entry.excludedCount === 0 ? "Kapsanan katkı" : "Kapsam eksik"]; }) };
  return <ChartFrame title="Günlük tahmini brüt kâr" summary={`TRY · ${partial ? "Kapsanan sonuç" : "Tahmini sonuç"} · tüm ürünler · çizginin altı tahmini zarar`} table={table} headingLevel="h2" className="c-viz c-viz-profit">
    <DailyBars period={report.context.period} days={days} series={profitSeries} formatValue={money} ariaLabel="Günlük tahmini brüt kâr grafiği" />
    <p className="viz-gap-note">Boşluk: kapsanmayan veya maliyeti bilinmeyen gün; sıfır değildir.</p>
  </ChartFrame>;
}

/** Top products, from a fixed server-side query so the graph never follows table search, sort or page. */
export function useTopProducts(report: MonthlyDisplay, sort: ReportProductsRequest["sort"], limit: number, active = true) {
  const [state, setState] = useState<{ key: string; rows: ProductRow[]; failed: boolean }>();
  const key = `${report.id}:${sort}`;
  useEffect(() => {
    if (!active || !isV2(report)) return;
    let current = true;
    window.esmer.readReportProducts({ reportId: report.id, search: "", sort, direction: "desc", offset: 0 })
      .then(result => { if (current) setState({ key, rows: result.status === "products" && result.reportId === report.id ? result.rows.slice(0, limit) : [], failed: result.status !== "products" }); })
      .catch(() => { if (current) setState({ key, rows: [], failed: true }); });
    return () => { current = false; };
  }, [key, active]);
  const ready = state?.key === key ? state : undefined;
  return { rows: ready?.rows ?? [], failed: ready?.failed ?? false, loaded: ready !== undefined };
}

type Metric = "netSales" | "coveredGrossProfit";
export function ProductRanking({ rows, metric, title, summary, onSelect, empty, ariaLabel }: { rows: ProductRow[]; metric: Metric; title: string; summary: string; onSelect?: (row: ProductRow, button: HTMLButtonElement) => void; empty: string; ariaLabel: string }) {
  const rankRows: RankRow[] = rows.map(row => ({
    id: row.productId, label: row.displayName, value: row[metric],
    detail: metric === "netSales" ? `Maliyet kapsamı ${row.costCoveragePercent === null ? "bilinmiyor" : percent(row.costCoveragePercent)}` : undefined,
    focusKey: `product-rank-${metric}-${row.productId}`,
    onSelect: onSelect ? button => onSelect(row, button) : undefined,
  }));
  const table: ChartTable = { caption: title, columns: [{ label: "Ürün" }, { label: metric === "netSales" ? "Net satış" : "Kapsanan kâr", numeric: true }, { label: "Maliyet kapsamı", numeric: true }], rows: rows.map(row => [row.displayName, amount(row[metric]), row.costCoveragePercent === null ? "Hesaplanamıyor" : percent(row.costCoveragePercent)]) };
  return <ChartFrame title={title} summary={summary} table={table.rows.length ? table : undefined} headingLevel="h2" className="c-viz c-viz-rank">
    <RankBars rows={rankRows} color={metric === "netSales" ? "var(--viz-sales)" : "var(--viz-contribution)"} formatValue={money} ariaLabel={ariaLabel} empty={empty} />
  </ChartFrame>;
}

/** Covered sales, less covered cost, equals covered estimated gross profit; sales whose cost is missing stay a separate unknown step. */
export function bridgeSteps(report: MonthlyDisplay): BridgeStep[] | null {
  const gross = report.purchasing.gross, profit = isV2(report) ? report.productProfit.summary : null;
  const sales = profit ? profit.coveredSales : gross.status !== "unavailable" ? gross.coveredSales : null;
  const cost = profit ? profit.coveredCost : gross.status !== "unavailable" ? gross.coveredCost : null;
  const result = profit ? profit.coveredGrossProfit : gross.status !== "unavailable" && gross.coveredCount > 0 ? gross.coveredGrossProfit : null;
  if (sales === null || cost === null || result === null) return null;
  const exposures = profit?.exposures ?? gross.exposures;
  return [
    { label: "Kapsanan satış", value: sales, kind: "total" },
    { label: "Kapsanan maliyet", value: cost, kind: "minus", detail: "tarihsel tahmin" },
    { label: result.startsWith("-") ? "Kapsanan tahmini brüt zarar" : "Kapsanan tahmini brüt kâr", value: result, kind: "result", detail: "giderler düşülmemiştir" },
    // At full coverage the excluded amount is a known zero: no step, so the bridge never claims an unknown that is not there.
    ...(isZeroDecimal(exposures.excludedSales) ? [] : [{ label: "Maliyeti eksik satış", value: exposures.excludedSales, kind: "unknown" as const, detail: "maliyeti bilinmiyor · kâra dahil değil" }]),
  ];
}

export function CoverageBridge({ steps }: { steps: BridgeStep[] }) {
  const table: ChartTable = { caption: "Kapsanan satıştan brüt kâra", columns: [{ label: "Adım" }, { label: "Tutar", numeric: true }], rows: steps.map(step => [step.label, step.value === null ? "Hesaplanamıyor" : money(step.value)]) };
  return <ChartFrame title="Kapsanan satıştan brüt kâra" summary="Tarihsel son alış maliyeti tahmini · giderler düşülmemiştir" table={table} headingLevel="h2" className="c-viz c-viz-bridge">
    <Bridge steps={steps} formatValue={money} ariaLabel="Kapsanan satıştan brüt kâra köprü" />
  </ChartFrame>;
}

/** Line counts only; the service already counted them. */
export function LineCoverage({ covered, excluded }: { covered: number; excluded: number }) {
  const table: ChartTable = { caption: "Kapsanan ve dışlanan satırlar", columns: [{ label: "Satır" }, { label: "Sayı", numeric: true }], rows: [["Kapsanan", count(covered)], ["Dışlanan", count(excluded)]] };
  return <ChartFrame title="Maliyet kapsamı" summary="Kapsanan ve dışlanan satır sayısı" table={table} headingLevel="h2" className="c-viz c-viz-comp">
    <CompositionBar ariaLabel={`Satırların kapsanan ${count(covered)}, dışlanan ${count(excluded)}`} empty="Bu ay satır yok." parts={[{ key: "covered", label: "Maliyeti kapsanan satır", value: covered, color: "var(--viz-contribution)" }, { key: "excluded", label: "Dışlanan satır", value: excluded, color: "unknown" }]} />
  </ChartFrame>;
}
