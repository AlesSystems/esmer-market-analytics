import type { SalesComponent, SalesDocumentResult, SalesExclusion } from "../analytics/sales";
export type ReportContext = { sessionId: string; datasetId: string; appRevision: number; calculationVersion: string; period: string };
export type SalesFilters = { categoryId: string | null; productId: string | null; search: string; kind: "all" | "sale" | "customer-return" };
export type ReportMetrics = { netSales: string; tax: string; gross: string; saleDocumentCount: number; basketNumerator: string; averageBasket: string | null; quantities: { piece: string; kg: string } };
export type Comparison = { currentFrom: string; currentTo: string; from: string; to: string; available: boolean; netSales: string | null; netChange: string | null; transactionChange: string | null; basketChange: string | null; quantityChange: { piece: string | null; kg: string | null } };
export type Breakdown = { id: string; name: string; categoryId?: string; netSales: string; share: string | null; previousMonthChange: string | null; quantities: { piece: string; kg: string } };
export type Transaction = SalesDocumentResult & { scopeNet: string };
export type SalesView = { context: ReportContext; cutoff: string; importedAt: string | null; extractedAt: string; mappingVersion: string; from: string; to: string; coverage: "complete" | "partial" | "unavailable"; stale: boolean; complete: boolean; filters: SalesFilters; metrics: ReportMetrics; comparisons: { month: Comparison; year: Comparison }; categories: Breakdown[]; products: Breakdown[]; daily: { date: string; netSales: string; height: string; negative: boolean }[]; transactions: Transaction[]; exclusions: SalesExclusion[]; warnings: string[] };
export type SalesFailure = { status: "unavailable"; code: "EMPTY_STORE" | "UNSUPPORTED_MAPPING" | "STALE_CONTEXT" | "NOT_FOUND" | "UNSUPPORTED_ADJUSTMENTS" | "SERVICE_UNAVAILABLE" | "REPORT_NOT_FOUND" | "PRODUCT_PROFIT_UNAVAILABLE" | "INCOMPARABLE_REPORTS" | "REVIEW_CONFLICT" | "REPORT_TOO_LARGE" | "INVALID_REVIEW" | "EXCEL_ROW_LIMIT" | "EXCEL_COLUMN_LIMIT" | "EXCEL_CELL_LIMIT" | "UNSUPPORTED_PROJECTION_VERSION" | "MISSING_STORED_FACTS"; message: string };

export type PurchasingView = { coverage: "complete" | "partial" | "unavailable"; costCalculationVersion: string; purchasingCalculationVersion: string; context: ReportContext; cutoff: string; lineage: string; extractionId: string; mappingVersion: string; from: string; to: string; stale: boolean; evidence: { documents: import("../source/package").DocumentRecord[]; lines: import("../source/package").LineRecord[] }; gross: import("../analytics/costs").GrossResult; purchasing: Record<string, unknown> };


export type OperationControl = { checkCancelled?: () => void; onProgress?: (phase: string, completed: number, total: number) => void };
type MonthlyBase = {
  id: string; context: ReportContext;
  calculations: { report: string; sales: string; costs: string; purchasing: string; operating: string };
  rules: { artifact: string; decimalPrecision: number; rounding: string; conventions: string[] };
  state: "open" | "provisional";
  sales: SalesView;
  salesEvidence: { documents: import("../source/package").DocumentRecord[]; lines: import("../source/package").LineRecord[]; components: SalesComponent[] };
  purchasing: PurchasingView;
  operating: Extract<import("../expenses/contracts").OperatingReportResult, {status: "operating"}>;
  appEvidence: import("../store/revisions").AppRecord[];
  review: { acceptedAt: string; reason: string; previousAcceptedId: string | null } | null;
};
export type MonthlyReportV1 = MonthlyBase & { format: "monthly-report-v1" };
export type MonthlyReportV2 = MonthlyBase & { format: "monthly-report-v2"; productProfit: import("../analytics/product-profit").ProductProfit };
export type MonthlyReport = MonthlyReportV1 | MonthlyReportV2;
export type ReportSummary = { cutoff: string; id: string; period: string; datasetId: string; appRevision: number; acceptedAt: string; reason: string };
