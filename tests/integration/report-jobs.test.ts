import { expect, test } from "vitest";
import { OperationJobs } from "../../src/desktop/jobs";
import { saveReportExport } from "../../src/desktop/report-export";

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
