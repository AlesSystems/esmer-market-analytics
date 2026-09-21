import { expect, test } from "vitest";
import { calculatePurchasing } from "../../src/analytics/purchasing";
import { readPackage } from "../../src/source/package";
import { addPurchase, businessRecords, businessPackage } from "../helpers/business-fixtures";
const context = { mappingVersion: "synthetic-business-v1", from: "2025-09-01", to: "2025-09-30" };
test("G07 purchase and supplier-return pairs count once and preserve source IDs", () => {
  const records = businessRecords();
  for (const [id, kind, price] of [["P1", "purchase", "80"], ["R1", "supplier-return", "20"]] as const) {
    addPurchase(records, id, price, kind); const invoice = records.documents.at(-1)!; const line = records.lines.at(-1)!;
    records.documents.push({ ...structuredClone(invoice), id: `${id}-dispatch`, purchasing: { ...invoice.purchasing!, representation: "dispatch", invoiced: true, convertedTo: id } }); records.lines.push({ ...structuredClone(line), id: `${id}-dispatch-line`, documentId: `${id}-dispatch` });
  }
  const parsed = readPackage(businessPackage(records)); expect(parsed.ok).toBe(true); if (!parsed.ok) return;
  const result = calculatePurchasing(parsed.records, context); expect(result.history.map(row => row.net)).toEqual(["80"]); expect(result.supplierReturns.map(row => row.net)).toEqual(["-20"]); expect(result.supplierReturns[0].recognizedCredit).toBeNull(); expect(result.supplierReturns[0].sourceDocumentIds).toEqual(["R1-dispatch", "R1"]);
  records.lines.at(-1)!.net = "-21"; expect(calculatePurchasing(records, context).supplierReturns).toHaveLength(0);
});
test("physical dispatch cannot imply settlement", () => { const records = businessRecords(); addPurchase(records, "R1", "20", "supplier-return"); records.documents.at(-1)!.purchasing!.representation = "dispatch"; const result = calculatePurchasing(records, context); expect(result.supplierReturns[0]).toMatchObject({ physicalReturn: true, recognizedCredit: null, replacementSettlement: "unknown" }); records.documents.at(-1)!.purchasing!.recognizedCredit = "20"; expect(() => businessPackage(records)).toThrow("INVALID_PACKAGE"); });
test("purchase signs, reconciliation and completion are financial boundaries", () => {
  for (const mutation of [(r: ReturnType<typeof businessRecords>) => { r.lines.at(-1)!.net = "20"; }, (r: ReturnType<typeof businessRecords>) => { r.documents.at(-1)!.sales!.state = "void"; }, (r: ReturnType<typeof businessRecords>) => { r.documents.at(-1)!.sales!.net = "-19"; }]) {
    const records = businessRecords(); addPurchase(records, "R1", "20", "supplier-return"); mutation(records); expect(calculatePurchasing(records, context).supplierReturns).toHaveLength(0);
  }
});
test("multi-owner conversion conflicts block every member regardless of order", () => {
  const records = businessRecords(); addPurchase(records); const invoice = records.documents.at(-1)!, line = records.lines.at(-1)!;
  for (const id of ["D1", "D2"]) { records.documents.push({ ...structuredClone(invoice), id, purchasing: { ...invoice.purchasing!, representation: "dispatch", convertedTo: "P1", invoiced: true } }); records.lines.push({ ...structuredClone(line), id: `${id}-line`, documentId: id }); }
  records.lines.at(-1)!.net = "99"; for (const docs of [records.documents, [...records.documents].reverse()]) expect(calculatePurchasing({ ...records, documents: docs }, context).history).toHaveLength(0);
});
test("converted source reconciliation conflict also blocks the invoice", () => {
  const records = businessRecords(); addPurchase(records); const invoice = records.documents.at(-1)!, line = records.lines.at(-1)!;
  records.documents.push({ ...structuredClone(invoice), id: "D1", sales: { ...invoice.sales!, tax: "1" }, purchasing: { ...invoice.purchasing!, representation: "dispatch", convertedTo: "P1", invoiced: true } }); records.lines.push({ ...structuredClone(line), id: "D1-line", documentId: "D1" });
  expect(calculatePurchasing(records, context).history).toHaveLength(0);
});

test("converted unknown meanings and discounts block the whole event", () => {
  for (const patch of [{ discountRate: "10" }, { meaning: "unknown" as const }]) {
    const records = businessRecords(); addPurchase(records);
    const invoice = records.documents.at(-1)!, line = records.lines.at(-1)!;
    records.documents.push({ ...structuredClone(invoice), id: "D1", purchasing: { ...invoice.purchasing!, representation: "dispatch", convertedTo: "P1", invoiced: true } });
    records.lines.push({ ...structuredClone(line), id: "D1-line", documentId: "D1", sales: { ...line.sales!, ...patch } });
    const parsed = readPackage(businessPackage(records));
    if (!parsed.ok) throw new Error("Expected structurally valid evidence");
    const result = calculatePurchasing(parsed.records, context);
    expect(result.history).toEqual([]);
    expect(result.replacements).toEqual([]);
    expect(result.exclusions).toEqual(expect.arrayContaining([{ documentId: "D1", reason: "CONVERSION_CONFLICT" }, { documentId: "P1", reason: "CONVERSION_CONFLICT" }]));
  }
});

test("linked settlement evidence survives conversion and conflicting amounts block the event", () => {
  const records = businessRecords(); addPurchase(records, "R1", "25", "supplier-return");
  const invoice = records.documents.at(-1)!, line = records.lines.at(-1)!;
  records.documents.push({ ...structuredClone(invoice), id: "D1", purchasing: { ...invoice.purchasing!, representation: "dispatch", convertedTo: "R1", invoiced: true, requestedRecovery: "25", recognizedCredit: "25", replacementSettlement: "confirmed", settlementEvidence: "credit-D1" } });
  records.lines.push({ ...structuredClone(line), id: "D1-line", documentId: "D1" });
  const result = calculatePurchasing(records, context);
  expect(result.supplierReturns).toHaveLength(1);
  expect(result.supplierReturns[0]).toMatchObject({ requestedRecovery: "25", recognizedCredit: "25", replacementSettlement: "confirmed", settlementEvidence: "credit-D1" });
  invoice.purchasing!.recognizedCredit = "20"; invoice.purchasing!.settlementEvidence = "credit-R1";
  const conflict = calculatePurchasing(records, context);
  expect(conflict.supplierReturns).toEqual([]);
  expect(conflict.exclusions).toEqual(expect.arrayContaining([{ documentId: "D1", reason: "CONVERSION_CONFLICT" }, { documentId: "R1", reason: "CONVERSION_CONFLICT" }]));
});
test("equivalent linked settlement amounts retain both references and unknown states do not contradict", () => {
  const records = businessRecords(); addPurchase(records, "R1", "25", "supplier-return");
  const invoice = records.documents.at(-1)!, line = records.lines.at(-1)!;
  Object.assign(invoice.purchasing!, { recognizedCredit: "25.00", settlementEvidence: "credit-I" });
  records.documents.push({ ...structuredClone(invoice), id: "D1", purchasing: { ...invoice.purchasing!, representation: "dispatch", convertedTo: "R1", invoiced: true, recognizedCredit: "25", requestedRecovery: "30", replacementSettlement: "confirmed", settlementEvidence: "credit-D" } });
  records.lines.push({ ...structuredClone(line), id: "D1-line", documentId: "D1" });
  const result = calculatePurchasing(records, context);
  expect(result.supplierReturns[0]).toMatchObject({ requestedRecovery: "30", recognizedCredit: "25.00", replacementSettlement: "confirmed", settlementEvidenceReferences: ["credit-I", "credit-D"] });
  invoice.purchasing!.requestedRecovery = "31"; expect(calculatePurchasing(records, context).supplierReturns).toEqual([]);
});
