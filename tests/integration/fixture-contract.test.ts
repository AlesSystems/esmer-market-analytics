import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, test } from "vitest";
import assert from "node:assert/strict";
import { sourceContract } from "../../src/source/contract";

const fixturePath = (path: string) => resolve("tests/fixtures", path);

test("phase 2 supplies independently specified G01–G08 synthetic oracles", () => {
  const path = fixturePath("golden/scenarios.json");
  expect(existsSync(path), "golden oracle catalogue is absent").toBe(true);
  const scenarios = JSON.parse(readFileSync(path, "utf8"));
  expect(scenarios.map((scenario: { id: string }) => scenario.id)).toEqual([
    "G01", "G02", "G03", "G04", "G05", "G06", "G07", "G08",
  ]);
});

type Row = Record<string, string | null> & { id: string; kind: string };
type Fixture = {
  id: string;
  version: number;
  mappingVersion: string;
  provenance: { kind: string; oracle: string; sourceReconciled: boolean };
  lineage: string;
  semantics: string;
  assumptions: string[];
  coverage: { coveredIds: string[]; excludedIds: string[] };
  records: Row[];
  expected: unknown;
};
const read = (path: string) => JSON.parse(readFileSync(fixturePath(path), "utf8"));
const golden: Fixture[] = read("golden/scenarios.json");
const edges: Fixture[] = read("source-contract/edges.json");
const sourceA: Fixture = read("source-a/snapshot.json");
const sourceB: Fixture = read("source-b/snapshot.json");
const privacy: Fixture = read("source-contract/privacy.json");
const fixtures = [...golden, ...edges, sourceA, sourceB, privacy];

const expected: Record<string, unknown> = {
  "documented-zero-cost": { eligibleCost: "0", estimatedGrossProfit: "10", sourceZeroCostRule: "unsupported" },
  "unit-conversion": { pieces: "6", estimatedCost: "18", estimatedGrossProfit: "12" },
  "positive-comparisons": { nominalNetGrowthPercent: "20", transactionGrowthPercent: "50", unitVolumeGrowthPercent: "25", purchasePriceGrowthPercent: "50", supplierId: "supplier-comparison" },
  G01: { netSales: "180", kdv: "9", grossReceipt: "189", estimatedCost: "140", estimatedGrossProfit: "40", method: "historical-last-purchase-estimate" },
  G02: { coveredSales: "100", coveredCost: "60", coveredEstimatedGrossProfit: "40", costCoveragePercent: "50", fullPopulationGrossProfit: null },
  G03: { historicalEstimatedCost: "30", replacementA: "75", replacementB: "150" },
  G04: { linkedReturnNet: "-100", linkedReturnCost: "-60", unlinkedReturnCost: null, warning: "unsupported-return-cost" },
  G05: { januaryExpense: "50", februaryExpense: "0", februaryPayment: "50", totalExpense: "50" },
  G06: { netSales: "100", estimatedGrossProfit: "40", operatingProfit: null, message: "Faaliyet kârı hesaplanamıyor — gider verileri eksik." },
  G07: { purchaseEvents: "1", purchaseNet: "80", supplierReturnEvents: "1", supplierReturnNet: "-20", retainedDocumentIds: ["dispatch-1", "invoice-1", "dispatch-2", "invoice-2"] },
  G08: { candidateDataset: "source-b", acceptedDataset: "source-a", changedIds: ["line-edit"], insertedIds: ["line-insert"], deletedIds: ["line-delete"], reviewAdjustmentIds: ["adjustment-1", "adjustment-during-stage"] },
  fractional: { net: "30", estimatedCost: "15", estimatedGrossProfit: "15" },
  "unknown-cost-unit": { eligibleCost: null, excludedIds: ["unknown-unit", "zero-cost", "negative-cost", "missing-cost"], warning: "unsupported-cost-or-unit" },
  denominators: { zeroComparisonPercent: null, negativeComparisonPercent: null, zeroMarginPercent: null, negativeMarginPercent: null, zeroBasket: null, zeroCostCoveragePercent: null },
  "absolute-coverage": { coveredSaleNet: "100", coveredReturnNet: "-50", excludedSaleNet: "0", excludedReturnNet: "-50", coveredAbsoluteNet: "150", totalAbsoluteNet: "200", coveragePercent: "75", coveredEstimatedCost: "30", coveredEstimatedGrossProfit: "20" },
  "basket-margin": { completedSaleDocuments: "2", basketNumerator: "300", averageBasket: "150", customerReturns: "-50", netSales: "250", estimatedCost: "195", estimatedGrossProfit: "55", estimatedMarginPercent: "22" },
  "comparison-partial": { difference: "20", comparisonPercent: "20", periodState: "partial", fullMonthComparable: false, cutoff: "2025-10-12" },
  "expense-classification": { eligibleOperatingResult: "150", ownerContributionEffect: "0", withUnknownTaxOperatingResult: null, withoutConfirmationOperatingResult: null, method: "estimated-management-result" },
  "rounding-discounts": { unroundedNet: "1.005", displayNetHalfUp: "1.01", unroundedKdv: "0.05025", lineDiscountNet: "180", headerDiscountNet: "171", headerDiscountKdv: "8.55", sourceRounding: "unresolved" },
  "unsupported-documents": { rareType: "unsupported", voidSaleCountEffect: "0", archiveSubtraction: "0", conversionMetric: null, recordedKdv: "999", kdvWarning: "anomaly-not-rewritten" },
  "lineage-reset": { collidesWithSourceA: false, identity: ["synthetic-market-reset", "line-edit"] },
  "interrupted-publication": { activeDataset: "source-a", candidateActivated: false, acceptedDataset: "source-a", preservedConcurrentIds: ["expense-during-stage", "adjustment-during-stage"] },
  "source-a": { sourceIds: ["line-edit", "line-delete"], sourceNet: "150", appOwnedIds: ["expense-1", "adjustment-1", "setting-1", "audit-1", "report-1"], acceptedReportNet: "150", acceptedDataset: "source-a" },
  "source-b": { sourceIds: ["line-edit", "line-insert"], sourceNet: "110", insertedIds: ["line-insert"], editedIds: ["line-edit"], deletedIds: ["line-delete"], backdatedIds: ["line-edit"], preservedAppOwnedIds: ["expense-1", "adjustment-1", "setting-1", "audit-1", "report-1"], concurrentAppOwnedIds: ["expense-during-stage", "adjustment-during-stage"], reviewAdjustmentIds: ["adjustment-1", "adjustment-during-stage"], acceptedReportNet: "150", acceptedDataset: "source-a" },
  privacy: { approvedSupplierIds: ["supplier-1"], rejectedFields: ["MUSTERI_AD", "EMAIL", "ADRES", "VERGI_NUMARASI", "LOYALTY_CARD", "PERSONNEL_NAME", "RAW_SQL", "credentials"] },
};

function keys(value: object, names: readonly string[]) {
  assert.deepEqual(Object.keys(value).sort(), [...names].sort());
}

function validateFixture(fixture: Fixture, contract = sourceContract): string {
  try {
    keys(fixture, ["id", "version", "mappingVersion", "provenance", "lineage", "semantics", "assumptions", "coverage", "records", "expected"]);
    assert.equal(fixture.version, 1);
    assert.equal(fixture.mappingVersion, contract.version);
    assert.ok(Object.hasOwn(expected, fixture.id));
    assert.deepEqual(fixture.provenance, { kind: "synthetic", oracle: "independent-hand-arithmetic", sourceReconciled: false });
    assert.equal(fixture.semantics, "synthetic-assumptions-only");
    assert.equal(fixture.lineage, fixture.id === "lineage-reset" ? "synthetic-market-reset" : "synthetic-market-1");
    assert.ok(fixture.assumptions.length > 0 && fixture.assumptions.every((item) => typeof item === "string" && item.length > 0));
    assert.equal(contract.sourceEvidence, "revalidation-required");
    for (const rule of Object.values(contract.rules)) {
      assert.equal(rule.status, "unsupported");
      assert.equal(rule.evidence, "historical-audit-only");
      assert.ok(rule.population.length > 0 && rule.warning.length > 0);
    }
    keys(fixture.coverage, ["coveredIds", "excludedIds"]);
    assert.ok(fixture.records.length > 0);
    const ids = fixture.records.map((record) => record.id);
    assert.equal(new Set(ids).size, ids.length);
    const coverage = [...fixture.coverage.coveredIds, ...fixture.coverage.excludedIds];
    assert.equal(new Set(coverage).size, coverage.length);
    assert.ok(coverage.every((id) => ids.includes(id)));
    for (const row of fixture.records) {
      assert.ok(Object.hasOwn(contract.syntheticColumns, row.kind));
      const allowed = contract.syntheticColumns[row.kind as keyof typeof contract.syntheticColumns] as readonly string[];
      assert.ok(Object.keys(row).every((key) => allowed.includes(key)));
      assert.ok(Object.values(row).every((value) => value === null || typeof value === "string"));
      assert.ok(row.id.trim().length > 0);
      assert.ok(Object.values(row).every((value) => value === null || !value.includes("SYNTHETIC_PRIVATE_")));
      if (["sale", "return", "conversion"].includes(row.kind)) assert.ok(row.documentId?.trim());
      if (row.kind === "supplier") {
        assert.ok(row.purchaseDocumentId && row.name);
        assert.ok(fixture.records.some((purchase) => purchase.kind === "conversion" && purchase.documentId === row.purchaseDocumentId && ["1", "5"].includes(purchase.documentType!)));
      }
      if (row.kind === "report") assert.ok(row.datasetId && row.mappingVersion && row.calculationVersion && row.appRevision);
      for (const field of ["net", "kdv", "gross", "cost", "quantity", "unitNet", "discountPercent"])
        if (row[field] !== undefined && row[field] !== null) assert.match(row[field], /^-?\d+(?:\.\d+)?$/);
    }
    assert.deepEqual(fixture.expected, expected[fixture.id]);
    return fixture.id;
  } catch {
    throw new Error("FIXTURE_CONTRACT_REJECTED");
  }
}

test.each(fixtures)("accepts declared synthetic oracle $id", (fixture) => {
  expect(validateFixture(fixture)).toBe(fixture.id);
});

test.each([
  ["missing outputs", (f: Fixture) => { delete (f as Partial<Fixture>).expected; }],
  ["empty outputs", (f: Fixture) => { f.expected = {}; }],
  ["wrong outputs", (f: Fixture) => { f.expected = { ...(f.expected as object), netSales: "181" }; }],
  ["blank record identity", (f: Fixture) => { f.records[0].id = " "; }],
  ["blank document identity", (f: Fixture) => { f.records[0].documentId = " "; }],
  ["unknown fixture version", (f: Fixture) => { f.version = 0; }],
  ["missing lineage", (f: Fixture) => { f.lineage = ""; }],
  ["unknown mapping", (f: Fixture) => { f.mappingVersion = "unknown"; }],
  ["false source support", (f: Fixture) => { f.semantics = "supported"; f.provenance.sourceReconciled = true; }],
  ["foreign covered population", (f: Fixture) => { f.coverage.coveredIds = ["absent-line"]; }],
  ["overlapping coverage", (f: Fixture) => { f.coverage.excludedIds = [...f.coverage.coveredIds]; }],
  ["incompatible record kind", (f: Fixture) => { f.records[0].kind = "expense"; }],
  ["nested private field", (f: Fixture) => { Object.assign(f.records[0], { private: { EMAIL: "SYNTHETIC_PRIVATE_SENTINEL" } }); }],
] as const)("rejects %s", (_name, mutate) => {
  const changed = structuredClone(golden[0]);
  mutate(changed);
  expect(() => validateFixture(changed)).toThrowError(/^FIXTURE_CONTRACT_REJECTED$/);
});

test("synthetic evidence cannot promote a source rule even with changed metadata", () => {
  const contract = structuredClone(sourceContract);
  Object.assign(contract.rules.historicalCost, { status: "supported", evidence: "synthetic" });
  expect(() => validateFixture(golden[0], contract)).toThrowError(/^FIXTURE_CONTRACT_REJECTED$/);
});

test.each(["MUSTERI_AD", "EMAIL", "ADRES", "VERGI_NUMARASI", "LOYALTY_CARD", "PERSONNEL_NAME", "RAW_SQL", "credentials"])("rejects synthetic private input %s without echoing its value", (field) => {
  const changed = structuredClone(privacy);
  changed.records[0][field] = `SYNTHETIC_PRIVATE_${field}`;
  expect(() => validateFixture(changed)).toThrowError(/^FIXTURE_CONTRACT_REJECTED$/);
  expect(validateFixture(privacy)).toBe("privacy");
});

test("rejects private data in provenance, coverage and expected output", () => {
  for (const key of ["provenance", "coverage", "expected"] as const) {
    const changed = structuredClone(privacy);
    Object.assign(changed[key] as object, { EMAIL: "SYNTHETIC_PRIVATE_SENTINEL" });
    expect(() => validateFixture(changed)).toThrowError(/^FIXTURE_CONTRACT_REJECTED$/);
  }
});

const scenario = (id: string) => fixtures.find((fixture) => fixture.id === id)!;
const record = (id: string, row: string) => scenario(id).records.find((item) => item.id === row)!;
const integer = (row: Row, field: string) => BigInt(row[field]!);
const thousandths = (value: string) => {
  assert.match(value, /^-?\d+(?:\.\d{1,3})?$/);
  const negative = value.startsWith("-");
  const [whole, fractional = ""] = (negative ? value.slice(1) : value).split(".");
  const magnitude = BigInt(whole) * 1000n + BigInt(fractional.padEnd(3, "0"));
  return negative ? -magnitude : magnitude;
};
const output = (id: string, key: string) => (scenario(id).expected as Record<string, unknown>)[key];
const checkInteger = (id: string, key: string, actual: bigint) => expect(actual.toString()).toBe(output(id, key));

test("independently checks golden arithmetic with integer quantities and money", () => {
  const sale = record("G01", "sale-1");
  const net = integer(sale, "quantity") * integer(sale, "unitNet") * (100n - integer(sale, "discountPercent")) / 100n;
  const cost = integer(sale, "quantity") * integer(sale, "cost");
  checkInteger("G01", "netSales", net);
  checkInteger("G01", "kdv", net * 5n / 100n);
  checkInteger("G01", "grossReceipt", net + integer(sale, "kdv"));
  checkInteger("G01", "estimatedCost", cost);
  checkInteger("G01", "estimatedGrossProfit", net - cost);
  const covered = record("G02", "costed");
  const missing = record("G02", "missing");
  checkInteger("G02", "coveredSales", integer(covered, "net"));
  checkInteger("G02", "coveredCost", integer(covered, "cost"));
  checkInteger("G02", "coveredEstimatedGrossProfit", integer(covered, "net") - integer(covered, "cost"));
  checkInteger("G02", "costCoveragePercent", integer(covered, "net") * 100n / (integer(covered, "net") + integer(missing, "net")));
  expect(missing.cost).toBeNull();
  expect(scenario("G02").coverage).toEqual({ coveredIds: ["costed"], excludedIds: ["missing"] });
  const historical = record("G03", "historical");
  checkInteger("G03", "historicalEstimatedCost", integer(historical, "quantity") * integer(historical, "cost"));
  checkInteger("G03", "replacementA", integer(historical, "quantity") * integer(record("G03", "current-a"), "cost"));
  checkInteger("G03", "replacementB", integer(historical, "quantity") * integer(record("G03", "current-b"), "cost"));
  const returned = record("G04", "linked-return");
  expect(returned.linkedId).toBe(record("G04", "original").id);
  checkInteger("G04", "linkedReturnCost", integer(returned, "quantity") * integer(returned, "cost"));
  checkInteger("G04", "linkedReturnNet", integer(returned, "net"));
  expect(record("G04", "unlinked-return").linkedId).toBeNull();
  expect(record("G04", "unlinked-return").cost).toBeNull();
  const expense = record("G05", "expense-1");
  expect(expense.date?.slice(0, 7)).toBe("2025-01");
  expect(expense.paidDate?.slice(0, 7)).toBe("2025-02");
  checkInteger("G05", "totalExpense", integer(expense, "net"));
  expect(record("G06", "expenses").status).toBe("absent");
  checkInteger("G06", "estimatedGrossProfit", integer(record("G06", "costed"), "net") - integer(record("G06", "costed"), "cost"));
});

test("independently checks fractional and rounding assumptions without floating-point money", () => {
  expect(thousandths("-0.375")).toBe(-375n);
  expect(thousandths("-1.005")).toBe(-1005n);
  const weighted = record("fractional", "weight");
  expect(weighted.quantity).toBe("0.375");
  expect(weighted.unit).toBe("kg");
  checkInteger("fractional", "net", thousandths(weighted.quantity!) * integer(weighted, "unitNet") / 1000n);
  checkInteger("fractional", "estimatedCost", thousandths(weighted.quantity!) * integer(weighted, "cost") / 1000n);
  checkInteger("fractional", "estimatedGrossProfit", thousandths(weighted.quantity!) * (integer(weighted, "unitNet") - integer(weighted, "cost")) / 1000n);
  const precision = record("rounding-discounts", "precision");
  expect(precision.unitNet).toBe("0.335");
  const unrounded = thousandths(precision.unitNet!) * integer(precision, "quantity");
  expect(unrounded).toBe(1005n);
  expect(output("rounding-discounts", "unroundedNet")).toBe("1.005");
  expect((unrounded + 5n) / 10n).toBe(101n);
  expect(output("rounding-discounts", "displayNetHalfUp")).toBe("1.01");
  expect(unrounded * 5n).toBe(5025n);
  expect(precision.kdv).toBe("0.05025");
  const discounts = record("rounding-discounts", "discounts");
  const afterLine = integer(discounts, "quantity") * integer(discounts, "unitNet") * (100n - integer(discounts, "discountPercent")) / 100n;
  checkInteger("rounding-discounts", "lineDiscountNet", afterLine);
  checkInteger("rounding-discounts", "headerDiscountNet", afterLine * 95n / 100n);
  expect(afterLine * 95n / 100n * 5n).toBe(855n);
  expect(discounts.kdv).toBe("8.55");
});

test("covers signed returns with absolute exposure and the same covered cost population", () => {
  const fixture = scenario("absolute-coverage");
  const covered = fixture.records.filter((row) => fixture.coverage.coveredIds.includes(row.id));
  expect(covered.map((row) => row.id)).toEqual(["sale-covered", "return-covered"]);
  const exposure = (rows: Row[]) => rows.reduce((sum, row) => { const net = integer(row, "net"); return sum + (net < 0n ? -net : net); }, 0n);
  const cost = covered.reduce((sum, row) => sum + (row.kind === "return" ? -1n : 1n) * integer(row, "cost"), 0n);
  checkInteger(fixture.id, "coveredAbsoluteNet", exposure(covered));
  checkInteger(fixture.id, "totalAbsoluteNet", exposure(fixture.records));
  checkInteger(fixture.id, "coveragePercent", exposure(covered) * 100n / exposure(fixture.records));
  checkInteger(fixture.id, "coveredEstimatedCost", cost);
  checkInteger(fixture.id, "coveredEstimatedGrossProfit", covered.reduce((sum, row) => sum + integer(row, "net"), 0n) - cost);
});

test("checks completed-document basket, margin and positive comparison arithmetic", () => {
  const rows = scenario("basket-margin").records;
  const sales = rows.filter((row) => row.kind === "sale" && row.status === "complete");
  const saleCount = BigInt(new Set(sales.map((row) => row.documentId)).size);
  const numerator = sales.reduce((sum, row) => sum + integer(row, "net"), 0n);
  const net = rows.reduce((sum, row) => sum + integer(row, "net"), 0n);
  const cost = rows.reduce((sum, row) => sum + (row.kind === "return" ? -1n : 1n) * integer(row, "cost"), 0n);
  checkInteger("basket-margin", "completedSaleDocuments", saleCount);
  checkInteger("basket-margin", "averageBasket", numerator / saleCount);
  checkInteger("basket-margin", "netSales", net);
  checkInteger("basket-margin", "estimatedCost", cost);
  checkInteger("basket-margin", "estimatedMarginPercent", (net - cost) * 100n / net);
  const previous = record("positive-comparisons", "prior");
  const current = record("positive-comparisons", "current");
  expect([previous.unit, current.unit]).toEqual(["kg", "kg"]);
  for (const [field, key] of [["net", "nominalNetGrowthPercent"], ["value", "transactionGrowthPercent"], ["quantity", "unitVolumeGrowthPercent"], ["cost", "purchasePriceGrowthPercent"]])
    checkInteger("positive-comparisons", key, (integer(current, field) - integer(previous, field)) * 100n / integer(previous, field));
  const expense = record("expense-classification", "operating");
  checkInteger("expense-classification", "eligibleOperatingResult", integer(record("expense-classification", "gross"), "net") - integer(expense, "net"));
  expect(record("expense-classification", "owner").classification).toBe("owner-contribution");
  expect(record("expense-classification", "unknown-tax").kdvTreatment).toBe("unknown");
});

test("G07 retains both documents while specifying one event for each conversion family", () => {
  const rows = scenario("G07").records;
  for (const [event, net, types] of [["purchase-event", "80", ["5", "1"]], ["supplier-event", "-20", ["7", "3"]]] as const) {
    const pair = rows.filter((row) => row.eventId === event);
    expect(pair.map((row) => row.documentType)).toEqual(types);
    expect(pair.map((row) => row.net)).toEqual([net, net]);
    expect(pair[0].linkedId).toBe(pair[1].id);
    expect(pair[1].linkedId).toBe(pair[0].id);
    expect(new Set(pair.map((row) => row.eventId)).size).toBe(1);
  }
  expect(rows.map((row) => row.documentId)).toEqual(output("G07", "retainedDocumentIds"));
});

function snapshotRelations(a: Fixture, b: Fixture) {
  try {
    assert.equal(a.lineage, b.lineage);
    const before = a.records.filter((row) => row.kind === "sale");
    const after = b.records.filter((row) => row.kind === "sale");
    const inserted = after.filter((row) => !before.some((old) => old.id === row.id));
    const deleted = before.filter((row) => !after.some((current) => current.id === row.id));
    const edited = after.filter((row) => before.some((old) => old.id === row.id && JSON.stringify(old) !== JSON.stringify(row)));
    const result = b.expected as Record<string, unknown>;
    assert.deepEqual(inserted.map((row) => row.id), result.insertedIds);
    assert.deepEqual(deleted.map((row) => row.id), result.deletedIds);
    assert.deepEqual(edited.map((row) => row.id), result.editedIds);
    assert.deepEqual(edited.map((row) => row.documentId), ["doc-edit"]);
    assert.deepEqual(edited.filter((row) => row.date! < before.find((old) => old.id === row.id)!.date!).map((row) => row.id), result.backdatedIds);
    const owned = a.records.filter((row) => row.kind !== "sale");
    for (const row of owned) assert.deepEqual(b.records.find((current) => current.id === row.id), row);
    assert.deepEqual(owned.map((row) => row.id), result.preservedAppOwnedIds);
    assert.deepEqual(b.records.filter((row) => row.kind !== "sale" && !owned.some((old) => old.id === row.id)).map((row) => row.id), result.concurrentAppOwnedIds);
    assert.deepEqual(b.records.filter((row) => row.kind === "adjustment" && [...deleted, ...edited].some((line) => line.id === row.targetId)).map((row) => row.id), result.reviewAdjustmentIds);
    assert.equal(after.reduce((sum, row) => sum + integer(row, "net"), 0n).toString(), result.sourceNet);
    const accepted = b.records.find((row) => row.kind === "report")!;
    assert.equal(accepted.datasetId, a.id);
    assert.equal(accepted.mappingVersion, a.mappingVersion);
    assert.equal(accepted.calculationVersion, "synthetic-calculation-v1");
    assert.equal(accepted.appRevision, "1");
    assert.equal(accepted.net, "150");
    return { inserted: inserted.map((row) => row.id), edited: edited.map((row) => row.id), deleted: deleted.map((row) => row.id) };
  } catch {
    throw new Error("SNAPSHOT_CONTRACT_REJECTED");
  }
}

test("A/B concrete facts establish correction, deletion and preservation expectations", () => {
  expect(snapshotRelations(sourceA, sourceB)).toEqual({ inserted: ["line-insert"], edited: ["line-edit"], deleted: ["line-delete"] });
  const reset = scenario("lineage-reset");
  expect(reset.records[0].id).toBe(sourceA.records[0].id);
  expect([reset.lineage, reset.records[0].id]).toEqual(output("lineage-reset", "identity"));
  expect(reset.lineage).not.toBe(sourceA.lineage);
  const interruption = scenario("interrupted-publication");
  expect(interruption.records.slice(2)).toEqual(sourceB.records.slice(-2));
  expect(record("interrupted-publication", "active").value).toBe(sourceA.id);
  expect(record("interrupted-publication", "candidate").status).toBe("interrupted");
});

test.each(["delete-app-expense", "overwrite-report", "miss-deletion", "remove-concurrent-adjustment", "different-lineage"])("rejects inconsistent snapshot evidence %s", (mutation) => {
  const changed = structuredClone(sourceB);
  if (mutation === "delete-app-expense") changed.records = changed.records.filter((row) => row.id !== "expense-1");
  if (mutation === "overwrite-report") changed.records.find((row) => row.kind === "report")!.net = "110";
  if (mutation === "miss-deletion") changed.records.push(sourceA.records[1]);
  if (mutation === "remove-concurrent-adjustment") changed.records = changed.records.filter((row) => row.id !== "adjustment-during-stage");
  if (mutation === "different-lineage") changed.lineage = "another-source";
  expect(() => snapshotRelations(sourceA, changed)).toThrowError(/^SNAPSHOT_CONTRACT_REJECTED$/);
});

test("rejects a sentinel in an allowed supplier name and a supplier without a purchasing reference", () => {
  const changed = structuredClone(privacy);
  changed.records[0].name = "SYNTHETIC_PRIVATE_SENTINEL";
  expect(() => validateFixture(changed)).toThrowError(/^FIXTURE_CONTRACT_REJECTED$/);
  changed.records[0].name = "SENTETİK TEDARİKÇİ";
  changed.records[0].purchaseDocumentId = "absent-purchase";
  expect(() => validateFixture(changed)).toThrowError(/^FIXTURE_CONTRACT_REJECTED$/);
});

test("documents synthetic zero-cost evidence and explicit fractional unit conversion", () => {
  const gift = record("documented-zero-cost", "gift");
  expect(gift.status).toBe("synthetic-zero-cost-evidence");
  checkInteger("documented-zero-cost", "eligibleCost", integer(gift, "cost"));
  checkInteger("documented-zero-cost", "estimatedGrossProfit", integer(gift, "net") - integer(gift, "cost"));
  const carton = record("unit-conversion", "carton");
  const multiplier = record("unit-conversion", "multiplier");
  expect([carton.unit, multiplier.unit]).toEqual(["carton", "pieces-per-carton"]);
  const pieces = thousandths(carton.quantity!) * integer(multiplier, "quantity") / 1000n;
  checkInteger("unit-conversion", "pieces", pieces);
  checkInteger("unit-conversion", "estimatedCost", pieces * integer(carton, "cost"));
  checkInteger("unit-conversion", "estimatedGrossProfit", integer(carton, "net") - pieces * integer(carton, "cost"));
});
