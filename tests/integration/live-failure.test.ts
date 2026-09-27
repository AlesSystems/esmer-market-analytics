import { afterEach, expect, test, vi } from "vitest";
import { LiveSynchronizer, liveFingerprint, liveIdentity } from "../../src/source/live";
import { readPackage } from "../../src/source/package";
import { openStore } from "../../src/store/store";
import { sourcePackage } from "../helpers/store-fixtures";

const controllers: LiveSynchronizer[] = [];
afterEach(async () => { await Promise.all(controllers.splice(0).map(controller => controller.close())); vi.useRealTimers(); });
function fixture(extract: (signal: AbortSignal) => Promise<Uint8Array>, persist?: ConstructorParameters<typeof LiveSynchronizer>[0]["persist"]) {
  const store = openStore(":memory:");
  store.importPackage(sourcePackage("a"));
  store.appendRevision({ kind: "expense", entityId: "expense", value: { net: "7", date: "2025-01-01", reason: "Synthetic", evidence: "fixture:expense" } });
  store.appendRevision({kind: "adjustment", entityId: "adjustment", value: {net: "2", reason: "Synthetic", evidence: "fixture:adjustment", target: {datasetId: store.readSnapshot().pin.datasetId!, kind: "line", sourceId: "line-edit"}, reversed: false}});
  const snapshot = store.readSnapshot();
  store.acceptReport({id: "accepted", pin: snapshot.pin, calculationVersion: "v1", evidence: ["fixture:a"], output: {net: "150"}});
  const controller = new LiveSynchronizer({extract, importCandidate: bytes => {
    const result = store.importPackage(bytes);
    return result.status === "failed" ? {...result, message: "failure"} : result;
  }, activeDataset: () => { const current = store.readSnapshot(); return current.metadata && current.pin.datasetId ? {datasetId: current.pin.datasetId, fingerprint: liveFingerprint(current.metadata), identity: liveIdentity(current.metadata)} : null; }, persist});
  controllers.push(controller);
  return {store, controller, snapshot};
}

test("disabled starts no source reads; outage and corrupt candidate preserve local records and accepted report", async () => {
  let bytes = sourcePackage("a", undefined, "poll-a");
  let fail = false;
  const extract = vi.fn(async () => { if (fail) throw new Error("password=private server=private"); return bytes; });
  const {store, controller, snapshot} = fixture(extract);
  try {
    expect(await controller.refresh()).toEqual({status: "disabled"});
    expect(extract).not.toHaveBeenCalled();
    controller.enable();
    expect(await controller.refresh()).toMatchObject({status: "unchanged"});
    const success = controller.status().lastSuccessAt;
    fail = true;
    expect(await controller.refresh()).toEqual({status: "failed", code: "SOURCE_UNAVAILABLE"});
    expect(controller.status()).toMatchObject({phase: "stale", lastSuccessAt: success, error: "SOURCE_UNAVAILABLE"});
    fail = false;
    const parsed = JSON.parse(bytes.toString()); parsed.payload.lines[0].net = "999"; bytes = Buffer.from(JSON.stringify(parsed));
    expect(await controller.refresh()).toEqual({status: "failed", code: "INVALID_CANDIDATE"});
    expect(store.readSnapshot()).toEqual(snapshot);
    expect(store.readReport("accepted").output).toEqual({net: "150"});
    expect(JSON.stringify(controller.status())).not.toContain("private");
  } finally { store.close(); }
});

test("single flight, disable and abort prevent late activation even when source ignores cancellation", async () => {
  let release!: (bytes: Uint8Array) => void;
  let signal!: AbortSignal;
  const {store, controller, snapshot} = fixture(s => {signal = s; return new Promise(resolve => {release = resolve;});});
  try {
    controller.enable();
    const pending = controller.refresh();
    expect(await controller.refresh()).toEqual({status: "busy"});
    const disabled = controller.disable();
    expect(signal.aborted).toBe(true);
    release(sourcePackage("b"));
    expect(await pending).toEqual({status: "cancelled"});
    expect(await disabled).toMatchObject({phase: "disabled", lastSuccessAt: null});
    expect(store.readSnapshot()).toEqual(snapshot);
  } finally { store.close(); }
});

test("bounded polling, elapsed freshness and failed persistence never misreport a committed import", async () => {
  vi.useFakeTimers();
  const extract = vi.fn(async () => sourcePackage("b", undefined, "new-poll"));
  const {store, controller} = fixture(extract, () => {throw new Error("disk full");});
  try {
    controller.enable();
    expect(await controller.refresh()).toMatchObject({status: "active"});
    expect(controller.status()).toMatchObject({phase: "idle", persistenceError: true});
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(extract).toHaveBeenCalledTimes(2);
    await controller.disable();
    await vi.advanceTimersByTimeAsync(20 * 60_000);
    expect(extract).toHaveBeenCalledTimes(2);
    controller.enable();
    expect(controller.status().phase).toBe("stale");
  } finally { store.close(); }
});

test("lineage and coverage changes are refused before activation", async () => {
  let bytes = sourcePackage("b", "other-source");
  const {store, controller, snapshot} = fixture(async () => bytes);
  try {
    controller.enable();
    expect(await controller.refresh()).toEqual({status: "failed", code: "SOURCE_CHANGED"});
    const parsed = readPackage(sourcePackage("b")); if (!parsed.ok) throw new Error("fixture");
    const value = JSON.parse(sourcePackage("b").toString()); value.manifest.coverage.complete = false; bytes = Buffer.from(JSON.stringify(value));
    expect(await controller.refresh()).toEqual({status: "failed", code: "SOURCE_CHANGED"});
    expect(store.readSnapshot()).toEqual(snapshot);
  } finally { store.close(); }
});

test("timeout aborts source work and never activates a late candidate", async () => {
  vi.useFakeTimers();
  let release!: (bytes: Uint8Array) => void;
  let signal!: AbortSignal;
  const {store, controller, snapshot} = fixture(s => {signal = s; return new Promise(resolve => {release = resolve;});});
  try {
    controller.enable();
    const pending = controller.refresh();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await pending).toEqual({status: "failed", code: "REFRESH_TIMEOUT"});
    expect(signal.aborted).toBe(true);
    expect(await controller.refresh()).toEqual({status: "busy"});
    release(sourcePackage("b"));
    await Promise.resolve();
    expect(store.readSnapshot()).toEqual(snapshot);
  } finally {store.close();}
});

test.each(["PERMISSION_DENIED", "SOURCE_UNAVAILABLE"] as const)("%s does not claim source success", async code => {
  const {store, controller, snapshot} = fixture(async () => {throw new Error(code);});
  try {
    controller.enable();
    expect(await controller.refresh()).toEqual({status: "failed", code});
    expect(controller.status()).toMatchObject({phase: "stale", lastSuccessAt: null, lastDatasetId: null});
    expect(store.readSnapshot()).toEqual(snapshot);
  } finally {store.close();}
});

test("historical and failed import outcomes retain last success instead of pretending to activate", async () => {
  let result: import("../../src/domain/contracts").ImportOutcome = {status: "historical", datasetId: "old"};
  const controller = new LiveSynchronizer({extract: async () => sourcePackage("b"), importCandidate: () => result, activeDataset: () => null});
  controllers.push(controller);
  controller.enable();
  expect(await controller.refresh()).toEqual({status: "failed", code: "INVALID_CANDIDATE"});
  result = {status: "failed", code: "STORAGE_FULL", message: "private driver information"};
  expect(await controller.refresh()).toEqual({status: "failed", code: "STORAGE_FULL"});
  expect(controller.status()).toMatchObject({lastSuccessAt: null, lastDatasetId: null});
});

test("saved success restarts stale and manual dataset replacement clears freshness", async () => {
  let saved: unknown;
  const {store, controller} = fixture(async () => sourcePackage("a", undefined, "fresh"), status => {saved = status;});
  try {
    controller.enable(); await controller.refresh();
    const prior = controller.status();
    const restarted = new LiveSynchronizer({extract: async () => sourcePackage("a", undefined, "restarted"), importCandidate: () => ({status: "active", datasetId: prior.lastDatasetId!}), activeDataset: () => {const value = store.readSnapshot(); return {datasetId: value.pin.datasetId!, fingerprint: liveFingerprint(value.metadata!), identity: liveIdentity(value.metadata!)};}, initialStatus: saved});
    controllers.push(restarted);
    expect(restarted.status().phase).toBe("disabled");
    expect(restarted.enable()).toMatchObject({phase: "stale", error: "INTERRUPTED", lastSuccessAt: prior.lastSuccessAt});
    expect(await restarted.refresh()).toMatchObject({status: "unchanged"});
    store.importPackage(sourcePackage("b"));
    expect(restarted.status()).toMatchObject({phase: "stale", error: "SOURCE_CHANGED", lastSuccessAt: null, lastDatasetId: null});
  } finally {store.close();}
});


test("invalid persisted status is ignored without importing untrusted fields", () => {
  const controller = new LiveSynchronizer({extract: async () => sourcePackage("a"), importCandidate: () => ({status: "cancelled"}), activeDataset: () => null, initialStatus: {phase: "stale", error: "password=private", lastSuccessAt: "invalid", lastDatasetId: "private", path: "/private"}});
  controllers.push(controller);
  expect(controller.status()).toEqual({phase: "disabled", error: null, lastAttemptAt: null, lastSuccessAt: null, lastDatasetId: null, lastRecord: "none", persistenceError: false});
});

test("polling resumes after timeout cleanup outlasts the next scheduled poll", async () => {
  vi.useFakeTimers();
  let release!: (bytes: Uint8Array) => void;
  const extract = vi.fn().mockImplementationOnce(() => new Promise<Uint8Array>(resolve => {release = resolve;})).mockImplementation(async () => sourcePackage("b", undefined, "after-delayed-cleanup"));
  const {store, controller} = fixture(extract);
  try {
    controller.enable();
    const initial = controller.refresh();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(await initial).toEqual({status: "failed", code: "REFRESH_TIMEOUT"});
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(extract).toHaveBeenCalledTimes(1);
    release(sourcePackage("b", undefined, "late-cancelled-capture"));
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(5 * 60_000);
    expect(extract).toHaveBeenCalledTimes(2);
    expect(controller.status()).toMatchObject({phase: "idle", lastSuccessAt: expect.any(String)});
  } finally {await controller.close(); store.close();}
});
