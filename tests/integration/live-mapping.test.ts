import { expect, test, vi } from "vitest";
import { prepareLiveEstimate } from "../../src/source/sql-package";
import { parseSqlServerConfig } from "../../src/source/sql-server";
import { readPackage } from "../../src/source/package";
import { readRawPackage } from "../../src/source/raw-package";
import { LiveSynchronizer } from "../../src/source/live";
import { openStore } from "../../src/store/store";
vi.mock("../../src/source/sql-server", async importOriginal => {
  const original = await importOriginal<typeof import("../../src/source/sql-server")>();
  const { estimateSnapshot: snapshot } = await import("../helpers/estimate-fixture");
  return { ...original, extractSqlServer: async () => snapshot() };
});

const config = () => parseSqlServerConfig({ server: "localhost", port: 14333, database: "fixture", user: "reader", password: "synthetic", scope: "isolated-copy", lineage: "fixture", expectedDatabaseId: "f51ae321-96f0-4bdf-9497-6b106180ff25", from: "2025-10-01", to: "2025-10-12" });

test("a successful SQL read becomes an estimate source preview and not a financial package", async () => {
  const bytes = await prepareLiveEstimate(config(), undefined, "2025-12-01");
  const raw = readRawPackage(bytes);
  expect(raw?.snapshot.headers).toHaveLength(1);
  expect(raw?.snapshot.lines).toHaveLength(1);
  expect(raw?.sourceReconciled).toBe(false);
  expect(raw?.schemaVersion).toBe("sql-backup-estimate-v1");
  expect(readPackage(bytes).ok).toBe(false);
  const store = openStore(":memory:");
  try {
    expect(store.importSourcePreview(bytes)).toMatchObject({ status: "preview-imported" });
  } finally { store.close(); }
});

test("a live preview stays stored when the financial dataset is absent and a repeat read does not add rows", async () => {
  const store = openStore(":memory:");
  const bytes = await prepareLiveEstimate(config(), undefined, "2025-12-01");
  let fail = false;
  const controller = new LiveSynchronizer({
    extract: async () => { if (fail) throw new Error("SOURCE_UNAVAILABLE"); return bytes; },
    importCandidate: () => { throw new Error("financial import"); },
    importPreview: preview => store.importSourcePreview(preview),
    activeDataset: () => null,
  });
  try {
    controller.enable();
    expect(await controller.refresh()).toMatchObject({ status: "active" });
    expect(controller.status()).toMatchObject({ phase: "idle", lastRecord: "preview" });
    expect(store.readSourcePreview({ stream: "headers", offset: 0 })).toMatchObject({ status: "source-preview", counts: { headers: 1, lines: 1 } });
    expect(await controller.refresh()).toMatchObject({ status: "active" });
    expect(store.readSourcePreview({ stream: "headers", offset: 0 })).toMatchObject({ counts: { headers: 1, lines: 1 } });
    fail = true;
    expect(await controller.refresh()).toMatchObject({ status: "failed", code: "SOURCE_UNAVAILABLE" });
    expect(store.readSourcePreview({ stream: "headers", offset: 0 })).toMatchObject({ counts: { headers: 1, lines: 1 } });
  } finally { await controller.close(); store.close(); }
});
