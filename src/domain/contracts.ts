import type { OpenSalesRequest, QuerySalesRequest, InspectSalesRequest, SalesReportResult, SalesDetailResult } from "../reports/contracts";
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
  openSales(request: OpenSalesRequest): Promise<SalesReportResult | RequestError>;
  querySales(request: QuerySalesRequest): Promise<SalesReportResult | RequestError>;
  inspectSales(request: InspectSalesRequest): Promise<SalesDetailResult | RequestError>;
  getAvailability(): Promise<Availability | RequestError>;
  importPackage(): Promise<ImportOutcome | RequestError>;
}
export type ServiceRequest = { id: number } & ({ operation: "getAvailability" } | { operation: "importPackage"; bytes: Uint8Array } | { operation: "openSales"; payload: OpenSalesRequest } | { operation: "querySales"; payload: QuerySalesRequest } | { operation: "inspectSales"; payload: InspectSalesRequest });
export type ServiceResponse = { id: number; result: Availability | ImportOutcome | SalesReportResult | SalesDetailResult };
