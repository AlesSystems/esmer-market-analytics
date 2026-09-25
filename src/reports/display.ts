import type { GrossResult } from "../analytics/costs";
import type { MonthlyReport, MonthlyResult, SalesFailure, SalesView } from "./contracts";

export type GrossSummary = Omit<GrossResult, "covered" | "excluded"> & { coveredCount: number; excludedCount: number };
export type OperatingDisplay = Omit<MonthlyReport["operating"], "gross"> & { gross: GrossSummary };
export type MonthlyDisplay = Omit<MonthlyReport, "sales" | "salesEvidence" | "appEvidence" | "purchasing" | "operating"> & {
  sales: Omit<SalesView, "transactions" | "products" | "categories" | "exclusions"> & { exclusionCount: number; topCategories: SalesView["categories"] };
  purchasing: Pick<MonthlyReport["purchasing"], "lineage" | "extractionId"> & { gross: GrossSummary };
  operating: OperatingDisplay;
};
export type MonthlyDisplayResult = { status: "monthly"; report: MonthlyDisplay } | SalesFailure;
export type ReportEvidenceRequest = { reportId: string; section: "components" | "exclusions" | "documents" | "lines"; offset: number; search: string; range: "current" | "month" | "year"; documentId: string | null };
type EvidenceRows = {
  components: MonthlyReport["salesEvidence"]["components"];
  exclusions: MonthlyReport["sales"]["exclusions"];
  documents: MonthlyReport["salesEvidence"]["documents"];
  lines: MonthlyReport["salesEvidence"]["lines"];
};
export type ReportEvidencePage = { [K in keyof EvidenceRows]: { status: "evidence"; reportId: string; section: K; offset: number; total: number; rows: EvidenceRows[K] } }[keyof EvidenceRows];

function grossSummary({ covered, excluded, ...gross }: GrossResult): GrossSummary {
  return { ...gross, coveredCount: covered.length, excludedCount: excluded.length };
}
export function monthlyDisplay(report: MonthlyReport): MonthlyDisplay {
  const s = report.sales;
  return {
    format: report.format, id: report.id, context: report.context, calculations: report.calculations, rules: report.rules,
    state: report.state, review: report.review,
    sales: { context: s.context, cutoff: s.cutoff, importedAt: s.importedAt, extractedAt: s.extractedAt, mappingVersion: s.mappingVersion,
      from: s.from, to: s.to, coverage: s.coverage, stale: s.stale, complete: s.complete, filters: s.filters, metrics: s.metrics,
      comparisons: s.comparisons, warnings: s.warnings, exclusionCount: s.exclusions.length, daily: s.daily.slice(0, 31), topCategories: s.categories.slice(0, 5) },
    purchasing: { lineage: report.purchasing.lineage, extractionId: report.purchasing.extractionId, gross: grossSummary(report.purchasing.gross) },
    operating: { ...report.operating, gross: grossSummary(report.operating.gross) },
  };
}
export function displayResult(result: MonthlyResult): MonthlyDisplayResult {
  return result.status === "monthly" ? { status: "monthly", report: monthlyDisplay(result.report) } : result;
}

export function reportEvidence(report: MonthlyReport, request: ReportEvidenceRequest): ReportEvidencePage {
  const { reportId, section, offset, search, range, documentId } = request;
  const base = { status: "evidence" as const, reportId, offset };
  const term = search.toLocaleLowerCase("tr-TR");
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
    const rows = report.salesEvidence.documents.filter(row => row.date >= interval.from && row.date <= interval.to && row.id.toLocaleLowerCase("tr-TR").includes(term));
    return { ...base, section, total: rows.length, rows: rows.slice(offset, offset + 100) };
  }
  const rows = report.salesEvidence.lines.filter(row => row.documentId === documentId);
  return { ...base, section, total: rows.length, rows: rows.slice(offset, offset + 100) };
}
