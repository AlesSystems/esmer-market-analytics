import type { Records } from "../../src/source/package";
import { productProfitRecords } from "./business-fixtures";

export function dependencyCapacityRecords(groups: number): Records {
  const records: Records = { documents: [], lines: [], suppliers: [] };
  for (let index = 0; index < groups; index++) {
    const group = productProfitRecords(false);
    for (const document of group.documents) {
      if (document.id === "A1") document.date = "2025-08-31";
      document.id = `${index}-${document.id}`;
    }
    for (const line of group.lines) {
      line.id = `${index}-${line.id}`;
      line.documentId = `${index}-${line.documentId}`;
      const cost = line.business?.historicalCost;
      if (cost?.originalSaleLineId) cost.originalSaleLineId = `${index}-${cost.originalSaleLineId}`;
    }
    records.documents.push(...group.documents);
    records.lines.push(...group.lines);
  }
  return records;
}
