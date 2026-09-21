import type { ExpenseResult, ExpenseRequests, OperatingReportResult } from "../expenses/contracts";
import type { QueryPurchasingRequest, PurchasingReportResult, OpenSalesRequest, QuerySalesRequest, InspectSalesRequest, SalesReportResult, SalesDetailResult } from "../reports/contracts";
export type ImportErrorCode = "INVALID_PACKAGE" | "IMPORT_FAILED" | "STORAGE_FULL" | "INTERRUPTED" | "INVALID_CANDIDATE";
export type DatasetMetadata = { datasetId: string; cutoff: string; extractedAt: string; counts: { documents: number; lines: number; suppliers: number }; warnings: string[] };
export type Availability =
  | { status: "ready"; store: "empty"; liveConnection: "disabled"; lastImportError?: ImportErrorCode }
  | { status: "ready"; store: "loaded"; liveConnection: "disabled"; dataset: DatasetMetadata; lastImportError?: ImportErrorCode }
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
  importPackage(): Promise<ImportOutcome | RequestError>;
}
export type ExpenseServiceRequest = { [K in Exclude<keyof ExpenseRequests, "saveExpenseTemplate" | "previewExpenses">]: { operation: K; payload: ExpenseRequests[K] } }[Exclude<keyof ExpenseRequests, "saveExpenseTemplate" | "previewExpenses">] | { operation: "previewExpenses"; bytes: Uint8Array };
export type ServiceRequest = { id: number } & (ExpenseServiceRequest | { operation: "queryPurchasing"; payload: QueryPurchasingRequest } | { operation: "getAvailability" } | { operation: "importPackage"; bytes: Uint8Array } | { operation: "openSales"; payload: OpenSalesRequest } | { operation: "querySales"; payload: QuerySalesRequest } | { operation: "inspectSales"; payload: InspectSalesRequest });
export type ServiceResponse = { id: number; result: ExpenseResult | OperatingReportResult | PurchasingReportResult | Availability | ImportOutcome | SalesReportResult | SalesDetailResult };
