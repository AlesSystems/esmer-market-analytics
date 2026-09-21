import { Exact, percentageChange, sum } from "../domain/money";
import { BUSINESS_MAPPING_VERSION, type Records, type PurchaseEvidence } from "../source/package";
import { estimateGrossResult } from "./costs";
export const PURCHASING_CALCULATION_VERSION = "synthetic-purchasing-calc-v1";
export type PurchaseRow = { documentId: string; lineId: string; date: string; productId: string; productName: string; supplierId: string; supplierName: string; unit: "piece" | "kg"; quantity: string; net: string; unitCost: string; representation: "invoice" | "dispatch"; sourceDocumentIds: string[]; evidence: string };
export type SupplierReturnRow = PurchaseRow & { physicalReturn: boolean; requestedRecovery: string | null; recognizedCredit: string | null; replacementSettlement: "unknown" | "confirmed"; settlementEvidence: string | null; settlementEvidenceReferences: string[] };
export type ReplacementRow = { productId: string; productName: string; unit: "piece" | "kg"; historicalUnitCost: string | null; latestUnitCost: string; nominalChangePercent: string | null; quantity: string; historicalCost: string | null; replacementCost: string; documentId: string; sourceDocumentIds: string[]; date: string };
export type InventoryRow = { lineId: string; productId: string; productName: string; unit: "piece" | "kg"; date: string; stock: string | null; recordedWaste: string | null; evidence: string; complete: boolean };
export type PurchasingResult = { status: "ready" | "unavailable"; history: PurchaseRow[]; supplierReturns: SupplierReturnRow[]; replacements: ReplacementRow[]; inventory: InventoryRow[]; warnings: string[]; exclusions: { documentId: string; reason: string }[] };
export function calculatePurchasing(records: Records, context: { mappingVersion: string; from: string; to: string; cutoff?: string }): PurchasingResult {
  const result: PurchasingResult = { status: context.mappingVersion === BUSINESS_MAPPING_VERSION ? "ready" : "unavailable", history: [], supplierReturns: [], replacements: [], inventory: [], warnings: [], exclusions: [] };
  if (result.status === "unavailable") { result.warnings.push("UNSUPPORTED_PURCHASING_MAPPING"); return result; }
  const cutoff = context.cutoff ?? context.to;
  const documents = new Map(records.documents.map(row => [row.id, row]));
  const suppliers = new Map(records.suppliers.map(row => [row.id, row.name]));
  const grouped = new Map<string, Records["lines"]>();
  for (const line of records.lines) { const group = grouped.get(line.documentId) ?? []; group.push(line); grouped.set(line.documentId, group); }
  const conflicts = new Set<string>();
  const owners = new Map<string, string[]>();
  const signature = (id: string) => (grouped.get(id) ?? []).map(line => JSON.stringify([line.sales?.productId, line.sales?.unit, line.sales?.meaning, ...[line.quantity, line.net, line.sales?.unitNet ?? "0", line.sales?.discountRate ?? "0", line.sales?.taxRate ?? "0", line.sales?.tax ?? "0", line.sales?.gross ?? "0"].map(value => new Exact(value).toFixed())])).sort().join(";");
  for (const doc of records.documents) if (doc.purchasing?.convertedTo) {
    const p = doc.purchasing, target = documents.get(p.convertedTo!); const ids = owners.get(p.convertedTo!) ?? []; ids.push(doc.id); owners.set(p.convertedTo!, ids);
    const settlementConflict = target?.purchasing && (["requestedRecovery", "recognizedCredit"] as const).some(key => p[key] !== null && target.purchasing![key] !== null && !new Exact(p[key]!).eq(target.purchasing![key]!));
    if (settlementConflict || doc.sales?.state !== "completed" || target?.sales?.state !== "completed" || !["net", "tax", "gross"].every(key => doc.sales && target?.sales && new Exact(doc.sales[key as "net" | "tax" | "gross"]).eq(target.sales[key as "net" | "tax" | "gross"])) || p.representation !== "dispatch" || !p.invoiced || !target?.purchasing || target.purchasing.representation !== "invoice" || target.purchasing.convertedTo !== null || target.kind !== doc.kind || target.supplierId !== doc.supplierId || signature(doc.id) !== signature(target.id)) { conflicts.add(doc.id); conflicts.add(p.convertedTo!); }
  }
  for (const [id, sources] of owners) if (sources.length > 1) { conflicts.add(id); sources.forEach(source => conflicts.add(source)); }
  for (const [id, sources] of owners) if (conflicts.has(id) || sources.some(source => conflicts.has(source))) { conflicts.add(id); sources.forEach(source => conflicts.add(source)); }
  const allPurchases: PurchaseRow[] = [];
  for (const doc of records.documents) {
    if (doc.date > cutoff || (doc.kind !== "purchase" && doc.kind !== "supplier-return")) continue;
    const p = doc.purchasing, lines = grouped.get(doc.id) ?? [];
    let reason: string | null = conflicts.has(doc.id) ? "CONVERSION_CONFLICT" : !p || !doc.supplierId || !suppliers.get(doc.supplierId) ? "UNSUPPORTED_PURCHASING_EVIDENCE" : null;
    if (!reason && p && ((p.invoiced && p.representation === "dispatch" && !p.convertedTo) || (p.representation === "invoice" && p.convertedTo))) reason = "CONVERSION_CONFLICT";
    if (!reason && doc.sales?.state !== "completed") reason = "UNSUPPORTED_PURCHASING_STATE";
    if (!reason && (!lines.length || lines.some(line => !line.sales || line.sales.meaning !== "known" || !new Exact(line.sales.discountRate).isZero() || line.sales.unit === "unknown" || !new Exact(line.quantity).gt(0) || new Exact(line.sales.unitNet).lt(0) || !new Exact(line.quantity).times(line.sales.unitNet).times(doc.kind === "purchase" ? 1 : -1).eq(line.net)))) reason = "UNSUPPORTED_PURCHASE_BASIS";
    if (!reason && doc.sales && (lines.some(line => !new Exact(line.net).times(line.sales!.taxRate).div(100).toDecimalPlaces(2).eq(line.sales!.tax) || !new Exact(line.net).plus(line.sales!.tax).eq(line.sales!.gross)) || !new Exact(sum(lines.map(line => line.net))).eq(doc.sales.net) || !new Exact(sum(lines.map(line => line.sales!.tax))).eq(doc.sales.tax) || !new Exact(sum(lines.map(line => line.sales!.gross))).eq(doc.sales.gross))) reason = "PURCHASE_RECONCILIATION";
    if (reason) { result.exclusions.push({ documentId: doc.id, reason }); continue; }
    if (p!.convertedTo) continue;
    const evidence = p as PurchaseEvidence;
    const relatedEvidence = [evidence, ...(owners.get(doc.id) ?? []).map(id => documents.get(id)!.purchasing!)];
    const settlementEvidenceReferences = [...new Set(relatedEvidence.flatMap(item => item.settlementEvidence ? [item.settlementEvidence] : []))];
    for (const line of lines) {
      const s = line.sales!;
      const row: PurchaseRow = { documentId: doc.id, lineId: line.id, date: doc.date, productId: s.productId, productName: s.productName, supplierId: doc.supplierId!, supplierName: suppliers.get(doc.supplierId!)!, unit: s.unit as "piece" | "kg", quantity: line.quantity, net: line.net, unitCost: s.unitNet, representation: evidence.representation, sourceDocumentIds: [...(owners.get(doc.id) ?? []), doc.id], evidence: evidence.evidence };
      if (doc.kind === "purchase") { allPurchases.push(row); if (doc.date >= context.from && doc.date <= context.to) result.history.push(row); }
      else if (doc.date >= context.from && doc.date <= context.to) result.supplierReturns.push({ ...row, physicalReturn: relatedEvidence.some(item => item.physicalReturn), requestedRecovery: relatedEvidence.find(item => item.requestedRecovery !== null)?.requestedRecovery ?? null, recognizedCredit: relatedEvidence.find(item => item.recognizedCredit !== null)?.recognizedCredit ?? null, replacementSettlement: relatedEvidence.some(item => item.replacementSettlement === "confirmed") ? "confirmed" : "unknown", settlementEvidence: settlementEvidenceReferences[0] ?? null, settlementEvidenceReferences });
    }
  }
  for (const line of records.lines) {
    const i = line.business?.inventory, s = line.sales;
    if (i && s && s.meaning === "known" && s.unit !== "unknown" && i.date <= cutoff) { result.inventory.push({ ...i, lineId: line.id, productId: s.productId, productName: s.productName, unit: s.unit }); if (i.stock !== null && new Exact(i.stock).lt(0)) result.warnings.push("NEGATIVE_STOCK"); if (!i.complete || i.recordedWaste === null || new Exact(i.recordedWaste).isZero()) result.warnings.push("SPARSE_WASTE_RECORDING"); }
  }
  const gross = estimateGrossResult(records, context);
  const latest = new Map<string, PurchaseRow>();
  const purchaseGroups = new Map<string, PurchaseRow[]>();
  for (const row of allPurchases) { const key = `${row.productId}:${row.unit}`, group = purchaseGroups.get(key) ?? []; group.push(row); purchaseGroups.set(key, group); }
  const costGroups = new Map<string, typeof gross.covered>();
  for (const row of [...gross.covered, ...gross.excluded]) { const key = `${row.productId}:${row.unit}`, group = costGroups.get(key) ?? []; group.push(row); costGroups.set(key, group); }
  for (const row of allPurchases.sort((a, b) => a.date.localeCompare(b.date) || a.documentId.localeCompare(b.documentId))) latest.set(`${row.productId}:${row.unit}`, row);
  for (const [key, purchase] of latest) {
    const peers = purchaseGroups.get(key)!.filter(row => row.date === purchase.date);
    if (peers.some(row => !new Exact(row.unitCost).eq(purchase.unitCost))) { result.warnings.push("AMBIGUOUS_REPLACEMENT_PRICE"); continue; }
    const lines = costGroups.get(key) ?? [];
    if (!lines.length) continue;
    const quantity = sum(lines.map(row => row.quantity));
    const complete = lines.every(row => row.cost !== null);
    const historicalCost = complete ? sum(lines.map(row => row.cost!)) : null;
    const historicalUnitCost = historicalCost !== null && new Exact(quantity).gt(0) ? new Exact(historicalCost).div(quantity).toFixed() : null;
    result.replacements.push({ productId: purchase.productId, productName: purchase.productName, unit: purchase.unit, historicalUnitCost, latestUnitCost: purchase.unitCost, nominalChangePercent: historicalUnitCost === null ? null : percentageChange(purchase.unitCost, historicalUnitCost), quantity, historicalCost, replacementCost: new Exact(quantity).times(purchase.unitCost).toFixed(), documentId: purchase.documentId, sourceDocumentIds: purchase.sourceDocumentIds, date: purchase.date });
  }
  result.warnings = [...new Set([...result.warnings, ...result.exclusions.map(row => row.reason), ...(result.inventory.length ? [] : ["INVENTORY_UNAVAILABLE", "SPARSE_WASTE_RECORDING"])])];
  return result;
}
