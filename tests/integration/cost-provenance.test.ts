import { expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { openStore } from "../../src/store/store";
import { estimateGrossResult } from "../../src/analytics/costs";
import { businessPackage, businessRecords } from "../helpers/business-fixtures";
import { salesPackage } from "../helpers/sales-fixtures";
test("schema3 upgrade preserves snapshots and evidence-only corrections invalidate adjustment applicability", () => {
  const dir = mkdtempSync(join(tmpdir(), "phase6-")), path = join(dir, "store.sqlite"); let store = openStore(path, { schemaVersion: 3 });
  try {
    expect(store.importPackage(salesPackage()).status).toBe("active"); const legacy = store.readSnapshot(); store.close(); store = openStore(path);
    expect(store.readSnapshot()).toEqual(legacy); expect(store.importPackage(businessPackage()).status).toBe("active"); const snapshot = store.readSnapshot(); expect(snapshot.records).toEqual(businessRecords());
    const output = estimateGrossResult(snapshot.records, { mappingVersion: snapshot.metadata!.mappingVersion, from: "2025-09-01", to: "2025-09-30" });
    store.acceptReport({ id: "cost-report", pin: snapshot.pin, calculationVersion: "synthetic-cost-calc-v1", evidence: ["fixture:g02"], output });
    store.appendRevision({ kind: "adjustment", entityId: "adjustment", value: { net: "1", reason: "Synthetic", evidence: "fixture:adjustment", target: { datasetId: snapshot.pin.datasetId!, kind: "line", sourceId: "L1" }, reversed: false } });
    const changed = businessRecords(); changed.lines[0].business!.historicalCost!.evidence = "corrected-evidence";
    expect(store.importPackage(businessPackage(changed, { extractionId: "business-2" })).status).toBe("active");
    expect(store.readSnapshot().app[0].applicability).toBe("review-required"); expect(store.readReport("cost-report").output).toEqual(output); expect(store.readPinned(snapshot.pin).records).toEqual(snapshot.records);
  } finally { store.close(); rmSync(dir, { recursive: true, force: true }); }
});
