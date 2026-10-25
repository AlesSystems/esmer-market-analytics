import { expect, test } from "vitest";
import { mkdtemp, mkdir, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { Recovery } from "../../src/recovery/backup";
import { generateRecoveryKey, encodeRecoveryKey, decodeRecoveryKey } from "../../src/recovery/keys";
import { validateSnapshot } from "../../src/recovery/validate";
import { openStore } from "../../src/store/store";
import type { AcceptedReport } from "../../src/store/revisions";
import { businessPackage } from "../helpers/business-fixtures";

// Frozen synthetic outputs of the removed report service: one monthly-report-v1 and one monthly-report-v2.
const frozen = async () => JSON.parse(await readFile(join(__dirname, "../fixtures/accepted-reports/monthly-v1-v2.json"), "utf8")) as { v1: AcceptedReport; v2: AcceptedReport };

function seed(path: string, reports: AcceptedReport[]) {
  const store = openStore(path);
  expect(store.importPackage(businessPackage()).status).toBe("active");
  for (const report of reports) store.acceptReport(structuredClone(report));
  store.close();
}
const rows = (path: string) => {
  const db = new DatabaseSync(path, { readOnly: true });
  try { return { reports: db.prepare("SELECT * FROM report_versions ORDER BY rowid").all(), evidence: db.prepare("SELECT * FROM evidence_references ORDER BY id").all() }; } finally { db.close(); }
};

test("backup and restore keep frozen v1 and v2 accepted reports byte-equal and valid", async () => {
  const { v1, v2 } = await frozen();
  const root = await mkdtemp(join(tmpdir(), "esmer-accepted-restore-"));
  const original = join(root, "original"), fresh = join(root, "fresh"), destination = join(root, "backups");
  await Promise.all([mkdir(original), mkdir(fresh), mkdir(destination)]);
  const key = generateRecoveryKey(), keyBytes = encodeRecoveryKey(key);
  let recovery: Recovery | undefined;
  try {
    recovery = await Recovery.open(join(original, "analytics.sqlite"), { destination, key });
    const store = recovery.store!;
    expect(store.importPackage(businessPackage()).status).toBe("active");
    store.acceptReport(structuredClone(v1)); store.acceptReport(structuredClone(v2));
    const before = rows(join(original, "analytics.sqlite"));
    expect(before.reports).toHaveLength(2);
    const status = await recovery.backupNow();
    const latest = [...status.backups].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const artifact = join(destination, `${latest.id}.esmerbackup`);
    await recovery.close(); recovery = undefined;
    await rm(original, { recursive: true });

    const restoredPath = join(fresh, "analytics.sqlite");
    recovery = await Recovery.open(restoredPath);
    const preview = await recovery.prepareRestore(artifact, decodeRecoveryKey(keyBytes));
    expect(preview.reports).toBe(2);
    await recovery.confirmRestore(preview.token);
    await recovery.close(); recovery = undefined;
    expect(validateSnapshot(restoredPath).reports).toBe(2);
    expect(rows(restoredPath)).toEqual(before);
  } finally {
    await recovery?.close();
    await rm(root, { recursive: true, force: true });
  }
});

test("deep validation accepts the frozen v1 and v2 reports and rejects a v2 report with an altered unit cost", async () => {
  const { v1, v2 } = await frozen();
  const root = await mkdtemp(join(tmpdir(), "esmer-accepted-tamper-"));
  try {
    const good = join(root, "good.sqlite");
    seed(good, [v1, v2]);
    expect(validateSnapshot(good).reports).toBe(2);
    const altered = structuredClone(v2);
    const text = JSON.stringify(altered);
    expect(text).toContain('"historicalUnitCost":"60"');
    const tampered = JSON.parse(text.replace('"historicalUnitCost":"60"', '"historicalUnitCost":"99"')) as AcceptedReport;
    const bad = join(root, "bad.sqlite");
    seed(bad, [tampered]);
    expect(() => validateSnapshot(bad)).toThrow();
  } finally { await rm(root, { recursive: true, force: true }); }
});
