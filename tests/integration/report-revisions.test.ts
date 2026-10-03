import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { ReportVersions } from "../../src/reports/versions";
import { addPurchase, businessPackage, businessRecords } from "../helpers/business-fixtures";

test("accepted monthly output preserves deleted source facts, app revisions and version explanations", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const first = versions.open({ period: "2025-09" });
    if (first.status !== "monthly") throw new Error("Expected monthly report");
    expect(first.report.purchasing.gross.coveredGrossProfit).toBe("40");
    expect(first.report.operating.result.value).toBeNull();
    versions.accept({ candidateId: first.report.id, previousAcceptedId: null, reason: "İlk inceleme" });
    const saved = versions.selected(first.report.id);
    const records = businessRecords(); records.documents = []; records.lines = [];
    store.appendRevision({ kind: "expense", entityId: "expense", value: { net: "50", date: "2025-09-01", reason: "Düzeltme", evidence: "synthetic-expense" } });
    store.importPackage(businessPackage(records, { extractionId: "deleted" }));
    const next = versions.open({ period: "2025-09" });
    if (next.status !== "monthly") throw new Error("Expected candidate");
    expect(versions.compare({ candidateId: next.report.id, acceptedId: saved.id }).changes.length).toBeGreaterThan(0);
    store.prune(versions.protectedDatasetIds());
    expect(versions.selected(saved.id)).toEqual(saved);
    expect(store.readPinned({ datasetId: saved.context.datasetId, appRevision: saved.context.appRevision }).records.lines.length).toBeGreaterThan(0);
    const restarted = new ReportVersions(store, new SalesReports(store));
    expect(restarted.selected(saved.id)).toEqual(saved);
    expect(restarted.list({ period: "2025-09" }).reports).toHaveLength(1);
    expect(restarted.list({ period: "2025-09" }).reports[0]).toMatchObject({ cutoff: "2025-09-30" });
  } finally { store.close(); }
});

test("cancellation during row persistence and before activation preserves the active pin without import failure", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage()); const before = store.readSnapshot();
    let checks = 0;
    expect(store.importPackage(businessPackage(undefined, { extractionId: "cancelled" }), { checkCancelled: () => { if (++checks === 4) throw new Error("CANCELLED"); } })).toEqual({ status: "cancelled" });
    expect(store.readSnapshot()).toEqual(before);
    expect(store.availability()).not.toHaveProperty("lastImportError");
    const stage = store.stage(businessPackage(undefined, { extractionId: "cancel-activation" }));
    if (stage.status !== "validated") throw new Error("Expected staged package");
    expect(store.activate(stage.id, { checkCancelled: () => { throw new Error("CANCELLED"); } })).toEqual({ status: "cancelled" });
    expect(store.readSnapshot()).toEqual(before);
  } finally { store.close(); }
});

test("accepted version survives disk reopen and compares expense corrections, source changes and retained older rules", async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { Expenses } = await import("../../src/expenses/import");
  const { workbook, row } = await import("../helpers/expense-fixtures");
  const directory = mkdtempSync(join(tmpdir(), "report-revisions-")), path = join(directory, "analytics.sqlite");
  let store = openStore(path);
  try {
    const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
    store.importPackage(businessPackage(records));
    const expenses = new Expenses(store), preview = expenses.preview(await workbook([[...row.slice(0, 1), "15.09.2025", "01.10.2025", ...row.slice(3)]]));
    expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
    store.confirmExpensesComplete({ period: "2025-09", reviewedRevision: 1, complete: true, reason: "Sentetik inceleme" });
    let versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" }); if (opened.status !== "monthly") throw new Error("Expected monthly");
    expect(opened.report.operating.result).toMatchObject({ value: "-10", expenses: "50", breakdown: { operatingExpense: "50", labour: "0" }, breakdownCoverage: { operatingExpense: "available", labour: "missing" } });
    versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Kayıt" });
    const saved = versions.selected(opened.report.id);
    expect(saved.appEvidence).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "confirmation", entityId: "expense-complete:2025-09" })]));
    const expense = expenses.query({ period: "2025-09" }).rows[0];
    if (!("format" in expense.value)) throw new Error("Expected expense-v1");
    const { fieldKeys } = await import("../../src/expenses/validation");
    const value = expense.value;
    const fields = Object.fromEntries(fieldKeys.map(key => [key, value[key as keyof typeof value]])) as import("../../src/expenses/contracts").ExpenseFields;
    store.changeExpense({ entityId: expense.entityId, expectedRevision: expense.revision, replacement: { ...fields, net: "60", gross: "60" }, reason: "Gider düzeltildi" });
    let candidate = versions.open({ period: "2025-09" }); if (candidate.status !== "monthly") throw new Error("Expected candidate");
    expect(candidate.report.operating.result).toMatchObject({ value: null, expenses: "60", reasons: ["EXPENSES_INCOMPLETE"] });
    expect(versions.compare({ candidateId: candidate.report.id, acceptedId: saved.id }).changes).toEqual(expect.arrayContaining([expect.objectContaining({ path: "operating.result.expenses", before: "50", after: "60", delta: "10" })]));
    records.documents[0].sales = { ...records.documents[0].sales!, net: "120", tax: "6", gross: "126" };
    records.lines[0].net = "120"; records.lines[0].sales = { ...records.lines[0].sales!, unitNet: "120", tax: "6", gross: "126" };
    store.importPackage(businessPackage(records, { extractionId: "corrected" }));
    candidate = versions.open({ period: "2025-09" }); if (candidate.status !== "monthly") throw new Error("Expected candidate");
    expect(candidate.report.sales.metrics.netSales).toBe("120");
    expect(versions.compare({ candidateId: candidate.report.id, acceptedId: saved.id }).changes).toEqual(expect.arrayContaining([expect.objectContaining({ path: "sales.metrics.netSales", before: "100", after: "120", delta: "20" })]));
    const older = structuredClone(saved); older.id = "archived-rule-v0"; older.calculations.sales = "synthetic-sales-calc-v0"; older.rules.artifact = "synthetic-rule-v0"; older.rules.conventions = ["Synthetic old rule: fixed test net-sales result 90"]; older.sales.metrics.netSales = "90";
    store.acceptReport({ id: older.id, pin: { datasetId: older.context.datasetId, appRevision: older.context.appRevision }, calculationVersion: "monthly-calc-v0", evidence: [older.rules.artifact], output: { report: older } });
    expect(versions.compare({ candidateId: candidate.report.id, acceptedId: older.id }).changes).toEqual(expect.arrayContaining([expect.objectContaining({ path: "calculations.sales", before: "synthetic-sales-calc-v0" }), expect.objectContaining({ path: "sales.metrics.netSales", before: "90", after: "120" })]));
    store.close(); store = openStore(path); versions = new ReportVersions(store, new SalesReports(store));
    expect(versions.selected(saved.id)).toEqual(saved);
    expect(versions.selected(older.id)).toEqual(older);
    expect(versions.list({ period: "2025-09" }).reports).toHaveLength(2);
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});

test("selectable candidate survives pruning, mismatched periods cannot compare, and snapshots above 1 MiB are retained", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage()); const versions = new ReportVersions(store, new SalesReports(store));
    const opened = versions.open({ period: "2025-09" }); if (opened.status !== "monthly") throw new Error("Expected monthly");
    for (const extractionId of ["next-1", "next-2", "next-3"]) { store.prune(versions.protectedDatasetIds()); store.importPackage(businessPackage(undefined, { extractionId })); }
    expect(versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Eski aday incelendi" }).status).toBe("monthly");
    expect(versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Eski aday incelendi" }).status).toBe("monthly");
    const other = versions.open({ period: "2025-10" }); if (other.status !== "monthly") throw new Error("Expected monthly");
    expect(() => versions.compare({ candidateId: other.report.id, acceptedId: opened.report.id })).toThrow("INCOMPARABLE_REPORTS");
    const output = { evidence: "x".repeat(1024 * 1024 + 1) };
    store.acceptReport({ id: "large-output", pin: store.readPin(), calculationVersion: "fixture-v1", evidence: ["synthetic-large"], output });
    expect(store.readReport("large-output").output).toEqual(output);
  } finally { store.close(); }
});

test("acceptance rejects a stale predecessor without replacing review history", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const first = versions.open({ period: "2025-09" }); if (first.status !== "monthly") throw new Error("Expected report");
    versions.accept({ candidateId: first.report.id, previousAcceptedId: null, reason: "Birinci" });
    const next = versions.open({ period: "2025-09" }); if (next.status !== "monthly") throw new Error("Expected report");
    expect(() => versions.accept({ candidateId: next.report.id, previousAcceptedId: null, reason: "Eski inceleme" })).toThrow("REVIEW_CONFLICT");
    expect(versions.accept({ candidateId: next.report.id, previousAcceptedId: first.report.id, reason: "İkinci" }).status).toBe("monthly");
    expect(versions.list({ period: "2025-09" }).reports).toHaveLength(2);
  } finally { store.close(); }
});

test("two saved versions compare their retained values after a newer candidate is opened", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store));
    const first = versions.open({ period: "2025-09" }); if (first.status !== "monthly") throw new Error("Expected report");
    versions.accept({ candidateId: first.report.id, previousAcceptedId: null, reason: "İlk inceleme" });
    const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
    store.importPackage(businessPackage(records, { extractionId: "second" }));
    const second = versions.open({ period: "2025-09" }); if (second.status !== "monthly") throw new Error("Expected report");
    versions.accept({ candidateId: second.report.id, previousAcceptedId: first.report.id, reason: "İkinci inceleme" });
    const current = versions.open({ period: "2025-09" }); if (current.status !== "monthly") throw new Error("Expected candidate");
    const comparison = versions.compare({ candidateId: second.report.id, acceptedId: first.report.id });
    expect(comparison.changes).toContainEqual({ path: "sales.metrics.netSales", before: "200", after: "100", delta: "-100" });
    expect(comparison.changes.some(row => /^productProfit\.(products|lines|daily|sourceExclusions)/.test(row.path))).toBe(false);
    expect(comparison.changes).toEqual(expect.arrayContaining([expect.objectContaining({path:"productProfit.summary.netSales",before:"200",after:"100"})]));
    expect(versions.selected(first.report.id).sales.metrics.netSales).toBe("200");
    expect(versions.selected(second.report.id).sales.metrics.netSales).toBe("100");
    expect(versions.selected(current.report.id).review).toBeNull();
  } finally { store.close(); }
});

test("v1 to v2 comparison summarizes composition without expanding every new line", () => {
  const store = openStore(":memory:");
  try {
    const records = businessRecords(), document = records.documents[0], line = records.lines[0];
    records.documents = Array.from({length:205},(_,index)=>({...structuredClone(document),id:`S${index}`}));
    records.lines = records.documents.map((row,index)=>({...structuredClone(line),id:`L${index}`,documentId:row.id,sales:{...line.sales!,productId:`P${index}`,productName:`Ürün ${index}`}}));
    store.importPackage(businessPackage(records));
    const versions = new ReportVersions(store,new SalesReports(store)), opened = versions.open({period:"2025-09"});
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2");
    const legacy = structuredClone(opened.report) as unknown as import("../../src/reports/contracts").MonthlyReportV1;
    Reflect.deleteProperty(legacy,"productProfit");
    legacy.id = "legacy-cross-format"; legacy.format = "monthly-report-v1"; legacy.calculations.report = "monthly-calc-v1"; legacy.rules.artifact = "esmer-market:monthly-v1";
    legacy.review = {acceptedAt:"2025-10-01T00:00:00.000Z",reason:"Sentetik eski sürüm",previousAcceptedId:null};
    store.acceptReport({id:legacy.id,pin:{datasetId:legacy.context.datasetId,appRevision:legacy.context.appRevision},calculationVersion:legacy.calculations.report,evidence:[legacy.rules.artifact],output:{report:legacy}});
    const changes = versions.compare({candidateId:opened.report.id,acceptedId:legacy.id}).changes;
    expect(changes).toEqual(expect.arrayContaining([expect.objectContaining({path:"format",before:"monthly-report-v1",after:"monthly-report-v2"}),expect.objectContaining({path:"productProfit.version",before:null,after:"monthly-product-profit-v1"})]));
    expect(changes.length).toBeLessThan(100);
    expect(changes.some(row=>/^productProfit\.(products|lines|sourceExclusions)/.test(row.path))).toBe(false);
    expect(versions.accept({candidateId:opened.report.id,previousAcceptedId:legacy.id,reason:"Yeni sentetik sürüm"}).status).toBe("monthly");
  } finally { store.close(); }
});


test("replacement comparisons retain each unit for the same product without reorder differences", () => {
  const store = openStore(":memory:");
  try {
    const records = businessRecords();
    for (const [index, unit] of ["kg", "piece"].entries()) {
      const line = records.lines[index];
      line.sales = { ...line.sales!, productId: "water", unit: unit as "kg" | "piece" };
      line.business = { historicalCost: { unitCost: "20", unit: unit as "kg" | "piece", taxBasis: "net", evidence: "synthetic-cost", documentedZero: false, originalSaleLineId: null }, inventory: null };
      addPurchase(records, `purchase-${unit}`, unit === "kg" ? "30" : "25");
      records.lines.at(-1)!.sales = { ...records.lines.at(-1)!.sales!, unit: unit as "kg" | "piece" };
    }
    expect(store.importPackage(businessPackage(records)).status).toBe("active");
    const versions = new ReportVersions(store, new SalesReports(store));
    const first = versions.open({ period: "2025-09" });
    if (first.status !== "monthly") throw new Error("Expected monthly report");
    expect(first.report.purchasing.purchasing.replacements.map(row => [row.productId, row.unit, row.latestUnitCost])).toEqual([["water", "kg", "30"], ["water", "piece", "25"]]);
    versions.accept({ candidateId: first.report.id, previousAcceptedId: null, reason: "Sentetik birim incelemesi" });
    const reordered = versions.selected(first.report.id);
    reordered.id = "reordered-replacements";
    reordered.purchasing.purchasing.replacements.reverse();
    store.acceptReport({ id: reordered.id, pin: { datasetId: reordered.context.datasetId, appRevision: reordered.context.appRevision }, calculationVersion: reordered.calculations.report, evidence: [reordered.rules.artifact], output: { report: reordered } });
    expect(versions.compare({ candidateId: first.report.id, acceptedId: first.report.id }).changes).toEqual([]);
    for (const unit of ["kg", "piece"] as const) {
      const corrected = structuredClone(records);
      const document = corrected.documents.find(row => row.id === `purchase-${unit}`)!;
      const line = corrected.lines.find(row => row.documentId === document.id)!;
      const cost = unit === "kg" ? "31" : "26";
      document.sales = { ...document.sales!, net: cost, gross: cost };
      line.net = cost; line.sales = { ...line.sales!, unitNet: cost, gross: cost };
      expect(store.importPackage(businessPackage(corrected, { extractionId: `corrected-${unit}` })).status).toBe("active");
      const candidate = versions.open({ period: "2025-09" });
      if (candidate.status !== "monthly") throw new Error("Expected monthly candidate");
      expect(candidate.report.purchasing.purchasing.replacements.find(row => row.unit === unit)?.latestUnitCost).toBe(cost);
      const changes = versions.compare({ candidateId: candidate.report.id, acceptedId: first.report.id }).changes;
      expect(changes.filter(row => row.path.startsWith("purchasing.purchasing.replacements") && row.path.endsWith(".latestUnitCost"))).toEqual([
        { path: `purchasing.purchasing.replacements[water:${unit}].latestUnitCost`, before: unit === "kg" ? "30" : "25", after: cost, delta: "1" },
      ]);
      expect(changes.filter(row => row.path.includes(`replacements[water:${unit === "kg" ? "piece" : "kg"}]`))).toEqual([]);
      expect(changes).toContainEqual({ path: `purchasing.purchasing.history[purchase-${unit}-line].unitCost`, before: unit === "kg" ? "30" : "25", after: cost, delta: "1" });
    }
    expect(versions.compare({ candidateId: reordered.id, acceptedId: first.report.id }).changes).toEqual([]);
  } finally { store.close(); }
});
