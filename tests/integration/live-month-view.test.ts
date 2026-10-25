import { afterEach, expect, test, vi } from "vitest";
import { LiveSynchronizer } from "../../src/source/live";
import { MAX_MONTHS, prepareLiveEstimate, prepareMonthlyEstimate } from "../../src/source/sql-package";
import { parseSqlServerConfig, type SqlSnapshot } from "../../src/source/sql-server";
import { readRawPackage } from "../../src/source/raw-package";
import { openStore } from "../../src/store/store";
import { monthProfitSnapshot } from "../helpers/month-profit-fixture";
import { richEstimateSnapshot } from "../helpers/rich-estimate-fixture";

// The fake extraction honours the requested window like the real read does and always carries cost.
let source: SqlSnapshot = monthProfitSnapshot();
let failing = false;
vi.mock("../../src/source/sql-server", async importOriginal => {
  const original = await importOriginal<typeof import("../../src/source/sql-server")>();
  return {...original, extractSqlServer: async (config: {from: string; to: string}, _signal?: AbortSignal, options?: {cost?: boolean}) => {
    if (failing) throw new Error("SOURCE_UNAVAILABLE");
    if (!options?.cost) throw new Error("COST_REQUIRED");
    const inside = (row: {FIS_TARIHI?: unknown}) => String(row.FIS_TARIHI).slice(0, 10) >= config.from && String(row.FIS_TARIHI).slice(0, 10) <= config.to;
    const headers = source.headers.filter(inside), ids = new Set(headers.map(row => row.ID));
    const lines = source.lines.filter(row => ids.has(row.FIS));
    const stoks = new Set(lines.map(row => row.STOK));
    return {...source, from: config.from, to: config.to, headers, lines, products: source.products?.filter(row => stoks.has(row.ID))};
  }};
});

const config = () => parseSqlServerConfig({server: "localhost", port: 14333, database: "fixture", user: "reader", password: "synthetic", scope: "isolated-copy", lineage: "fixture", expectedDatabaseId: "f51ae321-96f0-4bdf-9497-6b106180ff25", from: "2025-08-01", to: "2025-10-31"});
const today = "2026-10-25";
const controllers: LiveSynchronizer[] = [];
afterEach(async () => { failing = false; source = monthProfitSnapshot(); await Promise.all(controllers.splice(0).map(controller => controller.close())); });
function live(store: ReturnType<typeof openStore>, snapshotConfig = config()) {
  const controller = new LiveSynchronizer({
    extract: signal => prepareLiveEstimate(snapshotConfig, signal, today),
    importCandidate: () => { throw new Error("financial import"); },
    importPreview: bytes => store.importSourcePreview(bytes),
    activePreview: () => store.sourcePreviewState(),
    activeDataset: () => null,
  });
  controllers.push(controller); controller.enable();
  return controller;
}
const view = (store: ReturnType<typeof openStore>, month: string) => { const read = store.readMonthProfit({month}); if (read.status !== "month-profit") throw new Error(`NO_VIEW ${read.status}`); return read.view; };
// source.hash covers the random extraction id and source.extractedAt the capture instant; both differ per extraction by design.
const withoutIdentity = (value: ReturnType<typeof view>) => ({...value, source: {...value.source, hash: "-", extractedAt: "-"}});

test("live refresh and prepare-month packages give identical month views", async () => {
  const packageStore = openStore(":memory:"), liveStore = openStore(":memory:");
  try {
    const prepared = await prepareMonthlyEstimate(config(), "2025-10", MAX_MONTHS, undefined, {clamp: true});
    expect(readRawPackage(prepared.bytes)?.schemaVersion).toBe("sql-backup-estimate-v2");
    expect(packageStore.importSourcePreview(prepared.bytes).status).toBe("preview-imported");
    expect(await live(liveStore).refresh()).toMatchObject({status: "active"});
    for (const month of ["2025-10", "2025-09", "2025-08"]) expect(withoutIdentity(view(liveStore, month))).toEqual(withoutIdentity(view(packageStore, month)));
    expect(view(liveStore, "2025-10").totals).toMatchObject({sales: "480", grossProfit: "57.5"});
  } finally { packageStore.close(); liveStore.close(); }
});

test("a failed live refresh keeps the previous month view and expenses", async () => {
  const store = openStore(":memory:");
  try {
    store.appendRevision({kind: "expense", entityId: "expense", value: {net: "7", date: "2025-10-02", reason: "Synthetic", evidence: "fixture:expense"}});
    const controller = live(store);
    expect(await controller.refresh()).toMatchObject({status: "active"});
    const before = view(store, "2025-10"), expenses = store.readSnapshot();
    failing = true;
    expect(await controller.refresh()).toEqual({status: "failed", code: "SOURCE_UNAVAILABLE"});
    expect(view(store, "2025-10")).toEqual(before);
    expect(store.readSnapshot()).toEqual(expenses);
  } finally { store.close(); }
});

test("refreshing identical source data reports no change and changed data replaces the preview", async () => {
  const store = openStore(":memory:");
  try {
    const controller = live(store);
    expect(await controller.refresh()).toMatchObject({status: "active"});
    const first = view(store, "2025-10");
    expect(await controller.refresh()).toMatchObject({status: "unchanged", datasetId: first.source.hash});
    expect(view(store, "2025-10")).toEqual(first);
    source = {...source, capturedAt: "2026-01-01T00:00:00.000Z", lines: source.lines.map(row => row.ID === "1011" ? {...row, TOPLAM_KDV_MATRAHI: "110"} : row)};
    expect(await controller.refresh()).toMatchObject({status: "active"});
    expect(view(store, "2025-10").totals.sales).toBe("490");
  } finally { store.close(); }
});

test("timing of a fake six-month live refresh", async () => {
  source = richEstimateSnapshot();
  const store = openStore(":memory:");
  try {
    const wide = parseSqlServerConfig({...config(), from: "2025-05-01", to: "2025-10-31"});
    const started = performance.now();
    expect(await live(store, wide).refresh()).toMatchObject({status: "active"});
    console.info(`LIVE_REFRESH_FAKE_6_MONTHS ms=${Math.round(performance.now() - started)} lines=${source.lines.length}`);
    expect(view(store, "2025-10").month).toBe("2025-10");
  } finally { store.close(); }
});
