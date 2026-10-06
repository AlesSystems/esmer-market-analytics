import { Exact, rounded, sum } from "../domain/money";
import type { Records } from "../source/package";
import type { GrossResult, CostRow } from "./costs";
import type { SalesComponent, SalesResult } from "./sales";

export const PRODUCT_PROFIT_VERSION = "monthly-product-profit-v1";
type Quantity = { unit: "piece" | "kg"; sold: string; returned: string; net: string };
type Scope = { netSales: string | null; coveredSales: string | null; coveredCost: string | null; coveredGrossProfit: string | null; coveredMarginPercent: string | null; costCoveragePercent: string | null; coveredCount: number; excludedCount: number; quantities: Quantity[]; exposures: GrossResult["exposures"]; exclusionReasons: string[] };
export type ProductProfitLine = SalesComponent & { cost: string | null; historicalUnitCost: string | null; originalSaleLineId: string | null; costReason: CostRow["reason"] | "UNSUPPORTED_COST_MAPPING" | null; costEvidence: string | null };
export type ProductProfit = { version: typeof PRODUCT_PROFIT_VERSION; lineage: string; period: string; summary: Scope & { status: "empty" | "ready" | "unavailable"; scope: "market" | "covered"; salesCoverage: { complete: boolean; unresolvedCount: number; exposure: string | null }; periodCoverage: { from: string; to: string; complete: boolean }; warnings: string[] }; products: (Scope & { productId: string; displayName: string; displayStatus: "approved" | "fallback" })[]; daily: (Scope & { date: string; status: "empty" | "ready" | "unavailable"; sourceCoverage: "complete" | "partial" | "unavailable"; trend: string | null })[]; lines: ProductProfitLine[]; sourceExclusions: { documentId: string; date: string; reason: SalesResult["exclusions"][number]["reason"]; exposure: null }[] };

export function projectProductProfitScopeV1(lines: ProductProfitLine[], supported: boolean): Scope {
  const covered = lines.filter(row => row.costReason === null), excluded = lines.filter(row => row.costReason !== null);
  const netSales = sum(lines.map(row => row.net)), coveredSales = sum(covered.map(row => row.net));
  const coveredCost = supported && covered.length ? sum(covered.map(row => row.cost!)) : null;
  const coveredGrossProfit = coveredCost === null ? null : new Exact(coveredSales).minus(coveredCost).toFixed();
  const absolute = (rows: ProductProfitLine[]) => sum(rows.map(row => new Exact(row.net).abs().toFixed()));
  const denominator = new Exact(absolute(lines));
  const quantity = (kind: ProductProfitLine["kind"], unit: "piece" | "kg") => sum(lines.filter(row => row.kind === kind && row.unit === unit).map(row => new Exact(row.quantity).abs().toFixed()));
  const quantities: Quantity[] = (["piece", "kg"] as const).filter(unit => lines.some(row => row.unit === unit)).map(unit => { const sold = quantity("sale", unit), returned = quantity("customer-return", unit); return { unit, sold, returned, net: new Exact(sold).minus(returned).toFixed() }; });
  const exposure = (rows: ProductProfitLine[], kind: ProductProfitLine["kind"]) => sum(rows.filter(row => row.kind === kind).map(row => row.net));
  return { netSales, coveredSales, coveredCost, coveredGrossProfit, coveredMarginPercent: coveredGrossProfit !== null && new Exact(coveredSales).gt(0) ? rounded(new Exact(coveredGrossProfit).div(coveredSales).times(100).toFixed()) : null,
    costCoveragePercent: supported && denominator.gt(0) ? rounded(new Exact(absolute(covered)).div(denominator).times(100).toFixed()) : null,
    coveredCount: covered.length, excludedCount: excluded.length, quantities, exclusionReasons: [...new Set(excluded.map(row => row.costReason!))],
    exposures: { coveredSales: exposure(covered, "sale"), coveredReturns: exposure(covered, "customer-return"), excludedSales: exposure(excluded, "sale"), excludedReturns: exposure(excluded, "customer-return") } };
}

export function buildProductProfit(input: { sales: SalesResult; gross: GrossResult; records: Records; lineage: string; period: string; coverage: { from: string; to: string; complete: boolean } }): ProductProfit {
  const { sales, gross, records, lineage, period, coverage } = input;
  const supported = gross.status === "ready";
  const costs = new Map<string, CostRow>();
  for (const row of [...gross.covered, ...gross.excluded]) {
    if (costs.has(row.lineId)) throw new Error("DUPLICATE_COST_ROW");
    costs.set(row.lineId, row);
  }
  if (supported && (costs.size !== sales.lines.length || sales.lines.some(line => !costs.has(line.lineId)))) throw new Error("COST_MEMBERSHIP_MISMATCH");
  const inputs = new Map(records.lines.map(row => [row.id, row]));
  const lines = sales.lines.map(line => {
    const cost = costs.get(line.lineId);
    if (cost && (cost.documentId !== line.documentId || cost.productId !== line.productId || cost.unit !== line.unit || cost.net !== line.net || cost.quantity !== line.quantity)) throw new Error("COST_MEMBERSHIP_MISMATCH");
    const original = inputs.get(line.lineId)?.business?.historicalCost;
    return { ...structuredClone(line), cost: cost?.cost ?? null, historicalUnitCost: original?.unitCost ?? null, originalSaleLineId: original?.originalSaleLineId ?? null, costReason: supported ? cost!.reason : "UNSUPPORTED_COST_MAPPING" as const, costEvidence: cost?.evidence ?? null };
  });
  const documents = new Map(records.documents.map(row => [row.id, row]));
  const sourceExclusions = sales.exclusions.map(row => {
    const date = documents.get(row.documentId)?.date;
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("MISSING_EXCLUSION_DATE");
    return { ...row, date, exposure: null as null };
  });
  const relevant = (date: string) => sourceExclusions.some(row => row.date === date && ["UNKNOWN_MEANING", "CONVERSION_CONFLICT", "NO_LINES"].includes(row.reason)) || sales.documents.some(doc => doc.date === date && !doc.reconciled);
  const groups = new Map<string, ProductProfitLine[]>();
  for (const line of lines) { const group = groups.get(line.productId) ?? []; group.push(line); groups.set(line.productId, group); }
  const products = [...groups].map(([productId, group]) => { const name = group[0].productName?.trim(); return { productId, displayName: name || `Ürün #${productId}`, displayStatus: name ? "approved" as const : "fallback" as const, ...projectProductProfitScopeV1(group, supported) }; })
    .sort((a, b) => a.productId.localeCompare(b.productId, "en"));
  const daily: ProductProfit["daily"] = [];
  const last = new Date(Date.UTC(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0)).getUTCDate();
  for (let day = 1; day <= last; day++) {
    const date = `${period}-${String(day).padStart(2, "0")}`;
    const group = lines.filter(line => line.date === date), values = projectProductProfitScopeV1(group, supported);
    const observed = date >= coverage.from && date <= coverage.to;
    const sourceCoverage = !observed ? "unavailable" : !coverage.complete || relevant(date) ? "partial" : "complete";
    const status = !supported || sourceCoverage !== "complete" && !group.length || sourceCoverage === "unavailable" || group.length > 0 && values.coveredCount === 0 ? "unavailable" : group.length ? "ready" : "empty";
    daily.push({ ...values, ...(status === "unavailable" && !group.length ? { netSales: null, coveredSales: null, coveredCost: null, coveredGrossProfit: null, coveredMarginPercent: null, costCoveragePercent: null } : {}), date, status, sourceCoverage, trend: status === "unavailable" && !group.length ? null : values.coveredGrossProfit ?? (status === "empty" ? "0" : null) });
  }
  const summary = projectProductProfitScopeV1(lines, supported);
  const complete = supported && sales.complete && coverage.complete && coverage.from <= `${period}-01` && coverage.to >= `${period}-${last}` && summary.excludedCount === 0;
  const unresolvedCount = sourceExclusions.filter(row => ["UNKNOWN_MEANING", "CONVERSION_CONFLICT", "NO_LINES"].includes(row.reason)).length + sales.documents.filter(row => !row.reconciled).length;
  return { version: PRODUCT_PROFIT_VERSION, lineage, period, summary: { ...summary, status: supported && !lines.length && unresolvedCount === 0 && complete ? "empty" : !supported || !summary.coveredCount || !lines.length && unresolvedCount > 0 ? "unavailable" : "ready", scope: complete ? "market" : "covered", salesCoverage: { complete: sales.complete, unresolvedCount, exposure: unresolvedCount ? null : "0" }, periodCoverage: coverage, warnings: [...new Set([...gross.warnings, ...(!sales.complete ? ["INCOMPLETE_SALES"] : [])])] }, products, daily, lines, sourceExclusions };
}
