import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { emptySalesFilters } from "../../src/reports/contracts";
import { journeyRecords, salesPackage } from "../helpers/sales-fixtures";

test("month to product to receipt retains one snapshot after two imports and pruning", () => {
  const store = openStore(":memory:");
  try {
    expect(store.importPackage(salesPackage(journeyRecords())).status).toBe("active");
    const reports = new SalesReports(store);
    const opened = reports.open({ period: "2025-09" });
    if (opened.status !== "report") throw new Error(opened.code);
    expect(opened.view.metrics).toMatchObject({ netSales: "365", saleDocumentCount: 3, averageBasket: "133.33", quantities: { piece: "11", kg: "2" } });
    const context = opened.view.context;
    const filters = { ...emptySalesFilters, productId: "water" };
    const changed = journeyRecords();
    changed.lines[2].quantity = "4.5"; changed.lines[2].net = "90"; changed.lines[2].sales!.tax = "4.5"; changed.lines[2].sales!.gross = "94.5";
    Object.assign(changed.documents[1].sales!, { net: "160", tax: "8", gross: "168" });
    expect(store.importPackage(salesPackage(changed, { extractionId: "second" })).status).toBe("active");
    expect(store.importPackage(salesPackage(changed, { extractionId: "third" })).status).toBe("active");
    expect(store.prune()).toBe(1);
    expect(() => store.readPinned(context)).toThrow();
    const view = reports.query({ context, filters });
    expect(view).toMatchObject({ status: "report", view: { stale: true, metrics: { netSales: "100" }, transactions: [{ documentId: "S002", scopeNet: "60", net: "130" }, { documentId: "S001", scopeNet: "40", net: "70" }] } });
    expect(reports.inspect({ context, filters, documentId: "S002" })).toMatchObject({ status: "detail", detail: { context, scopeNet: "60", totals: { net: "130" }, extractionId: "sales-1", lines: [{ lineId: "L003", matchesScope: true }, { lineId: "L004", matchesScope: false }] } });
    expect(reports.open({ period: "2025-09" })).toMatchObject({ status: "report", view: { metrics: { netSales: "395" } } });
    expect(reports.query({ context, filters })).toMatchObject({ status: "unavailable", code: "STALE_CONTEXT" });
  } finally { store.close(); }
});

test("partial periods compare matched calendar days, missing coverage differs from valid zero", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(salesPackage(journeyRecords(), { coverage: { from: "2024-01-01", to: "2025-09-03", complete: true } }));
    const reports = new SalesReports(store);
    const result = reports.open({ period: "2025-09" });
    expect(result).toMatchObject({ status: "report", view: { coverage: "partial", comparisons: { month: { from: "2025-08-01", to: "2025-08-03", available: true, netSales: "0", netChange: null }, year: { from: "2024-09-01", to: "2024-09-03", available: true } } } });
    expect(reports.open({ period: "2025-10" })).toMatchObject({ status: "report", view: { coverage: "unavailable", complete: false, comparisons: { month: { available: false, netSales: null } } } });
    expect(reports.open({ period: "2024-03" })).toMatchObject({ status: "report", view: { comparisons: { month: { to: "2024-02-29" }, year: { to: "2023-03-31", available: false } } } });
    expect(reports.open({ period: "2025-03" })).toMatchObject({ status: "report", view: { comparisons: { month: { to: "2025-02-28" } } } });
  } finally { store.close(); }
});

test("basket comparisons use unrounded numerators, not rounded display averages", () => {
  const records = journeyRecords(); records.documents = []; records.lines = [];
  for (const [month, amount] of [["08", "1"], ["09", "2"]]) for (let index = 0; index < 3; index++) {
    const id = `${month}-${index}`, net = index ? "0" : amount;
    records.documents.push({ id, date: `2025-${month}-01`, kind: "sale", supplierId: null, sales: { state: "completed", convertedTo: null, net, tax: "0", gross: net } });
    records.lines.push({ id: `${id}-line`, documentId: id, quantity: "1", net, cost: null, sales: { productId: "p", productName: "Ürün", categoryId: "c", categoryName: "Kategori", unit: "piece", unitNet: net, discountRate: "0", taxRate: "0", tax: "0", gross: net, meaning: "known" } });
  }
  const store = openStore(":memory:");
  try {
    store.importPackage(salesPackage(records, { coverage: { from: "2025-08-01", to: "2025-09-03", complete: true } }));
    expect(new SalesReports(store).open({ period: "2025-09" })).toMatchObject({ status: "report", view: { metrics: { averageBasket: "0.67" }, comparisons: { month: { basketChange: "100", transactionChange: "0" } } } });
  } finally { store.close(); }
});

test("header differences retain line totals and all recorded source amounts in evidence", () => {
  const records = journeyRecords(); records.documents[1].sales!.net = "132";
  const store = openStore(":memory:");
  try {
    store.importPackage(salesPackage(records));
    const reports = new SalesReports(store), result = reports.open({ period: "2025-09" });
    expect(result).toMatchObject({ status: "report", view: { complete: false, metrics: { netSales: "365" } } });
    if (result.status !== "report") throw new Error(result.code);
    expect(reports.inspect({ context: result.view.context, filters: emptySalesFilters, documentId: "S002" })).toMatchObject({ status: "detail", detail: { reconciled: false, totals: { net: "130" }, recorded: { net: "132" }, lines: [{ recorded: { net: "60" } }, { recorded: { net: "70" } }] } });
    expect(reports.query({ context: result.view.context, filters: { ...emptySalesFilters, search: "İÇME" } })).toMatchObject({ status: "report", view: { metrics: { netSales: "100" }, products: [{ name: "İçme suyu" }] } });
  } finally { store.close(); }
});

test("overlapping incomplete coverage retains known contributions and partial-month comparisons match days", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(salesPackage(journeyRecords(), { coverage: { from: "2025-09-01", to: "2025-09-03", complete: false } }));
    expect(new SalesReports(store).open({ period: "2025-09" })).toMatchObject({ status: "report", view: { coverage: "partial", complete: false, metrics: { netSales: "365" } } });
    const records = journeyRecords();
    for (const document of records.documents) document.date = "2025-03-30";
    store.importPackage(salesPackage(records, { extractionId: "march", cutoff: "2025-03-30", coverage: { from: "2025-02-01", to: "2025-03-30", complete: true } }));
    expect(new SalesReports(store).open({ period: "2025-03" })).toMatchObject({ status: "report", view: { metrics: { netSales: "365" }, comparisons: { month: { currentFrom: "2025-03-01", currentTo: "2025-03-28", from: "2025-02-01", to: "2025-02-28", available: true, netChange: null } } } });
  } finally { store.close(); }
});

test("late-month coverage never returns impossible dates for a shorter comparison month", () => {
  const store = openStore(":memory:");
  const records = journeyRecords(); for (const doc of records.documents) doc.date = "2025-03-30";
  try {
    store.importPackage(salesPackage(records, { cutoff: "2025-03-30", coverage: { from: "2025-03-30", to: "2025-03-30", complete: true } }));
    expect(new SalesReports(store).open({ period: "2025-03" })).toMatchObject({ status: "report", view: { from: "2025-03-30", to: "2025-03-30", comparisons: { month: { currentFrom: "2025-03-30", currentTo: "2025-03-30", from: "2025-02-28", to: "2025-02-28", available: false } } } });
  } finally { store.close(); }
});

test("a complete short month compares the entire previous calendar month", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(salesPackage(journeyRecords(), { coverage: { from: "2025-01-01", to: "2025-09-03", complete: true } }));
    expect(new SalesReports(store).open({ period: "2025-02" })).toMatchObject({ status: "report", view: { comparisons: { month: { currentFrom: "2025-02-01", currentTo: "2025-02-28", from: "2025-01-01", to: "2025-01-31", available: true } } } });
  } finally { store.close(); }
});

test("excluded lines retain original source fields for pinned evidence without computed contributions", () => {
  const store = openStore(":memory:");
  const records = journeyRecords(); records.lines[6].sales!.unit = "unknown";
  try {
    store.importPackage(salesPackage(records));
    const reports = new SalesReports(store), opened = reports.open({ period: "2025-09" });
    if (opened.status !== "report") throw new Error(opened.code);
    expect(reports.inspect({ context: opened.view.context, filters: emptySalesFilters, documentId: "R001" })).toMatchObject({ status: "detail", detail: { context: opened.view.context, extractionId: "sales-1", lineage: "sales-fixture", mappingVersion: "synthetic-sales-v1", exclusion: "UNKNOWN_MEANING", lines: [], excludedLines: [{ lineId: "L007", quantity: "1", net: "-35", reason: "UNKNOWN_MEANING", input: { productId: "soda", categoryId: "drinks", unit: "unknown", tax: "-1.75", gross: "-36.75", unitNet: "35", discountRate: "0", taxRate: "5" } }] } });
  } finally { store.close(); }
});
