import { expect, test } from "vitest";
import { readPackage, writePackage } from "../../src/source/package";
import { openStore } from "../../src/store/store";
import { sourcePackage } from "../helpers/store-fixtures";

export const salesRecords = {
  documents: [{ id: "S1", kind: "sale" as const, date: "2025-09-01", supplierId: null, sales: { state: "completed" as const, convertedTo: null, net: "180", tax: "9", gross: "189" } }],
  lines: [{ id: "L1", documentId: "S1", quantity: "2", net: "180", cost: null, sales: { productId: "water", productName: "İçme suyu", categoryId: "drinks", categoryName: "İçecekler", unit: "piece" as const, unitNet: "100", discountRate: "10", taxRate: "5", tax: "9", gross: "189", meaning: "known" as const } }], suppliers: [],
};
export function salesPackage() { return writePackage([{ stream: "documents", records: salesRecords.documents }, { stream: "lines", records: salesRecords.lines }], { lineage: "sales-fixture", extractionId: "sales-1", extractedAt: "2025-09-04T00:00:00.000Z", cutoff: "2025-09-03", coverage: { from: "2025-09-01", to: "2025-09-03", complete: true } }, "synthetic-sales-v1"); }

test("typed synthetic sales round-trips through package and durable store without changing legacy facts", () => {
  const store = openStore(":memory:");
  try {
    expect(store.importPackage(sourcePackage("a")).status).toBe("active");
    const legacy = store.readSnapshot();
    expect(Object.hasOwn(legacy.records.documents[0], "sales")).toBe(false);
    const bytes = salesPackage();
    const parsed = readPackage(bytes);
    expect(parsed.ok && parsed.metadata.mappingVersion).toBe("synthetic-sales-v1");
    expect(store.importPackage(bytes).status).toBe("active");
    expect(store.readSnapshot().records).toEqual(salesRecords);
    expect(store.readPinned(legacy.pin)).toEqual(legacy);
  } finally { store.close(); }
});
