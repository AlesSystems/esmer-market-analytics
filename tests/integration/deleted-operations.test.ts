import { expect, test, vi } from "vitest";
import { handleRequest } from "../../src/desktop/requests";
const deleted = [
  "readSourcePreview", "querySourceEstimate", "exportSourceEstimate",
  "queryMonthly", "listReportVersions", "readReportVersion", "compareReportVersion", "acceptReportVersion", "exportReportVersion",
  "readReportEvidence", "readReportProducts", "readReportProduct", "readReportProductDependency", "exportReportProduct", "readReportPurchasing",
  "queryOperating", "queryPurchaseDocuments", "inspectPurchaseDocument", "queryPurchasing", "openSales", "querySales", "inspectSales",
];
test.each(deleted)("%s is no longer an operation and reaches no service", async operation => {
  const service = vi.fn();
  // Every optional dependency is a catch-all spy, so a surviving handler would be called.
  const everything = new Proxy(service, { get: () => service });
  const call = handleRequest as unknown as (...args: unknown[]) => Promise<unknown>;
  for (const payload of [null, {}, { period: "2026-01" }, { context: {} }, { reportId: "x" }])
    expect(await call(true, operation, payload, service, service, ...Array(12).fill(everything))).toMatchObject({ status: "rejected", code: "UNKNOWN_OPERATION" });
  expect(service).not.toHaveBeenCalled();
});
