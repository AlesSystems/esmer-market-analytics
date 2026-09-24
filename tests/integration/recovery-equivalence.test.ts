import { expect, test } from "vitest";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import readAll from "read-excel-file/node";
import { Recovery } from "../../src/recovery/backup";
import { generateRecoveryKey, encodeRecoveryKey, decodeRecoveryKey } from "../../src/recovery/keys";
import { ReportVersions } from "../../src/reports/versions";
import { SalesReports } from "../../src/reports/query";
import { excelReport } from "../../src/reports/export";
import { populateRecoveryStore } from "../helpers/recovery-fixtures";

function financialRecords(path: string) {
  const db = new DatabaseSync(path, { readOnly: true });
  try {
    const names = ["datasets", "source_documents", "source_lines", "source_suppliers", "active_dataset", "rollback_dataset", "package_history", "app_revisions", "adjustment_targets", "expense_batches", "report_versions", "evidence_references", "import_batches"];
    return Object.fromEntries(names.map(name => [name, db.prepare(`SELECT * FROM ${name} ORDER BY rowid`).all()]));
  } finally { db.close(); }
}

test("independent artifact and exported key recover financial history and every Excel sheet after original installation loss", async () => {
  const root = await mkdtemp(join(tmpdir(), "esmer-independent-recovery-"));
  const original = join(root, "original"), fresh = join(root, "fresh"), destination = join(root, "retained-backups");
  await Promise.all([mkdir(original), mkdir(fresh), mkdir(destination)]);
  const originalPath = join(original, "analytics.sqlite"), restoredPath = join(fresh, "analytics.sqlite");
  const key = generateRecoveryKey(), keyPath = join(root, "retained-key.esmerkey");
  await writeFile(keyPath, encodeRecoveryKey(key), { mode: 0o600 });
  let recovery: Recovery | undefined;
  try {
    recovery = await Recovery.open(originalPath, { destination, key });
    const accepted = await populateRecoveryStore(recovery.store!);
    const before = financialRecords(originalPath);
    const workbookBefore = await readAll(await excelReport(accepted));
    const status = await recovery.backupNow();
    expect(status.state).toBe("ready");
    expect(status.backups.length).toBeGreaterThan(0);
    const latest = [...status.backups].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const artifact = join(destination, `${latest.id}.esmerbackup`);
    expect((await readFile(artifact)).includes(Buffer.from("Sentetik kira düzeltmesi"))).toBe(false);
    await recovery.close(); recovery = undefined;
    await rm(original, { recursive: true });
    key.fill(0);

    recovery = await Recovery.open(restoredPath);
    const preview = await recovery.prepareRestore(artifact, decodeRecoveryKey(await readFile(keyPath)));
    expect(preview.reports).toBe(1);
    expect(preview.revisions).toBe(6);
    expect(recovery.store!.availability()).toMatchObject({ store: "empty" });
    await recovery.confirmRestore(preview.token);
    expect(financialRecords(restoredPath)).toEqual(before);
    const versions = new ReportVersions(recovery.store!, new SalesReports(recovery.store!));
    const restored = versions.selected(accepted.id);
    expect(restored).toEqual(accepted);
    expect(restored.sales.metrics.netSales).toBe("100");
    expect(restored.purchasing.gross.coveredGrossProfit).toBe("40");
    expect(restored.operating.result.expenses).toBe("60");
    expect(await readAll(await excelReport(restored))).toEqual(workbookBefore);
    await recovery.close(); recovery = undefined;
    recovery = await Recovery.open(restoredPath);
    expect(financialRecords(restoredPath)).toEqual(before);
  } finally {
    await recovery?.close();
    await rm(root, { recursive: true, force: true });
  }
});
