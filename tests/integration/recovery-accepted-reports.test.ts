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
import { Expenses } from "../../src/expenses/import";
import { row, workbook } from "../helpers/expense-fixtures";
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

test("a linked bill can cross historical versions and survive encrypted restore with its original receipt", async () => {
  const { v1 } = await frozen();
  const root = await mkdtemp(join(tmpdir(), "esmer-linked-restore-"));
  const original = join(root, "original.sqlite"), restored = join(root, "restored.sqlite"), destination = join(root, "backups");
  await mkdir(destination);
  const key = generateRecoveryKey();
  let recovery: Recovery | undefined;
  try {
    recovery = await Recovery.open(original, { destination, key });
    const store = recovery.store!, expenses = new Expenses(store);
    expect(store.importPackage(businessPackage()).status).toBe("active");
    store.acceptReport(v1);
    const fields = { period: "2026-01", category: "Kira", amount: "50" };
    const bill = expenses.create({ action: "save-bill", requestId: "backup-bill", fields });
    if (bill.status !== "saved") throw Error("Fixture bill not saved");
    const preview = expenses.preview(await workbook([row]));
    expenses.confirm({ previewId: preview.previewId, keepCandidateRows: [], matches: [{ row: 2, entityId: bill.entityId }] });
    const linked = expenses.query({ period: fields.period }).rows[0];
    const detailed = linked.value;
    if (!("format" in detailed) || detailed.format !== "expense-v1") throw Error("Fixture link not saved");
    const version = store.changeExpense({ entityId: bill.entityId, expectedRevision: linked.revision, restoreRevision: bill.revision, reason: "Review original bill" });
    expect(expenses.query({ period: fields.period }).rows[0].value).toMatchObject({ format: "manual-bill-v1" });
    const reused = expenses.preview(await workbook([Array(row.length).fill(null), row]));
    expect(reused.rows[0].errors).not.toEqual([]);
    store.changeExpense({ entityId: bill.entityId, expectedRevision: version, restoreRevision: linked.revision, reason: "Restore the detailed bill" });
    const equivalent = expenses.create({ action: "save", requestId: "legacy-equivalent", duplicateReview: null, fields: {
      date: detailed.date, paymentDate: detailed.paymentDate, category: detailed.category, classification: detailed.classification,
      net: "50", tax: "0", gross: "50", taxTreatment: detailed.taxTreatment, taxEvidence: detailed.taxEvidence,
      supportingReference: detailed.supportingReference, sourceReference: detailed.sourceReference, labourPeriod: detailed.labourPeriod, loss: detailed.loss,
    } });
    expect(equivalent).toMatchObject({ status: "already-present", entityId: bill.entityId });
    const before = expenses.query({ period: fields.period });
    const status = await recovery.backupNow(), artifact = join(destination, `${status.backups[0].id}.esmerbackup`);
    await recovery.close(); recovery = undefined;
    recovery = await Recovery.open(restored);
    const restore = await recovery.prepareRestore(artifact, key);
    await recovery.confirmRestore(restore.token);
    const recovered = new Expenses(recovery.store!);
    expect(recovered.query({ period: fields.period })).toEqual(before);
    expect(recovered.create({ action: "resolve", requestId: "backup-bill" })).toMatchObject({ status: "already-saved", revision: bill.revision });
    expect(recovery.store!.readReport(v1.id)).toEqual(v1);
  } finally {
    await recovery?.close();
    await rm(root, { recursive: true, force: true });
  }
});
