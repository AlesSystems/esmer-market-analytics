import type { ExpenseRequests, ExpenseResult, OperatingReportResult } from "../expenses/contracts";
import { validFields, validPeriod } from "../expenses/validation";
import type { QueryPurchasingRequest, PurchasingReportResult, OpenSalesRequest, QuerySalesRequest, InspectSalesRequest, SalesReportResult, SalesDetailResult } from "../reports/contracts";
import { validId } from "../store/revisions";
import type { Availability, ImportOutcome, RequestError } from "../domain/contracts";
export const APP_URL = "esmer://app/index.html";
function exact(value: unknown, fields: string[]): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === fields.sort().join();
}
const period = (value: unknown) => typeof value === "string" && /^(?:19[0-9]{2}|[2-9][0-9]{3})-(?:0[1-9]|1[0-2])$/.test(value) && value < "9999";
function validReportRequest(operation: string, value: unknown): boolean {
  if (operation === "openSales") return exact(value, ["period"]) && (value.period === null || period(value.period));
  if ((operation === "queryPurchasing" || operation === "queryOperating")) return exact(value, ["context"]) && validReportRequest("querySales", { context: value.context, filters: { categoryId: null, productId: null, search: "", kind: "all" } });
  if (!exact(value, operation === "inspectSales" ? ["context", "filters", "documentId"] : ["context", "filters"])) return false;
  if (operation === "inspectSales" && !validId(value.documentId)) return false;
  const c = value.context, f = value.filters;
  return exact(c, ["sessionId", "datasetId", "appRevision", "calculationVersion", "period"]) && validId(c.sessionId) && validId(c.datasetId) && validId(c.calculationVersion) && period(c.period) && Number.isSafeInteger(c.appRevision) && Number(c.appRevision) >= 0
    && exact(f, ["categoryId", "productId", "search", "kind"]) && (f.categoryId === null || validId(f.categoryId)) && (f.productId === null || validId(f.productId)) && typeof f.search === "string" && f.search.length <= 160 && !/[\u0000-\u001f\u007f]/.test(f.search) && ["all", "sale", "customer-return"].includes(String(f.kind)) && typeof f.kind === "string";
}
const expenseOperations = ["saveExpenseTemplate", "previewExpenses", "confirmExpenses", "queryExpenses", "correctExpense", "restoreExpense", "confirmExpenseCompleteness", "queryOperating"];
export function validExpenseRequest(operation: string, payload: unknown): boolean {
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
type SalesService = { purchasing?: (request: QueryPurchasingRequest) => Promise<PurchasingReportResult>; open: (request: OpenSalesRequest) => Promise<SalesReportResult>; query: (request: QuerySalesRequest) => Promise<SalesReportResult>; inspect: (request: InspectSalesRequest) => Promise<SalesDetailResult> };
export async function handleRequest(
  trustedSender: boolean,
  operation: unknown,
  payload: unknown,
  getAvailability: () => Promise<Availability>,
  importPackage?: () => Promise<ImportOutcome>,
  sales?: SalesService,
  expenses?: ExpenseService,
): Promise<ExpenseResult | OperatingReportResult | PurchasingReportResult | Availability | ImportOutcome | RequestError | SalesReportResult | SalesDetailResult> {
  if (!trustedSender)
    return {
      status: "rejected",
      code: "UNTRUSTED_SENDER",
      message: "Bu pencerenin işlem yapma izni yok.",
    };
  if (expenses && typeof operation === "string" && expenseOperations.includes(operation)) {
    if (!validExpenseRequest(operation, payload)) return { status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil." };
    return expenses(operation as keyof ExpenseRequests, payload as ExpenseRequests[keyof ExpenseRequests]);
  }
  if (sales && typeof operation === "string" && ["openSales", "querySales", "inspectSales", ...(sales.purchasing ? ["queryPurchasing"] : [])].includes(operation)) {
    if (!validReportRequest(operation, payload)) return { status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil." };
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
