import { calculateOperatingResult, OPERATING_CALCULATION_VERSION } from "../analytics/operating";
import { buildProductProfit } from "../analytics/product-profit";
import { relevantExpenseRevision } from "../expenses/adjustments";
import type { OperatingReportResult } from "../expenses/contracts";
import { estimateGrossResult, COST_CALCULATION_VERSION, type GrossResult } from "../analytics/costs";
import { calculatePurchasing, PURCHASING_CALCULATION_VERSION, type PurchasingResult } from "../analytics/purchasing";
import type { QueryPurchasingRequest, PurchasingReportResult, MonthlyReport, MonthlyResult, OperationControl } from "./contracts";
import { randomUUID } from "node:crypto";
import { calculateSales, SALES_CALCULATION_VERSION, totals, type SalesComponent, type SalesResult } from "../analytics/sales";
import { Exact, percentageChange, sum } from "../domain/money";
import { SALES_MAPPING_VERSION, BUSINESS_MAPPING_VERSION } from "../source/package";
import type { openStore, Snapshot } from "../store/store";
import { emptySalesFilters, type Breakdown, type Comparison, type InspectSalesRequest, type OpenSalesRequest, type QuerySalesRequest, type ReportContext, type SalesDetailResult, type SalesFailure, type SalesFilters, type SalesReportResult } from "./contracts";

const failure = (code: SalesFailure["code"], message: string): SalesFailure => ({ status: "unavailable", code, message });
const endOfMonth = (period: string) => { const [year, month] = period.split("-").map(Number); return new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10); };
function shifted(period: string, months: number): string { const [year, month] = period.split("-").map(Number); return new Date(Date.UTC(year, month - 1 + months, 1)).toISOString().slice(0, 7); }
function matches(line: SalesComponent, filters: SalesFilters) {
  return (!filters.categoryId || line.categoryId === filters.categoryId) && (!filters.productId || line.productId === filters.productId) && (filters.kind === "all" || line.kind === filters.kind) && (!filters.search || line.productName.toLocaleLowerCase("tr-TR").includes(filters.search.trim().toLocaleLowerCase("tr-TR")));
}
function range(snapshot: Snapshot, period: string) {
  const start = `${period}-01`, end = endOfMonth(period);
  const coverage = snapshot.metadata!.coverage;
  const overlap = coverage.from <= end && coverage.to >= start;
  const from = overlap && coverage.from > start ? coverage.from : start;
  const to = overlap && coverage.to < end ? coverage.to : end;
  return { from, to, overlap, covered: overlap && coverage.complete, partial: from !== start || to !== end || !coverage.complete };
}
export class SalesReports {
  private session: { snapshot: Snapshot; context: ReportContext; calculations: { sales: Map<string, SalesResult>; gross: GrossResult | null; purchasing: PurchasingResult | null; monthly: MonthlyReport | null } } | null = null;
  constructor(private readonly store: ReturnType<typeof openStore>) {}
  open(request: OpenSalesRequest): SalesReportResult {
    this.session = null;
    const snapshot = this.store.readSnapshot();
    if (!snapshot.metadata || !snapshot.pin.datasetId) return this.store.hasSourcePreview()
      ? failure("UNSUPPORTED_MAPPING", "Yedek kayıtları yüklendi; mali rapor için doğrulanmış satış verisi henüz hazır değil.")
      : failure("EMPTY_STORE", "Henüz veri içe aktarılmadı.");
    if (![SALES_MAPPING_VERSION, BUSINESS_MAPPING_VERSION].includes(snapshot.metadata.mappingVersion)) return failure("UNSUPPORTED_MAPPING", "Bu pakette satış hesabı için doğrulanmış ürün, birim ve KDV anlamları yok.");
    if (snapshot.app.some(row => row.kind === "adjustment" && row.applicability !== "reversed")) return failure("UNSUPPORTED_ADJUSTMENTS", "Satış düzeltmelerinin etkisi henüz desteklenmiyor. Düzeltilmiş toplam gösterilemiyor.");
    const context: ReportContext = { sessionId: randomUUID(), datasetId: snapshot.pin.datasetId, appRevision: snapshot.pin.appRevision, calculationVersion: SALES_CALCULATION_VERSION, period: request.period ?? snapshot.metadata.cutoff.slice(0, 7) };
    this.session = { snapshot, context, calculations: { sales: new Map(), gross: null, purchasing: null, monthly: null } };
    return this.query({ context, filters: { ...emptySalesFilters } });
  }
  monthly(context: ReportContext, control: OperationControl = {}): MonthlyResult {
    return structuredClone(this.monthlyCandidate(context, control));
  }
  monthlyCandidate(context: ReportContext, control: OperationControl = {}): MonthlyResult {
    const session = this.resolve(context);
    if (!session) return failure("STALE_CONTEXT", "Rapor sürümü geçerli değil. Raporu yeniden açın.");
    control.checkCancelled?.();
    const cached = session.calculations.monthly;
    if (cached) {
      control.onProgress?.("complete", 4, 4);
      return { status: "monthly", report: this.monthlyResponse(session, cached) };
    }
    const step = (phase: string, count: number) => { control.checkCancelled?.(); control.onProgress?.(phase, count, 4); };
    step("sales", 0);
    const sales = this.query({ context, filters: { ...emptySalesFilters } });
    if (sales.status !== "report") return sales;
    step("purchasing", 1);
    const purchasing = this.purchasingCandidate(context);
    if (purchasing.status !== "purchasing") return purchasing;
    step("operating", 2);
    const operating = this.operating({ context });
    if (operating.status !== "operating") return operating;
    const { snapshot } = session;
    step("evidence", 3);
    const components = this.sales(session, sales.view.from, sales.view.to).lines;
    const productProfit = buildProductProfit({ sales: this.sales(session, sales.view.from, sales.view.to), gross: this.gross(session, sales.view.from, sales.view.to), records: snapshot.records, lineage: snapshot.metadata!.lineage, period: context.period, coverage: snapshot.metadata!.coverage });
    const report = { format: "monthly-report-v2" as const, id: randomUUID(), context: { ...context },
      calculations: { report: "monthly-report-calc-v2", sales: SALES_CALCULATION_VERSION, costs: COST_CALCULATION_VERSION, purchasing: PURCHASING_CALCULATION_VERSION, operating: OPERATING_CALCULATION_VERSION },
      rules: { artifact: "esmer-market:monthly-v2", decimalPrecision: 100, rounding: "ROUND_HALF_UP", conventions: ["Sales: signed customer returns; completed sale-document basket denominator", "Comparisons: matched covered days; positive denominators only", "Cost: covered historical last-purchase estimate, no replacement fallback", "Operating: incurred date, classified costs, reviewed completeness", "Percentages: 2 decimal places; source and calculation values retain precision"] },
      state: sales.view.coverage === "partial" ? "open" as const : "provisional" as const,
      sales: sales.view, salesEvidence: { documents: snapshot.records.documents, lines: snapshot.records.lines, components },
      purchasing: purchasing.view, operating, appEvidence: [...snapshot.expenseHistory, ...snapshot.app.filter(row => row.kind !== "expense")], review: null, productProfit };
    step("complete", 4);
    session.calculations.monthly = report;
    return { status: "monthly", report: this.monthlyResponse(session, report) };
  }
  private resolve(context: ReportContext) {
    const current = this.session?.context;
    return current && current.sessionId === context.sessionId && current.datasetId === context.datasetId && current.appRevision === context.appRevision && current.calculationVersion === context.calculationVersion && current.period === context.period ? this.session! : null;
  }
  private monthlyResponse(session: NonNullable<SalesReports["session"]>, report: MonthlyReport): MonthlyReport {
    const active = this.store.availability();
    const pin = this.store.readPin();
    const sourceStale = active.status !== "ready" || active.store !== "loaded" || active.dataset.datasetId !== session.context.datasetId;
    const revisionStale = pin.appRevision !== session.context.appRevision;
    return { ...report,
      sales: { ...report.sales, stale: sourceStale || revisionStale },
      purchasing: { ...report.purchasing, stale: sourceStale || revisionStale },
      operating: { ...report.operating, stale: pin.datasetId !== session.context.datasetId || revisionStale },
    };
  }
  private sales(session: NonNullable<SalesReports["session"]>, from: string, to: string): SalesResult {
    const key = `${from}\u0000${to}`;
    let result = session.calculations.sales.get(key);
    if (!result) {
      result = calculateSales(session.snapshot.records, { mappingVersion: session.snapshot.metadata!.mappingVersion, from, to });
      session.calculations.sales.set(key, result);
    }
    return result;
  }
  private gross(session: NonNullable<SalesReports["session"]>, from: string, to: string): GrossResult {
    if (!session.calculations.gross) {
      session.calculations.gross = estimateGrossResult(session.snapshot.records, { mappingVersion: session.snapshot.metadata!.mappingVersion, from, to }, {
        sales: this.sales(session, from, to),
        allSales: this.sales(session, "1900-01-01", "9998-12-31"),
      });
    }
    return session.calculations.gross;
  }
  query({ context, filters }: QuerySalesRequest): SalesReportResult {
    const session = this.resolve(context);
    if (!session) return failure("STALE_CONTEXT", "Rapor sürümü geçerli değil. Raporu yeniden açın.");
    const { snapshot } = session, metadata = snapshot.metadata!;
    const period = range(snapshot, context.period);
    const current = this.sales(session, period.from, period.to);
    const lines = current.lines.filter(line => matches(line, filters));
    const metrics = totals(lines);
    const compare = (months: number): { comparison: Comparison; lines: SalesComponent[]; currentLines: SalesComponent[] } => {
      const comparisonPeriod = shifted(context.period, months);
      const candidateFrom = `${comparisonPeriod}-${period.from.slice(8)}`;
      const hasMatchingDays = candidateFrom <= endOfMonth(comparisonPeriod);
      const from = hasMatchingDays ? candidateFrom : endOfMonth(comparisonPeriod);
      const to = period.partial && `${comparisonPeriod}-${period.to.slice(8)}` < endOfMonth(comparisonPeriod) ? `${comparisonPeriod}-${period.to.slice(8)}` : endOfMonth(comparisonPeriod);
      const currentFrom = period.from;
      const currentTo = hasMatchingDays && period.partial && to.slice(8) < period.to.slice(8) ? `${context.period}-${to.slice(8)}` : period.to;
      const result = this.sales(session, from, to);
      const currentLines = lines.filter(line => line.date >= currentFrom && line.date <= currentTo);
      const currentMetrics = totals(currentLines);
      const available = hasMatchingDays && period.covered && metadata.coverage.complete && metadata.coverage.from <= from && metadata.coverage.to >= to && from <= to && currentFrom <= currentTo && current.complete && result.complete;
      const filtered = result.lines.filter(line => matches(line, filters)), previous = totals(filtered);
      return { lines: filtered, currentLines, comparison: { currentFrom, currentTo, from, to, available, netSales: available ? previous.netSales : null, netChange: available ? percentageChange(currentMetrics.netSales, previous.netSales) : null, transactionChange: available ? percentageChange(String(currentMetrics.saleDocumentCount), String(previous.saleDocumentCount)) : null, basketChange: available && currentMetrics.averageBasket !== null && previous.averageBasket !== null ? percentageChange(new Exact(currentMetrics.basketNumerator).div(currentMetrics.saleDocumentCount).toFixed(), new Exact(previous.basketNumerator).div(previous.saleDocumentCount).toFixed()) : null, quantityChange: { piece: available ? percentageChange(currentMetrics.quantities.piece, previous.quantities.piece) : null, kg: available ? percentageChange(currentMetrics.quantities.kg, previous.quantities.kg) : null } } };
    };
    const month = compare(-1), year = compare(-12);
    const breakdown = (kind: "category" | "product"): Breakdown[] => {
      const grouped = new Map<string, SalesComponent[]>();
      const currentGroups = new Map<string, string[]>();
      for (const line of month.currentLines) { const id = kind === "category" ? line.categoryId : line.productId; const values = currentGroups.get(id) ?? []; values.push(line.net); currentGroups.set(id, values); }
      const previousGroups = new Map<string, string[]>();
      for (const line of month.lines) { const id = kind === "category" ? line.categoryId : line.productId; const values = previousGroups.get(id) ?? []; values.push(line.net); previousGroups.set(id, values); }
      for (const line of lines) { const id = kind === "category" ? line.categoryId : line.productId; const group = grouped.get(id) ?? []; group.push(line); grouped.set(id, group); }
      return [...grouped].map(([id, group]) => {
        const total = totals(group);
        const previousNet = sum(previousGroups.get(id) ?? []);
        return { id, name: kind === "category" ? group[0].categoryName : group[0].productName, ...(kind === "product" ? { categoryId: group[0].categoryId } : {}), netSales: total.netSales, quantities: total.quantities, share: new Exact(metrics.netSales).gt(0) ? new Exact(total.netSales).div(metrics.netSales).times(100).toDecimalPlaces(2).toFixed() : null, previousMonthChange: month.comparison.available ? percentageChange(sum(currentGroups.get(id) ?? []), previousNet) : null };
      }).sort((a, b) => new Exact(b.netSales).cmp(a.netSales) || a.id.localeCompare(b.id, "en"));
    };
    const dailyGroups = new Map<string, string[]>();
    for (const line of lines) { const values = dailyGroups.get(line.date) ?? []; values.push(line.net); dailyGroups.set(line.date, values); }
    const dailyTotals = [...dailyGroups].sort(([a], [b]) => a.localeCompare(b)).map(([date, values]) => ({ date, netSales: sum(values) }));
    const maximum = dailyTotals.reduce((max, row) => Exact.max(max, new Exact(row.netSales).abs()), new Exact(0));
    const ids = new Set(lines.map(line => line.documentId));
    const transactionScopes = new Map<string, string[]>();
    for (const line of lines) { const values = transactionScopes.get(line.documentId) ?? []; values.push(line.net); transactionScopes.set(line.documentId, values); }
    const active = this.store.availability();
    return structuredClone({ status: "report", view: { context: { ...context }, cutoff: metadata.cutoff, importedAt: snapshot.importedAt, extractedAt: metadata.extractedAt, mappingVersion: metadata.mappingVersion, from: period.from, to: period.to, coverage: !period.overlap ? "unavailable" : period.partial ? "partial" : "complete", stale: active.status !== "ready" || active.store !== "loaded" || active.dataset.datasetId !== context.datasetId || this.store.readPin().appRevision !== context.appRevision, complete: current.complete && period.covered, filters: { ...filters }, metrics, comparisons: { month: month.comparison, year: year.comparison }, categories: breakdown("category"), products: breakdown("product"), daily: dailyTotals.map(row => ({ ...row, height: maximum.isZero() ? "0" : new Exact(row.netSales).abs().div(maximum).times(100).toDecimalPlaces(6).toFixed(), negative: new Exact(row.netSales).lt(0) })), transactions: current.documents.filter(doc => ids.has(doc.documentId)).map(doc => ({ ...doc, scopeNet: sum(transactionScopes.get(doc.documentId)!) })).sort((a, b) => b.date.localeCompare(a.date) || a.documentId.localeCompare(b.documentId)), exclusions: current.exclusions, warnings: [...snapshot.warnings] } } satisfies SalesReportResult);
  }
  purchasing({ context }: QueryPurchasingRequest): PurchasingReportResult {
    return structuredClone(this.purchasingCandidate(context));
  }
  private purchasingCandidate(context: ReportContext): PurchasingReportResult {
    const session = this.resolve(context);
    if (!session) return failure("STALE_CONTEXT", "Rapor sürümü geçerli değil. Raporu yeniden açın.");
    const { snapshot } = session, metadata = snapshot.metadata!, period = range(snapshot, context.period);
    const scope = { mappingVersion: metadata.mappingVersion, from: period.from, to: period.to, cutoff: metadata.cutoff };
    const active = this.store.availability();
    const gross = this.gross(session, period.from, period.to);
    const purchasing = session.calculations.purchasing ??= calculatePurchasing(snapshot.records, scope, { gross });
    const ids = new Set([...gross.covered, ...gross.excluded].map(row => row.documentId));
    for (const row of [...purchasing.history, ...purchasing.supplierReturns, ...purchasing.replacements]) row.sourceDocumentIds.forEach(id => ids.add(id));
    for (const row of purchasing.exclusions) ids.add(row.documentId);
    const lineIds = new Set(purchasing.inventory.map(row => row.lineId));
    for (const row of snapshot.records.lines) if (ids.has(row.documentId) && row.business?.historicalCost?.originalSaleLineId) lineIds.add(row.business.historicalCost.originalSaleLineId);
    for (const row of snapshot.records.lines) if (lineIds.has(row.id)) ids.add(row.documentId);
    const evidence = { documents: snapshot.records.documents.filter(row => ids.has(row.id)), lines: snapshot.records.lines.filter(row => ids.has(row.documentId)) };
    return { status: "purchasing", view: { coverage: !period.overlap ? "unavailable" : period.partial ? "partial" : "complete", costCalculationVersion: COST_CALCULATION_VERSION, purchasingCalculationVersion: PURCHASING_CALCULATION_VERSION, context: { ...context }, cutoff: metadata.cutoff, lineage: metadata.lineage, extractionId: metadata.extractionId, mappingVersion: metadata.mappingVersion, from: period.from, to: period.to, stale: active.status !== "ready" || active.store !== "loaded" || active.dataset.datasetId !== context.datasetId || this.store.readPin().appRevision !== context.appRevision, evidence, gross, purchasing } } satisfies PurchasingReportResult;
  }
  operating({ context }: QueryPurchasingRequest): OperatingReportResult {
    const session = this.resolve(context);
    if (!session) return failure("STALE_CONTEXT", "Rapor sürümü geçerli değil. Raporu yeniden açın.");
    const { snapshot } = session, period = range(snapshot, context.period);
    const sales = this.sales(session, period.from, period.to), gross = this.gross(session, period.from, period.to);
    const result = calculateOperatingResult({ gross, salesReconciled: sales.complete, periodCoverageComplete: period.covered && !period.partial, period: context.period, expenses: snapshot.app, confirmation: snapshot.app.find(row => row.kind === "confirmation" && row.entityId === `expense-complete:${context.period}`) ?? null, expenseRevision: relevantExpenseRevision(snapshot.expenseHistory, context.period) });
    const current = this.store.readPin();
    return structuredClone({ status: "operating", context: { ...context }, calculationVersion: OPERATING_CALCULATION_VERSION, grossCalculationVersion: COST_CALCULATION_VERSION, gross, expenseRevision: relevantExpenseRevision(snapshot.expenseHistory, context.period), expenseRecords: snapshot.app.filter(row => row.kind === "expense"), stale: current.datasetId !== context.datasetId || current.appRevision !== context.appRevision, result } satisfies OperatingReportResult);
  }
  inspect({ context, filters, documentId }: InspectSalesRequest): SalesDetailResult {
    const session = this.resolve(context);
    if (!session) return failure("STALE_CONTEXT", "Rapor sürümü geçerli değil. Raporu yeniden açın.");
    const { snapshot } = session, metadata = snapshot.metadata!;
    const period = range(snapshot, context.period);
    const doc = snapshot.records.documents.find(row => row.id === documentId && row.date >= period.from && row.date <= period.to);
    if (!doc) return failure("NOT_FOUND", "Belge bu raporda bulunamadı.");
    const result = this.sales(session, period.from, period.to);
    const total = result.documents.find(row => row.documentId === documentId);
    const lines = result.lines.filter(line => line.documentId === documentId).map(line => ({ ...line, matchesScope: matches(line, filters) }));
    const exclusion = result.exclusions.find(row => row.documentId === documentId)?.reason ?? null;
    return structuredClone({ status: "detail", detail: { context: { ...context }, cutoff: metadata.cutoff, lineage: metadata.lineage, importedAt: snapshot.importedAt, extractionId: metadata.extractionId, mappingVersion: metadata.mappingVersion, documentId, date: doc.date, kind: doc.kind, state: doc.sales?.state ?? "unknown", scopeNet: sum(lines.filter(line => line.matchesScope).map(line => line.net)), totals: { net: total?.net ?? "0", tax: total?.tax ?? "0", gross: total?.gross ?? "0" }, recorded: doc.sales ? { net: doc.sales.net, tax: doc.sales.tax, gross: doc.sales.gross } : null, reconciled: total?.reconciled ?? false, exclusion, lines, excludedLines: exclusion ? snapshot.records.lines.filter(line => line.documentId === documentId).map(line => ({ lineId: line.id, quantity: line.quantity, net: line.net, productName: line.sales?.productName ?? "Bilinmeyen ürün", reason: exclusion, input: line.sales ? { ...line.sales } : null })) : [] } } satisfies SalesDetailResult);
  }
}
