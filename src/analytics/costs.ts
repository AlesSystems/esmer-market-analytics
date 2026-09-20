import { Exact, sum, rounded } from "../domain/money";
import { BUSINESS_MAPPING_VERSION, type Records, type HistoricalCost } from "../source/package";
import { calculateSales, type SalesContext } from "./sales";
export const COST_CALCULATION_VERSION = "synthetic-cost-calc-v1";
export type CostReason = "MISSING_COST" | "UNVALIDATED_COST" | "UNKNOWN_UNIT" | "UNKNOWN_TAX" | "NEGATIVE_COST" | "UNDOCUMENTED_ZERO" | "RETURN_ATTRIBUTION";
export type CostRow = { lineId: string; documentId: string; productId: string; productName: string; unit: "piece" | "kg"; quantity: string; net: string; cost: string | null; reason: CostReason | null; evidence: string | null };
export type GrossResult = { status: "ready" | "unavailable"; confidence: "estimated"; method: "historical-last-purchase-estimate"; coveredSales: string; coveredCost: string; coveredGrossProfit: string; coveredMarginPercent: string | null; costCoveragePercent: string | null; covered: CostRow[]; excluded: CostRow[]; exposures: { coveredSales: string; coveredReturns: string; excludedSales: string; excludedReturns: string }; warnings: string[] };
function costReason(c: HistoricalCost | null | undefined, unit: string): CostReason | null {
  if (!c || c.unitCost === null) return "MISSING_COST";
  if (!c.evidence) return "UNVALIDATED_COST";
  if (c.unit === "unknown" || c.unit !== unit) return "UNKNOWN_UNIT";
  if (c.taxBasis !== "net") return "UNKNOWN_TAX";
  if (new Exact(c.unitCost).lt(0)) return "NEGATIVE_COST";
  if (new Exact(c.unitCost).isZero() && !c.documentedZero) return "UNDOCUMENTED_ZERO";
  return null;
}
export function estimateGrossResult(records: Records, context: SalesContext): GrossResult {
  const supported = context.mappingVersion === BUSINESS_MAPPING_VERSION;
  const sales = calculateSales(records, context);
  const allSales = calculateSales(records, { ...context, from: "1900-01-01", to: "9998-12-31" });
  const byId = new Map(records.lines.map(line => [line.id, line]));
  const originals = new Map(allSales.lines.filter(line => line.kind === "sale").map(line => [line.lineId, line]));
  const returned = new Map<string, string[]>();
  for (const line of allSales.lines.filter(row => row.kind === "customer-return")) { const originalId = byId.get(line.lineId)?.business?.historicalCost?.originalSaleLineId; if (originalId) { const quantities = returned.get(originalId) ?? []; quantities.push(new Exact(line.quantity).abs().toFixed()); returned.set(originalId, quantities); } }
  const covered: CostRow[] = [], excluded: CostRow[] = [];
  for (const line of supported ? sales.lines : []) {
    const c = byId.get(line.lineId)?.business?.historicalCost;
    let reason = costReason(c, line.unit);
    if (line.kind === "customer-return") {
      const original = c?.originalSaleLineId ? originals.get(c.originalSaleLineId) : undefined;
      const originalCost = original ? byId.get(original.lineId)?.business?.historicalCost : null;
      if (!original || original.date > line.date || new Exact(sum(returned.get(original.lineId) ?? [])).gt(original.quantity) || original.productId !== line.productId || original.unit !== line.unit || costReason(originalCost, line.unit) || !c || !originalCost || c.unitCost === null || originalCost.unitCost === null || !new Exact(c.unitCost).eq(originalCost.unitCost)) reason = "RETURN_ATTRIBUTION";
    }
    const row: CostRow = { lineId: line.lineId, documentId: line.documentId, productId: line.productId, productName: line.productName, unit: line.unit, quantity: line.quantity, net: line.net, cost: reason ? null : new Exact(line.quantity).times(c!.unitCost!).toFixed(), reason, evidence: c?.evidence ?? null };
    (reason ? excluded : covered).push(row);
  }
  const coveredSales = sum(covered.map(row => row.net)), coveredCost = sum(covered.map(row => row.cost!));
  const coveredGrossProfit = new Exact(coveredSales).minus(coveredCost).toFixed();
  const absolute = (rows: CostRow[]) => sum(rows.map(row => new Exact(row.net).abs().toFixed()));
  const totalExposure = new Exact(absolute(covered)).plus(absolute(excluded));
  const exposure = (rows: CostRow[], returns: boolean) => sum(rows.filter(row => new Exact(row.quantity).isNegative() === returns).map(row => row.net));
  return { status: supported ? "ready" : "unavailable", confidence: "estimated", method: "historical-last-purchase-estimate", coveredSales, coveredCost, coveredGrossProfit, coveredMarginPercent: new Exact(coveredSales).gt(0) ? rounded(new Exact(coveredGrossProfit).div(coveredSales).times(100).toFixed()) : null, costCoveragePercent: totalExposure.gt(0) ? rounded(new Exact(absolute(covered)).div(totalExposure).times(100).toFixed()) : null, covered, excluded, exposures: { coveredSales: exposure(covered, false), coveredReturns: exposure(covered, true), excludedSales: exposure(excluded, false), excludedReturns: exposure(excluded, true) }, warnings: [...new Set([...excluded.map(row => row.reason!), ...(!sales.complete ? ["INCOMPLETE_SALES"] : []), ...(!supported ? ["UNSUPPORTED_COST_MAPPING"] : [])])] };
}
