import type { GrossResult } from "../analytics/costs";
import { Exact } from "../domain/money";
import type { MonthlyReport, MonthlyResult, MonthlyReportV1, MonthlyReportV2, SalesFailure, SalesView } from "./contracts";

export type GrossSummary = Omit<GrossResult, "covered" | "excluded"> & { coveredCount: number; excludedCount: number };
export type OperatingDisplay = Omit<MonthlyReport["operating"], "gross"> & { gross: GrossSummary };
type DisplayBase<T extends MonthlyReport> = Omit<T, "sales" | "salesEvidence" | "appEvidence" | "purchasing" | "operating" | "productProfit"> & {
  sales: Omit<SalesView, "transactions" | "products" | "categories" | "exclusions"> & { exclusionCount: number; topCategories: SalesView["categories"] };
  purchasing: Pick<MonthlyReport["purchasing"], "lineage" | "extractionId"> & { gross: GrossSummary };
  operating: OperatingDisplay;
};
export type MonthlyDisplay = DisplayBase<MonthlyReportV1> | (DisplayBase<MonthlyReportV2> & { productProfit: Pick<MonthlyReportV2["productProfit"], "version" | "summary"> & { daily: (MonthlyReportV2["productProfit"]["daily"][number] & { height: string | null; negative: boolean; zero: boolean })[]; productCount: number } });
export type MonthlyDisplayResult = { status: "monthly"; report: MonthlyDisplay } | SalesFailure;
export type ReportProductsRequest = { reportId: string; search: string; sort: "profit" | "name" | "netSales" | "coverage"; direction: "asc" | "desc"; offset: number };
export type ReportProductsPage = { status: "products"; reportId: string; total: number; offset: number; rows: MonthlyReportV2["productProfit"]["products"] };
export type ReportEvidenceRequest = { reportId: string; section: "components" | "exclusions" | "documents" | "lines"; offset: number; search: string; range: "current" | "month" | "year"; documentId: string | null } | { reportId: string; section: "product-profit"; offset: number; search: string; range: "current"; documentId: string | null; productId?: string | null };
type EvidenceRows = {
  components: MonthlyReport["salesEvidence"]["components"];
  exclusions: MonthlyReport["sales"]["exclusions"];
  documents: MonthlyReport["salesEvidence"]["documents"];
  lines: MonthlyReport["salesEvidence"]["lines"];
};
export type ReportEvidencePage = { [K in keyof EvidenceRows]: { status: "evidence"; reportId: string; section: K; offset: number; total: number; rows: EvidenceRows[K] } }[keyof EvidenceRows] | { status: "evidence"; reportId: string; section: "product-profit"; productId: string | null; offset: number; total: number; rows: MonthlyReportV2["productProfit"]["lines"] };

function grossSummary({ covered, excluded, ...gross }: GrossResult): GrossSummary {
  return { ...gross, coveredCount: covered.length, excludedCount: excluded.length };
}
function profitDaily(daily: MonthlyReportV2["productProfit"]["daily"]) {
  const maximum = daily.reduce((max, day) => day.trend === null ? max : Exact.max(max, new Exact(day.trend).abs()), new Exact(0));
  return daily.slice(0, 31).map(day => ({ ...day, height: day.trend === null ? null : maximum.isZero() ? "0" : new Exact(day.trend).abs().div(maximum).times(100).toDecimalPlaces(6).toFixed(), negative: day.trend !== null && new Exact(day.trend).lt(0), zero: day.trend !== null && new Exact(day.trend).isZero() }));
}
export function monthlyDisplay(report: MonthlyReport): MonthlyDisplay {
  const s = report.sales;
  const base = {
    format: report.format, id: report.id, context: report.context, calculations: report.calculations, rules: report.rules,
    state: report.state, review: report.review,
    sales: { context: s.context, cutoff: s.cutoff, importedAt: s.importedAt, extractedAt: s.extractedAt, mappingVersion: s.mappingVersion,
      from: s.from, to: s.to, coverage: s.coverage, stale: s.stale, complete: s.complete, filters: s.filters, metrics: s.metrics,
      comparisons: s.comparisons, warnings: s.warnings, exclusionCount: s.exclusions.length, daily: s.daily.slice(0, 31), topCategories: s.categories.slice(0, 5) },
    purchasing: { lineage: report.purchasing.lineage, extractionId: report.purchasing.extractionId, gross: grossSummary(report.purchasing.gross) },
    operating: { ...report.operating, gross: grossSummary(report.operating.gross) },
  };
  return report.format === "monthly-report-v2" ? { ...base, format: report.format, productProfit: { version: report.productProfit.version, summary: report.productProfit.summary, daily: profitDaily(report.productProfit.daily), productCount: report.productProfit.products.length } } : { ...base, format: report.format };
}
export function displayResult(result: MonthlyResult): MonthlyDisplayResult {
  return result.status === "monthly" ? { status: "monthly", report: monthlyDisplay(result.report) } : result;
}

export function reportEvidence(report: MonthlyReport, request: ReportEvidenceRequest): ReportEvidencePage {
  const { reportId, section, offset, search, range, documentId } = request;
  const base = { status: "evidence" as const, reportId, offset };
  const term = search.toLocaleLowerCase("tr-TR");
  if (section === "product-profit") {
    if (report.format !== "monthly-report-v2") throw new Error("PRODUCT_PROFIT_UNAVAILABLE");
    const rows = report.productProfit.lines.filter(row => (!request.productId || row.productId === request.productId) && (!documentId || row.documentId === documentId) && (!term || row.productName.toLocaleLowerCase("tr-TR").includes(term) || row.productId.toLocaleLowerCase("tr-TR").includes(term)))
      .toSorted((a, b) => a.date.localeCompare(b.date) || a.lineId.localeCompare(b.lineId, "en"));
    return { ...base, section, productId: request.productId ?? null, total: rows.length, rows: rows.slice(offset, offset + 100) };
  }
  if (section === "components") {
    const rows = report.salesEvidence.components.filter(row => row.productName.toLocaleLowerCase("tr-TR").includes(term))
      .toSorted((a, b) => a.productName.localeCompare(b.productName, "tr-TR") || a.lineId.localeCompare(b.lineId));
    return { ...base, section, total: rows.length, rows: rows.slice(offset, offset + 100) };
  }
  if (section === "exclusions") {
    const rows = report.sales.exclusions;
    return { ...base, section, total: rows.length, rows: rows.slice(offset, offset + 100) };
  }
  if (section === "documents") {
    const interval = range === "current" ? report.sales : report.sales.comparisons[range];
    const rows = report.salesEvidence.documents.filter(row => row.date >= interval.from && row.date <= interval.to && (documentId === null || row.id === documentId) && row.id.toLocaleLowerCase("tr-TR").includes(term));
    return { ...base, section, total: rows.length, rows: rows.slice(offset, offset + 100) };
  }
  const rows = report.salesEvidence.lines.filter(row => row.documentId === documentId);
  return { ...base, section, total: rows.length, rows: rows.slice(offset, offset + 100) };
}

export function reportProducts(report: MonthlyReport, request: ReportProductsRequest): ReportProductsPage {
  if (report.format !== "monthly-report-v2") throw new Error("PRODUCT_PROFIT_UNAVAILABLE");
  const term = request.search.trim().toLocaleLowerCase("tr-TR");
  const rows = report.productProfit.products.filter(row => !term || row.displayName.toLocaleLowerCase("tr-TR").includes(term) || row.productId.toLocaleLowerCase("tr-TR").includes(term));
  const value = (row: typeof rows[number]) => request.sort === "profit" ? row.coveredGrossProfit : request.sort === "netSales" ? row.netSales : request.sort === "coverage" ? row.costCoveragePercent : row.displayName;
  rows.sort((a, b) => {
    const av = value(a), bv = value(b);
    if (av === null || bv === null) return av === bv ? a.displayName.localeCompare(b.displayName, "tr-TR") || a.productId.localeCompare(b.productId, "en") : av === null ? 1 : -1;
    const order = request.sort === "name" ? String(av).localeCompare(String(bv), "tr-TR") : new Exact(av).cmp(bv);
    return (request.direction === "desc" ? -order : order) || a.displayName.localeCompare(b.displayName, "tr-TR") || a.productId.localeCompare(b.productId, "en");
  });
  return { status: "products", reportId: request.reportId, offset: request.offset, total: rows.length, rows: rows.slice(request.offset, request.offset + 100) };
}
