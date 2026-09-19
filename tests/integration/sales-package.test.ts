import { expect, test } from "vitest";
import { readPackage } from "../../src/source/package";
import { openStore } from "../../src/store/store";
import { sourcePackage } from "../helpers/store-fixtures";

import { salesPackage, salesRecords } from "../helpers/sales-fixtures";

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

test("sales packages reject incomplete metadata, private fields, conflicting labels and broken conversions", async () => {
  const { writePackage } = await import("../../src/source/package");
  const { createHash } = await import("node:crypto");
  const { canonical } = await import("../../src/source/package");
  const bytes = salesPackage();
  for (const change of ["private", "rate", "unit", "missing", "cycle", "label", "quantity"]) {
    const value = JSON.parse(bytes.toString());
    if (change === "private") value.payload.lines[0].sales.customerName = "PRIVATE_SENTINEL";
    if (change === "rate") value.payload.lines[0].sales.taxRate = "100.000001";
    if (change === "unit") value.payload.lines[0].sales.unit = ["piece"];
    if (change === "missing") delete value.payload.documents[0].sales;
    if (change === "cycle") Object.assign(value.payload.documents[0].sales, { state: "converted", convertedTo: "S1" });
    if (change === "quantity") value.payload.lines[0].quantity = "-1";
    if (change === "label") value.payload.lines.push({ ...value.payload.lines[0], id: "other", sales: { ...value.payload.lines[0].sales, productName: "Other identity" } });
    for (const stream of ["documents", "lines", "suppliers"]) value.manifest.streams[stream] = { count: value.payload[stream].length, sha256: createHash("sha256").update(canonical(value.payload[stream])).digest("hex") };
    expect(readPackage(Buffer.from(canonical(value)))).toEqual({ ok: false, code: "INVALID_PACKAGE" });
  }
  expect(() => writePackage([{ stream: "documents", records: salesRecords.documents }], { lineage: "test", extractionId: "test", extractedAt: "2025-09-04T00:00:00.000Z", cutoff: "2025-09-03", coverage: { from: "2025-09-01", to: "2025-09-03", complete: true } })).toThrow("INVALID_PACKAGE");
});

test("migration preserves legacy adjustment fingerprints while sales metadata changes require review", async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const directory = mkdtempSync(join(tmpdir(), "sales-migration-"));
  const path = join(directory, "analytics.sqlite");
  let store = openStore(path, { schemaVersion: 2 });
  try {
    store.importPackage(sourcePackage("a"));
    const legacy = store.readSnapshot();
    store.appendRevision({ kind: "adjustment", entityId: "legacy-adjustment", value: { net: "1", reason: "Synthetic migration check", evidence: "fixture:legacy", target: { datasetId: legacy.pin.datasetId!, kind: "line", sourceId: legacy.records.lines[0].id }, reversed: false } });
    const before = store.readSnapshot(); store.close(); store = openStore(path);
    expect(store.readSnapshot()).toEqual(before);
    expect(store.readSnapshot().app[0].applicability).toBe("applicable");
    store.importPackage(salesPackage());
    const first = store.readSnapshot();
    store.appendRevision({ kind: "adjustment", entityId: "sales-adjustment", value: { net: "1", reason: "Synthetic sales check", evidence: "fixture:sales", target: { datasetId: first.pin.datasetId!, kind: "line", sourceId: "L1" }, reversed: false } });
    expect(store.readSnapshot().app[1].applicability).toBe("applicable");
    const changed = structuredClone(salesRecords); changed.lines[0].sales!.discountRate = "5";
    store.importPackage(salesPackage(changed, { extractionId: "changed-sales" }));
    expect(store.readSnapshot().app[1].applicability).toBe("review-required");
    expect(store.readPinned(first.pin).records).toEqual(first.records);
  } finally { store.close(); rmSync(directory, { recursive: true, force: true }); }
});
