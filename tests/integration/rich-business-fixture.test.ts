import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { readPackage } from "../../src/source/package";
import { richBusinessPackage, richBusinessRecords, seedRichExpenses } from "../helpers/rich-business-fixture";

test("rich business fixture is deterministic and reads back as a valid package", () => {
  expect(Buffer.compare(richBusinessPackage(), richBusinessPackage())).toBe(0);
  const read = readPackage(richBusinessPackage());
  expect(read.ok).toBe(true);
  if (read.ok) expect(read.warnings).toEqual(expect.arrayContaining(["SYNTHETIC_ONLY", "MISSING_COST"]));
  const records = richBusinessRecords(), september = records.documents.filter(row => row.date.startsWith("2025-09"));
  for (const date of new Set(september.filter(row => row.kind === "sale").map(row => row.date))) {
    const count = september.filter(row => row.date === date && (row.kind === "sale" || row.kind === "customer-return")).length;
    expect(count).toBeGreaterThanOrEqual(20); expect(count).toBeLessThanOrEqual(62);
  }
});

test("rich business fixture imports active and seeds its expenses", () => {
  const store = openStore(":memory:");
  try {
    expect(store.importPackage(richBusinessPackage())).toMatchObject({ status: "active" });
    seedRichExpenses(store);
    expect(store.expenseBatches().length).toBeGreaterThan(0);
  } finally { store.close(); }
});
