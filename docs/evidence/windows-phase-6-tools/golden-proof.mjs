import { build } from "esbuild";
import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const output = resolve(dirname(fileURLToPath(import.meta.url)), "golden-proof.json");
const source = String.raw`
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { businessRecords, businessPackage, addPurchase, historicalCost } from "./tests/helpers/business-fixtures";
import { readPackage, canonical } from "./src/source/package";
import { estimateGrossResult, COST_CALCULATION_VERSION } from "./src/analytics/costs";
import { calculatePurchasing } from "./src/analytics/purchasing";
import { openStore } from "./src/store/store";

const assertions = [], observations = {}, fixtures = [];
const ctx = { mappingVersion: "synthetic-business-v1", from: "2025-09-01", to: "2025-09-30", cutoff: "2025-09-30" };
function check(gate, label, actual, expected) {
  assert.deepStrictEqual(actual, expected, gate + " " + label);
  assertions.push({ gate, label, expected, actual, passed: true });
}
function fixture(records, identity, metadata = {}) {
  const bytes = businessPackage(records, { extractionId: identity, ...metadata });
  const parsed = readPackage(bytes);
  assert.equal(parsed.ok, true, identity + " package must validate");
  fixtures.push({ identity, bytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"), records: { documents: records.documents.length, lines: records.lines.length, suppliers: records.suppliers.length }, cutoff: parsed.metadata.cutoff });
  return { bytes, records: parsed.records };
}
function gross(records, context = ctx) { return estimateGrossResult(records, context); }
function purchases(records, context = ctx) { return calculatePurchasing(records, context); }
function sale(records, index, quantity, net, tax, total) {
  Object.assign(records.lines[index], { quantity, net });
  Object.assign(records.lines[index].sales, { tax, gross: total });
  Object.assign(records.documents.find(d => d.id === records.lines[index].documentId).sales, { net, tax, gross: total });
}

const base = fixture(businessRecords(), "golden-g02");
const g02 = gross(base.records);
check("G02", "covered identifiers and count", g02.covered.map(r => r.lineId), ["L1"]);
check("G02", "excluded identifiers and count", g02.excluded.map(r => r.lineId), ["L2"]);
check("G02", "covered sales", g02.coveredSales, "100");
check("G02", "covered cost", g02.coveredCost, "60");
check("G02", "covered gross", g02.coveredGrossProfit, "40");
check("G02", "coverage percent", g02.costCoveragePercent, "50");
check("G02", "margin percent", g02.coveredMarginPercent, "40");
check("G02", "missing reason and null cost", g02.excluded.map(r => [r.reason, r.cost]), [["MISSING_COST", null]]);
check("G02", "signed exposures", g02.exposures, { coveredSales: "100", coveredReturns: "0", excludedSales: "100", excludedReturns: "0" });
check("G02", "no full-population gross140", g02.coveredGrossProfit === "140", false);
check("G02", "estimated confidence", g02.confidence, "estimated");
observations.G02 = g02;

for (const [name, patch, reason] of [
  ["invalid-zero", { unitCost: "0" }, "UNDOCUMENTED_ZERO"],
  ["unknown-unit", { unit: "unknown" }, "UNKNOWN_UNIT"],
  ["mismatched-unit", { unit: "kg" }, "UNKNOWN_UNIT"],
  ["unknown-kdv", { taxBasis: "unknown" }, "UNKNOWN_TAX"],
  ["negative-cost", { unitCost: "-1" }, "NEGATIVE_COST"],
  ["missing-validation", { evidence: null }, "UNVALIDATED_COST"],
  ["missing-value", { unitCost: null }, "MISSING_COST"]
]) {
  const records = businessRecords(); Object.assign(records.lines[0].business.historicalCost, patch);
  const result = gross(fixture(records, "golden-" + name).records);
  check("G02", name + " excludes L1", result.excluded.find(r => r.lineId === "L1")?.reason, reason);
  check("G02", name + " unavailable cost", result.excluded.find(r => r.lineId === "L1")?.cost, null);
}
const zero = businessRecords(); Object.assign(zero.lines[0].business.historicalCost, { unitCost: "0", documentedZero: true });
const zeroResult = gross(fixture(zero, "golden-documented-zero").records);
check("G02", "documented zero participates", zeroResult.covered.map(r => [r.lineId, r.cost]), [["L1", "0"]]);
const allZero = businessRecords();
for (let i = 0; i < 2; i++) { allZero.lines[i].sales.unitNet = "0"; sale(allZero, i, "1", "0", "0", "0"); }
const allZeroResult = gross(fixture(allZero, "golden-zero-exposure").records);
check("G02", "all-zero exposure has no percentage", allZeroResult.costCoveragePercent, null);
check("G02", "all-zero covered sales has no margin", allZeroResult.coveredMarginPercent, null);
check("G02", "all-zero retains row counts", [allZeroResult.covered.length, allZeroResult.excluded.length], [1, 1]);

function returned() {
  const r = businessRecords(); r.documents[0].date = "2025-08-31"; sale(r, 0, "2", "200", "10", "210");
  r.documents[1].kind = "customer-return"; sale(r, 1, "1", "-100", "-5", "-105");
  r.lines[1].business.historicalCost = { ...historicalCost(), originalSaleLineId: "L1" };
  return r;
}
const wide = { coverage: { from: "2025-08-01", to: "2025-09-30", complete: true } };
const returnedResult = gross(fixture(returned(), "golden-g04", wide).records);
check("G04", "prior-month linked return sales", returnedResult.coveredSales, "-100");
check("G04", "prior-month linked return cost", returnedResult.coveredCost, "-60");
check("G04", "negative covered sales no margin", returnedResult.coveredMarginPercent, null);
check("G04", "return population", returnedResult.covered.map(r => [r.lineId, r.quantity]), [["L2", "-1"]]);
check("G04", "signed return exposure", returnedResult.exposures, { coveredSales: "0", coveredReturns: "-100", excludedSales: "0", excludedReturns: "0" });
observations.G04 = returnedResult;
for (const [name, change] of [
  ["missing", r => { r.lines[1].business.historicalCost.originalSaleLineId = null; }],
  ["wrong-product", r => { r.lines[1].sales.productId = "other-product"; }],
  ["wrong-unit", r => { r.lines[1].sales.unit = "kg"; }],
  ["wrong-historical-cost", r => { r.lines[1].business.historicalCost.unitCost = "61"; }],
  ["ambiguous-over-return", r => { const extra = structuredClone(r.lines[1]); extra.id = "L3"; extra.quantity = "2"; r.lines.push(extra); }]
]) {
  const r = returned(); change(r); addPurchase(r, "P1", "90");
  const result = gross(fixture(r, "golden-return-" + name, wide).records);
  check("G04", name + " attribution excluded", result.excluded.find(r => r.lineId === "L2")?.reason, "RETURN_ATTRIBUTION");
  check("G04", name + " no latest-purchase fallback", result.excluded.find(r => r.lineId === "L2")?.cost, null);
}
const cancellation = returned(); cancellation.documents[0].date = "2025-09-01"; sale(cancellation, 0, "1", "100", "5", "105");
cancellation.documents.push({ ...structuredClone(cancellation.documents[0]), id: "S3" });
cancellation.lines.push({ ...structuredClone(cancellation.lines[0]), id: "L3", documentId: "S3", business: { historicalCost: null, inventory: null } });
const cancelResult = gross(fixture(cancellation, "golden-cancellation").records);
check("G02", "cancellation covered sales", cancelResult.coveredSales, "0");
check("G02", "cancellation keeps denominator", cancelResult.costCoveragePercent, "66.67");
check("G02", "cancellation margin unavailable", cancelResult.coveredMarginPercent, null);
check("G02", "cancellation signed exposures", cancelResult.exposures, { coveredSales: "100", coveredReturns: "-100", excludedSales: "100", excludedReturns: "0" });
const absoluteExposure = [...cancelResult.covered, ...cancelResult.excluded].reduce((total, r) => { const value = BigInt(r.net); return total + (value < 0n ? -value : value); }, 0n).toString();
check("G02", "independent integer absolute denominator", absoluteExposure, "300");
observations.cancellation = { result: cancelResult, absoluteDenominator: absoluteExposure };

const history = businessRecords(); history.documents.splice(1); history.lines.splice(1); sale(history, 0, "3", "300", "15", "315");
history.lines[0].business.historicalCost = historicalCost("10"); addPurchase(history, "P1", "25");
const historyA = fixture(history, "golden-g03-a");
const g03A = gross(historyA.records), replacementA = purchases(historyA.records).replacements[0];
check("G03", "three units historical10", g03A.coveredCost, "30");
check("G03", "three units replacement25", replacementA.replacementCost, "75");
check("G03", "replacement unit explicit", replacementA.unit, "piece");
const changed = structuredClone(history); addPurchase(changed, "P2", "50"); changed.documents.at(-1).date = "2025-09-10";
const historyB = fixture(changed, "golden-g03-b");
check("G03", "replacement50 does not rewrite cost", gross(historyB.records).coveredCost, "30");
check("G03", "three units replacement50", purchases(historyB.records).replacements[0].replacementCost, "150");
check("G03", "explicit earlier cutoff excludes future price", purchases(historyB.records, { ...ctx, cutoff: "2025-09-05" }).replacements[0].replacementCost, "75");
check("G03", "nominal unit price change10 to25", replacementA.nominalChangePercent, "150");
const store = openStore(":memory:");
try {
  check("G03", "import initial dataset", store.importPackage(historyA.bytes).status, "active");
  const initial = store.readSnapshot();
  const accepted = { id: "synthetic-g03-proof", pin: initial.pin, calculationVersion: COST_CALCULATION_VERSION, evidence: ["synthetic-g03-oracle", "historical-evidence"], output: g03A };
  store.acceptReport(accepted);
  const acceptedHash = createHash("sha256").update(canonical(store.readReport(accepted.id))).digest("hex");
  check("G03", "import replacement change", store.importPackage(historyB.bytes).status, "active");
  const corrected = structuredClone(changed); corrected.lines[0].business.historicalCost.unitCost = "12"; corrected.lines[0].business.historicalCost.evidence = "historical-correction-evidence";
  const correction = fixture(corrected, "golden-g03-correction");
  const beforeCorrection = store.readSnapshot();
  const candidate = store.stage(correction.bytes);
  check("G03", "historical correction creates candidate", candidate.status, "validated");
  check("G03", "candidate staging preserves active dataset", store.readSnapshot().pin.datasetId, beforeCorrection.pin.datasetId);
  check("G03", "activate corrected candidate", store.activate(candidate.id).status, "active");
  const current = store.readSnapshot();
  check("G03", "historical correction creates new dataset", current.pin.datasetId !== initial.pin.datasetId && current.pin.datasetId !== beforeCorrection.pin.datasetId, true);
  check("G03", "corrected three units historical12", gross(current.records).coveredCost, "36");
  check("G03", "accepted output and evidence unchanged", store.readReport(accepted.id), accepted);
  check("G03", "accepted content hash unchanged", createHash("sha256").update(canonical(store.readReport(accepted.id))).digest("hex"), acceptedHash);
  check("G03", "pinned historical data retains cost30", gross(store.readPinned(initial.pin).records).coveredCost, "30");
  check("G03", "accepted confidence remains estimated", store.readReport(accepted.id).output.confidence, "estimated");
  check("G03", "accepted method remains last-purchase estimate", store.readReport(accepted.id).output.method, "historical-last-purchase-estimate");
  observations.G03 = { initialDataset: initial.pin.datasetId, replacementDataset: beforeCorrection.pin.datasetId, correctedDataset: current.pin.datasetId, acceptedHash, acceptedEvidence: accepted.evidence, initialHistoricalCost: "30", correctedHistoricalCost: "36", replacementTotals: ["75", "150"], syntheticAcceptanceOnly: true };
} finally { store.close(); }

function linked(kind = "purchase") {
  const r = businessRecords(); addPurchase(r, "I1", kind === "purchase" ? "80" : "20", kind);
  const invoice = r.documents.at(-1), line = r.lines.at(-1); invoice.date = "2025-09-05";
  r.documents.push({ ...structuredClone(invoice), id: "D1", date: "2025-09-02", purchasing: { ...invoice.purchasing, representation: "dispatch", convertedTo: "I1", invoiced: true } });
  r.lines.push({ ...structuredClone(line), id: "D1-line", documentId: "D1" });
  return r;
}
for (const kind of ["purchase", "supplier-return"]) {
  const r = fixture(linked(kind), "golden-g07-" + kind).records;
  const result = purchases(r), events = kind === "purchase" ? result.history : result.supplierReturns;
  check("G07", kind + " exactly one event", events.length, 1);
  check("G07", kind + " retains both source IDs", events[0].sourceDocumentIds, ["D1", "I1"]);
  check("G07", kind + " invoice date", events[0].date, "2025-09-05");
  check("G07", kind + " signed invoice value", events[0].net, kind === "purchase" ? "80" : "-20");
  const earlier = purchases(r, { ...ctx, to: "2025-09-03" });
  check("G07", kind + " dispatch date does not recognize event", (kind === "purchase" ? earlier.history : earlier.supplierReturns).length, 0);
  if (kind === "supplier-return") {
    check("G07", "physical return evidenced", events[0].physicalReturn, true);
    check("G07", "unknown credit remains unknown", events[0].recognizedCredit, null);
    check("G07", "unknown recovery request remains unknown", events[0].requestedRecovery, null);
    check("G07", "unknown replacement remains unknown", events[0].replacementSettlement, "unknown");
  }
}
for (const [name, change] of [
  ["flag", r => { r.documents.at(-1).purchasing.invoiced = false; }],
  ["missing-target", r => { r.documents.at(-1).purchasing.convertedTo = "absent-invoice"; }],
  ["duplicate-owner", r => { const d = structuredClone(r.documents.at(-1)), l = structuredClone(r.lines.at(-1)); d.id = "D2"; l.id = "D2-line"; l.documentId = "D2"; r.documents.push(d); r.lines.push(l); }],
  ["supplier", r => { r.suppliers.push({ id: "supplier-2", name: "Sentetik tedarikçi" }); r.documents.at(-1).supplierId = "supplier-2"; }],
  ["product", r => { r.lines.at(-1).sales.productId = "other-product"; }],
  ["unit", r => { r.lines.at(-1).sales.unit = "kg"; }],
  ["quantity", r => { r.lines.at(-1).quantity = "2"; }]
]) {
  const r = linked(); change(r); const result = purchases(fixture(r, "golden-g07-conflict-" + name).records);
  if (name === "missing-target") {
    check("G07", name + " blocks affected dispatch", result.exclusions.some(e => e.documentId === "D1" && e.reason === "CONVERSION_CONFLICT"), true);
  } else {
    check("G07", name + " blocks purchase event", result.history.length, 0);
    check("G07", name + " warns both linked documents", ["D1", "I1"].every(id => result.exclusions.some(e => e.documentId === id && e.reason === "CONVERSION_CONFLICT")), true);
  }
}
const missingEvidence = businessRecords(); addPurchase(missingEvidence); missingEvidence.documents.at(-1).purchasing = null;
check("G07", "absent purchase evidence excludes document", purchases(fixture(missingEvidence, "golden-g07-missing-evidence").records).exclusions.find(e => e.documentId === "P1")?.reason, "UNSUPPORTED_PURCHASING_EVIDENCE");
const settlement = linked("supplier-return"); settlement.documents.find(d => d.id === "I1").purchasing.recognizedCredit = "20";
let rejected = false; try { businessPackage(settlement); } catch (error) { rejected = error.message === "INVALID_PACKAGE"; }
check("G07", "credit without settlement evidence rejected", rejected, true);
const physical = businessRecords(); addPurchase(physical, "R1", "20", "supplier-return"); physical.documents.at(-1).purchasing.representation = "dispatch";
const physicalResult = purchases(fixture(physical, "golden-g07-physical-dispatch").records).supplierReturns[0];
check("G07", "standalone physical dispatch retains physical fact", physicalResult.physicalReturn, true);
check("G07", "standalone physical dispatch does not invent credit", physicalResult.recognizedCredit, null);
check("G07", "standalone physical dispatch does not invent replacement", physicalResult.replacementSettlement, "unknown");

export default { generatedAt: new Date().toISOString(), runtime: process.versions, platform: process.platform, arch: process.arch, syntheticOnly: true, ownerAcceptance: false, claims: "Independent literal golden assertions against the local application engine and SQLite persistence. No source semantics or release acceptance certified.", assertionCount: assertions.length, assertions, fixtures, observations };
`;
const compiled = await build({ stdin: { contents: source, resolveDir: process.cwd(), loader: "ts" }, bundle: true, platform: "node", format: "esm", write: false });
const { default: result } = await import("data:text/javascript;base64," + Buffer.from(compiled.outputFiles[0].text).toString("base64"));
result.head = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
result.sourceHashes = Object.fromEntries(["src/analytics/costs.ts", "src/analytics/purchasing.ts", "src/source/package.ts", "src/store/store.ts", "src/store/migrations.ts", "src/store/schema.ts", "tests/helpers/business-fixtures.ts", "work/windows-phase-6/golden-proof.mjs"].map(path => [path, createHash("sha256").update(readFileSync(path)).digest("hex")]));
writeFileSync(output, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ passed: result.assertionCount, fixtures: result.fixtures.length, output }));
