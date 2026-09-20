import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { salesPackage } from "../helpers/sales-fixtures";
import { addPurchase, businessPackage, businessRecords } from "../helpers/business-fixtures";

test("replacement evidence retains both purchase documents outside the report month", () => {
  const records = businessRecords();
  records.documents.forEach(row => { row.date = "2025-08-15"; });
  addPurchase(records, "P1");
  addPurchase(records, "D1");
  const dispatch = records.documents.find(row => row.id === "D1")!;
  dispatch.purchasing = { ...dispatch.purchasing!, representation: "dispatch", convertedTo: "P1", invoiced: true };
  const store = openStore(":memory:");
  try {
    expect(store.importPackage(businessPackage(records, { coverage: { from: "2025-08-01", to: "2025-09-30", complete: true } }))).toMatchObject({ status: "active" });
    const reports = new SalesReports(store), sales = reports.open({ period: "2025-08" });
    if (sales.status !== "report") throw new Error("Expected report");
    const result = reports.purchasing({ context: sales.view.context });
    if (result.status !== "purchasing") throw new Error("Expected purchasing");
    expect(result.view.purchasing.history).toEqual([]);
    expect(result.view.purchasing.replacements).toMatchObject([{ documentId: "P1", replacementCost: "50" }]);
    expect(result.view.evidence.documents.map(row => row.id)).toEqual(expect.arrayContaining(["P1", "D1"]));
    expect(result.view.evidence.lines.map(row => row.id)).toEqual(expect.arrayContaining(["P1-line", "D1-line"]));
  } finally { store.close(); }
});

test("purchasing shares the sales snapshot and rejects stale contexts without inventing legacy cost", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(salesPackage());
    const reports = new SalesReports(store), opened = reports.open({ period: null });
    if (opened.status !== "report") throw new Error("Expected sales report");
    const result = reports.purchasing({ context: opened.view.context });
    expect(result.status).toBe("purchasing");
    if (result.status !== "purchasing") throw new Error("Expected purchasing view");
    expect(result.view.gross.status).toBe("unavailable");
    expect(result.view.purchasing.status).toBe("unavailable");
    expect(reports.purchasing({ context: { ...opened.view.context, sessionId: "forged" } })).toMatchObject({ status: "unavailable", code: "STALE_CONTEXT" });
    reports.open({ period: "2025-08" });
    expect(reports.purchasing({ context: opened.view.context })).toMatchObject({ status: "unavailable", code: "STALE_CONTEXT" });
  } finally { store.close(); }
});

test("purchasing IPC rejects untrusted senders and extra context fields", async () => {
  const { handleRequest } = await import("../../src/desktop/requests");
  const { vi } = await import("vitest");
  const response = { status: "unavailable", code: "UNSUPPORTED_MAPPING", message: "Kanıt yok" } as const;
  const purchasing = vi.fn().mockResolvedValue(response);
  const service = { open: vi.fn(), query: vi.fn(), inspect: vi.fn(), purchasing };
  const context = { sessionId: "session", datasetId: "dataset", appRevision: 0, calculationVersion: "sales-v1", period: "2025-09" };
  expect(await handleRequest(false, "queryPurchasing", { context }, vi.fn(), undefined, service)).toMatchObject({ code: "UNTRUSTED_SENDER" });
  for (const payload of [null, {}, { context, sql: "SELECT" }, { context: { ...context, appRevision: -1 } }, { context: { ...context, period: "2025-99" } }]) {
    expect(await handleRequest(true, "queryPurchasing", payload, vi.fn(), undefined, service)).toMatchObject({ code: "INVALID_PAYLOAD" });
  }
  expect(purchasing).not.toHaveBeenCalled();
  expect(await handleRequest(true, "queryPurchasing", { context }, vi.fn(), undefined, service)).toEqual(response);
  expect(purchasing).toHaveBeenCalledWith({ context });
});

test("cost and purchasing evidence stay pinned across import and include both converted documents", async () => {
  const { businessPackage } = await import("../helpers/business-fixtures");
  const { purchasingJourney } = await import("../helpers/purchasing-journey");
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage(purchasingJourney()));
    const reports = new SalesReports(store), sales = reports.open({ period: null });
    if (sales.status !== "report") throw new Error("Expected report");
    const before = reports.purchasing({ context: sales.view.context });
    expect(before).toMatchObject({ status: "purchasing", view: { extractionId: "business-1", gross: { coveredSales: "100", coveredCost: "60", coveredGrossProfit: "40" } } });
    if (before.status !== "purchasing") throw new Error("Expected purchasing");
    expect(before.view.evidence.documents.map(row => row.id)).toEqual(expect.arrayContaining(["D1", "R1"]));
    store.importPackage(businessPackage(purchasingJourney(), { extractionId: "business-2" }));
    expect(reports.purchasing({ context: sales.view.context })).toMatchObject({ status: "purchasing", view: { extractionId: "business-1", stale: true, gross: before.view.gross } });
  } finally { store.close(); }
});

test("purchasing preserves partial and unavailable source-period coverage separately from cost coverage", async () => {
  const { businessPackage } = await import("../helpers/business-fixtures");
  const { purchasingJourney } = await import("../helpers/purchasing-journey");
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage(purchasingJourney(), { coverage: { from: "2025-09-01", to: "2025-09-30", complete: false } }));
    const reports = new SalesReports(store);
    for (const [period, coverage] of [["2025-09", "partial"], ["2025-10", "unavailable"]] as const) {
      const sales = reports.open({ period });
      if (sales.status !== "report") throw new Error("Expected sales report");
      expect(reports.purchasing({ context: sales.view.context })).toMatchObject({ status: "purchasing", view: { coverage } });
    }
  } finally { store.close(); }
});
