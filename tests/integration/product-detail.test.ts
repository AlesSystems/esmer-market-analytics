import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { ReportVersions } from "../../src/reports/versions";
import { businessPackage } from "../helpers/business-fixtures";

test("selected product reads exact stored summary and daily outcomes by report identity", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2 report");
    const productId = opened.report.productProfit.products[0].productId;
    const result = versions.product({ reportId: opened.report.id, productId });
    expect(result).toMatchObject({ status: "product", reportId: opened.report.id, productId, summary: opened.report.productProfit.products[0] });
    if (result.status !== "product") throw new Error("Expected selected product");
    expect(result.daily).toHaveLength(30);
    expect(result.daily.find(day => day.date === "2025-09-01")).toMatchObject({ netSales: "200", coveredCost: "60", coveredGrossProfit: "40" });
  } finally { store.close(); }
});

test("selected-product export includes the complete pinned scope", async () => {
  const { excelProductReport } = await import("../../src/reports/export");
  const { readSheet } = await import("read-excel-file/node");
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2 report");
    const bytes = await excelProductReport(opened.report, "water");
    const summary = await readSheet(bytes, "Ürün özeti");
    expect(summary.find(row => row[0] === "Kapsanan tahmini brüt kâr")?.slice(0, 3)).toEqual(["Kapsanan tahmini brüt kâr", 40, "40"]);
    expect(summary.find(row => row[0] === "Ürün kimliği")?.slice(0, 2)).toEqual(["Ürün kimliği", "water"]);
  } finally { store.close(); }
});

test("selected return navigation uses retained original evidence with bounded rows", async () => {
  const { productProfitRecords } = await import("../helpers/business-fixtures");
  const records = productProfitRecords();
  records.documents.find(row => row.id === "A1")!.date = "2025-08-31";
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage(records, { coverage: { from: "2025-08-01", to: "2025-09-30", complete: true } }));
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected report");
    const result = versions.product({ reportId: opened.report.id, productId: "A" });
    expect(result).toMatchObject({ summary: { netSales: "-100", coveredCost: "-60", coveredGrossProfit: "-40", coveredMarginPercent: null } });
    const request = { reportId: opened.report.id, productId: "A", returnLineId: "A2", offset: 0 };
    expect(versions.productDependency(request)).toMatchObject({ status: "product-dependency", originalLineId: "A1", document: { date: "2025-08-31" }, total: 1, original: { id: "A1" }, returnOutcome: { cost: "-60" } });
    expect(versions.productDependency({ ...request, offset: 100 })).toMatchObject({ total: 1, rows: [] });
    expect(versions.productDependency({ ...request, productId: "B" })).toMatchObject({ status: "unavailable", code: "NOT_FOUND" });
    expect(versions.productDependency({ ...request, returnLineId: "A1" })).toMatchObject({ status: "unavailable", code: "NOT_FOUND" });
    versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Synthetic dependency" });
    store.importPackage(businessPackage(undefined, { extractionId: "replacement" }));
    const reopened = new ReportVersions(store, new SalesReports(store));
    expect(reopened.product(request)).toEqual(result);
    expect(reopened.productDependency(request)).toEqual(versions.productDependency(request));
  } finally { store.close(); }
});

test("stored outcomes survive changed raw operands and missing original facts stay unavailable", async () => {
  const { reportProduct, reportProductDependency } = await import("../../src/reports/product-detail");
  const { productProfitRecords } = await import("../helpers/business-fixtures");
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage(productProfitRecords()));
    const opened = new ReportVersions(store, new SalesReports(store)).open({ period: "2025-09" });
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected report");
    const report = opened.report;
    report.salesEvidence.lines.find(row => row.id === "A1")!.business!.historicalCost!.unitCost = "999";
    const selected = reportProduct(report, "A");
    expect(selected).toMatchObject({ summary: { coveredCost: "60", coveredGrossProfit: "40" } });
    if (selected.status !== "product") throw new Error("Expected detail");
    expect(selected.daily.slice(0, 2)).toMatchObject([{ coveredCost: "120", coveredGrossProfit: "80" }, { coveredCost: "-60", coveredGrossProfit: "-40" }]);
    report.purchasing.evidence.lines = report.purchasing.evidence.lines.filter(row => row.id !== "A1");
    expect(reportProductDependency(report, { productId: "A", returnLineId: "A2", offset: 0 })).toMatchObject({ status: "unavailable", code: "MISSING_STORED_FACTS" });
    expect(reportProduct(report, "C")).toMatchObject({ summary: { netSales: "40", coveredCost: null, coveredGrossProfit: null, coveredMarginPercent: null, excludedCount: 1 } });
    report.rules.rounding = "OTHER";
    expect(reportProduct(report, "A")).toMatchObject({ status: "unavailable", code: "UNSUPPORTED_PROJECTION_VERSION" });
  } finally { store.close(); }
});

test("product request boundary rejects arbitrary dependencies, offsets and extra scope", async () => {
  const { validMonthlyRequest } = await import("../../src/desktop/requests");
  const detail = { reportId: "report", productId: "A" };
  expect(validMonthlyRequest("readReportProduct", detail)).toBe(true);
  expect(validMonthlyRequest("exportReportProduct", detail)).toBe(true);
  expect(validMonthlyRequest("readReportProduct", { ...detail, search: "A" })).toBe(false);
  const dependency = { ...detail, returnLineId: "R", offset: 0 };
  expect(validMonthlyRequest("readReportProductDependency", dependency)).toBe(true);
  for (const bad of [{ ...dependency, offset: -1 }, { ...dependency, offset: 0.5 }, { ...dependency, documentId: "S" }, { ...dependency, productId: "" }]) expect(validMonthlyRequest("readReportProductDependency", bad)).toBe(false);
});

test("offsetting product and day revisions remain visible with unchanged monthly profit", async () => {
  const { productProfitRecords } = await import("../helpers/business-fixtures");
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage(productProfitRecords(false)));
    const versions = new ReportVersions(store, new SalesReports(store)), before = versions.open({ period: "2025-09" });
    if (before.status !== "monthly") throw new Error("Expected report");
    versions.accept({ candidateId: before.report.id, previousAcceptedId: null, reason: "First synthetic" });
    const changed = productProfitRecords(false);
    changed.lines.find(row => row.id === "A1")!.business!.historicalCost!.unitCost = "50";
    changed.lines.find(row => row.id === "A2")!.business!.historicalCost!.unitCost = "50";
    changed.lines.find(row => row.id === "B1")!.business!.historicalCost!.unitCost = "40";
    store.importPackage(businessPackage(changed, { extractionId: "changed-costs" }));
    const after = versions.open({ period: "2025-09" });
    if (after.status !== "monthly" || before.report.format !== "monthly-report-v2" || after.report.format !== "monthly-report-v2") throw new Error("Expected v2");
    expect(after.report.productProfit.summary.coveredGrossProfit).toBe(before.report.productProfit.summary.coveredGrossProfit);
    const diff = versions.compare({ candidateId: after.report.id, acceptedId: before.report.id });
    expect(diff.changes).toContainEqual(expect.objectContaining({ path: "productProfit.products[A].coveredGrossProfit", delta: "10" }));
    expect(diff.changes).toContainEqual(expect.objectContaining({ path: "productProfit.products[B].coveredGrossProfit", delta: "-10" }));
    expect(diff.changes.some(row => row.path.startsWith("productProfit.daily["))).toBe(true);
  } finally { store.close(); }
});

test("product export preserves all 205 exact rows despite evidence pagination", async () => {
  const { productProfitRecords } = await import("../helpers/business-fixtures");
  const { excelProductReport, excelReport } = await import("../../src/reports/export");
  const { readSheet } = await import("read-excel-file/node");
  const records = productProfitRecords(false), baseDocument = records.documents[0], baseLine = records.lines[0];
  records.documents = Array.from({ length: 205 }, (_, index) => ({ ...structuredClone(baseDocument), id: `P${index}`, sales: { ...baseDocument.sales!, net: "0.015", tax: "0", gross: "0.015" } }));
  records.lines = records.documents.map(document => ({ ...structuredClone(baseLine), id: `${document.id}-line`, documentId: document.id, quantity: "1", net: "0.015", sales: { ...baseLine.sales!, productName: "=SYNTHETIC()", unitNet: "0.015", discountRate: "0", taxRate: "0", tax: "0", gross: "0.015" }, business: { historicalCost: { ...baseLine.business!.historicalCost!, unitCost: "0", documentedZero: true }, inventory: null } }));
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage(records));
    const versions = new ReportVersions(store, new SalesReports(store)), opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected report");
    const reportId = opened.report.id;
    expect(versions.evidence({ reportId, section: "product-profit", offset: 200, search: "", range: "current", documentId: null, productId: "A" })).toMatchObject({ total: 205, rows: expect.any(Array) });
    const selected = versions.product({ reportId, productId: "A" });
    expect(selected).toMatchObject({ summary: { netSales: "3.075", coveredCost: "0", coveredGrossProfit: "3.075" } });
    const bytes = await excelProductReport(opened.report, "A"), rows = await readSheet(bytes, "Ürün satırları");
    const header = rows.findIndex(row => row.includes("lineId"));
    expect(rows.length - header - 1).toBe(205);
    const column = rows[header].indexOf("lineId");
    expect(rows.slice(header + 1).map(row => row[column])).toContain("P204-line");
    const summary = await readSheet(bytes, "Ürün özeti");
    expect(summary.find(row => row[0] === "Kapsanan tahmini brüt kâr")?.[2]).toBe("3.075");
    expect(summary.find(row => row[0] === "Ürün")?.[1]).toBe("=SYNTHETIC()");
    const month = await readSheet(await excelReport(opened.report), "Ürün kâr kanıtları");
    expect(month.some(row => row.includes("P204-line"))).toBe(true);
  } finally { store.close(); }
});

test.each([["100", "0", "0"], ["120", "-20", "-20"], [null, null, null]])("selected profit distinguishes cost %s from missing cost", async (unitCost, profit, margin) => {
  const { businessRecords } = await import("../helpers/business-fixtures");
  const records = businessRecords();
  records.documents = records.documents.slice(0, 1); records.lines = records.lines.slice(0, 1);
  records.lines[0].business!.historicalCost = unitCost === null ? null : { ...records.lines[0].business!.historicalCost!, unitCost };
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage(records, { cutoff: "2025-09-03", coverage: { from: "2025-09-01", to: "2025-09-03", complete: true } }));
    const versions = new ReportVersions(store, new SalesReports(store)), opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected report");
    const result = versions.product({ reportId: opened.report.id, productId: "water" });
    expect(result).toMatchObject({ summary: { coveredGrossProfit: profit, coveredMarginPercent: margin } });
    if (result.status !== "product") throw new Error("Expected product");
    expect(result.daily[3]).toMatchObject({ status: "unavailable", sourceCoverage: "unavailable", netSales: null, coveredGrossProfit: null, trend: null });
    expect(result.daily[1]).toMatchObject({ status: "empty", netSales: "0", trend: "0", coveredCost: null });
  } finally { store.close(); }
});

test("selected quantities keep kilograms and pieces separate with independently expected totals", async () => {
  const { businessRecords, historicalCost } = await import("../helpers/business-fixtures");
  const records = businessRecords();
  for (const [index, input] of [{ quantity: "1.25", unit: "kg" as const, net: "90", unitNet: "72", cost: "50" }, { quantity: "2", unit: "piece" as const, net: "40", unitNet: "20", cost: "12" }].entries()) {
    const doc = records.documents[index], line = records.lines[index];
    doc.sales = { ...doc.sales!, net: input.net, tax: "0", gross: input.net };
    line.quantity = input.quantity; line.net = input.net; line.sales = { ...line.sales!, productId: "mixed", unit: input.unit, unitNet: input.unitNet, discountRate: "0", taxRate: "0", tax: "0", gross: input.net };
    line.business = { historicalCost: { ...historicalCost(input.cost), unit: input.unit }, inventory: null };
  }
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage(records));
    const versions = new ReportVersions(store, new SalesReports(store)), opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly") throw new Error("Expected report");
    expect(versions.product({ reportId: opened.report.id, productId: "mixed" })).toMatchObject({ summary: { netSales: "130", coveredCost: "86.5", coveredGrossProfit: "43.5", coveredMarginPercent: "33.46", quantities: [{ unit: "piece", sold: "2", returned: "0", net: "2" }, { unit: "kg", sold: "1.25", returned: "0", net: "1.25" }] } });
  } finally { store.close(); }
});

test("legacy, unsupported and incomplete saved detail remains unavailable", async () => {
  const { reportProduct } = await import("../../src/reports/product-detail");
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const opened = new ReportVersions(store, new SalesReports(store)).open({ period: "2025-09" });
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected report");
    const { productProfit, ...base } = opened.report;
    expect(reportProduct({ ...base, format: "monthly-report-v1" }, "water")).toMatchObject({ status: "unavailable", code: "PRODUCT_PROFIT_UNAVAILABLE" });
    const future = structuredClone(opened.report); future.calculations.costs = "future-cost-rule";
    expect(reportProduct(future, "water")).toMatchObject({ status: "unavailable", code: "UNSUPPORTED_PROJECTION_VERSION" });
    const incomplete = { ...opened.report, productProfit: { ...productProfit, daily: productProfit.daily.slice(1) } };
    expect(reportProduct(incomplete, "water")).toMatchObject({ status: "unavailable", code: "MISSING_STORED_FACTS" });
    const missingLine = { ...opened.report, productProfit: { ...productProfit, lines: productProfit.lines.slice(1) } };
    expect(reportProduct(missingLine, "water")).toMatchObject({ status: "unavailable", code: "MISSING_STORED_FACTS" });
  } finally { store.close(); }
});


test("report-bound product export matches the immutable artifact without exposing it", async () => {
  const { excelProductReport } = await import("../../src/reports/export");
  const { default: readAll } = await import("read-excel-file/node");
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" });
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2");
    const productId = opened.report.productProfit.products[0].productId;
    expect(await readAll(await versions.exportProduct({ reportId: opened.report.id, productId }))).toEqual(await readAll(await excelProductReport(opened.report, productId)));
    expect(versions.selected(opened.report.id)).toEqual(opened.report);
  } finally { store.close(); }
});
