import { expect, test } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Worker } from "node:worker_threads";
import { build } from "esbuild";
import { workbook, row } from "../helpers/expense-fixtures";
import { salesPackage } from "../helpers/sales-fixtures";
import { estimatePackage } from "../helpers/estimate-fixture";
import { openStore } from "../../src/store/store";
import { writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";
import type { ServiceResponse } from "../../src/domain/contracts";
const config = {server: "localhost", port: 1433, database: "fixture", user: "reader", password: "fixture-password", trustServerCertificate: true, scope: "isolated-copy", lineage: "test", expectedDatabaseId: "00000000-0000-0000-0000-000000000001", from: "2025-09-01", to: "2025-09-30"};

test("worker keeps local reports available during source waits, rejects overlapping imports and preserves fallback after failure", async () => {
  const directory = await mkdtemp(join(tmpdir(), "live-worker-"));
  const script = join(directory, "worker.cjs"), fixture = join(directory, "extractor.ts");
  await writeFile(join(directory, "candidate.json"), estimatePackage());
  await writeFile(fixture, `import {readFile} from "node:fs/promises";
    import {workerData} from "node:worker_threads";
    import {dirname,join} from "node:path";
    export async function prepareLiveEstimate(config,signal) {
      await new Promise((resolve,reject)=>{ const timer=setTimeout(resolve,300); signal.addEventListener("abort",()=>{clearTimeout(timer);reject(new Error("INTERRUPTED"));},{once:true}); });
      if(config.database==="fail") throw new Error("password=fixture-password host=localhost");
      return readFile(join(dirname(workerData.databasePath),"candidate.json"));
    }`);
  await build({entryPoints: [resolve("src/service/worker.ts")], outfile: script, bundle: true, platform: "node", format: "cjs", target: "node24", plugins: [{name: "test-source", setup(builder) {builder.onResolve({filter: /source\/sql-package$/}, () => ({path: fixture}));}}]});
  { const seeded = openStore(join(directory, "analytics.sqlite")); try { expect(seeded.importPackage(salesPackage()).status).toBe("active"); } finally { seeded.close(); } }
  let worker = new Worker(script, {workerData: {databasePath: join(directory, "analytics.sqlite")}}), id = 0;
  const request = (operation: string, fields: object = {}) => new Promise<ServiceResponse["result"]>((resolveResult, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => {worker.off("message", receive); reject(new Error("WORKER_TIMEOUT"));}, 5000);
    const receive = (message: ServiceResponse) => {if (message.id === requestId) {clearTimeout(timer); worker.off("message", receive); resolveResult(message.result);}};
    worker.on("message", receive); worker.postMessage({id: requestId, operation, ...fields});
  });
  try {
    expect(await request("getLiveStatus")).toMatchObject({status: "live", configured: false, live: {phase: "disabled"}});
    expect(await request("setLiveEnabled", {payload: {enabled: true, sql: "secret"}})).toMatchObject({code: "INVALID_PAYLOAD"});
    expect(await request("configureLiveSource", {payload: {config: {...config, scope: "production"}, enabled: true}})).toMatchObject({code: "INVALID_PAYLOAD"});
    expect(await request("configureLiveSource", {payload: {config, enabled: false}})).toMatchObject({status: "live", configured: true, live: {phase: "disabled"}});
    expect(await request("refreshLiveSource")).toMatchObject({live: {phase: "disabled", lastAttemptAt: null}});
    expect(await request("setLiveEnabled", {payload: {enabled: true}})).toMatchObject({live: {phase: "idle"}});
    const expenseBytes = await workbook([[row[0], "15.09.2025", "01.10.2025", ...row.slice(3)]]);
    const refresh = request("refreshLiveSource");
    expect(await request("getLiveStatus")).toMatchObject({live: {phase: "refreshing"}});
    expect(await request("getAvailability")).toMatchObject({status: "ready", store: "loaded", liveConnection: "enabled"});
    expect(await request("importPackage", {bytes: estimatePackage(undefined, "overlap")})).toEqual({status: "busy"});
    expect(await request("refreshLiveSource")).toEqual({status: "busy"});
    const expenses = await request("previewExpenses", {bytes: expenseBytes});
    if (expenses.status !== "preview") throw new Error("NO_EXPENSE_PREVIEW");
    expect(await request("confirmExpenses", {payload: {previewId: expenses.previewId, keepCandidateRows: []}})).toMatchObject({status: "imported"});
    expect(await refresh).toMatchObject({live: {phase: "idle", lastSuccessAt: expect.any(String)}});
    const active = await request("getAvailability");
    const expensesAfter = await request("queryExpenses", {payload: {period: "2025-09"}});
    expect(expensesAfter).toMatchObject({rows: [expect.objectContaining({entityId: expect.any(String)})]});
    expect(await request("configureLiveSource", {payload: {config: {...config, database: "fail"}, enabled: true}})).toMatchObject({status: "live"});
    const failed = await request("refreshLiveSource");
    expect(failed).toMatchObject({live: {phase: "stale", error: "SOURCE_UNAVAILABLE"}});
    expect(JSON.stringify(failed)).not.toContain("fixture-password");
    expect(await request("queryExpenses", {payload: {period: "2025-09"}})).toEqual(expensesAfter);
    expect(await request("getAvailability")).toEqual(active);
    const pending = request("refreshLiveSource");
    expect(await request("setLiveEnabled", {payload: {enabled: false}})).toMatchObject({live: {phase: "disabled"}});
    await pending;
    expect(JSON.parse(await readFile(join(directory, "live-status.json"), "utf8"))).toMatchObject({phase: "disabled"});
    await worker.terminate();
    worker = new Worker(script, {workerData: {databasePath: join(directory, "analytics.sqlite"), liveConfig: config, liveEnabled: true}});
    expect(await request("getLiveStatus")).toMatchObject({live: {phase: "stale", error: "INTERRUPTED"}});
    expect(await request("getAvailability")).toEqual(active);
    const destination = join(directory, "backup"); await mkdir(destination);
    const key = Buffer.alloc(32, 7);
    const recovery = await request("setupRecovery", {payload: {destination, key}});
    expect(recovery.status).toBe("recovery");
    if (recovery.status !== "recovery") throw new Error("NO_BACKUP");
    const preview = await request("prepareRestore", {payload: {backupPath: join(destination, `${recovery.backups[0].id}.esmerbackup`), key}});
    if (preview.status !== "restore-preview") throw new Error("NO_PREVIEW");
    const inFlight = request("refreshLiveSource");
    expect(await request("getLiveStatus")).toMatchObject({live: {phase: "refreshing"}});
    expect(await request("confirmRestore", {payload: {token: preview.token}})).toEqual({status: "restored"});
    await inFlight;
    expect(await request("getLiveStatus")).toMatchObject({live: {phase: "disabled", lastSuccessAt: null, lastDatasetId: null}});
    expect(JSON.parse(await readFile(join(directory, "live-status.json"), "utf8"))).toMatchObject({phase: "disabled", lastSuccessAt: null});
    expect(await request("getAvailability")).toMatchObject({status: "ready", liveConnection: "disabled"});
  } finally {await worker.terminate(); await rm(directory, {recursive: true, force: true});}
});

test("worker stores a raw SQL preview without replacing the financial report", async () => {
  const directory = await mkdtemp(join(tmpdir(), "live-preview-"));
  const script = join(directory, "worker.cjs"), fixture = join(directory, "extractor.ts");
  await writeFile(join(directory, "preview.json"), writeRawPackage(rawSnapshot(), "fixture:worker", "batch-1"));
  await writeFile(fixture, `import {readFile} from "node:fs/promises";
    import {workerData} from "node:worker_threads";
    import {dirname,join} from "node:path";
    export async function prepareLiveEstimate() { return readFile(join(dirname(workerData.databasePath),"preview.json")); }`);
  await build({entryPoints: [resolve("src/service/worker.ts")], outfile: script, bundle: true, platform: "node", format: "cjs", target: "node24", plugins: [{name: "test-source", setup(builder) {builder.onResolve({filter: /source\/sql-package$/}, () => ({path: fixture}));}}]});
  { const seeded = openStore(join(directory, "analytics.sqlite")); try { expect(seeded.importPackage(salesPackage()).status).toBe("active"); } finally { seeded.close(); } }
  const worker = new Worker(script, {workerData: {databasePath: join(directory, "analytics.sqlite"), liveConfig: config, liveEnabled: true}});
  let id = 0;
  const request = (operation: string, fields: object = {}) => new Promise<ServiceResponse["result"]>((resolveResult, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => {worker.off("message", receive); reject(new Error("WORKER_TIMEOUT"));}, 5000);
    const receive = (message: ServiceResponse) => {if (message.id === requestId) {clearTimeout(timer); worker.off("message", receive); resolveResult(message.result);}};
    worker.on("message", receive); worker.postMessage({id: requestId, operation, ...fields});
  });
  const sourceQuery = {hash: null, period: null, view: "overview", scope: "all", documentType: null, productId: null, documentId: null, offset: 0};
  try {
    const loaded = await request("getAvailability");
    expect(loaded).toMatchObject({status: "ready", store: "loaded"});
    expect(await request("setLiveEnabled", {payload: {enabled: true}})).toMatchObject({live: {phase: "idle"}});
    expect(await request("refreshLiveSource")).toMatchObject({live: {phase: "idle", lastRecord: "preview"}});
    expect(await request("querySourceWorkspace", {payload: sourceQuery})).toMatchObject({status: "source-workspace", counts: {documents: 1, lines: 1}});
    expect(await request("refreshLiveSource")).toMatchObject({live: {phase: "idle", lastRecord: "preview"}});
    expect(await request("querySourceWorkspace", {payload: sourceQuery})).toMatchObject({counts: {documents: 1, lines: 1}});
    expect(await request("getAvailability")).toMatchObject({status: "ready", store: "loaded", dataset: (loaded as {dataset: unknown}).dataset});
  } finally {await worker.terminate(); await rm(directory, {recursive: true, force: true});}
});
