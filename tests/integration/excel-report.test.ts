import { expect, test } from "vitest";
import { readSheet } from "read-excel-file/node";
import { unzipSync, strFromU8 } from "fflate";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
import { ReportVersions } from "../../src/reports/versions";
import { excelReport } from "../../src/reports/export";
import { businessPackage } from "../helpers/business-fixtures";

test("Excel uses the selected immutable report across refresh and preserves Turkish numeric and text cells", async () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store)), result = versions.open({ period: "2025-09" });
    if (result.status !== "monthly") throw new Error("Expected monthly report");
    const selected = result.report;
    selected.sales.products[0].name = "=HYPERLINK(\"İstanbul\")";
    selected.sales.metrics.quantities.kg = "0.125000000000000001";
    const exporting = excelReport(selected);
    store.importPackage(businessPackage(undefined, { extractionId: "new-source" }));
    const bytes = await exporting, files = unzipSync(bytes);
    const worksheets = Object.entries(files).filter(([name]) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name));
    expect(worksheets.length).toBeGreaterThan(8);
    for (const [, xml] of worksheets) { const text = strFromU8(xml); expect(text).not.toMatch(/<f[ >]/); }
    const summary = await readSheet(bytes, "Özet");
    expect(summary.flat()).toContain(selected.id);
    expect(summary.flat()).toContain(Number(selected.sales.metrics.netSales));
    expect(summary.flat()).toContain("0.125000000000000001");
    const products = await readSheet(bytes, "Ürünler");
    expect(products.flat()).toContain('=HYPERLINK("İstanbul")');
    for (const [, xml] of worksheets) expect(strFromU8(xml)).not.toContain("new-source");
  } finally { store.close(); }
});

test("workbook has Turkish tables, report metadata on every sheet, exact unsafe decimals and explicit cell bounds", async () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const versions = new ReportVersions(store, new SalesReports(store)), result = versions.open({ period: "2025-09" });
    if (result.status !== "monthly") throw new Error("Expected monthly");
    versions.accept({ candidateId: result.report.id, previousAcceptedId: null, reason: "Dışa aktarım incelemesi" });
    const report = versions.selected(result.report.id);
    report.sales.products[0].name = "@Çeşit + ürün";
    report.sales.products[0].quantities.kg = "12345678901234567890.123456789";
    const bytes = await excelReport(report);
    const { default: readAll } = await import("read-excel-file/node");
    const sheets = await readAll(bytes);
    for (const sheet of sheets) {
      expect(sheet.data[0].slice(0, 2)).toEqual(["Rapor sürümü", report.id]);
      expect(sheet.data.flat()).toContain("2025-09-30");
      expect(sheet.data.flat()).toContain("Tarihsel son alış maliyeti tahmini; yalnız kapsanan satışlar");
    }
    const summary = await readSheet(bytes, "Özet");
    expect(summary.find(row => row[0] === "Kapsanan tahmini brüt kâr")?.[1]).toBe(40);
    expect(summary.find(row => row[0] === "Tahmini maliyet")?.[1]).toBe(60);
    expect(summary.find(row => row[0] === "İşçilik")?.[1]).toBeNull();
    const products = await readSheet(bytes, "Ürünler");
    expect(products.some(row => row.includes("Net satış") && row.includes("Kilogram"))).toBe(true);
    expect(products.flat()).toContain("12345678901234567890.123456789");
    expect(products.flat()).toContain("@Çeşit + ürün");
    const transactions = await readSheet(bytes, "Satış işlemleri");
    expect(transactions.some(row => row.includes("Belge kimliği") && row.includes("Kaynakla uzlaşmış"))).toBe(true);
    report.sales.products[0].name = "x".repeat(32_768);
    await expect(excelReport(report)).rejects.toThrow("EXCEL_CELL_LIMIT");
  } finally { store.close(); }
});

test("an unavailable month exports blanks rather than invented zero sales or profit", async () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const result = new ReportVersions(store, new SalesReports(store)).open({ period: "2025-10" });
    if (result.status !== "monthly") throw new Error("Expected monthly");
    expect(result.report.sales.coverage).toBe("unavailable");
    const summary = await readSheet(await excelReport(result.report), "Özet");
    for (const title of ["Net satış", "KDV", "Tamamlanan satış işlemi", "Tahmini maliyet", "Kapsanan tahmini brüt kâr", "İşçilik"]) expect(summary.find(row => row[0] === title)?.[1]).toBeNull();
  } finally { store.close(); }
});
