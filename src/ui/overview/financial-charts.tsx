import { useEffect, useState } from "react";
import type { MonthlyDisplay, ReportProductsPage, ReportProductsRequest } from "../../reports/display";
import { ChartFrame, CompositionBar, DailyBars, RankBars, type ChartTable, type DailyDay, type RankRow } from "../charts";
import { count, date, money, percent } from "../format";

/**
 * Chart wiring for the financial path. Every figure is a service string passed through money()/percent();
 * nothing here adds, subtracts or divides amounts. Null stays unknown and is never drawn as zero.
 */
type V2 = Extract<MonthlyDisplay, { format: "monthly-report-v2" }>;
type ProductRow = ReportProductsPage["rows"][number];
const amount = (value: string | null) => value === null ? "Hesaplanamıyor" : money(value);

const isV2 = (report: MonthlyDisplay): report is V2 => report.format === "monthly-report-v2";
/** Daily covered gross profit: null trend is a gap, "empty" days carry the service's zero. */
function profitDays(report: V2): DailyDay[] {
  return report.productProfit.daily.map((day): DailyDay => {
    if (day.sourceCoverage === "unavailable") return { date: day.date, segments: [], state: "out-of-range" };
    if (day.trend === null) return { date: day.date, segments: [], state: "unknown" };
    return { date: day.date, segments: [{ key: "profit", value: day.trend }], state: "value" };
  });
}

const profitSeries = [{ key: "profit", label: "Kapsanan tahmini brüt kâr", color: "var(--viz-contribution)" }];

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

/** Line counts only; the service already counted them. */
export function LineCoverage({ covered, excluded }: { covered: number; excluded: number }) {
  const table: ChartTable = { caption: "Kapsanan ve dışlanan satırlar", columns: [{ label: "Satır" }, { label: "Sayı", numeric: true }], rows: [["Kapsanan", count(covered)], ["Dışlanan", count(excluded)]] };
  return <ChartFrame title="Maliyet kapsamı" summary="Kapsanan ve dışlanan satır sayısı" table={table} headingLevel="h2" className="c-viz c-viz-comp">
    <CompositionBar ariaLabel={`Satırların kapsanan ${count(covered)}, dışlanan ${count(excluded)}`} empty="Bu ay satır yok." parts={[{ key: "covered", label: "Maliyeti kapsanan satır", value: covered, color: "var(--viz-contribution)" }, { key: "excluded", label: "Dışlanan satır", value: excluded, color: "unknown" }]} />
  </ChartFrame>;
}
