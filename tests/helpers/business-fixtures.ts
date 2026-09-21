import { BUSINESS_MAPPING_VERSION, writePackage, type Records, type Metadata, type HistoricalCost } from "../../src/source/package";
import { salesRecords } from "./sales-fixtures";
export const historicalCost = (unitCost: string | null = "60"): HistoricalCost => ({ unitCost, unit: "piece", taxBasis: "net", evidence: "historical-evidence", documentedZero: false, originalSaleLineId: null });
export function businessRecords(): Records {
  const records = structuredClone(salesRecords);
  const document = records.documents[0]; document.sales = { state: "completed", convertedTo: null, net: "100", tax: "5", gross: "105" }; document.purchasing = null;
  const line = records.lines[0]; line.quantity = "1"; line.net = "100"; line.sales = { ...line.sales!, unitNet: "100", discountRate: "0", tax: "5", gross: "105" }; line.business = { historicalCost: historicalCost(), inventory: null };
  records.documents.push({ ...structuredClone(document), id: "S2" }); records.lines.push({ ...structuredClone(line), id: "L2", documentId: "S2", business: { historicalCost: null, inventory: null } });
  return records;
}
export function businessPackage(records = businessRecords(), metadata: Partial<Metadata> = {}) {
  return writePackage([{ stream: "documents", records: records.documents }, { stream: "lines", records: records.lines }, { stream: "suppliers", records: records.suppliers }], { lineage: "business-fixture", extractionId: "business-1", extractedAt: "2025-10-01T00:00:00.000Z", cutoff: "2025-09-30", coverage: { from: "2025-09-01", to: "2025-09-30", complete: true }, ...metadata }, BUSINESS_MAPPING_VERSION);
}
export function addPurchase(records: Records, id = "P1", unitCost = "25", kind: "purchase" | "supplier-return" = "purchase") {
  if (!records.suppliers.length) records.suppliers.push({ id: "supplier-1", name: "Örnek Tedarikçi" });
  const sign = kind === "purchase" ? "" : "-";
  records.documents.push({ id, kind, date: "2025-09-03", supplierId: "supplier-1", sales: { state: "completed", convertedTo: null, net: `${sign}${unitCost}`, tax: "0", gross: `${sign}${unitCost}` }, purchasing: { representation: "invoice", convertedTo: null, invoiced: false, evidence: `evidence-${id}`, physicalReturn: kind === "supplier-return", requestedRecovery: null, recognizedCredit: null, replacementSettlement: "unknown", settlementEvidence: null } });
  records.lines.push({ ...structuredClone(records.lines[0]), id: `${id}-line`, documentId: id, quantity: "1", net: `${sign}${unitCost}`, sales: { ...records.lines[0].sales!, unitNet: unitCost, taxRate: "0", tax: "0", gross: `${sign}${unitCost}` }, business: { historicalCost: null, inventory: null } });
}
