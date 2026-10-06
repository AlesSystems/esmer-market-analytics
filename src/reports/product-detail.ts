import { projectProductProfitScopeV1, type ProductProfitLine } from "../analytics/product-profit";
import { canonical, type DocumentRecord, type LineRecord } from "../source/package";
import type { MonthlyReport, MonthlyReportV2, SalesFailure } from "./contracts";

export type ProductUnavailable = SalesFailure;
export type ProductDetail = {
  status: "product"; reportId: string; productId: string; lineage: string; period: string; cutoff: string;
  summary: MonthlyReportV2["productProfit"]["products"][number];
  daily: MonthlyReportV2["productProfit"]["daily"];
  calculations: MonthlyReport["calculations"]; rules: MonthlyReport["rules"]; warnings: string[];
  sourceCoverage: MonthlyReportV2["productProfit"]["summary"]["salesCoverage"];
};
export type ProductDetailResult = ProductDetail | ProductUnavailable;
export type ProductDependency = {
  status: "product-dependency"; reportId: string; productId: string; returnLineId: string;
  offset: number; total: number; originalLineId: string; document: DocumentRecord;
  original: LineRecord; rows: LineRecord[]; returnOutcome: ProductProfitLine;
};
export type ProductDependencyResult = ProductDependency | ProductUnavailable;
const unavailable = (code: SalesFailure["code"], message: string): ProductUnavailable => ({ status: "unavailable", code, message });

function supported(report: MonthlyReport): report is MonthlyReportV2 {
  return report.format === "monthly-report-v2" && report.productProfit.version === "monthly-product-profit-v1"
    && report.calculations.report === "monthly-report-calc-v2" && report.calculations.sales === "synthetic-sales-calc-v1"
    && report.calculations.costs === "synthetic-cost-calc-v1" && report.rules.artifact === "esmer-market:monthly-v2"
    && report.rules.decimalPrecision === 100 && report.rules.rounding === "ROUND_HALF_UP";
}
export function reportProduct(report: MonthlyReport, productId: string): ProductDetailResult {
  if (report.format !== "monthly-report-v2") return unavailable("PRODUCT_PROFIT_UNAVAILABLE", "Bu rapor sürümünde ürün kârlılığı ayrıntısı yok.");
  if (!supported(report)) return unavailable("UNSUPPORTED_PROJECTION_VERSION", "Bu raporun kayıtlı hesaplama yöntemi desteklenmiyor.");
  const profit = report.productProfit, products = profit.products.filter(row => row.productId === productId);
  if (!products.length) return unavailable("NOT_FOUND", "Ürün bu raporda bulunamadı.");
  const lines = profit.lines.filter(row => row.productId === productId);
  const days = new Date(Date.UTC(Number(profit.period.slice(0, 4)), Number(profit.period.slice(5, 7)), 0)).getUTCDate();
  const knownDays = new Set(profit.daily.map(day => day.date));
  const valid = products.length === 1 && profit.period === report.context.period && profit.lineage === report.purchasing.lineage
    && profit.daily.length === days && knownDays.size === days
    && profit.daily.every((day, index) => day.date === `${profit.period}-${String(index + 1).padStart(2, "0")}`)
    && new Set(lines.map(row => row.lineId)).size === lines.length
    && lines.every(row => knownDays.has(row.date) && (row.costReason !== null || row.cost !== null));
  if (!valid) return unavailable("MISSING_STORED_FACTS", "Raporun kayıtlı ürün kanıtları eksik veya tutarsız.");
  const costSupported = report.purchasing.gross.status === "ready";
  const { productId: ignoredId, displayName: ignoredName, displayStatus: ignoredStatus, ...storedScope } = products[0];
  void ignoredId; void ignoredName; void ignoredStatus;
  if (canonical(projectProductProfitScopeV1(lines, costSupported)) !== canonical(storedScope)) return unavailable("MISSING_STORED_FACTS", "Ürün toplamı kayıtlı satırlarla uzlaşmıyor.");
  const daily = profit.daily.map(day => {
    const group = lines.filter(row => row.date === day.date), values = projectProductProfitScopeV1(group, costSupported);
    const status = !costSupported || day.sourceCoverage === "unavailable" || day.sourceCoverage !== "complete" && !group.length || group.length > 0 && values.coveredCount === 0 ? "unavailable" : group.length ? "ready" : "empty";
    return { ...values, ...(status === "unavailable" && !group.length ? { netSales: null, coveredSales: null, coveredCost: null, coveredGrossProfit: null, coveredMarginPercent: null, costCoveragePercent: null } : {}), date: day.date, sourceCoverage: day.sourceCoverage, status, trend: status === "unavailable" && !group.length ? null : values.coveredGrossProfit ?? (status === "empty" ? "0" : null) };
  }) satisfies ProductDetail["daily"];
  return structuredClone({ status: "product", reportId: report.id, productId, lineage: profit.lineage, period: profit.period, cutoff: report.sales.cutoff,
    summary: products[0], daily, calculations: report.calculations, rules: report.rules, warnings: [...report.sales.warnings, ...profit.summary.warnings], sourceCoverage: profit.summary.salesCoverage });
}
export function productDependencySelector(report: MonthlyReportV2, productId: string) {
  const returns = new Map<string, ProductProfitLine[]>();
  for (const row of report.productProfit.lines) if (row.productId === productId && row.kind === "customer-return") {
    const group = returns.get(row.lineId) ?? []; group.push(row); returns.set(row.lineId, group);
  }
  const evidence = report.purchasing.evidence;
  const lines = new Map<string, LineRecord[]>(), documents = new Map<string, DocumentRecord[]>(), documentLines = new Map<string, LineRecord[]>();
  for (const row of evidence.lines) {
    const group = lines.get(row.id) ?? []; group.push(row); lines.set(row.id, group);
    const documentGroup = documentLines.get(row.documentId) ?? []; documentGroup.push(row); documentLines.set(row.documentId, documentGroup);
  }
  for (const row of evidence.documents) { const group = documents.get(row.id) ?? []; group.push(row); documents.set(row.id, group); }
  const duplicateDocuments = new Set<string>();
  for (const group of lines.values()) if (group.length > 1) for (const row of group) duplicateDocuments.add(row.documentId);
  return (returnLineId: string, offset: number): ProductDependencyResult => {
    const matched = returns.get(returnLineId);
    if (matched?.length !== 1 || !matched[0].originalSaleLineId) return unavailable("NOT_FOUND", "Bu iadenin kayıtlı özgün satış bağlantısı yok.");
    const outcome = matched[0], originals = lines.get(outcome.originalSaleLineId!);
    if (originals?.length !== 1) return unavailable("MISSING_STORED_FACTS", "Özgün satış kanıtı bu raporda saklanmamış.");
    const original = originals[0], matchedDocuments = documents.get(original.documentId);
    if (matchedDocuments?.length !== 1 || matchedDocuments[0].kind !== "sale" || original.sales?.productId !== productId || duplicateDocuments.has(original.documentId)) return unavailable("MISSING_STORED_FACTS", "Özgün satış kanıtı tutarsız.");
    const rows = documentLines.get(original.documentId)!;
    return { status: "product-dependency", reportId: report.id, productId, returnLineId, offset, total: rows.length, originalLineId: original.id,
      document: matchedDocuments[0], original, rows: rows.slice(offset, offset + 100), returnOutcome: outcome };
  };
}
export function reportProductDependency(report: MonthlyReport, request: { productId: string; returnLineId: string; offset: number }): ProductDependencyResult {
  const detail = reportProduct(report, request.productId);
  if (detail.status !== "product") return detail;
  if (report.format !== "monthly-report-v2") return unavailable("PRODUCT_PROFIT_UNAVAILABLE", "Ürün ayrıntısı yok.");
  return structuredClone(productDependencySelector(report, request.productId)(request.returnLineId, request.offset));
}
