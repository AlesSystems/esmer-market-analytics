import type { MonthlyDisplayResult, ReportEvidencePage } from "../reports/display";
import type { ExpenseResult, ExpenseRequests, OperatingReportResult } from "../expenses/contracts";
import type { QueryPurchasingRequest, PurchasingReportResult, OpenSalesRequest, QuerySalesRequest, InspectSalesRequest, SalesReportResult, SalesDetailResult } from "../reports/contracts";
import type { ReportRequestMap, ReportResponse, ReportHistoryResult, ReportDifference, SalesFailure } from "../reports/contracts";
import type { RecoveryResult, RecoveryServiceRequest } from "../recovery/contracts";
export type OperationStatus = { status: "idle" } | { status: "operation"; id: number; operation: "importPackage" | "openMonthly" | "queryMonthly"; phase: string; completed: number; total: number; cancelling: boolean };
export type JobOutcome = { status: "busy" } | { status: "cancelled" };
export type ReportExportResult = SalesFailure | { status: "saved" } | { status: "cancelled" } | { status: "failed"; code: "REPORT_EXPORT_FAILED"; message: string };
export type ReportServiceRequest = { [K in keyof ReportRequestMap]: { operation: K; payload: ReportRequestMap[K] } }[keyof ReportRequestMap];
export type ImportErrorCode = "INVALID_PACKAGE" | "IMPORT_FAILED" | "STORAGE_FULL" | "INTERRUPTED" | "INVALID_CANDIDATE";
export type DatasetMetadata = { datasetId: string; cutoff: string; extractedAt: string; counts: { documents: number; lines: number; suppliers: number }; warnings: string[] };
export type ImportHistoryEntry = { id: string; createdAt: string; state: string; cutoff: string | null; errorCode: string | null };
export type Availability =
  | { status: "ready"; store: "empty"; liveConnection: "disabled"; lastImportError?: ImportErrorCode; recentImports?: ImportHistoryEntry[] }
  | { status: "ready"; store: "loaded"; liveConnection: "disabled"; dataset: DatasetMetadata; lastImportError?: ImportErrorCode; recentImports?: ImportHistoryEntry[] }
  | { status: "unavailable"; code: "SERVICE_UNAVAILABLE"; message: string };
export type RequestError = {
  status: "rejected";
  code: "UNTRUSTED_SENDER" | "UNKNOWN_OPERATION" | "INVALID_PAYLOAD";
  message: string;
};
export type ImportOutcome =
  | { status: "active" | "unchanged" | "historical"; datasetId: string }
  | { status: "cancelled" }
  | { status: "failed"; code: ImportErrorCode | "SERVICE_UNAVAILABLE"; message: string };
export interface DesktopApi {
  getRecoveryStatus(): Promise<RecoveryResult | RequestError>;
  setupRecovery(): Promise<RecoveryResult | RequestError>;
  backupNow(): Promise<RecoveryResult | RequestError>;
  pinBackup(request: {backupId: string; pinned: boolean}): Promise<RecoveryResult | RequestError>;
  prepareRestore(): Promise<RecoveryResult | RequestError>;
  confirmRestore(request: {token: string}): Promise<RecoveryResult | RequestError>;
  cancelRestore(request: {token: string}): Promise<RecoveryResult | RequestError>;
  openMonthly(request: ReportRequestMap["openMonthly"]): Promise<MonthlyDisplayResult | JobOutcome | RequestError>;
  queryMonthly(request: ReportRequestMap["queryMonthly"]): Promise<MonthlyDisplayResult | JobOutcome | RequestError>;
  listReportVersions(request: ReportRequestMap["listReportVersions"]): Promise<ReportHistoryResult | SalesFailure | RequestError>;
  readReportVersion(request: ReportRequestMap["readReportVersion"]): Promise<MonthlyDisplayResult | RequestError>;
  compareReportVersion(request: ReportRequestMap["compareReportVersion"]): Promise<ReportDifference | SalesFailure | RequestError>;
  acceptReportVersion(request: ReportRequestMap["acceptReportVersion"]): Promise<MonthlyDisplayResult | RequestError>;
  exportReportVersion(request: ReportRequestMap["exportReportVersion"]): Promise<ReportExportResult | RequestError>;
  readReportEvidence(request: ReportRequestMap["readReportEvidence"]): Promise<ReportEvidencePage | SalesFailure | RequestError>;
  readReportPurchasing(request: ReportRequestMap["readReportPurchasing"]): Promise<PurchasingReportResult | RequestError>;
  getOperationStatus(): Promise<OperationStatus | RequestError>;
  cancelOperation(request: {id: number}): Promise<{status: "cancelling"} | {status: "idle"} | RequestError>;
  saveExpenseTemplate(): Promise<ExpenseResult | RequestError>;
  previewExpenses(): Promise<ExpenseResult | RequestError>;
  confirmExpenses(request: ExpenseRequests["confirmExpenses"]): Promise<ExpenseResult | RequestError>;
  queryExpenses(request: ExpenseRequests["queryExpenses"]): Promise<ExpenseResult | RequestError>;
  correctExpense(request: ExpenseRequests["correctExpense"]): Promise<ExpenseResult | RequestError>;
  restoreExpense(request: ExpenseRequests["restoreExpense"]): Promise<ExpenseResult | RequestError>;
  confirmExpenseCompleteness(request: ExpenseRequests["confirmExpenseCompleteness"]): Promise<ExpenseResult | RequestError>;
  queryOperating(request: ExpenseRequests["queryOperating"]): Promise<OperatingReportResult | RequestError>;
  queryPurchasing(request: QueryPurchasingRequest): Promise<PurchasingReportResult | RequestError>;
  openSales(request: OpenSalesRequest): Promise<SalesReportResult | RequestError>;
  querySales(request: QuerySalesRequest): Promise<SalesReportResult | RequestError>;
  inspectSales(request: InspectSalesRequest): Promise<SalesDetailResult | RequestError>;
  getAvailability(): Promise<Availability | RequestError>;
  importPackage(): Promise<ImportOutcome | JobOutcome | RequestError>;
}
export type ExpenseServiceRequest = { [K in Exclude<keyof ExpenseRequests, "saveExpenseTemplate" | "previewExpenses">]: { operation: K; payload: ExpenseRequests[K] } }[Exclude<keyof ExpenseRequests, "saveExpenseTemplate" | "previewExpenses">] | { operation: "previewExpenses"; bytes: Uint8Array };
export type ServiceRequest = { id: number; job?: { id: number; cancellation: SharedArrayBuffer } } & (ReportServiceRequest | ExpenseServiceRequest | RecoveryServiceRequest | { operation: "queryPurchasing"; payload: QueryPurchasingRequest } | { operation: "getAvailability" } | { operation: "importPackage"; bytes: Uint8Array } | { operation: "openSales"; payload: OpenSalesRequest } | { operation: "querySales"; payload: QuerySalesRequest } | { operation: "inspectSales"; payload: InspectSalesRequest });
export type ServiceResponse = { id: number; result: ReportResponse | { status: "export"; bytes: Uint8Array } | ReportExportResult | JobOutcome | RequestError | ExpenseResult | OperatingReportResult | PurchasingReportResult | Availability | ImportOutcome | SalesReportResult | SalesDetailResult | RecoveryResult };

export type ServiceProgress = { jobId: number; phase: string; completed: number; total: number };
