import { businessRecords, addPurchase } from "./business-fixtures";
export function purchasingJourney() {
  const records = businessRecords();
  addPurchase(records);
  addPurchase(records, "R1", "25", "supplier-return");
  addPurchase(records, "D1", "25", "supplier-return");
  const dispatch = records.documents.find(row => row.id === "D1")!;
  dispatch.purchasing = { ...dispatch.purchasing!, representation: "dispatch", convertedTo: "R1", invoiced: true };
  records.lines[0].business!.inventory = { date: "2025-09-03", stock: "-2", recordedWaste: "0", evidence: "inventory-1", complete: false };
  return records;
}
