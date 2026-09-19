import { writePackage, type Records, type Metadata } from "../../src/source/package";

export const salesRecords: Records = {
  documents: [{ id: "S1", kind: "sale" as const, date: "2025-09-01", supplierId: null, sales: { state: "completed" as const, convertedTo: null, net: "180", tax: "9", gross: "189" } }],
  lines: [{ id: "L1", documentId: "S1", quantity: "2", net: "180", cost: null, sales: { productId: "water", productName: "İçme suyu", categoryId: "drinks", categoryName: "İçecekler", unit: "piece" as const, unitNet: "100", discountRate: "10", taxRate: "5", tax: "9", gross: "189", meaning: "known" as const } }], suppliers: [],
};
export function salesPackage(records: Records = salesRecords, metadata: Partial<Metadata> = {}) { return writePackage([{ stream: "documents", records: records.documents }, { stream: "lines", records: records.lines }, { stream: "suppliers", records: records.suppliers }], { lineage: "sales-fixture", extractionId: "sales-1", extractedAt: "2025-09-04T00:00:00.000Z", cutoff: "2025-09-03", coverage: { from: "2025-09-01", to: "2025-09-03", complete: true }, ...metadata }, "synthetic-sales-v1"); }


export function journeyRecords(): Records {
  return {
    documents: [
      { id: "S001", kind: "sale", date: "2025-09-01", supplierId: null, sales: { state: "completed", convertedTo: null, net: "70", tax: "3.5", gross: "73.5" } },
      { id: "S002", kind: "sale", date: "2025-09-02", supplierId: null, sales: { state: "completed", convertedTo: null, net: "130", tax: "6.5", gross: "136.5" } },
      { id: "S003", kind: "sale", date: "2025-09-03", supplierId: null, sales: { state: "completed", convertedTo: null, net: "200", tax: "10", gross: "210" } },
      { id: "R001", kind: "customer-return", date: "2025-09-02", supplierId: null, sales: { state: "completed", convertedTo: null, net: "-35", tax: "-1.75", gross: "-36.75" } },
    ],
    lines: [
      ["L001", "S001", "2", "40", "water", "İçme suyu", "drinks", "İçecekler", "piece", "20", "2", "42"],
      ["L002", "S001", "1", "30", "bread", "Ekmek", "bakery", "Fırın", "piece", "30", "1.5", "31.5"],
      ["L003", "S002", "3", "60", "water", "İçme suyu", "drinks", "İçecekler", "piece", "20", "3", "63"],
      ["L004", "S002", "2", "70", "soda", "Gazoz", "drinks", "İçecekler", "piece", "35", "3.5", "73.5"],
      ["L005", "S003", "4", "120", "bread", "Ekmek", "bakery", "Fırın", "piece", "30", "6", "126"],
      ["L006", "S003", "2", "80", "apple", "Elma", "produce", "Manav", "kg", "40", "4", "84"],
      ["L007", "R001", "1", "-35", "soda", "Gazoz", "drinks", "İçecekler", "piece", "35", "-1.75", "-36.75"],
    ].map(([id, documentId, quantity, net, productId, productName, categoryId, categoryName, unit, unitNet, tax, gross]) => ({ id, documentId, quantity, net, cost: null, sales: { productId, productName, categoryId, categoryName, unit: unit as "piece" | "kg", unitNet, discountRate: "0", taxRate: "5", tax, gross, meaning: "known" } })),
    suppliers: [],
  };
}
