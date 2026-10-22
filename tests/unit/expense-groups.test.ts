import { expect, test } from "vitest";
import { displayGroup, groupExpenses } from "../../src/expenses/groups";
import { calculateExpenseComponents } from "../../src/analytics/operating";
import type { ExpenseFields, ExpenseValue } from "../../src/expenses/contracts";
import type { AppRecord } from "../../src/store/revisions";

let revision = 0;
function expense(entityId: string, fields: Partial<ExpenseFields> & { voided?: boolean }): AppRecord {
  const { voided = false, ...rest } = fields;
  const value: ExpenseValue = { date: "2025-09-05", paymentDate: null, category: "Kira", classification: "operating-expense", net: "100", tax: "0", gross: "100", taxTreatment: "non-recoverable", taxEvidence: "tax-1", supportingReference: null, sourceReference: null, labourPeriod: null, loss: null, ...rest, format: "expense-v1", origin: { batchId: "batch-1", row: 2 }, reason: "Excel içe aktarımı", evidence: "batch-1", replacesRevision: null, voided };
  return { kind: "expense", entityId, value, revision: ++revision };
}

test("display groups read the stored classification and the category text", () => {
  expect(displayGroup("labour", "Maaşlar")).toBe("staff");
  expect(displayGroup("operating-expense", "Kira")).toBe("rent");
  expect(displayGroup("operating-expense", "dükkan KİRA")).toBe("rent");
  expect(displayGroup("operating-expense", "Elektrik")).toBe("utilities");
  expect(displayGroup("operating-expense", "Elektrik/su")).toBe("utilities");
  expect(displayGroup("operating-expense", "Su faturası")).toBe("utilities");
  expect(displayGroup("operating-expense", "Sucuk alımı")).toBe("other");
  expect(displayGroup("operating-expense", "Kırtasiye")).toBe("other");
  expect(displayGroup("inventory-loss", "Bozulan ürün")).toBe("other");
  for (const excluded of ["asset-purchase", "taxes", "financing-loan", "owner-contribution", "owner-withdrawal", "transfer", "unclassified"] as const) expect(displayGroup(excluded, "Kira")).toBeNull();
});

test("group amounts add up to the counted expense total, by hand", () => {
  const app = [
    expense("a", { category: "Kira", net: "5000", gross: "5000" }),
    expense("b", { category: "Elektrik", net: "800", tax: "160", gross: "960", taxTreatment: "recoverable" }), // recoverable counts net
    expense("c", { category: "Su", net: "200", gross: "200" }),
    expense("d", { category: "Personel", classification: "labour", labourPeriod: "2025-09", net: "12000", gross: "12000" }),
    expense("e", { category: "Temizlik", net: "150.5", gross: "150.5" }),
    expense("f", { category: "Kasa", classification: "asset-purchase", net: "9000", gross: "9000" }), // excluded
    expense("g", { category: "Kira", net: "999", gross: "999", voided: true }), // voided
    expense("h", { category: "Kira", date: "2025-10-01", net: "1", gross: "1" }), // another month
  ];
  const { groups, attention } = groupExpenses("2025-09", app);
  expect(groups).toEqual([
    { key: "staff", amount: "12000", count: 1 },
    { key: "rent", amount: "5000", count: 1 },
    { key: "utilities", amount: "1000", count: 2 },
    { key: "other", amount: "150.5", count: 1 },
  ]);
  expect(attention).toEqual([]);
  expect(calculateExpenseComponents({ period: "2025-09", expenses: app }).expenses).toBe("18150.5");
});

test("an unknown-tax line blocks its group and is named", () => {
  const app = [
    expense("a", { category: "Kira" }),
    expense("b", { category: "Elektrik", taxTreatment: "unknown", taxEvidence: null, date: "2025-09-12" }),
    expense("c", { category: "Belirsiz", classification: "unclassified", net: "40", gross: "40" }),
  ];
  const { groups, attention } = groupExpenses("2025-09", app);
  expect(groups.find(group => group.key === "utilities")).toEqual({ key: "utilities", amount: null, count: 1 });
  expect(groups.find(group => group.key === "rent")).toEqual({ key: "rent", amount: "100", count: 1 });
  expect(groups.find(group => group.key === "staff")).toEqual({ key: "staff", amount: "0", count: 0 });
  expect(attention).toEqual([
    { entityId: "b", category: "Elektrik", date: "2025-09-12", reason: "unknownTax" },
    { entityId: "c", category: "Belirsiz", date: "2025-09-05", reason: "unclassified" },
  ]);
});
