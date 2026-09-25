import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { cpus, release, tmpdir, totalmem } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readPackageFile } from "../src/desktop/package-file";
import { BUSINESS_MAPPING_VERSION, readPackage, writePackage, type Records } from "../src/source/package";
import { openStore } from "../src/store/store";
import { SalesReports } from "../src/reports/query";
import { ReportVersions } from "../src/reports/versions";
import { excelReport } from "../src/reports/export";
import type { MonthlyReport } from "../src/reports/contracts";

type MemorySample = ReturnType<typeof process.memoryUsage>;
type StageName = "prepare-first" | "read-first" | "parse-first" | "stage-first" | "activate-first" | "snapshot-first" | "monthly-cold" | "monthly-warm" | "accept-first" | "prepare-replacement" | "read-replacement" | "parse-replacement" | "stage-replacement" | "activate-replacement" | "monthly-replacement" | "verify-preservation" | "excel-export" | "backup" | "backup-reopen";
export type ProfileReceipt = {
  format: "synthetic-import-profile-v1";
  environment: { node: string; platform: string; arch: string; osRelease: string; cpu: string; totalMemoryBytes: number; commit: string };
  fixture: { name: "synthetic-business-profile-v1"; mapping: string; documents: number; lines: number; firstSha256: string; replacementSha256: string };
  stages: { name: StageName; elapsedMs: number; before: MemorySample; after: MemorySample; processHighWaterRssKiB: number }[];
  files: { packageBytes: number; replacementPackageBytes: number; readBackingBufferBytes: number; databaseBytes: number; walBytes: number; backupBytes: number; excelBytes: number };
  results: { firstNetSales: string; firstEstimatedCost: string; firstEstimatedGrossProfit: string; replacementNetSales: string; replacementEstimatedCost: string; replacementEstimatedGrossProfit: string; preserved: boolean; exactText: boolean };
  backgroundElapsedMs: number;
  limitations: string[];
};
export function parseProfileCount(args: string[]): number {
  if (args.length > 1 || (args.length === 1 && !/^[1-9][0-9]*$/.test(args[0]))) throw new Error("INVALID_PROFILE_COUNT");
  const count = Number(args[0] ?? "100");
  if (!Number.isSafeInteger(count) || count < 1 || count > 25_000) throw new Error("INVALID_PROFILE_COUNT");
  return count;
}
function fixture(count: number, corrected: boolean): Buffer {
  const records: Records = { documents: [], lines: [], suppliers: [] };
  for (let index = 0; index < count; index++) {
    const id = String(9007199254740993n + BigInt(index));
    const net = corrected && index === 0 ? "120.000000000000000" : "100.000000000000000";
    records.documents.push({ id, kind: "sale", date: "2025-09-15", supplierId: null, sales: { state: "completed", convertedTo: null, net, tax: "0", gross: net }, purchasing: null });
    records.lines.push({ id: `L${id}`, documentId: id, quantity: "1.000000000000000", net, cost: null,
      sales: { productId: "product", productName: "Sentetik ürün", categoryId: "category", categoryName: "Sentetik kategori", unit: "piece", unitNet: net, discountRate: "0", taxRate: "0", tax: "0", gross: net, meaning: "known" },
      business: { historicalCost: { unitCost: "60.000000000000000", unit: "piece", taxBasis: "net", evidence: "synthetic-cost", documentedZero: false, originalSaleLineId: null }, inventory: null } });
  }
  return writePackage([{ stream: "documents", records: records.documents }, { stream: "lines", records: records.lines }], {
    lineage: "synthetic-profile", extractionId: corrected ? "corrected" : "first", extractedAt: "2025-10-01T00:00:00.000Z", cutoff: "2025-09-30", coverage: { from: "2025-09-01", to: "2025-09-30", complete: true },
  }, BUSINESS_MAPPING_VERSION);
}
function totals(report: MonthlyReport, count: number, corrected: boolean) {
  const net = String(BigInt(count) * 100n + (corrected ? 20n : 0n));
  const cost = String(BigInt(count) * 60n), gross = String(BigInt(count) * 40n + (corrected ? 20n : 0n));
  assert.equal(report.sales.metrics.netSales, net);
  assert.equal(report.sales.metrics.saleDocumentCount, count);
  assert.equal(report.salesEvidence.lines.length, count);
  assert.equal(report.purchasing.gross.coveredCost, cost);
  assert.equal(report.purchasing.gross.coveredGrossProfit, gross);
  assert.equal(report.purchasing.gross.confidence, "estimated");
  assert.equal(report.operating.result.value, null);
  return { net, cost, gross };
}
export async function runProfile(count: number): Promise<ProfileReceipt> {
  parseProfileCount([String(count)]);
  const directory = await mkdtemp(join(tmpdir(), "synthetic-import-profile-"));
  const databasePath = join(directory, "analytics.sqlite"), packagePath = join(directory, "package.json"), backupPath = join(directory, "backup.sqlite");
  const started = performance.now(), stages: ProfileReceipt["stages"] = [];
  const measure = async <T>(name: StageName, action: () => T | Promise<T>): Promise<T> => {
    const before = process.memoryUsage(), start = performance.now();
    const result = await action();
    stages.push({ name, elapsedMs: performance.now() - start, before, after: process.memoryUsage(), processHighWaterRssKiB: process.resourceUsage().maxRSS });
    return result;
  };
  let store: ReturnType<typeof openStore> | undefined;
  try {
    store = openStore(databasePath);
    const active = store;
    const first = await measure("prepare-first", () => fixture(count, false));
    await writeFile(packagePath, first);
    const bytes = await measure("read-first", () => readPackageFile(packagePath));
    const parsed = await measure("parse-first", () => readPackage(bytes));
    assert(parsed.ok);
    assert.equal(parsed.records.lines[0].documentId, "9007199254740993");
    assert.equal(parsed.records.lines[0].net, "100.000000000000000");
    const staged = await measure("stage-first", () => active.stage(bytes));
    assert.equal(staged.status, "validated"); if (staged.status !== "validated") throw new Error("PROFILE_FAILED");
    assert.equal((await measure("activate-first", () => active.activate(staged.id))).status, "active");
    active.appendRevision({ kind: "setting", entityId: "currency", value: { currency: "TRY", reason: "Sentetik profil", evidence: "synthetic-setting" } });
    active.appendRevision({ kind: "expense", entityId: "expense", value: { net: "7.000000000000001", date: "2025-09-15", reason: "Sentetik profil", evidence: "synthetic-expense" } });
    const snapshot = await measure("snapshot-first", () => active.readSnapshot());
    assert.deepEqual(snapshot.records, parsed.records);
    const versions = new ReportVersions(active, new SalesReports(active));
    const opened = await measure("monthly-cold", () => versions.open({ period: "2025-09" }));
    assert.equal(opened.status, "monthly"); if (opened.status !== "monthly") throw new Error("PROFILE_FAILED");
    const initial = totals(opened.report, count, false);
    const warm = await measure("monthly-warm", () => versions.current({ context: opened.report.context }));
    assert.equal(warm.status, "monthly");
    await measure("accept-first", () => versions.accept({ candidateId: opened.report.id, previousAcceptedId: null, reason: "Sentetik profil" }));
    const accepted = versions.selected(opened.report.id);
    const replacement = await measure("prepare-replacement", () => fixture(count, true));
    await writeFile(packagePath, replacement);
    const replacementBytes = await measure("read-replacement", () => readPackageFile(packagePath));
    assert((await measure("parse-replacement", () => readPackage(replacementBytes))).ok);
    const next = await measure("stage-replacement", () => active.stage(replacementBytes));
    assert.equal(next.status, "validated"); if (next.status !== "validated") throw new Error("PROFILE_FAILED");
    assert.equal((await measure("activate-replacement", () => active.activate(next.id))).status, "active");
    const candidate = await measure("monthly-replacement", () => versions.open({ period: "2025-09" }));
    assert.equal(candidate.status, "monthly"); if (candidate.status !== "monthly") throw new Error("PROFILE_FAILED");
    const corrected = totals(candidate.report, count, true);
    await measure("verify-preservation", () => {
      assert.deepEqual(versions.selected(accepted.id), accepted);
      assert.deepEqual(active.readSnapshot().app, snapshot.app);
      const before = active.readSnapshot();
      assert.deepEqual(active.importPackage(Buffer.from("malformed")), { status: "failed", code: "INVALID_PACKAGE" });
      assert.deepEqual(active.readSnapshot(), before);
    });
    const excel = await measure("excel-export", () => excelReport(accepted));
    await measure("backup", () => active.backupTo(backupPath));
    await measure("backup-reopen", () => {
      const restored = openStore(backupPath);
      try {
        assert.deepEqual(restored.readSnapshot(), active.readSnapshot());
        assert.deepEqual(new ReportVersions(restored, new SalesReports(restored)).selected(accepted.id), accepted);
      } finally { restored.close(); }
    });
    const sizes = await Promise.all([databasePath, `${databasePath}-wal`, backupPath].map(async path => {
      try { return (await stat(path)).size; } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0; throw error; }
    }));
    return {
      format: "synthetic-import-profile-v1",
      environment: { node: process.version, platform: process.platform, arch: process.arch, osRelease: release(), cpu: cpus()[0]?.model ?? "unknown", totalMemoryBytes: totalmem(), commit: execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", windowsHide: true }).trim() },
      fixture: { name: "synthetic-business-profile-v1", mapping: BUSINESS_MAPPING_VERSION, documents: count, lines: count, firstSha256: createHash("sha256").update(first).digest("hex"), replacementSha256: createHash("sha256").update(replacement).digest("hex") },
      stages, files: { packageBytes: first.length, replacementPackageBytes: replacement.length, readBackingBufferBytes: bytes.buffer.byteLength, databaseBytes: sizes[0], walBytes: sizes[1], backupBytes: sizes[2], excelBytes: excel.length },
      results: { firstNetSales: initial.net, firstEstimatedCost: initial.cost, firstEstimatedGrossProfit: initial.gross, replacementNetSales: corrected.net, replacementEstimatedCost: corrected.cost, replacementEstimatedGrossProfit: corrected.gross, preserved: true, exactText: true },
      backgroundElapsedMs: performance.now() - started,
      limitations: ["Synthetic bounded scenario only; no full-population acceptance", "Inputs, parsed records, snapshots and reports are retained for assertions; memory includes the profiling program and is not the service footprint", "Excel measures buffer generation only; this run does not read back the workbook", "No source extraction, IPC, UI responsiveness, cancellation or encrypted recovery measurement", "Memory values are stage-boundary samples; maxRSS is the process-lifetime high water in KiB, not a stage heap peak", "Disk sizes are end-of-run observations, not temporary disk peaks", "Background duration is not dashboard interaction latency"],
    };
  } finally {
    store?.close();
    await rm(directory, { recursive: true, force: true });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { process.stdout.write(`${JSON.stringify(await runProfile(parseProfileCount(process.argv.slice(2))), null, 2)}\n`); }
  catch { process.stderr.write("PROFILE_FAILED\n"); process.exitCode = 1; }
}
