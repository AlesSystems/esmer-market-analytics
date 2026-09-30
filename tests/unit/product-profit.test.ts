import { expect, test } from "vitest";
import { buildProductProfit } from "../../src/analytics/product-profit";
import { sum, Exact } from "../../src/domain/money";
import type { SalesComponent, SalesResult } from "../../src/analytics/sales";
import type { GrossResult, CostRow } from "../../src/analytics/costs";
import type { Records } from "../../src/source/package";

type Input = { id: string; product?: string; date?: string; kind?: "sale" | "customer-return"; unit?: "piece" | "kg"; quantity: string; net: string; cost: string | null; reason?: CostRow["reason"]; original?: string | null };
function fixture(input: Input[], options: { from?: string; to?: string; complete?: boolean; costSupported?: boolean; unresolved?: boolean } = {}) {
  const lines: SalesComponent[] = input.map(row => ({ documentId: `D${row.id}`, lineId: row.id, date: row.date ?? "2025-09-01", kind: row.kind ?? "sale", productId: row.product ?? "A", productName: row.product ?? "A", categoryId: "C", categoryName: "C", unit: row.unit ?? "piece", quantity: row.kind === "customer-return" ? new Exact(row.quantity).neg().toFixed() : row.quantity, net: row.net, tax: "0", gross: row.net, recorded: { quantity: row.quantity, net: row.net, tax: "0", gross: row.net }, input: { productId: row.product ?? "A", productName: row.product ?? "A", categoryId: "C", categoryName: "C", unit: row.unit ?? "piece", meaning: "known", unitNet: row.net, discountRate: "0", taxRate: "0", tax: "0", gross: row.net }, expectedTax: "0", reconciled: true }));
  const sales: SalesResult = { status: "ready", netSales: sum(lines.map(row => row.net)), tax: "0", gross: sum(lines.map(row => row.net)), saleDocumentCount: lines.filter(row => row.kind === "sale").length, basketNumerator: "0", averageBasket: null, quantities: {piece: "0", kg: "0"}, lines, documents: lines.map(row => ({ documentId: row.documentId, date: row.date, kind: row.kind, net: row.net, tax: "0", gross: row.net, recorded: {net: row.net, tax: "0", gross: row.net}, reconciled: true })), exclusions: options.unresolved ? [{ documentId: "unknown", reason: "UNKNOWN_MEANING" }] : [], complete: !options.unresolved };
  const rows: CostRow[] = lines.map((row, index) => ({lineId: row.lineId, documentId: row.documentId, productId: row.productId, productName: row.productName, unit: row.unit, quantity: row.quantity, net: row.net, cost: input[index].cost, reason: input[index].reason ?? (input[index].cost === null ? "MISSING_COST" : null), evidence: input[index].cost === null ? null : "fixture"}));
  const gross: GrossResult = { status: options.costSupported === false ? "unavailable" : "ready", confidence: "estimated", method: "historical-last-purchase-estimate", coveredSales: "0", coveredCost: "0", coveredGrossProfit: "0", coveredMarginPercent: null, costCoveragePercent: null, covered: options.costSupported === false ? [] : rows.filter(row => row.reason === null), excluded: options.costSupported === false ? [] : rows.filter(row => row.reason !== null), exposures: {coveredSales:"0",coveredReturns:"0",excludedSales:"0",excludedReturns:"0"}, warnings: [] };
  const records: Records = { documents: options.unresolved ? [{ id: "unknown", date: "2025-09-02", kind: "sale", supplierId: null, purchasing: null }] : [], lines: lines.map((row, index) => ({ id: row.lineId, documentId: row.documentId, quantity: input[index].quantity, net: row.net, cost: null, business: { historicalCost: {unitCost: input[index].cost === null ? null : new Exact(input[index].cost!).div(row.quantity).toFixed(), unit: row.unit, taxBasis: "net", evidence: "fixture", documentedZero: input[index].cost === "0", originalSaleLineId: input[index].original ?? null }, inventory: null } })), suppliers: [] };
  return buildProductProfit({sales, gross, records, lineage:"fixture", period:"2025-09", coverage:{from:options.from ?? "2025-09-01",to:options.to ?? "2025-09-30",complete:options.complete ?? true}});
}

test("E01–E03: product and daily partitions reconcile, including absolute cost coverage", () => {
  const base: Input[] = [{id:"A1",quantity:"2",net:"200",cost:"120"},{id:"B1",product:"B",quantity:"1",net:"50",cost:"30"}];
  const e01 = fixture(base);
  expect(e01.summary).toMatchObject({netSales:"250",coveredSales:"250",coveredCost:"150",coveredGrossProfit:"100",coveredMarginPercent:"40",costCoveragePercent:"100",scope:"market"});
  expect(e01.products.map(row => [row.productId,row.coveredGrossProfit])).toEqual([["A","80"],["B","20"]]);
  const e02 = fixture([...base,{id:"A2",date:"2025-09-02",kind:"customer-return",quantity:"1",net:"-100",cost:"-60",original:"A1"}]);
  expect(e02.summary).toMatchObject({netSales:"150",coveredSales:"150",coveredCost:"90",coveredGrossProfit:"60",costCoveragePercent:"100"});
  expect(e02.summary.quantities).toEqual([{unit:"piece",sold:"3",returned:"1",net:"2"}]);
  expect(e02.lines.find(row => row.lineId === "A2")).toMatchObject({historicalUnitCost:"60",originalSaleLineId:"A1",cost:"-60"});
  expect(e02.daily.slice(0,2).map(row => row.coveredGrossProfit)).toEqual(["100","-40"]);
  const e03 = fixture([...base,{id:"A2",date:"2025-09-02",kind:"customer-return",quantity:"1",net:"-100",cost:"-60",original:"A1"},{id:"C1",product:"C",quantity:"1",net:"40",cost:null}]);
  expect(e03.summary).toMatchObject({netSales:"190",coveredSales:"150",coveredCost:"90",coveredGrossProfit:"60",coveredMarginPercent:"40",costCoveragePercent:"89.74",coveredCount:3,excludedCount:1,scope:"covered"});
  expect(e03.summary.exposures.excludedSales).toBe("40");
  expect(sum(e03.products.map(row => row.coveredGrossProfit ?? "0"))).toBe("60");
  expect(sum(e03.daily.map(row => row.coveredGrossProfit ?? "0"))).toBe("60");
  for (const field of ["netSales", "coveredSales", "coveredCost", "coveredGrossProfit"] as const) {
    expect(sum(e03.products.map(row => row[field] ?? "0"))).toBe(e03.summary[field]);
    expect(sum(e03.daily.map(row => row[field] ?? "0"))).toBe(e03.summary[field]);
  }
});

test("E04–E06 and E10–E12: returns, absent cost, zero, loss and denominators", () => {
  const ret = fixture([{id:"R",kind:"customer-return",quantity:"1",net:"-100",cost:"-60",original:"prior"}]);
  expect(ret.summary).toMatchObject({netSales:"-100",coveredCost:"-60",coveredGrossProfit:"-40",coveredMarginPercent:null,costCoveragePercent:"100"});
  expect(ret.summary.quantities).toEqual([{unit:"piece",sold:"0",returned:"1",net:"-1"}]);
  const missing = fixture([{id:"R",kind:"customer-return",quantity:"1",net:"-100",cost:null,reason:"RETURN_ATTRIBUTION"}]);
  expect(missing.summary).toMatchObject({netSales:"-100",coveredCost:null,coveredGrossProfit:null,coveredMarginPercent:null,costCoveragePercent:"0"});
  expect(missing.summary.status).toBe("unavailable");
  expect(missing.daily[0]).toMatchObject({netSales:"-100",coveredGrossProfit:null});
  expect(fixture([{id:"Z",quantity:"1",net:"100",cost:"100"}]).summary).toMatchObject({coveredGrossProfit:"0",coveredMarginPercent:"0"});
  expect(fixture([{id:"L",quantity:"1",net:"100",cost:"120"}]).summary).toMatchObject({coveredGrossProfit:"-20",coveredMarginPercent:"-20"});
  expect(fixture([{id:"F",quantity:"1",net:"0",cost:"0"}]).summary).toMatchObject({coveredGrossProfit:"0",coveredMarginPercent:null,costCoveragePercent:null,coveredCount:1});
  expect(fixture([{id:"F",quantity:"1",net:"0",cost:"5"}]).summary).toMatchObject({coveredGrossProfit:"-5",coveredMarginPercent:null,costCoveragePercent:null});
  expect(fixture([{id:"S",quantity:"1",net:"100",cost:"60"},{id:"R",kind:"customer-return",quantity:"1",net:"-100",cost:"-60"}]).summary).toMatchObject({coveredGrossProfit:"0",coveredMarginPercent:null,costCoveragePercent:"100"});
  expect(fixture([{id:"S",quantity:"1",net:"100",cost:"60"},{id:"X",quantity:"1",net:"0",cost:null}]).summary).toMatchObject({coveredGrossProfit:"40",costCoveragePercent:"100",excludedCount:1,scope:"covered"});
});

test("E07–E09: units, transaction costs and tiny exact values", () => {
  const mixed = fixture([{id:"X",product:"X",unit:"kg",quantity:"1.250",net:"90",cost:"62.5"},{id:"Y",product:"Y",quantity:"2",net:"40",cost:"24"}]);
  expect(mixed.summary).toMatchObject({netSales:"130",coveredCost:"86.5",coveredGrossProfit:"43.5",coveredMarginPercent:"33.46"});
  expect(mixed.summary.quantities).toEqual([{unit:"piece",sold:"2",returned:"0",net:"2"},{unit:"kg",sold:"1.25",returned:"0",net:"1.25"}]);
  expect(fixture([{id:"A",quantity:"1",net:"100",cost:"60"},{id:"B",quantity:"1",net:"100",cost:"80"}]).summary).toMatchObject({coveredCost:"140",coveredGrossProfit:"60"});
  expect(fixture([{id:"A",quantity:"1",net:"0.015",cost:"0"},{id:"B",quantity:"1",net:"0.015",cost:"0"}]).summary).toMatchObject({coveredGrossProfit:"0.03",coveredCount:2});
});

test("incomplete empty days are gaps; observed partial contributions still reconcile", () => {
  const p = fixture([{id:"A",quantity:"1",net:"100",cost:"60"}],{from:"2025-09-01",to:"2025-09-02",complete:false,unresolved:true});
  expect(p.daily[0]).toMatchObject({status:"ready",sourceCoverage:"partial",coveredGrossProfit:"40"});
  expect(p.daily[1]).toMatchObject({status:"unavailable",sourceCoverage:"partial",netSales:null,coveredGrossProfit:null,trend:null});
  expect(p.daily[2]).toMatchObject({status:"unavailable",sourceCoverage:"unavailable",netSales:null,trend:null});
  expect(sum(p.daily.map(row => row.coveredGrossProfit ?? "0"))).toBe(p.summary.coveredGrossProfit);
  const full = fixture([]);
  expect(full.summary.status).toBe("empty");
  expect(full.daily[0]).toMatchObject({status:"empty",trend:"0"});
});

test("sales-only mapping retains recognized net and marks cost unavailable", () => {
  const p = fixture([{id:"A",quantity:"1",net:"100",cost:null}],{costSupported:false});
  expect(p.summary).toMatchObject({status:"unavailable",netSales:"100",coveredCost:null,coveredGrossProfit:null,costCoveragePercent:null});
  expect(p.lines[0].costReason).toBe("UNSUPPORTED_COST_MAPPING");
  expect(p.daily[0]).toMatchObject({status:"unavailable",netSales:"100",coveredCost:null,coveredGrossProfit:null});
});

test("unresolved-only month has no profit and pins independent line evidence", () => {
  expect(fixture([],{unresolved:true}).summary).toMatchObject({status:"unavailable",salesCoverage:{complete:false,unresolvedCount:1,exposure:null}});
  const original: Input[] = [{id:"A",quantity:"1",net:"100",cost:"60"}];
  const report = fixture(original);
  original[0].net = "999";
  expect(report.lines[0]).toMatchObject({net:"100",historicalUnitCost:"60",costEvidence:"fixture"});
});

test("recognized cross-month return and unknown-unit document flow through real calculators", async () => {
  const { businessRecords, historicalCost } = await import("../helpers/business-fixtures");
  const { calculateSales } = await import("../../src/analytics/sales");
  const { estimateGrossResult } = await import("../../src/analytics/costs");
  const records = businessRecords();
  records.documents[0].date = "2025-08-31";
  records.lines[0].quantity = "2";
  records.documents[1].kind = "customer-return";
  records.lines[1].net = "-100";
  records.lines[1].business!.historicalCost = {...historicalCost(), originalSaleLineId:"L1"};
  const context = {mappingVersion:"synthetic-business-v1",from:"2025-09-01",to:"2025-09-30"};
  const sales = calculateSales(records,context), gross = estimateGrossResult(records,context);
  const build = () => buildProductProfit({sales,gross,records,lineage:"fixture",period:"2025-09",coverage:{from:context.from,to:context.to,complete:true}});
  expect(build().summary).toMatchObject({netSales:"-100",coveredCost:"-60",coveredGrossProfit:"-40"});
  expect(build().lines[0]).toMatchObject({originalSaleLineId:"L1",historicalUnitCost:"60"});
  records.lines[1].business!.historicalCost!.originalSaleLineId = null;
  const badGross = estimateGrossResult(records,context);
  expect(buildProductProfit({sales,gross:badGross,records,lineage:"fixture",period:"2025-09",coverage:{from:context.from,to:context.to,complete:true}}).summary).toMatchObject({netSales:"-100",coveredCost:null,coveredGrossProfit:null});
  records.lines[1].business!.historicalCost!.originalSaleLineId = "L1";
  records.lines[1].quantity = "1.5";
  records.lines.push({...structuredClone(records.lines[1]),id:"R2"});
  const overSales = calculateSales(records,context), overGross = estimateGrossResult(records,context);
  expect(buildProductProfit({sales:overSales,gross:overGross,records,lineage:"fixture",period:"2025-09",coverage:{from:context.from,to:context.to,complete:true}}).summary.coveredCount).toBe(0);
  const unknown = businessRecords(); unknown.lines[0].sales!.unit = "unknown";
  const unknownSales = calculateSales(unknown,context), unknownGross = estimateGrossResult(unknown,context);
  const unresolved = buildProductProfit({sales:unknownSales,gross:unknownGross,records:unknown,lineage:"fixture",period:"2025-09",coverage:{from:context.from,to:context.to,complete:true}});
  expect(unresolved.lines.map(row => row.lineId)).toEqual(["L2"]);
  expect(unresolved.sourceExclusions).toMatchObject([{documentId:"S1",reason:"UNKNOWN_MEANING",exposure:null}]);
  expect(unresolved.summary.salesCoverage).toMatchObject({complete:false,unresolvedCount:1,exposure:null});
});
