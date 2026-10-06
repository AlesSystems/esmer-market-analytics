import { excelProductReport } from "./export";
import { reportProduct, reportProductDependency } from "./product-detail";
import { canonical } from "../source/package";
import { Exact } from "../domain/money";
import type { openStore } from "../store/store";
import type { SalesReports } from "./query";
import type { MonthlyReport, MonthlyResult, OperationControl, ReportContext, ReportDifference, ReportHistoryResult } from "./contracts";
import { displayResult, monthlyDisplay, reportEvidence, reportProducts, type ReportEvidenceRequest, type ReportProductsRequest } from "./display";

function monthly(value: unknown): value is MonthlyReport {
  return !!value && typeof value === "object" && "format" in value && (value.format === "monthly-report-v1" || value.format === "monthly-report-v2");
}
export class ReportVersions {
  private candidate: MonthlyReport | null = null;
  private retained: MonthlyReport | null = null;
  constructor(private readonly store: ReturnType<typeof openStore>, private readonly sales: SalesReports) {}
  open(request: { period: string | null }, control?: OperationControl): MonthlyResult {
    const result = this.sales.open(request);
    return result.status === "report" ? this.current({ context: result.view.context }, control) : result;
  }
  current({ context }: { context: ReportContext }, control?: OperationControl): MonthlyResult {
    return structuredClone(this.calculate(context, control));
  }
  private calculate(context: ReportContext, control?: OperationControl): MonthlyResult {
    const result = this.sales.monthlyCandidate(context, control);
    if (result.status === "monthly") {
      if (this.candidate?.id === result.report.id && this.candidate.review) return { status: "monthly", report: {
        ...this.candidate,
        sales: { ...this.candidate.sales, stale: result.report.sales.stale },
        purchasing: { ...this.candidate.purchasing, stale: result.report.purchasing.stale },
        operating: { ...this.candidate.operating, stale: result.report.operating.stale },
      } };
      this.candidate = result.report;
    }
    return result;
  }
  openDisplay(request: { period: string | null }, control?: OperationControl) {
    const result = this.sales.open(request);
    return result.status === "report" ? this.currentDisplay({ context: result.view.context }, control) : result;
  }
  currentDisplay({ context }: { context: ReportContext }, control?: OperationControl) {
    return structuredClone(displayResult(this.calculate(context, control)));
  }
  display({ reportId }: { reportId: string }) {
    return { status: "monthly" as const, report: structuredClone(monthlyDisplay(this.resolve(reportId))) };
  }
  evidence(request: ReportEvidenceRequest) {
    return structuredClone(reportEvidence(this.resolve(request.reportId), request));
  }
  products(request: ReportProductsRequest) {
    return structuredClone(reportProducts(this.resolve(request.reportId), request));
  }
  product(request: { reportId: string; productId: string }) {
    return reportProduct(this.resolve(request.reportId), request.productId);
  }
  productDependency(request: { reportId: string; productId: string; returnLineId: string; offset: number }) {
    return reportProductDependency(this.resolve(request.reportId), request);
  }
  purchasing({ reportId }: { reportId: string }) {
    return { status: "purchasing" as const, view: structuredClone(this.resolve(reportId).purchasing) };
  }
  exportProduct({ reportId, productId }: { reportId: string; productId: string }) {
    return excelProductReport(this.resolve(reportId), productId);
  }
  protectedDatasetIds(): string[] { return this.candidate ? [this.candidate.context.datasetId] : []; }
  selected(reportId: string): MonthlyReport {
    return structuredClone(this.resolve(reportId));
  }
  private resolve(reportId: string): MonthlyReport {
    if (this.retained?.id === reportId) return this.retained;
    try { const stored = this.store.readReport(reportId); if (monthly(stored.output.report)) { this.retained = stored.output.report; return this.retained; } }
    catch (error) { if (!(error instanceof Error) || error.message !== "REPORT_NOT_FOUND") throw error; }
    if (this.candidate?.id === reportId) return this.candidate;
    throw new Error("REPORT_NOT_FOUND");
  }
  read({ reportId }: { reportId: string }): MonthlyResult { return { status: "monthly", report: this.selected(reportId) }; }
  list({ period }: { period: string }): ReportHistoryResult {
    return { status: "history", reports: this.store.listMonthlyReports(period) };
  }
  accept({ candidateId, previousAcceptedId, reason }: { candidateId: string; previousAcceptedId: string | null; reason: string }): MonthlyResult {
    if (!reason.trim() || reason.length > 1000) throw new Error("INVALID_REVIEW");
    const report = this.selected(candidateId);
    if (report.review) {
      if (report.review.reason !== reason || report.review.previousAcceptedId !== previousAcceptedId) throw new Error("REVIEW_CONFLICT");
      return { status: "monthly", report };
    }
    const latest = this.list({ period: report.context.period }).reports[0]?.id ?? null;
    if (latest !== previousAcceptedId) throw new Error("REVIEW_CONFLICT");
    if (previousAcceptedId) this.compare({ candidateId, acceptedId: previousAcceptedId });
    report.review = { acceptedAt: new Date().toISOString(), reason, previousAcceptedId };
    this.store.acceptReport({ id: report.id, pin: { datasetId: report.context.datasetId, appRevision: report.context.appRevision }, calculationVersion: report.calculations.report, evidence: [`package:${report.context.datasetId}`, report.rules.artifact], output: { report } });
    this.retained = structuredClone(report);
    if (this.candidate?.id === report.id) this.candidate = this.retained;
    return { status: "monthly", report };
  }
  compare({ candidateId, acceptedId }: { candidateId: string; acceptedId: string }): ReportDifference {
    const after = this.selected(candidateId), before = this.selected(acceptedId);
    if (!before.review || before.context.period !== after.context.period || before.purchasing.lineage !== after.purchasing.lineage || canonical(before.sales.filters) !== canonical(after.sales.filters)) throw new Error("INCOMPARABLE_REPORTS");
    const changes: ReportDifference["changes"] = [];
    const walk = (a: unknown, b: unknown, path: string) => {
      if (canonical(a ?? null) === canonical(b ?? null)) return;
      if (Array.isArray(a) || Array.isArray(b)) {
        const key = (value: unknown, index: number) => {
          if (!value || typeof value !== "object") return String(index);
          const row = value as Record<string, unknown>;
          return String(row.lineId ?? (row.productId && row.unit ? `${row.productId}:${row.unit}` : row.productId) ?? row.id ?? (row.entityId ? `${row.entityId}:${row.revision}` : row.documentId ?? row.date ?? index));
        };
        const old = new Map((Array.isArray(a) ? a : []).map((value, index) => [key(value, index), value]));
        const next = new Map((Array.isArray(b) ? b : []).map((value, index) => [key(value, index), value]));
        for (const id of new Set([...old.keys(), ...next.keys()])) walk(old.get(id), next.get(id), `${path}[${id}]`);
        return;
      }
      if ((a && typeof a === "object") || (b && typeof b === "object")) {
        for (const key of new Set([...Object.keys(a ?? {}), ...Object.keys(b ?? {})])) walk((a as Record<string, unknown> | undefined)?.[key], (b as Record<string, unknown> | undefined)?.[key], path ? `${path}.${key}` : key);
        return;
      }
      const scalar = (value: unknown): string | number | boolean | null => value == null ? null : typeof value === "object" ? canonical(value) : value as string | number | boolean;
      const old = scalar(a), next = scalar(b);
      const decimal = (v: unknown): v is string => typeof v === "string" && /^-?\d+(?:\.\d+)?$/.test(v);
      changes.push({ path, before: old, after: next, delta: decimal(old) && decimal(next) ? new Exact(next).minus(old).toFixed() : null });
    };
    const comparable = (r: MonthlyReport) => ({ format: r.format, calculations: r.calculations, rules: r.rules, datasetId: r.context.datasetId, appRevision: r.context.appRevision, sales: { ...r.sales, context: undefined, stale: undefined }, purchasing: { ...r.purchasing, context: undefined, stale: undefined }, operating: { ...r.operating, context: undefined, stale: undefined }, salesEvidence: r.salesEvidence, appEvidence: r.appEvidence, productProfit: r.format === "monthly-report-v2" ? before.format === "monthly-report-v2" && after.format === "monthly-report-v2" ? r.productProfit : { version: r.productProfit.version, summary: r.productProfit.summary } : null });
    walk(comparable(before), comparable(after), "");
    return { status: "difference", candidateId, acceptedId, changes };
  }
}
