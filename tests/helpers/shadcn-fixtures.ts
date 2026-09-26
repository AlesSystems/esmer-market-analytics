import { BUSINESS_MAPPING_VERSION, writePackage, type Records } from "../../src/source/package";
import { historicalCost, addPurchase } from "./business-fixtures";

export const monthlyUiExpected = {
  netSales: "2.875,00 ₺",
  coveredCost: "600,00 ₺",
  coveredGross: "900,00 ₺",
  saleDocuments: 29,
  days: 30,
} as const;

const categories = [
  { id: "drinks", name: "İçecekler", product: "İçme suyu", unit: "piece" },
  { id: "bakery", name: "Fırın", product: "Tam buğday ekmeği", unit: "piece" },
  { id: "produce", name: "Manav", product: "Mevsimlik elma", unit: "kg" },
  { id: "cleaning", name: "Temizlik ve kişisel bakım ürünleri", product: "Uzun ömürlü çamaşır deterjanı", unit: "piece" },
  { id: "pantry", name: "Temel gıda", product: "Pirinç", unit: "kg" },
] as const;

export function representativeMonthRecords(): Records {
  const records: Records = { documents: [], lines: [], suppliers: [] };
  for (let day = 1; day <= 30; day++) {
    const refund = day === 15;
    const amount = refund ? "-25" : "100";
    const tax = refund ? "-1.25" : "5";
    const gross = refund ? "-26.25" : "105";
    const category = categories[(day - 1) % categories.length];
    const id = `UI${String(day).padStart(2, "0")}`;
    records.documents.push({
      id, kind: refund ? "customer-return" : "sale", date: `2025-09-${String(day).padStart(2, "0")}`,
      supplierId: null,
      sales: { state: "completed", convertedTo: null, net: amount, tax, gross },
      purchasing: null,
    });
    records.lines.push({
      id: `${id}-line`, documentId: id, quantity: "1", net: amount, cost: null,
      sales: {
        productId: `${category.id}-product`, productName: category.product,
        categoryId: category.id, categoryName: category.name, unit: category.unit,
        unitNet: refund ? "25" : "100", discountRate: "0", taxRate: "5", tax, gross, meaning: "known",
      },
      business: { historicalCost: !refund && day % 2 === 0 ? { ...historicalCost("40"), unit: category.unit } : null, inventory: null },
    });
  }
  addPurchase(records, "UI-PURCHASE", "25");
  addPurchase(records, "UI-RETURN", "25", "supplier-return");
  records.suppliers[0].name = "Örnek Kuzey Kıbrıs Tedarikçisi";
  return records;
}

export function representativeMonthPackage() {
  return packageFor(representativeMonthRecords(), "shadcn-ui-month-1");
}

export function stressMonthPackage() {
  const records = representativeMonthRecords();
  const document = records.documents.find(row => row.id === "UI04")!;
  const line = records.lines.find(row => row.documentId === "UI04")!;
  for (let index = 1; index <= 172; index++) {
    const id = `UIS${String(index).padStart(3, "0")}`;
    const net = index === 1 ? "123456789.12" : "100";
    const tax = index === 1 ? "0" : "5";
    const gross = index === 1 ? net : "105";
    records.documents.push({ ...structuredClone(document), id, sales: { ...document.sales!, net, tax, gross } });
    records.lines.push({
      ...structuredClone(line), id: `${id}-line`, documentId: id, net,
      sales: { ...line.sales!, unitNet: net, taxRate: index === 1 ? "0" : "5", tax, gross },
      business: { historicalCost: null, inventory: null },
    });
  }
  return packageFor(records, "shadcn-ui-stress-1");
}

function packageFor(records: Records, extractionId: string) {
  return writePackage([
    { stream: "documents", records: records.documents },
    { stream: "lines", records: records.lines },
    { stream: "suppliers", records: records.suppliers },
  ], {
    lineage: "shadcn-ui-fixture", extractionId, extractedAt: "2025-10-01T00:00:00.000Z",
    cutoff: "2025-09-30", coverage: { from: "2025-09-01", to: "2025-09-30", complete: true },
  }, BUSINESS_MAPPING_VERSION);
}
