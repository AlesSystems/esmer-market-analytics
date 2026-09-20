import type { OpenSalesRequest, QuerySalesRequest, InspectSalesRequest, SalesReportResult, SalesDetailResult } from "../reports/contracts";
import { validId } from "../store/revisions";
import type { Availability, ImportOutcome, RequestError } from "../domain/contracts";
export const APP_URL = "esmer://app/index.html";
function exact(value: unknown, fields: string[]): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join() === fields.sort().join();
}
const period = (value: unknown) => typeof value === "string" && /^(?:19[0-9]{2}|[2-9][0-9]{3})-(?:0[1-9]|1[0-2])$/.test(value) && value < "9999";
function validReportRequest(operation: string, value: unknown): boolean {
  if (operation === "openSales") return exact(value, ["period"]) && (value.period === null || period(value.period));
  if (!exact(value, operation === "inspectSales" ? ["context", "filters", "documentId"] : ["context", "filters"])) return false;
  if (operation === "inspectSales" && !validId(value.documentId)) return false;
  const c = value.context, f = value.filters;
  return exact(c, ["sessionId", "datasetId", "appRevision", "calculationVersion", "period"]) && validId(c.sessionId) && validId(c.datasetId) && validId(c.calculationVersion) && period(c.period) && Number.isSafeInteger(c.appRevision) && Number(c.appRevision) >= 0
    && exact(f, ["categoryId", "productId", "search", "kind"]) && (f.categoryId === null || validId(f.categoryId)) && (f.productId === null || validId(f.productId)) && typeof f.search === "string" && f.search.length <= 160 && !/[\u0000-\u001f\u007f]/.test(f.search) && ["all", "sale", "customer-return"].includes(String(f.kind)) && typeof f.kind === "string";
}
type SalesService = { open: (request: OpenSalesRequest) => Promise<SalesReportResult>; query: (request: QuerySalesRequest) => Promise<SalesReportResult>; inspect: (request: InspectSalesRequest) => Promise<SalesDetailResult> };
export async function handleRequest(
  trustedSender: boolean,
  operation: unknown,
  payload: unknown,
  getAvailability: () => Promise<Availability>,
  importPackage?: () => Promise<ImportOutcome>,
  sales?: SalesService,
): Promise<Availability | ImportOutcome | RequestError | SalesReportResult | SalesDetailResult> {
  if (!trustedSender)
    return {
      status: "rejected",
      code: "UNTRUSTED_SENDER",
      message: "Bu pencerenin işlem yapma izni yok.",
    };
  if (sales && typeof operation === "string" && ["openSales", "querySales", "inspectSales"].includes(operation)) {
    if (!validReportRequest(operation, payload)) return { status: "rejected", code: "INVALID_PAYLOAD", message: "İstek geçerli değil." };
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
