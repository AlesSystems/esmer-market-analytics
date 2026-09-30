import { test, expect, _electron as electron } from "@playwright/test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { openStore } from "../../src/store/store";
import { businessPackage, businessRecords, historicalCost } from "../helpers/business-fixtures";

const executablePath = process.env.ESMER_EXECUTABLE ?? (process.platform === "darwin" ? resolve(`release/mac${process.arch === "arm64" ? "-arm64" : ""}/Esmer Market Analytics.app/Contents/MacOS/Esmer Market Analytics`) : process.platform === "win32" ? resolve("release/win-unpacked/Esmer Market Analytics.exe") : resolve("release/linux-unpacked/esmer-market-analytics"));

test("packaged product-profit pages stay bounded and accepted values survive restart", async () => {
  const userData = await mkdtemp(join(tmpdir(), "esmer-product-profit-"));
  const records = businessRecords(), template = records.lines[0];
  records.documents = Array.from({ length: 101 }, (_, index) => ({ id: `S${index}`, kind: "sale" as const, date: "2025-09-01", supplierId: null, purchasing: null, sales: { state: "completed" as const, convertedTo: null, net: "10", tax: "0.5", gross: "10.5" } }));
  records.lines = records.documents.map((document, index) => ({ ...structuredClone(template), id: `L${index}`, documentId: document.id, net: "10", sales: { ...template.sales!, productId: `P${String(index).padStart(3, "0")}`, productName: `Sentetik ürün ${String(index).padStart(3, "0")}`, unitNet: "10", tax: "0.5", gross: "10.5" }, business: { historicalCost: historicalCost("6"), inventory: null } }));
  const store = openStore(join(userData, "analytics.sqlite"));
  try { expect(store.importPackage(businessPackage(records)).status).toBe("active"); } finally { store.close(); }
  let app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
  try {
    let page = await app.firstWindow();
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("1.010,00 ₺");
    await expect.poll(() => page.evaluate(() => window.esmer.getOperationStatus())).toEqual({ status: "idle" });
    const opened = await page.evaluate(() => window.esmer.openMonthly({ period: "2025-09" }));
    if (opened.status !== "monthly" || opened.report.format !== "monthly-report-v2") throw new Error("Expected v2 monthly display");
    const reportId = opened.report.id;
    expect(opened.report.productProfit).toMatchObject({ productCount: 101, summary: { netSales: "1010", coveredCost: "606", coveredGrossProfit: "404" } });
    expect(opened.report.productProfit.daily).toHaveLength(30);
    expect(opened.report.productProfit).not.toHaveProperty("products");
    expect(opened.report.productProfit).not.toHaveProperty("lines");
    const request = { reportId, search: "", sort: "profit" as const, direction: "desc" as const, offset: 0 };
    const first = await page.evaluate(request => window.esmer.readReportProducts(request), request);
    if (first.status !== "products") throw new Error(`Expected product page: ${JSON.stringify(first)}`);
    expect(first.total).toBe(101); expect(first.rows).toHaveLength(100);
    const second = await page.evaluate(request => window.esmer.readReportProducts(request), { ...request, offset: 100 });
    if (second.status !== "products") throw new Error(`Expected second product page: ${JSON.stringify(second)}`);
    expect(second.rows).toHaveLength(1);
    expect(new Set([...first.rows, ...second.rows].map(row => row.productId)).size).toBe(101);
    const selected = await page.evaluate(request => window.esmer.readReportProducts(request), { ...request, search: "  ÜRÜN 100  " });
    if (selected.status !== "products") throw new Error("Expected product search");
    expect(selected.rows).toMatchObject([{ productId: "P100", coveredGrossProfit: "4" }]);
    const evidence = await page.evaluate(reportId => window.esmer.readReportEvidence({ reportId, section: "product-profit", productId: "P100", offset: 0, search: "", range: "current", documentId: null }), reportId);
    expect(evidence).toMatchObject({ status: "evidence", reportId, productId: "P100", total: 1, rows: [{ lineId: "L100", cost: "6", historicalUnitCost: "6" }] });
    const invalid = await page.evaluate(request => { const invalidRequest = { ...request, limit: 1000 }; return window.esmer.readReportProducts(invalidRequest); }, request);
    expect(invalid).toMatchObject({ status: "rejected", code: "INVALID_PAYLOAD" });
    const saved = await page.evaluate(candidateId => window.esmer.acceptReportVersion({ candidateId, previousAcceptedId: null, reason: "Sentetik paketli uygulama kontrolü" }), reportId);
    expect(saved.status).toBe("monthly");
    await app.close();
    app = await electron.launch({ executablePath, args: [`--user-data-dir=${userData}`] });
    page = await app.firstWindow();
    await expect(page.getByRole("region", { name: "Aylık göstergeler", exact: true })).toContainText("1.010,00 ₺");
    await expect.poll(() => page.evaluate(() => window.esmer.getOperationStatus())).toEqual({ status: "idle" });
    const reopened = await page.evaluate(reportId => window.esmer.readReportVersion({ reportId }), reportId);
    expect(reopened).toMatchObject({ status: "monthly", report: { id: reportId, productProfit: opened.report.productProfit } });
    const retained = await page.evaluate(request => window.esmer.readReportProducts(request), request);
    expect(retained).toEqual(first);
  } finally { await app.close(); await rm(userData, { recursive: true, force: true }); }
});
