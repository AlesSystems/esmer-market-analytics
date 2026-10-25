import {validMonthProfitRequest,validMonthProfitExportRequest,type MonthProfitExportRequest,type MonthProfitRequest,type MonthProfitResult} from "../source/month-profit";
import {validSourceQuery, type SourceQuery, type SourceWorkspaceResult} from "../source/workspace";
import type { LiveResult, PreferencesPatch, PreferencesResult } from "../domain/contracts";
import { validPreferencesPatch } from "./preferences";
import type { JobOutcome, OperationStatus, ReportExportResult } from "../domain/contracts";
import type { ExpenseRequests, ExpenseResult } from "../expenses/contracts";
import { validCreateExpenseRequest, validFields, validPeriod } from "../expenses/validation";
import { validId } from "../store/revisions";
import type { Availability, ImportOutcome, RequestError } from "../domain/contracts";
import { recoveryOperations } from "../recovery/contracts";
export const APP_URL = "esmer://app/index.html";
function exact(value: unknown, fields: string[]): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === fields.sort().join();
}
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
const expenseOperations = ["createExpense", "saveExpenseTemplate", "previewExpenses", "confirmExpenses", "queryExpenses", "correctExpense", "restoreExpense", "confirmExpenseCompleteness"];
export function validExpenseRequest(operation: string, payload: unknown): boolean {
  if (operation === "createExpense") return validCreateExpenseRequest(payload);
  const revision = (v: unknown) => Number.isSafeInteger(v) && Number(v) >= 0;
  const reason = (v: unknown) => typeof v === "string" && !!v.trim() && v.length <= 1000 && !/[\u0000-\u001f\u007f]/.test(v);
  if (operation === "saveExpenseTemplate" || operation === "previewExpenses") return payload === null;
  if (operation === "queryExpenses") return exact(payload, ["period"]) && validPeriod(payload.period);
  if (operation === "confirmExpenses") return exact(payload, ["previewId", "keepCandidateRows"]) && validId(payload.previewId) && Array.isArray(payload.keepCandidateRows) && payload.keepCandidateRows.length <= 5000 && payload.keepCandidateRows.every(v => Number.isSafeInteger(v) && v >= 2 && v <= 5001) && new Set(payload.keepCandidateRows).size === payload.keepCandidateRows.length;
  if (operation === "confirmExpenseCompleteness") return exact(payload, ["period", "reviewedRevision", "complete", "reason"]) && validPeriod(payload.period) && revision(payload.reviewedRevision) && typeof payload.complete === "boolean" && reason(payload.reason);
  if (operation === "correctExpense" || operation === "restoreExpense") return exact(payload, ["entityId", "expectedRevision", "reason", operation === "correctExpense" ? "replacement" : "restoreRevision"]) && validId(payload.entityId) && revision(payload.expectedRevision) && Number(payload.expectedRevision) > 0 && reason(payload.reason) && (operation === "correctExpense" ? validFields(payload.replacement) : payload.restoreRevision === null || revision(payload.restoreRevision) && Number(payload.restoreRevision) > 0);
  return false;
}
export type ExpenseService = (operation: keyof ExpenseRequests, payload: ExpenseRequests[keyof ExpenseRequests]) => Promise<ExpenseResult>;
export async function handleRequest(
  trustedSender: boolean,
  operation: unknown,
  payload: unknown,
  getAvailability: () => Promise<Availability>,
  importPackage?: () => Promise<ImportOutcome | JobOutcome>,
  expenses?: ExpenseService,
  jobs?: JobService,
  recovery?: RecoveryService,
  live?: LiveService,
  sourceWorkspace?: (request: SourceQuery) => Promise<SourceWorkspaceResult>,
  preferences?: {get: () => Promise<PreferencesResult>; set: (request: PreferencesPatch) => Promise<PreferencesResult>},
  monthProfit?: (request: MonthProfitRequest) => Promise<MonthProfitResult>,
  monthProfitExport?: (request: MonthProfitExportRequest) => Promise<ReportExportResult>,
): Promise<MonthProfitResult | PreferencesResult | SourceWorkspaceResult | LiveResult | ReportExportResult | JobOutcome | OperationStatus | {status: "cancelling"} | ExpenseResult | Availability | ImportOutcome | RequestError | import("../recovery/contracts").RecoveryResult> {
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
  if (operation === "readMonthProfit" && monthProfit) {
    if (!validMonthProfitRequest(payload)) return {status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil."};
    return monthProfit(payload);
  }
  if (operation === "exportMonthProfit" && monthProfitExport) {
    if (!validMonthProfitExportRequest(payload)) return {status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil."};
    return monthProfitExport(payload);
  }
  if (operation === "querySourceWorkspace" && sourceWorkspace) {
    if(!validSourceQuery(payload))return {status:"rejected",code:"INVALID_PAYLOAD",message:"İstek geçerli değil."};
    return sourceWorkspace(payload);
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
  if (expenses && typeof operation === "string" && expenseOperations.includes(operation)) {
    if (!validExpenseRequest(operation, payload)) return { status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil." };
    return expenses(operation as keyof ExpenseRequests, payload as ExpenseRequests[keyof ExpenseRequests]);
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
