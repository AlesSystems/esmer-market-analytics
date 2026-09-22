import { expect, test } from "vitest";
import readXlsxFile from "read-excel-file/node";
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
    const summary = await readXlsxFile(bytes, { sheet: "Özet" });
    expect(summary.flat()).toContain(selected.id);
    expect(summary.flat()).toContain(Number(selected.sales.metrics.netSales));
    expect(summary.flat()).toContain("0.125000000000000001");
    const products = await readXlsxFile(bytes, { sheet: "Ürünler" });
    expect(products.flat()).toContain('=HYPERLINK("İstanbul")');
    for (const [, xml] of worksheets) expect(strFromU8(xml)).not.toContain("new-source");
  } finally { store.close(); }
});
