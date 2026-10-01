import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { ReportVersions } from "../../src/reports/versions";
import { validMonthlyRequest } from "../../src/desktop/requests";
import { businessPackage, businessRecords } from "../helpers/business-fixtures";

test("monthly display omits bulk evidence and pages the selected immutable report", () => {
  const store = openStore(":memory:");
  try {
    const records = businessRecords(), document = records.documents[0], line = records.lines[0];
    records.documents = Array.from({ length: 205 }, (_, index) => ({ ...document, id: `S${String(index).padStart(3, "0")}` }));
    records.lines = records.documents.map(row => ({ ...line, id: `L${row.id}`, documentId: row.id }));
    store.importPackage(businessPackage(records));
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected monthly report");
    const reportId = opened.report.id;
    const display = versions.display({ reportId });
    expect(display.report.sales.metrics.netSales).toBe("20500");
    expect(display.report.purchasing.gross).toMatchObject({ coveredCost: "12300", coveredGrossProfit: "8200", coveredCount: 205, excludedCount: 0 });
    expect(display.report).not.toHaveProperty("salesEvidence");
    expect(display.report.sales).not.toHaveProperty("transactions");
    expect(display.report.purchasing.gross).not.toHaveProperty("covered");
    expect(Buffer.byteLength(JSON.stringify(display))).toBeLessThan(20_000);
    const request = { reportId, section: "components" as const, offset: 0, search: "", range: "current" as const, documentId: null };
    const first = versions.evidence(request), second = versions.evidence({ ...request, offset: 100 }), last = versions.evidence({ ...request, offset: 200 });
    expect(first.total).toBe(205);
    expect(first.rows).toHaveLength(100);
    expect(second.rows).toHaveLength(100);
    expect(last.rows).toHaveLength(5);
    expect(last.rows[4]).toMatchObject({ documentId: "S204", lineId: "LS204", net: "100" });
    expect(versions.evidence({ ...request, search: "İÇME" }).total).toBe(205);
    expect(versions.evidence({ ...request, section: "lines", documentId: "S204" }).rows).toEqual([records.lines[204]]);
    expect(versions.evidence({ ...request, section: "documents", search: "S204" }).rows).toEqual([records.documents[204]]);
    versions.accept({ candidateId: reportId, previousAcceptedId: null, reason: "Sentetik kontrol" });
    const accepted = versions.selected(reportId);
    store.importPackage(businessPackage({ documents: [], lines: [], suppliers: [] }, { extractionId: "deleted" }));
    versions.open({ period: "2025-09" });
    const restarted = new ReportVersions(store, new SalesReports(store));
    expect(restarted.display({ reportId }).report.sales.metrics.netSales).toBe("20500");
    expect(restarted.evidence({ ...request, offset: 200 }).rows).toHaveLength(5);
    expect(restarted.selected(reportId)).toEqual(accepted);
  } finally { store.close(); }
});

test("a synthetic monthly candidate stores exact product profit and calendar days", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const opened = new ReportVersions(store, new SalesReports(store)).open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected monthly report");
    expect(opened.report.format).toBe("monthly-report-v2");
    expect(opened.report).toHaveProperty("productProfit.summary.coveredGrossProfit", "40");
    expect(opened.report).toHaveProperty("productProfit.products.0.coveredGrossProfit", "40");
    expect(opened.report).toHaveProperty("productProfit.daily.0.date", "2025-09-01");
    expect(opened.report).toHaveProperty("productProfit.daily.29.date", "2025-09-30");
  } finally { store.close(); }
});

test("evidence requests reject unbounded pages and arbitrary selectors", () => {
  const request = { reportId: "report", section: "components", offset: 0, search: "", range: "current", documentId: null };
  expect(validMonthlyRequest("readReportEvidence", request)).toBe(true);
  for (const invalid of [{ ...request, offset: -1 }, { ...request, offset: 0.5 }, { ...request, limit: 1000 }, { ...request, section: "sql" }, { ...request, range: "all" }, { ...request, search: "x".repeat(161) }, { ...request, section: "lines" }, { ...request, documentId: "S1" }]) {
    expect(validMonthlyRequest("readReportEvidence", invalid)).toBe(false);
  }
});

test("monthly overview keeps bounded trend and leading categories with the saved report", () => {
  const store = openStore(":memory:");
  try {
    const records = businessRecords(), document = records.documents[0], line = records.lines[0];
    records.documents = Array.from({ length: 7 }, (_, index) => ({ ...document, id: `S${index}`, date: `2025-09-0${index + 1}` }));
    records.lines = records.documents.map((row, index) => ({ ...line, id: `L${index}`, documentId: row.id, sales: { ...line.sales!, productId: `product-${index}`, categoryId: `category-${index}`, categoryName: `Kategori ${index}` } }));
    store.importPackage(businessPackage(records));
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected monthly report");
    const reportId = opened.report.id;
    const { sales } = versions.display({ reportId }).report;
    expect(sales.daily).toHaveLength(7);
    expect(sales.daily[0]).toEqual({ date: "2025-09-01", netSales: "100", height: "100", negative: false });
    expect(sales.topCategories).toHaveLength(5);
    expect(sales.topCategories[0]).toMatchObject({ id: "category-0", name: "Kategori 0", netSales: "100", share: "14.29" });
    versions.accept({ candidateId: reportId, previousAcceptedId: null, reason: "Sentetik kontrol" });
    store.importPackage(businessPackage({ documents: [], lines: [], suppliers: [] }, { extractionId: "deleted" }));
    versions.open({ period: "2025-09" });
    const historical = new ReportVersions(store, new SalesReports(store)).display({ reportId }).report.sales;
    expect(historical.daily[6]).toMatchObject({ date: "2025-09-07", netSales: "100" });
    expect(historical.topCategories[0]).toMatchObject({ id: "category-0", netSales: "100" });
  } finally { store.close(); }
});

test("revisiting an accepted candidate keeps its review and saved display", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected monthly report");
    versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Sentetik kontrol" });
    const saved = versions.display({ reportId: opened.report.id });
    expect(versions.currentDisplay({ context: opened.report.context })).toEqual(saved);
  } finally { store.close(); }
});

test.each(["expense", "source"])("an accepted pinned candidate signals a newer %s revision without rewriting history", revision => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected monthly report");
    versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Sentetik kontrol" });
    const accepted = versions.selected(opened.report.id);
    if (revision === "expense") store.appendRevision({ kind: "expense", entityId: "expense", value: { net: "50", date: "2025-09-01", reason: "Sentetik gider", evidence: "fixture:expense" } });
    else store.importPackage(businessPackage({ documents: [], lines: [], suppliers: [] }, { extractionId: "deleted" }));
    expect(versions.current({ context: opened.report.context })).toMatchObject({ status: "monthly", report: {
      review: accepted.review, sales: { metrics: { netSales: "200" }, stale: true }, purchasing: { stale: true }, operating: { stale: true },
    } });
    expect(versions.currentDisplay({ context: opened.report.context })).toMatchObject({ status: "monthly", report: { sales: { stale: true }, operating: { stale: true } } });
    expect(versions.selected(opened.report.id)).toEqual(accepted);
    const restarted = new ReportVersions(store, new SalesReports(store));
    expect(restarted.selected(opened.report.id)).toEqual(accepted);
  } finally { store.close(); }
});

test("v2 product pages search and sort without changing the selected market summary", () => {
  const store = openStore(":memory:");
  try {
    const records = businessRecords(), document = records.documents[0], line = records.lines[0];
    records.documents = Array.from({length: 101}, (_, index) => ({...structuredClone(document),id:`S${index}`}));
    records.lines = records.documents.map((row,index) => ({...structuredClone(line),id:`L${index}`,documentId:row.id,sales:{...line.sales!,productId:`P${String(index).padStart(3,"0")}`,productName:`Ürün ${index}`}}));
    store.importPackage(businessPackage(records));
    const versions = new ReportVersions(store,new SalesReports(store)), opened = versions.open({period:"2025-09"});
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2");
    const reportId = opened.report.id, summary = opened.report.productProfit.summary;
    const base = {reportId,search:"",sort:"profit" as const,direction:"desc" as const,offset:0};
    expect(versions.products(base)).toMatchObject({status:"products",total:101,offset:0});
    expect(versions.products(base).rows).toHaveLength(100);
    expect(versions.products({...base,offset:100}).rows).toHaveLength(1);
    expect(versions.products({...base,search:"  ÜRÜN 100  "}).rows).toMatchObject([{productId:"P100"}]);
    expect(versions.products({...base,sort:"name",direction:"asc"}).rows[0].displayName).toBe("Ürün 0");
    expect(versions.display({reportId}).report).toMatchObject({productProfit:{productCount:101,summary}});
    expect(versions.display({reportId}).report).not.toHaveProperty("productProfit.products");
    expect(versions.evidence({reportId,section:"product-profit",productId:"P100",offset:0,search:"",range:"current",documentId:null})).toMatchObject({status:"evidence",section:"product-profit",productId:"P100",total:1,rows:[{lineId:"L100",cost:"60",historicalUnitCost:"60"}]});
    expect(validMonthlyRequest("readReportProducts",base)).toBe(true);
    for (const bad of [{...base,sort:"sql"},{...base,direction:"up"},{...base,offset:-1},{...base,offset:0.5},{...base,limit:1000},{...base,search:"x".repeat(161)},{...base,search:" ".repeat(161)},{...base,search:` ${"x".repeat(160)} `}]) expect(validMonthlyRequest("readReportProducts",bad)).toBe(false);
    const evidence = {reportId,section:"product-profit",offset:0,search:"",range:"current",documentId:null};
    expect(validMonthlyRequest("readReportEvidence",evidence)).toBe(true);
    expect(validMonthlyRequest("readReportEvidence",{...evidence,productId:"P100"})).toBe(true);
    expect(validMonthlyRequest("readReportEvidence",{...evidence,productId:" P100"})).toBe(false);
    expect(validMonthlyRequest("readReportEvidence",{...evidence,search:" ".repeat(161)})).toBe(false);
    expect(validMonthlyRequest("readReportEvidence",{...evidence,search:` ${"x".repeat(160)} `})).toBe(false);
  } finally { store.close(); }
});

test("profit display projects signed chart geometry without changing stored trend", () => {
  const store = openStore(":memory:");
  try {
    const records = businessRecords();
    records.lines[1].business!.historicalCost = { ...records.lines[0].business!.historicalCost!, unitCost: "120" };
    records.documents[1].date = "2025-09-02";
    store.importPackage(businessPackage(records));
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected monthly");
    const display = versions.display({ reportId: opened.report.id }).report;
    expect(display).toHaveProperty("productProfit.daily.0", expect.objectContaining({ trend: "40", height: "100", negative: false }));
    expect(display).toHaveProperty("productProfit.daily.1", expect.objectContaining({ trend: "-20", height: "50", negative: true }));
    expect(display).toHaveProperty("productProfit.daily.2", expect.objectContaining({ trend: "0", height: "0", negative: false }));
    expect(opened.report).not.toHaveProperty("productProfit.daily.0.height");
  } finally { store.close(); }
});
