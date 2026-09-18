export type DatasetMetadata = { datasetId: string; cutoff: string; extractedAt: string; counts: { documents: number; lines: number; suppliers: number }; warnings: string[] };
export type Availability =
  | { status: "ready"; store: "empty"; liveConnection: "disabled" }
  | { status: "ready"; store: "loaded"; liveConnection: "disabled"; dataset: DatasetMetadata }
  | { status: "unavailable"; code: "SERVICE_UNAVAILABLE"; message: string };
export type RequestError = {
  status: "rejected";
  code: "UNTRUSTED_SENDER" | "UNKNOWN_OPERATION" | "INVALID_PAYLOAD";
  message: string;
};
export type ImportOutcome =
  | { status: "active" | "unchanged" | "historical"; datasetId: string }
  | { status: "cancelled" }
  | { status: "failed"; code: "INVALID_PACKAGE" | "IMPORT_FAILED" | "STORAGE_FULL" | "INTERRUPTED" | "INVALID_CANDIDATE" | "SERVICE_UNAVAILABLE"; message: string };
export interface DesktopApi {
  getAvailability(): Promise<Availability | RequestError>;
  importPackage(): Promise<ImportOutcome | RequestError>;
}
export type ServiceRequest = { id: number } & ({ operation: "getAvailability" } | { operation: "importPackage"; bytes: Uint8Array });
export type ServiceResponse = { id: number; result: Availability | ImportOutcome };
