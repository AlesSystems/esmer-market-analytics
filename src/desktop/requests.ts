import {validSelectedMonth} from "../domain/month";
import {validEstimateRequest,type EstimateRequest,type EstimateExportRequest,type EstimateResult} from "../source/estimate";
import {validSourceQuery, type SourceQuery, type SourceWorkspaceResult} from "../source/workspace";
import { validSourcePreviewRequest, type SourcePreviewRequest, type SourcePreviewResult } from "../source/raw-package";
import type { LiveResult, PreferencesPatch, PreferencesResult } from "../domain/contracts";
import { validPreferencesPatch } from "./preferences";
import type { ReportRequestMap, ReportResponse } from "../reports/contracts";
import type { JobOutcome, OperationStatus, ReportExportResult } from "../domain/contracts";
import type { ExpenseRequests, ExpenseResult, OperatingReportResult } from "../expenses/contracts";
import { validCreateExpenseRequest, validFields, validPeriod } from "../expenses/validation";
import type { PurchaseDocumentsRequest, PurchaseDocumentRequest, PurchaseDocumentsResult, PurchaseDocumentResult, QueryPurchasingRequest, PurchasingReportResult, OpenSalesRequest, QuerySalesRequest, InspectSalesRequest, SalesReportResult, SalesDetailResult } from "../reports/contracts";
import { validId } from "../store/revisions";
import type { Availability, ImportOutcome, RequestError } from "../domain/contracts";
import { recoveryOperations } from "../recovery/contracts";
export const APP_URL = "esmer://app/index.html";
function exact(value: unknown, fields: string[]): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === fields.sort().join();
}
const period = validSelectedMonth;
export function validReportRequest(operation: string, value: unknown): boolean {
  if (operation === "queryPurchaseDocuments" || operation === "inspectPurchaseDocument") {
    if (!exact(value, operation === "queryPurchaseDocuments" ? ["context", "offset", "search"] : ["context", "offset", "documentId"])) return false;
    return Number.isSafeInteger(value.offset) && Number(value.offset) >= 0 && Number(value.offset) <= 100000 && Number(value.offset) % 50 === 0
      && (operation === "queryPurchaseDocuments" ? typeof value.search === "string" && value.search.length <= 160 && !/[\u0000-\u001f\u007f]/.test(value.search) : validId(value.documentId))
      && validReportRequest("querySales", {context: value.context, filters: {categoryId:null, productId:null, search:"", kind:"all"}});
  }
  if (operation === "openSales" || operation === "openMonthly") return exact(value, ["period"]) && (value.period === null || period(value.period));
  if ((operation === "queryPurchasing" || operation === "queryOperating" || operation === "queryMonthly")) return exact(value, ["context"]) && validReportRequest("querySales", { context: value.context, filters: { categoryId: null, productId: null, search: "", kind: "all" } });
  if (!exact(value, operation === "inspectSales" ? ["context", "filters", "documentId"] : ["context", "filters"])) return false;
  if (operation === "inspectSales" && !validId(value.documentId)) return false;
  const c = value.context, f = value.filters;
  return exact(c, ["sessionId", "datasetId", "appRevision", "calculationVersion", "period"]) && validId(c.sessionId) && validId(c.datasetId) && validId(c.calculationVersion) && period(c.period) && Number.isSafeInteger(c.appRevision) && Number(c.appRevision) >= 0
    && exact(f, ["categoryId", "productId", "search", "kind"]) && (f.categoryId === null || validId(f.categoryId)) && (f.productId === null || validId(f.productId)) && typeof f.search === "string" && f.search.length <= 160 && !/[\u0000-\u001f\u007f]/.test(f.search) && ["all", "sale", "customer-return"].includes(String(f.kind)) && typeof f.kind === "string";
}
export const monthlyOperations = ["openMonthly", "queryMonthly", "listReportVersions", "readReportVersion", "compareReportVersion", "acceptReportVersion", "exportReportVersion", "readReportEvidence", "readReportProducts", "readReportPurchasing", "readReportProduct", "readReportProductDependency", "exportReportProduct"];
export function validMonthlyRequest(operation: string, value: unknown): boolean {
  if (operation === "readReportProduct" || operation === "exportReportProduct") return exact(value, ["reportId", "productId"]) && validId(value.reportId) && validId(value.productId);
  if (operation === "readReportProductDependency") return exact(value, ["reportId", "productId", "returnLineId", "offset"]) && validId(value.reportId) && validId(value.productId) && validId(value.returnLineId) && Number.isSafeInteger(value.offset) && Number(value.offset) >= 0;
  if (operation === "readReportProducts") return exact(value, ["reportId", "search", "sort", "direction", "offset"])
    && validId(value.reportId) && typeof value.search === "string" && value.search.length <= 160 && !/[\u0000-\u001f\u007f]/.test(value.search)
    && typeof value.sort === "string" && ["profit", "name", "netSales", "coverage"].includes(value.sort)
    && typeof value.direction === "string" && ["asc", "desc"].includes(value.direction)
    && Number.isSafeInteger(value.offset) && Number(value.offset) >= 0;
  if (operation === "readReportEvidence") return (exact(value, ["reportId", "section", "offset", "search", "range", "documentId"]) || exact(value, ["reportId", "section", "offset", "search", "range", "documentId", "productId"]))
    && validId(value.reportId) && typeof value.section === "string" && ["components", "exclusions", "documents", "lines", "product-profit"].includes(value.section)
    && Number.isSafeInteger(value.offset) && Number(value.offset) >= 0
    && typeof value.search === "string" && value.search.length <= 160 && !/[\u0000-\u001f\u007f]/.test(value.search)
    && typeof value.range === "string" && ["current", "month", "year"].includes(value.range)
    && (value.section === "lines" ? validId(value.documentId) : (value.section === "product-profit" || value.section === "documents") ? value.documentId === null || validId(value.documentId) : value.documentId === null)
    && (value.section === "product-profit" ? (!("productId" in value) || value.productId === null || validId(value.productId)) && value.range === "current" : !("productId" in value));
  if (operation === "openMonthly" || operation === "queryMonthly") return validReportRequest(operation, value);
  if (operation === "listReportVersions") return exact(value, ["period"]) && period(value.period);
  if (operation === "readReportVersion" || operation === "exportReportVersion" || operation === "readReportPurchasing") return exact(value, ["reportId"]) && validId(value.reportId);
  if (operation === "compareReportVersion") return exact(value, ["candidateId", "acceptedId"]) && validId(value.candidateId) && validId(value.acceptedId);
  if (operation === "acceptReportVersion") return exact(value, ["candidateId", "previousAcceptedId", "reason"]) && validId(value.candidateId) && (value.previousAcceptedId === null || validId(value.previousAcceptedId)) && typeof value.reason === "string" && !!value.reason.trim() && value.reason.length <= 1000 && !/[\u0000-\u001f\u007f]/.test(value.reason);
  return false;
}
export type MonthlyService = (operation: keyof ReportRequestMap, payload: ReportRequestMap[keyof ReportRequestMap]) => Promise<ReportResponse | ReportExportResult | JobOutcome | RequestError>;
export type JobService = {status: () => OperationStatus; cancel: (request: {id: number}) => {status: "cancelling"} | {status: "idle"}};
export type LiveService = (operation: string, payload: null | {enabled: boolean}) => Promise<LiveResult>;
export const liveOperations = ["getLiveStatus", "configureLiveSource", "setLiveEnabled", "refreshLiveSource"];
export function validLiveRequest(operation: string, payload: unknown): boolean {
  return operation === "setLiveEnabled" ? exact(payload, ["enabled"]) && typeof payload.enabled === "boolean" : payload === null;
}
export type RecoveryService = (operation: string, payload: null | {backupId: string; pinned: boolean} | {token: string}) => Promise<import("../recovery/contracts").RecoveryResult>;
function validRecoveryRequest(operation: string, payload: unknown): boolean {
  if (["getRecoveryStatus", "setupRecovery", "backupNow", "prepareRestore"].includes(operation)) return payload === null;
  if (operation === "pinBackup") return exact(payload, ["backupId", "pinned"]) && validId(payload.backupId) && typeof payload.pinned === "boolean";
  return exact(payload, ["token"]) && validId(payload.token);
}
const expenseOperations = ["createExpense", "saveExpenseTemplate", "previewExpenses", "confirmExpenses", "queryExpenses", "correctExpense", "restoreExpense", "confirmExpenseCompleteness", "queryOperating"];
export function validExpenseRequest(operation: string, payload: unknown): boolean {
  if (operation === "createExpense") return validCreateExpenseRequest(payload);
  const revision = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
  const reason = (v: unknown) => typeof v === "string" && !!v.trim() && v.length <= 1000 && !/[\u0000-\u001f\u007f]/.test(v);
  if (operation === "saveExpenseTemplate" || operation === "previewExpenses") return payload === null;
  if (operation === "queryOperating") return validReportRequest(operation, payload);
  if (operation === "queryExpenses") return exact(payload, ["period"]) && validPeriod(payload.period);
  if (operation === "confirmExpenses") return exact(payload, ["previewId", "keepCandidateRows"]) && validId(payload.previewId) && Array.isArray(payload.keepCandidateRows) && payload.keepCandidateRows.length <= 5000 && payload.keepCandidateRows.every(v => Number.isSafeInteger(v) && v >= 2 && v <= 5001) && new Set(payload.keepCandidateRows).size === payload.keepCandidateRows.length;
  if (operation === "confirmExpenseCompleteness") return exact(payload, ["period", "reviewedRevision", "complete", "reason"]) && validPeriod(payload.period) && revision(payload.reviewedRevision) && typeof payload.complete === "boolean" && reason(payload.reason);
  if (operation === "correctExpense" || operation === "restoreExpense") return exact(payload, ["entityId", "expectedRevision", "reason", operation === "correctExpense" ? "replacement" : "restoreRevision"]) && validId(payload.entityId) && revision(payload.expectedRevision) && Number(payload.expectedRevision) > 0 && reason(payload.reason) && (operation === "correctExpense" ? validFields(payload.replacement) : payload.restoreRevision === null || revision(payload.restoreRevision) && Number(payload.restoreRevision) > 0);
  return false;
}
export type ExpenseService = (operation: keyof ExpenseRequests, payload: ExpenseRequests[keyof ExpenseRequests]) => Promise<ExpenseResult | OperatingReportResult>;
type SalesService = { purchaseDocuments?: (request: PurchaseDocumentsRequest) => Promise<PurchaseDocumentsResult>; purchaseDocument?: (request: PurchaseDocumentRequest) => Promise<PurchaseDocumentResult>; purchasing?: (request: QueryPurchasingRequest) => Promise<PurchasingReportResult>; open: (request: OpenSalesRequest) => Promise<SalesReportResult>; query: (request: QuerySalesRequest) => Promise<SalesReportResult>; inspect: (request: InspectSalesRequest) => Promise<SalesDetailResult> };
export async function handleRequest(
  trustedSender: boolean,
  operation: unknown,
  payload: unknown,
  getAvailability: () => Promise<Availability>,
  importPackage?: () => Promise<ImportOutcome | JobOutcome>,
  sales?: SalesService,
  expenses?: ExpenseService,
  monthly?: MonthlyService,
  jobs?: JobService,
  recovery?: RecoveryService,
  live?: LiveService,
  sourcePreview?: (request: SourcePreviewRequest) => Promise<SourcePreviewResult>,
  sourceWorkspace?: (request: SourceQuery) => Promise<SourceWorkspaceResult>,
  sourceEstimate?: {query:(request:EstimateRequest)=>Promise<EstimateResult>;export:(request:EstimateExportRequest)=>Promise<ReportExportResult|Extract<EstimateResult,{status:"source-unavailable"}>>},
  preferences?: {get: () => Promise<PreferencesResult>; set: (request: PreferencesPatch) => Promise<PreferencesResult>},
): Promise<PreferencesResult | EstimateResult | SourceWorkspaceResult | SourcePreviewResult | LiveResult | ReportResponse | ReportExportResult | JobOutcome | OperationStatus | {status: "cancelling"} | ExpenseResult | OperatingReportResult | PurchaseDocumentsResult | PurchaseDocumentResult | PurchasingReportResult | Availability | ImportOutcome | RequestError | SalesReportResult | SalesDetailResult | import("../recovery/contracts").RecoveryResult> {
  if (!trustedSender)
    return {
      status: "rejected",
      code: "UNTRUSTED_SENDER",
      message: "Bu pencerenin işlem yapma izni yok.",
    };
  if (preferences && (operation === "getPreferences" || operation === "setPreferences")) {
    if (operation === "getPreferences" && payload === null) return preferences.get();
    if (operation === "setPreferences" && validPreferencesPatch(payload)) return preferences.set(payload);
    return {status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil."};
  }
  if ((operation === "querySourceEstimate" || operation === "exportSourceEstimate") && sourceEstimate) {
    if(!validEstimateRequest(payload,operation === "exportSourceEstimate"))return {status:"rejected",code:"INVALID_PAYLOAD",message:"İstek geçerli değil."};
    return operation === "querySourceEstimate" ? sourceEstimate.query(payload) : sourceEstimate.export(payload);
  }
  if (operation === "querySourceWorkspace" && sourceWorkspace) {
    if(!validSourceQuery(payload))return {status:"rejected",code:"INVALID_PAYLOAD",message:"İstek geçerli değil."};
    return sourceWorkspace(payload);
  }
  if (operation === "readSourcePreview" && sourcePreview) {
    if (!validSourcePreviewRequest(payload)) return {status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil."};
    return sourcePreview(payload);
  }
  if (live && typeof operation === "string" && liveOperations.includes(operation)) {
    if (!validLiveRequest(operation, payload)) return {status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil."};
    return live(operation, payload as null | {enabled: boolean});
  }
  if (recovery && typeof operation === "string" && recoveryOperations.includes(operation)) {
    if (!validRecoveryRequest(operation, payload)) return {status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil."};
    return recovery(operation, payload as Parameters<RecoveryService>[1]);
  }
  if (jobs && (operation === "getOperationStatus" || operation === "cancelOperation")) {
    if (operation === "getOperationStatus" && payload === null) return jobs.status();
    if (operation === "cancelOperation" && exact(payload, ["id"]) && Number.isSafeInteger(payload.id) && Number(payload.id) > 0) return jobs.cancel({id: Number(payload.id)});
    return {status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil."};
  }
  if (monthly && typeof operation === "string" && monthlyOperations.includes(operation)) {
    if (!validMonthlyRequest(operation, payload)) return {status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil."};
    return monthly(operation as keyof ReportRequestMap, payload as ReportRequestMap[keyof ReportRequestMap]);
  }
  if (expenses && typeof operation === "string" && expenseOperations.includes(operation)) {
    if (!validExpenseRequest(operation, payload)) return { status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil." };
    return expenses(operation as keyof ExpenseRequests, payload as ExpenseRequests[keyof ExpenseRequests]);
  }
  if (sales && typeof operation === "string" && ["openSales", "querySales", "inspectSales", ...(sales.purchasing ? ["queryPurchasing"] : []), ...(sales.purchaseDocuments ? ["queryPurchaseDocuments"] : []), ...(sales.purchaseDocument ? ["inspectPurchaseDocument"] : [])].includes(operation)) {
    if (!validReportRequest(operation, payload)) return { status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil." };
    if (operation === "queryPurchaseDocuments") return sales.purchaseDocuments!(payload as PurchaseDocumentsRequest);
    if (operation === "inspectPurchaseDocument") return sales.purchaseDocument!(payload as PurchaseDocumentRequest);
    if (operation === "queryPurchasing") return sales.purchasing!(payload as QueryPurchasingRequest);
    if (operation === "openSales") return sales.open(payload as OpenSalesRequest);
    if (operation === "querySales") return sales.query(payload as QuerySalesRequest);
    return sales.inspect(payload as InspectSalesRequest);
  }
  if (operation !== "getAvailability" && (operation !== "importPackage" || !importPackage))
    return {
      status: "rejected",
      code: "UNKNOWN_OPERATION",
      message: "Bu işlem desteklenmiyor.",
    };
  if (payload !== null)
    return {
      status: "rejected",
      code: "INVALID_PAYLOAD",
      message: "İstek geçerli değil.",
    };
  return operation === "importPackage" ? importPackage!() : getAvailability();
}
