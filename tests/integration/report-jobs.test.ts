import { expect, test, vi } from "vitest";
import { OperationJobs } from "../../src/desktop/jobs";
import { saveReportExport } from "../../src/desktop/report-export";
vi.mock("node:fs/promises", async importOriginal => {
  const original = await importOriginal<typeof import("node:fs/promises")>();
  return {...original, writeFile: vi.fn(original.writeFile)};
});

test("one active job exposes real progress and cancels through shared memory without replacing completion", async () => {
  const jobs = new OperationJobs();
  let finish!: (value: {status: "active"; datasetId: string}) => void;
  let flag!: Int32Array;
  const running = jobs.run("importPackage", async (control) => {
    flag = new Int32Array(control.cancellation);
    jobs.progress(control.id, "documents", 2, 5);
    return new Promise<{status: "active"; datasetId: string}>(resolve => { finish = resolve; });
  });
  const state = jobs.status();
  expect(state).toMatchObject({status: "operation", phase: "documents", completed: 2, total: 5, cancelling: false});
  expect(await jobs.run("openMonthly", async () => ({status: "cancelled"}))).toEqual({status: "busy"});
  if (state.status !== "operation") throw new Error("NO_JOB");
  expect(jobs.cancel({id: state.id + 1})).toEqual({status: "idle"});
  expect(Atomics.load(flag, 0)).toBe(0);
  expect(jobs.cancel({id: state.id})).toEqual({status: "cancelling"});
  expect(Atomics.load(flag, 0)).toBe(1);
  finish({status: "active", datasetId: "committed"});
  expect(await running).toEqual({status: "active", datasetId: "committed"});
  expect(jobs.status()).toEqual({status: "idle"});
});

test("export freezes bytes before opening the dialog and reports write failure without leaking its path", async () => {
  const bytes = new Uint8Array([1, 2, 3]);
  let saved: Uint8Array | undefined;
  const result = await saveReportExport(async () => ({status: "export", bytes}), async () => { bytes.fill(9); return {canceled: false, filePath: "/private/out.xlsx"}; }, async (_path, value) => { saved = value; throw new Error("/private/out.xlsx"); });
  expect(saved).toEqual(new Uint8Array([1, 2, 3]));
  expect(result).toMatchObject({status: "failed", code: "REPORT_EXPORT_FAILED"});
  expect(JSON.stringify(result)).not.toContain("/private");
});

test("real worker rejects unknown work, observes shared cancellation, and stays usable for monthly reports", async () => {
  const {mkdtemp, rm} = await import("node:fs/promises");
  const {tmpdir} = await import("node:os");
  const {join, resolve} = await import("node:path");
  const {Worker} = await import("node:worker_threads");
  const {build} = await import("esbuild");
  const {salesPackage} = await import("../helpers/sales-fixtures");
  const dir = await mkdtemp(join(tmpdir(), "report-worker-"));
  const path = join(dir, "worker.cjs");
  await build({entryPoints: [resolve("src/service/worker.ts")], outfile: path, bundle: true, platform: "node", format: "cjs", target: "node24"});
  const worker = new Worker(path, {workerData: {databasePath: join(dir, "analytics.sqlite")}});
  let id = 0;
  const progress: {phase: string; completed: number; total: number}[] = [];
  worker.on("message", message => { if ("jobId" in message) progress.push(message); });
  const request = (operation: string, fields: object = {}) => new Promise<import("../../src/domain/contracts").ServiceResponse["result"]>((resolveResult, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => { worker.off("message", receive); reject(new Error("WORKER_TIMEOUT")); }, 5000);
    const receive = (message: import("../../src/domain/contracts").ServiceResponse) => { if (message.id === requestId) { clearTimeout(timer); worker.off("message", receive); resolveResult(message.result); } };
    worker.on("message", receive);
    worker.postMessage({id: requestId, operation, ...fields});
  });
  try {
    expect(await request("unknown", {bytes: salesPackage()})).toMatchObject({status: "rejected", code: "UNKNOWN_OPERATION"});
    expect(await request("getAvailability")).toMatchObject({status: "ready", store: "empty"});
    expect(await request("importPackage", {bytes: salesPackage()})).toMatchObject({status: "active"});
    const before = await request("getAvailability");
    const cancellation = new SharedArrayBuffer(4);
    Atomics.store(new Int32Array(cancellation), 0, 1);
    expect(await request("importPackage", {bytes: salesPackage(undefined, {extractionId: "cancelled"}), job: {id: 1, cancellation}})).toEqual({status: "cancelled"});
    expect(await request("getAvailability")).toEqual(before);
    expect(await request("openMonthly", {payload: {period: "2025-09"}, job: {id: 2, cancellation}})).toEqual({status: "cancelled"});
    Atomics.store(new Int32Array(cancellation), 0, 0);
    const monthly = await request("openMonthly", {payload: {period: "2025-09"}, job: {id: 3, cancellation}});
    expect(monthly).toMatchObject({status: "monthly", report: {sales: {metrics: {netSales: "180"}}}});
    expect(progress.length).toBeGreaterThan(0);
    expect(progress.every(row => row.completed >= 0 && row.total >= row.completed)).toBe(true);
    expect(await request("exportReportVersion", {payload: {reportId: "missing"}})).toMatchObject({status: "unavailable", code: "REPORT_NOT_FOUND"});
    expect(await request("openMonthly", {payload: {period: "2025-09", path: "/private"}})).toMatchObject({status: "rejected", code: "INVALID_PAYLOAD"});
    if (monthly.status !== "monthly") throw new Error("NO_REPORT");
    expect(monthly.report).not.toHaveProperty("salesEvidence");
    const evidence = { reportId: monthly.report.id, section: "components", offset: 0, search: "", range: "current", documentId: null };
    expect(await request("readReportEvidence", { payload: evidence })).toMatchObject({ status: "evidence", total: 1, rows: [{ net: "180" }] });
    expect(await request("readReportEvidence", { payload: { ...evidence, offset: -1 } })).toMatchObject({ status: "rejected", code: "INVALID_PAYLOAD" });
    expect(await request("readReportEvidence", { payload: { ...evidence, reportId: "missing" } })).toMatchObject({ status: "unavailable", code: "REPORT_NOT_FOUND" });
    const exported = await request("exportReportVersion", {payload: {reportId: monthly.report.id}});
    expect(exported.status).toBe("export");
    if (exported.status !== "export") throw new Error("NO_EXPORT");
    expect(Array.from(exported.bytes.slice(0, 2))).toEqual([80, 75]);
    expect(await request("getAvailability")).toEqual(before);
  } finally { await worker.terminate(); await rm(dir, {recursive: true, force: true}); }
});

test("failed export generation and cancelled save never write a destination", async () => {
  const select = vi.fn().mockResolvedValue({canceled: true});
  const write = vi.fn();
  expect(await saveReportExport(async () => { throw new Error("private cause"); }, select, write)).toMatchObject({status: "failed", code: "REPORT_EXPORT_FAILED"});
  expect(select).not.toHaveBeenCalled();
  expect(await saveReportExport(async () => ({status: "export", bytes: new Uint8Array([1])}), select, write)).toEqual({status: "cancelled"});
  expect(write).not.toHaveBeenCalled();
});

test("atomic export leaves the previous workbook intact after a partial replacement write fails", async () => {
  const {atomicWriteFile} = await import("../../src/desktop/atomic-file");
  const {mkdtemp, readFile, readdir, rm, writeFile} = await import("node:fs/promises");
  const {tmpdir} = await import("node:os");
  const {join} = await import("node:path");
  const dir = await mkdtemp(join(tmpdir(), "report-atomic-"));
  try {
    const name = "prior.xlsx", path = join(dir, name);
    await writeFile(path, "prior workbook");
    const original = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    vi.mocked(writeFile).mockImplementationOnce(async (temporary, _bytes, options) => {
      await original.writeFile(temporary, "partial", options);
      throw new Error("DISK_FULL");
    });
    await expect(atomicWriteFile(path, new Uint8Array([1, 2, 3]))).rejects.toThrow();
    expect(await readFile(path, "utf8")).toBe("prior workbook");
    expect(await readdir(dir)).toEqual([name]);
    const normal = join(dir, "report.xlsx");
    await writeFile(normal, "prior workbook");
    await atomicWriteFile(normal, new Uint8Array([1, 2, 3]));
    expect(await readFile(normal)).toEqual(Buffer.from([1, 2, 3]));
    expect((await readdir(dir)).sort()).toEqual([name, "report.xlsx"].sort());
  } finally { await rm(dir, {recursive: true, force: true}); }
});
