import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { dependencyCapacityRecords } from "./issue-67-capacity";
import { businessPackage } from "./business-fixtures";
import { readPackage } from "../../src/source/package";
import { estimateGrossResult } from "../../src/analytics/costs";

const count = Number(process.argv[2]);
assert(process.argv.length === 3 && [100, 1000, 5000, 10000, 16666, 16667].includes(count));
const started = performance.now();
const records = dependencyCapacityRecords(count);
let phase = "write";
try {
  const bytes = businessPackage(records, {
    lineage: "synthetic-issue-67-capacity",
    coverage: { from: "2025-08-01", to: "2025-09-30", complete: true },
  });
  assert(count < 16667, "The package above 100,000 records must be rejected");
  const written = performance.now();
  phase = "parse";
  const parsed = readPackage(bytes);
  assert(parsed.ok);
  const read = performance.now();
  phase = "calculate";
  const result = estimateGrossResult(parsed.records, {
    mappingVersion: "synthetic-business-v1", from: "2025-09-01", to: "2025-09-30",
  });
  assert.equal(result.coveredSales, String(-50n * BigInt(count)));
  assert.equal(result.coveredCost, String(-30n * BigInt(count)));
  assert.equal(result.coveredGrossProfit, String(-20n * BigInt(count)));
  assert.equal(result.covered.length, count * 2);
  assert.equal(result.excluded.length, 0);
  process.stdout.write(`${JSON.stringify({
    synthetic: true, groups: count, records: count * 6,
    originalSaleDocuments: count, originalSaleLines: count,
    packageBytes: bytes.length, sha256: createHash("sha256").update(bytes).digest("hex"),
    prepareMs: written - started, parseMs: read - written, calculateMs: performance.now() - read,
    totalMs: performance.now() - started, maxRssKiB: process.resourceUsage().maxRSS,
    net: result.coveredSales, cost: result.coveredCost, profit: result.coveredGrossProfit, status: "passed",
  })}\n`);
} catch (error) {
  if (count !== 16667 || phase !== "write" || !(error instanceof Error) || error.message !== "INVALID_PACKAGE") throw error;
  process.stdout.write(`${JSON.stringify({
    synthetic: true, groups: count, records: count * 6,
    originalSaleDocuments: count, originalSaleLines: count,
    status: "rejected-by-existing-bounds", phase,
    totalMs: performance.now() - started, maxRssKiB: process.resourceUsage().maxRSS,
  })}\n`);
}
