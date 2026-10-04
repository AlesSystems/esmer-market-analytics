import { Exact } from "../domain/money";
import { classifications, type ExpenseFields, type CreateExpenseRequest, type ExpenseValue } from "./contracts";
export const validPeriod = (v: unknown): v is string => typeof v === "string" && /^(?:19\d{2}|[2-9]\d{3})-(?:0[1-9]|1[0-2])$/.test(v) && v < "9999";
export const validDate = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && validPeriod(v.slice(0, 7)) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const id = (v: unknown) => v === null || typeof v === "string" && /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(v);
export const exactKeys = (v: unknown, keys: string[]): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).sort().join() === [...keys].sort().join();
export const fieldKeys = ["date", "paymentDate", "category", "classification", "net", "tax", "gross", "taxTreatment", "taxEvidence", "supportingReference", "sourceReference", "labourPeriod", "loss"];
export function validFields(value: unknown): value is ExpenseFields {
  if (!exactKeys(value, fieldKeys)) return false;
  const v = value;
  if (!validDate(v.date) || v.paymentDate !== null && !validDate(v.paymentDate) || typeof v.category !== "string" || !v.category.trim() || v.category.length > 80 || /[\u0000-\u001f\u007f]/.test(v.category) || !classifications.includes(v.classification as never)) return false;
  if (![v.net, v.tax, v.gross].every(x => typeof x === "string" && /^(?:0|[1-9]\d{0,39})(?:\.\d{1,30})?$/.test(x)) || !new Exact(v.net as string).plus(v.tax as string).eq(v.gross as string)) return false;
  if (!["recoverable", "non-recoverable", "unknown"].includes(String(v.taxTreatment)) || !id(v.taxEvidence) || !id(v.supportingReference) || !id(v.sourceReference)) return false;
  if (v.taxTreatment !== "unknown" && !v.taxEvidence) return false;
  if (v.classification === "labour" ? !validPeriod(v.labourPeriod) || v.labourPeriod !== v.date.slice(0, 7) : v.labourPeriod !== null) return false;
  return v.classification === "inventory-loss" ? exactKeys(v.loss, ["evidence", "recognition"]) && v.loss.evidence !== null && id(v.loss.evidence) && ["separate", "already-in-cost"].includes(String(v.loss.recognition)) : v.loss === null;
}
export function isExpense(value: object): value is ExpenseValue { return "format" in value && value.format === "expense-v1"; }
export function validExpense(value: unknown): value is ExpenseValue {
  if (!exactKeys(value, [...fieldKeys, "format", "origin", "reason", "evidence", "replacesRevision", "voided"])) return false;
  const fields = Object.fromEntries(fieldKeys.map(k => [k, value[k]]));
  return validFields(fields) && value.format === "expense-v1" && validOrigin(value.origin) && typeof value.reason === "string" && !!value.reason.trim() && value.reason.length <= 1000 && value.evidence !== null && id(value.evidence) && (value.replacesRevision === null || Number.isSafeInteger(value.replacesRevision) && Number(value.replacesRevision) > 0) && typeof value.voided === "boolean";
}

export function validOrigin(origin: unknown): boolean {
  return exactKeys(origin, ["batchId", "row"]) && origin.batchId !== null && id(origin.batchId) && Number.isSafeInteger(origin.row) && Number(origin.row) >= 2
    || exactKeys(origin, ["kind", "requestId"]) && origin.kind === "manual" && origin.requestId !== null && id(origin.requestId);
}
export function validCreateExpenseRequest(value: unknown): value is CreateExpenseRequest {
  if (exactKeys(value, ["action", "requestId"]) && value.action === "resolve") return value.requestId !== null && id(value.requestId);
  if (!exactKeys(value, ["action", "requestId", "fields", "duplicateReview"]) || value.action !== "save" || value.requestId === null || !id(value.requestId) || !exactKeys(value.fields, fieldKeys)) return false;
  const f = value.fields;
  if (![f.net, f.tax, f.gross, f.date].every(x => typeof x === "string" && x.length <= 100) || f.paymentDate !== null && (typeof f.paymentDate !== "string" || f.paymentDate.length > 100) || typeof f.category !== "string" || f.category.length > 80 || /[\u0000-\u001f\u007f]/.test(f.category) || !classifications.includes(f.classification as never) || !["recoverable", "non-recoverable", "unknown"].includes(String(f.taxTreatment)) || !id(f.taxEvidence) || !id(f.supportingReference) || !id(f.sourceReference) || f.labourPeriod !== null && !validPeriod(f.labourPeriod) || f.loss !== null && (!exactKeys(f.loss, ["evidence", "recognition"]) || !id(f.loss.evidence) || !["separate", "already-in-cost"].includes(String(f.loss.recognition)))) return false;
  return value.duplicateReview === null || exactKeys(value.duplicateReview, ["fingerprint", "keepSeparate"]) && typeof value.duplicateReview.fingerprint === "string" && /^[a-f0-9]{64}$/.test(value.duplicateReview.fingerprint) && value.duplicateReview.keepSeparate === true;
}
