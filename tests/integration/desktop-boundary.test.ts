import { expect, test, vi } from "vitest";
import { handleRequest } from "../../src/desktop/requests";
test.each([
  [false, "getAvailability", null, "UNTRUSTED_SENDER"],
  [true, "unknown", null, "UNKNOWN_OPERATION"],
  [true, "getAvailability", {}, "INVALID_PAYLOAD"],
  [
    true,
    "getAvailability",
    { path: "/private/file", credentials: "secret" },
    "INVALID_PAYLOAD",
  ],
  [true, "import", { sql: "DROP TABLE source" }, "UNKNOWN_OPERATION"],
  [true, "getAvailability", { sql: "SELECT * FROM source" }, "INVALID_PAYLOAD"],
] as const)(
  "rejects boundary input before privileged work (%s, %s)",
  async (trusted, operation, payload, code) => {
    const service = vi.fn();
    const result = await handleRequest(trusted, operation, payload, service);
    expect(result).toMatchObject({ status: "rejected", code });
    expect(JSON.stringify(result)).not.toMatch(/private|secret|DROP|SELECT/);
    expect(service).not.toHaveBeenCalled();
  },
);
test("valid request returns service availability, including failure", async () => {
  const result = {
    status: "unavailable",
    code: "SERVICE_UNAVAILABLE",
    message: "Yerel hizmet başlatılamadı.",
  } as const;
  const service = vi.fn().mockResolvedValue(result);
  expect(await handleRequest(true, "getAvailability", null, service)).toEqual(
    result,
  );
  expect(service).toHaveBeenCalledOnce();
});

test.each([
  [false, "importPackage", null, "UNTRUSTED_SENDER"],
  [true, "importPackage", { path: "/private/file" }, "INVALID_PAYLOAD"],
  [true, "importPackage", undefined, "INVALID_PAYLOAD"],
] as const)("rejects import before opening native dialog (%s)", async (trusted, operation, payload, code) => {
  const availability = vi.fn(); const selectAndImport = vi.fn();
  expect(await handleRequest(trusted, operation, payload, availability, selectAndImport)).toMatchObject({ status: "rejected", code });
  expect(availability).not.toHaveBeenCalled(); expect(selectAndImport).not.toHaveBeenCalled();
});
test("named no-argument import invokes only the privileged import callback", async () => {
  const availability = vi.fn(); const selectAndImport = vi.fn().mockResolvedValue({ status: "cancelled" });
  expect(await handleRequest(true, "importPackage", null, availability, selectAndImport)).toEqual({ status: "cancelled" });
  expect(selectAndImport).toHaveBeenCalledOnce(); expect(availability).not.toHaveBeenCalled();
});

test("sales operations validate exact contexts and filters before touching report service", async () => {
  const { openStore } = await import("../../src/store/store");
  const { SalesReports } = await import("../../src/reports/query");
  const { salesPackage } = await import("../helpers/sales-fixtures");
  const { emptySalesFilters } = await import("../../src/reports/contracts");
  const store = openStore(":memory:");
  try {
    store.importPackage(salesPackage());
    const reports = new SalesReports(store);
    const service = { open: async (request: Parameters<typeof reports.open>[0]) => reports.open(request), query: async (request: Parameters<typeof reports.query>[0]) => reports.query(request), inspect: async (request: Parameters<typeof reports.inspect>[0]) => reports.inspect(request) };
    const invoke = (trusted: boolean, operation: string, payload: unknown) => handleRequest(trusted, operation, payload, async () => store.availability(), undefined, service);
    for (const payload of [{ period: "2025-99" }, { period: "2025-09", path: "/private" }]) expect(await invoke(true, "openSales", payload)).toMatchObject({ code: "INVALID_PAYLOAD" });
    expect(await invoke(true, "openMonthly", { period: "2025-09" })).toMatchObject({ code: "UNKNOWN_OPERATION" });
    const result = await invoke(true, "openSales", { period: "2025-09" });
    expect(result).toMatchObject({ status: "report", view: { metrics: { netSales: "180" } } });
    if (result.status !== "report") throw new Error("NO_REPORT");
    const valid = { context: result.view.context, filters: emptySalesFilters };
    expect(await invoke(false, "querySales", valid)).toMatchObject({ code: "UNTRUSTED_SENDER" });
    for (const payload of [null, {}, { ...valid, sql: "SELECT *" }, { ...valid, filters: { ...emptySalesFilters, search: "a".repeat(161) } }, { ...valid, context: { ...valid.context, period: "2025-99" } }, { ...valid, context: { ...valid.context, appRevision: -1 } }]) expect(await invoke(true, "querySales", payload)).toMatchObject({ code: "INVALID_PAYLOAD" });
    expect(await invoke(true, "querySales", valid)).toMatchObject({ status: "report" });
    expect(await invoke(true, "querySales", { ...valid, context: { ...valid.context, sessionId: "wrong" } })).toMatchObject({ code: "STALE_CONTEXT" });
  } finally { store.close(); }
});

test("monthly and export requests reject spoofed fields before privileged work", async () => {
  const report = vi.fn().mockResolvedValue({ status: "history", reports: [] });
  const invoke = (trusted: boolean, operation: string, payload: unknown) => handleRequest(trusted, operation, payload, vi.fn(), undefined, undefined, undefined, report);
  expect(await invoke(true, "listReportVersions", { period: "2025-09" })).toEqual({ status: "history", reports: [] });
  report.mockClear();
  for (const [operation, payload] of [
    ["exportReportVersion", { reportId: "report-1", path: "/private/out.xlsx" }],
    ["readReportVersion", { reportId: "report-1", sql: "SELECT *" }],
    ["readReportPurchasing", { reportId: "report-1", datasetId: "current" }],
    ["readReportEvidence", { reportId: "report-1", section: "components", offset: 0, search: "", range: "current", documentId: null, limit: 10000 }],
    ["acceptReportVersion", { candidateId: "candidate", previousAcceptedId: null, reason: "" }],
    ["queryMonthly", { context: null }],
  ] as const) expect(await invoke(true, operation, payload)).toMatchObject({ code: "INVALID_PAYLOAD" });
  expect(await invoke(false, "exportReportVersion", { reportId: "report-1" })).toMatchObject({ code: "UNTRUSTED_SENDER" });
  expect(await invoke(false, "readReportEvidence", { reportId: "report-1", section: "components", offset: 0, search: "", range: "current", documentId: null })).toMatchObject({ code: "UNTRUSTED_SENDER" });
  expect(report).not.toHaveBeenCalled();
});

test("job status and cancellation validate sender and exact payload before changing shared state", async () => {
  const status = vi.fn().mockReturnValue({status: "idle"});
  const cancel = vi.fn().mockReturnValue({status: "cancelling"});
  const invoke = (trusted: boolean, operation: string, payload: unknown) => handleRequest(trusted, operation, payload, vi.fn(), undefined, undefined, undefined, undefined, {status, cancel});
  expect(await invoke(true, "getOperationStatus", null)).toEqual({status: "idle"});
  expect(await invoke(true, "cancelOperation", {id: 1})).toEqual({status: "cancelling"});
  cancel.mockClear();
  expect(await invoke(false, "cancelOperation", {id: 1})).toMatchObject({code: "UNTRUSTED_SENDER"});
  for (const value of [null, {id: 0}, {id: 1.5}, {id: 1, cancellation: "spoof"}, {id: "1"}]) expect(await invoke(true, "cancelOperation", value)).toMatchObject({code: "INVALID_PAYLOAD"});
  expect(cancel).not.toHaveBeenCalled();
});
