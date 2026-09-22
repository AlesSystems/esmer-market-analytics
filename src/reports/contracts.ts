import type { SalesLine } from "../source/package";
import type { SalesComponent, SalesDocumentResult, SalesExclusion } from "../analytics/sales";
export type ReportContext = { sessionId: string; datasetId: string; appRevision: number; calculationVersion: string; period: string };
export type SalesFilters = { categoryId: string | null; productId: string | null; search: string; kind: "all" | "sale" | "customer-return" };
export type ReportMetrics = { netSales: string; tax: string; gross: string; saleDocumentCount: number; basketNumerator: string; averageBasket: string | null; quantities: { piece: string; kg: string } };
export type Comparison = { currentFrom: string; currentTo: string; from: string; to: string; available: boolean; netSales: string | null; netChange: string | null; transactionChange: string | null; basketChange: string | null; quantityChange: { piece: string | null; kg: string | null } };
export type Breakdown = { id: string; name: string; categoryId?: string; netSales: string; share: string | null; previousMonthChange: string | null; quantities: { piece: string; kg: string } };
export type Transaction = SalesDocumentResult & { scopeNet: string };
export type SalesView = { context: ReportContext; cutoff: string; importedAt: string | null; extractedAt: string; mappingVersion: string; from: string; to: string; coverage: "complete" | "partial" | "unavailable"; stale: boolean; complete: boolean; filters: SalesFilters; metrics: ReportMetrics; comparisons: { month: Comparison; year: Comparison }; categories: Breakdown[]; products: Breakdown[]; daily: { date: string; netSales: string; height: string; negative: boolean }[]; transactions: Transaction[]; exclusions: SalesExclusion[]; warnings: string[] };
export type SalesDetail = { context: ReportContext; cutoff: string; lineage: string; importedAt: string | null; extractionId: string; mappingVersion: string; documentId: string; date: string; kind: string; state: string; scopeNet: string; totals: { net: string; tax: string; gross: string }; recorded: { net: string; tax: string; gross: string } | null; reconciled: boolean; exclusion: string | null; lines: (SalesComponent & { matchesScope: boolean })[]; excludedLines: { lineId: string; quantity: string; net: string; productName: string; reason: string; input: SalesLine | null }[] };
export type SalesFailure = { status: "unavailable"; code: "EMPTY_STORE" | "UNSUPPORTED_MAPPING" | "STALE_CONTEXT" | "NOT_FOUND" | "UNSUPPORTED_ADJUSTMENTS" | "SERVICE_UNAVAILABLE" | "REPORT_NOT_FOUND" | "INCOMPARABLE_REPORTS" | "REVIEW_CONFLICT" | "REPORT_TOO_LARGE" | "INVALID_REVIEW" | "EXCEL_ROW_LIMIT" | "EXCEL_COLUMN_LIMIT" | "EXCEL_CELL_LIMIT"; message: string };
export type SalesReportResult = { status: "report"; view: SalesView } | SalesFailure;
export type SalesDetailResult = { status: "detail"; detail: SalesDetail } | SalesFailure;
export type OpenSalesRequest = { period: string | null };
export type QuerySalesRequest = { context: ReportContext; filters: SalesFilters };
export type InspectSalesRequest = QuerySalesRequest & { documentId: string };
export const emptySalesFilters: SalesFilters = { categoryId: null, productId: null, search: "", kind: "all" };

export type QueryPurchasingRequest = { context: ReportContext };
export type PurchasingView = { coverage: "complete" | "partial" | "unavailable"; costCalculationVersion: string; purchasingCalculationVersion: string; context: ReportContext; cutoff: string; lineage: string; extractionId: string; mappingVersion: string; from: string; to: string; stale: boolean; evidence: { documents: import("../source/package").DocumentRecord[]; lines: import("../source/package").LineRecord[] }; gross: import("../analytics/costs").GrossResult; purchasing: import("../analytics/purchasing").PurchasingResult };
export type PurchasingReportResult = { status: "purchasing"; view: PurchasingView } | SalesFailure;

export type OperationControl = { checkCancelled?: () => void; onProgress?: (phase: string, completed: number, total: number) => void };
export type MonthlyReport = {
  format: "monthly-report-v1"; id: string; context: ReportContext;
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
export type MonthlyResult = { status: "monthly"; report: MonthlyReport } | SalesFailure;
export type ReportSummary = { id: string; period: string; datasetId: string; appRevision: number; acceptedAt: string; reason: string };
export type ReportHistoryResult = { status: "history"; reports: ReportSummary[] };
export type ReportDifference = { status: "difference"; candidateId: string; acceptedId: string; changes: { path: string; before: string | number | boolean | null; after: string | number | boolean | null; delta: string | null }[] };
export type ReportRequestMap = {
  openMonthly: OpenSalesRequest;
  queryMonthly: { context: ReportContext };
  listReportVersions: { period: string };
  readReportVersion: { reportId: string };
  compareReportVersion: { candidateId: string; acceptedId: string };
  acceptReportVersion: { candidateId: string; previousAcceptedId: string | null; reason: string };
  exportReportVersion: { reportId: string };
};
export type ReportResponse = MonthlyResult | ReportHistoryResult | ReportDifference;
