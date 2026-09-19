import { Exact, sum, rounded } from "../domain/money";
import { SALES_MAPPING_VERSION, type Records, type SalesLine } from "../source/package";

export const SALES_CALCULATION_VERSION = "synthetic-sales-calc-v1";
export type SalesContext = { mappingVersion: string; from: string; to: string };
export type SalesComponent = { documentId: string; lineId: string; date: string; kind: "sale" | "customer-return"; productId: string; productName: string; categoryId: string; categoryName: string; unit: "piece" | "kg"; quantity: string; net: string; tax: string; gross: string; recorded: { net: string; tax: string; gross: string }; input: SalesLine; expectedTax: string; reconciled: boolean };
export type SalesExclusion = { documentId: string; reason: "VOID" | "CONVERTED" | "CONVERSION_CONFLICT" | "UNKNOWN_MEANING" | "NO_LINES" | "NOT_SALES" };
export type SalesDocumentResult = { documentId: string; date: string; kind: "sale" | "customer-return"; net: string; tax: string; gross: string; recorded: { net: string; tax: string; gross: string }; reconciled: boolean };
export type SalesResult = { status: "ready" | "unavailable"; netSales: string; tax: string; gross: string; saleDocumentCount: number; basketNumerator: string; averageBasket: string | null; quantities: { piece: string; kg: string }; lines: SalesComponent[]; documents: SalesDocumentResult[]; exclusions: SalesExclusion[]; complete: boolean };
export function totals(lines: SalesComponent[]) {
  const sales = lines.filter(line => line.kind === "sale");
  const saleDocumentCount = new Set(sales.map(line => line.documentId)).size;
  const basketNumerator = sum(sales.map(line => line.net));
  return { netSales: sum(lines.map(line => line.net)), tax: sum(lines.map(line => line.tax)), gross: sum(lines.map(line => line.gross)), saleDocumentCount, basketNumerator, averageBasket: saleDocumentCount ? rounded(new Exact(basketNumerator).div(saleDocumentCount).toFixed()) : null, quantities: { piece: sum(lines.filter(line => line.unit === "piece").map(line => line.quantity)), kg: sum(lines.filter(line => line.unit === "kg").map(line => line.quantity)) } };
}
export function calculateSales(records: Records, context: SalesContext): SalesResult {
  const lines: SalesComponent[] = [], documents: SalesDocumentResult[] = [], exclusions: SalesExclusion[] = [];
  if (context.mappingVersion !== SALES_MAPPING_VERSION) return { status: "unavailable", ...totals([]), lines, documents, exclusions, complete: false };
  const grouped = new Map<string, Records["lines"]>();
  for (const line of records.lines) { const group = grouped.get(line.documentId) ?? []; group.push(line); grouped.set(line.documentId, group); }
  const owners = new Map<string, number>();
  for (const doc of records.documents) if (doc.sales?.convertedTo) owners.set(doc.sales.convertedTo, (owners.get(doc.sales.convertedTo) ?? 0) + 1);
  const byId = new Map(records.documents.map(doc => [doc.id, doc]));
  const conflicts = new Set<string>();
  const signature = (documentId: string) => (grouped.get(documentId) ?? []).map(line => {
    const s = line.sales;
    return JSON.stringify(s ? [s.productId, s.categoryId, s.unit, s.meaning, ...[line.quantity, line.net, s.unitNet, s.discountRate, s.taxRate, s.tax, s.gross].map(value => new Exact(value).toFixed())] : ["unknown"]);
  }).sort().join(";");
  for (const doc of records.documents) if (doc.sales?.convertedTo) {
    const target = byId.get(doc.sales.convertedTo);
    if (!target?.sales || (owners.get(target.id) ?? 0) > 1 || target.kind !== doc.kind || signature(doc.id) !== signature(target.id) || !["net", "tax", "gross"].every(key => new Exact(doc.sales![key as "net" | "tax" | "gross"]).eq(target.sales![key as "net" | "tax" | "gross"]))) {
      conflicts.add(doc.id); conflicts.add(doc.sales.convertedTo);
    }
  }
  for (const doc of [...records.documents].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0)) {
    if (doc.date < context.from || doc.date > context.to) continue;
    const input = grouped.get(doc.id) ?? [];
    let reason: SalesExclusion["reason"] | null = null;
    if (doc.kind !== "sale" && doc.kind !== "customer-return") reason = "NOT_SALES";
    else if (conflicts.has(doc.id)) reason = "CONVERSION_CONFLICT";
    else if (doc.sales?.state === "void") reason = "VOID";
    else if (doc.sales?.state === "converted") reason = "CONVERTED";
    else if (!doc.sales || doc.sales.state !== "completed" || input.some(line => !line.sales || line.sales.meaning !== "known" || line.sales.unit === "unknown")) reason = "UNKNOWN_MEANING";
    else if (!input.length) reason = "NO_LINES";
    if (reason) { exclusions.push({ documentId: doc.id, reason }); continue; }
    const kind = doc.kind as "sale" | "customer-return";
    const sign = kind === "sale" ? 1 : -1;
    const components = input.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map(line => {
      const s = line.sales!;
      const net = new Exact(line.quantity).times(s.unitNet).times(new Exact(100).minus(s.discountRate)).div(100).times(sign).toFixed();
      const expectedTax = rounded(new Exact(net).times(s.taxRate).div(100).toFixed());
      const tax = new Exact(s.tax).toFixed();
      const gross = new Exact(net).plus(tax).toFixed();
      const recorded = { net: line.net, tax: s.tax, gross: s.gross };
      const reconciled = new Exact(net).eq(recorded.net) && new Exact(expectedTax).eq(recorded.tax) && new Exact(gross).eq(recorded.gross);
      return { documentId: doc.id, lineId: line.id, date: doc.date, kind, productId: s.productId, productName: s.productName, categoryId: s.categoryId, categoryName: s.categoryName, unit: s.unit as "piece" | "kg", quantity: new Exact(line.quantity).times(sign).toFixed(), net, tax, gross, recorded, input: { ...s }, expectedTax, reconciled };
    });
    const total = totals(components);
    const recorded = { net: doc.sales!.net, tax: doc.sales!.tax, gross: doc.sales!.gross };
    documents.push({ documentId: doc.id, date: doc.date, kind, net: total.netSales, tax: total.tax, gross: total.gross, recorded, reconciled: components.every(line => line.reconciled) && new Exact(total.netSales).eq(recorded.net) && new Exact(total.tax).eq(recorded.tax) && new Exact(total.gross).eq(recorded.gross) });
    lines.push(...components);
  }
  return { status: "ready", ...totals(lines), lines, documents, exclusions, complete: documents.every(doc => doc.reconciled) && !exclusions.some(row => ["CONVERSION_CONFLICT", "UNKNOWN_MEANING", "NO_LINES"].includes(row.reason)) };
}
