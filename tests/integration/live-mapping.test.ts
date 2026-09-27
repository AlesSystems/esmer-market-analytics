import { expect, test, vi } from "vitest";
import { prepareSqlCandidate } from "../../src/source/sql-package";
import { parseSqlServerConfig } from "../../src/source/sql-server";
import { readPackage } from "../../src/source/package";
import { readRawPackage } from "../../src/source/raw-package";
import { LiveSynchronizer } from "../../src/source/live";
import { openStore } from "../../src/store/store";
import { SalesReports } from "../../src/reports/query";
vi.mock("../../src/source/sql-server", async importOriginal => {
  const original = await importOriginal<typeof import("../../src/source/sql-server")>();
  const { rawSnapshot: snapshot } = await import("../helpers/raw-fixture");
  return { ...original, extractSqlServer: async () => snapshot() };
});

const config = () => parseSqlServerConfig({ server: "localhost", port: 14333, database: "fixture", user: "reader", password: "synthetic", scope: "isolated-copy", lineage: "fixture", expectedDatabaseId: "f51ae321-96f0-4bdf-9497-6b106180ff25", from: "2025-10-01", to: "2025-10-12" });

test("a successful SQL read becomes a source preview and not a financial package", async () => {
  const bytes = await prepareSqlCandidate(config());
  const raw = readRawPackage(bytes);
  expect(raw?.snapshot.headers).toHaveLength(1);
  expect(raw?.snapshot.lines).toHaveLength(1);
  expect(raw?.sourceReconciled).toBe(false);
  expect(readPackage(bytes).ok).toBe(false);
  const store = openStore(":memory:");
  try {
    expect(store.importSourcePreview(bytes)).toMatchObject({ status: "preview-imported" });
    expect(new SalesReports(store).open({ period: "2025-10" })).toMatchObject({ status: "unavailable", code: "UNSUPPORTED_MAPPING", message: "Yedek kayıtları yüklendi; mali rapor için doğrulanmış satış verisi henüz hazır değil." });
  } finally { store.close(); }
});

test("a live preview stays stored when the financial dataset is absent and a repeat read does not add rows", async () => {
  const store = openStore(":memory:");
  const bytes = await prepareSqlCandidate(config());
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
    expect(new SalesReports(store).open({ period: "2025-10" })).toMatchObject({ code: "UNSUPPORTED_MAPPING" });
  } finally { await controller.close(); store.close(); }
});
