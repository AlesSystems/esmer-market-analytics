import { expect, test } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { Worker } from "node:worker_threads";
import { build } from "esbuild";
import { openStore } from "../../src/store/store";
import { Expenses } from "../../src/expenses/import";
import type { ServiceResponse } from "../../src/domain/contracts";
import { businessPackage, businessRecords } from "../helpers/business-fixtures";
import { estimatePackage } from "../helpers/estimate-fixture";
import { workbook, row } from "../helpers/expense-fixtures";

test("importPackage accepts only estimate packages and keeps the last valid dataset and expenses", async () => {
  const directory = await mkdtemp(join(tmpdir(), "import-estimate-only-"));
  const databasePath = join(directory, "analytics.sqlite");
  const seeded = openStore(databasePath);
  const records = businessRecords(); records.documents = [records.documents[0]]; records.lines = [records.lines[0]];
  expect(seeded.importPackage(businessPackage(records)).status).toBe("active");
  expect(seeded.importSourcePreview(estimatePackage()).status).toBe("preview-imported");
  const expenses = new Expenses(seeded);
  const preview = expenses.preview(await workbook([[row[0], "15.09.2025", "01.10.2025", ...row.slice(3)]]));
  expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
  const before = { availability: seeded.availability(), expenses: expenses.query({ period: "2025-09" }), pin: seeded.readPin(), previewBefore: seeded.readSourcePreview({ stream: "headers", offset: 0 }) };
  seeded.close();
  const script = join(directory, "worker.cjs");
  await build({ entryPoints: [resolve("src/service/worker.ts")], outfile: script, bundle: true, platform: "node", format: "cjs", target: "node24" });
  const worker = new Worker(script, { workerData: { databasePath } });
  let id = 0;
  const request = (operation: string, extra: object = {}) => new Promise<ServiceResponse["result"]>((resolveResult, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => { worker.off("message", receive); reject(new Error("WORKER_TIMEOUT")); }, 10_000);
    const receive = (message: ServiceResponse) => { if (message.id === requestId) { clearTimeout(timer); worker.off("message", receive); resolveResult(message.result); } };
    worker.on("message", receive);
    worker.postMessage({ id: requestId, operation, ...extra });
  });
  try {
    expect(await request("importPackage", { bytes: businessPackage(records, { extractionId: "analysis-again" }) })).toEqual({ status: "failed", code: "INVALID_PACKAGE", message: "Bu paket türü artık desteklenmiyor." });
    expect(await request("getAvailability")).toMatchObject({ status: "ready", store: "loaded", dataset: before.availability.status === "ready" && before.availability.store === "loaded" ? before.availability.dataset : undefined });
    expect(await request("queryExpenses", { payload: { period: "2025-09" } })).toEqual(before.expenses);
    expect(await request("importPackage", { bytes: estimatePackage(undefined, "estimate-2") })).toMatchObject({ status: "preview-imported" });
    expect(await request("queryExpenses", { payload: { period: "2025-09" } })).toEqual(before.expenses);
    await worker.terminate();
    const after = openStore(databasePath);
    try { expect(after.readPin()).toEqual(before.pin); } finally { after.close(); }
  } finally { await worker.terminate(); await rm(directory, { recursive: true, force: true }); }
});
