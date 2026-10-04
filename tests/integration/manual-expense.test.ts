import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { Expenses } from "../../src/expenses/import";
const fields = { date: "2026-01-15", paymentDate: "2026-02-01", category: "Elektrik", classification: "operating-expense" as const, net: "1.250,50", tax: "0", gross: "1.250,50", taxTreatment: "unknown" as const, taxEvidence: null, supportingReference: null, sourceReference: null, labourPeriod: null, loss: null };
test("manual creation is exact, app-owned and survives a lost reply without another revision", () => {
  const store = openStore(":memory:"), service = new Expenses(store);
  try {
    const request = { action: "save" as const, requestId: "manual-1", fields, duplicateReview: null };
    const saved = service.create(request);
    expect(saved).toMatchObject({ status: "saved", revision: 1, incurredPeriod: "2026-01", paymentPeriod: "2026-02" });
    expect(new Expenses(store).create({ action: "resolve", requestId: "manual-1" })).toMatchObject({ status: "already-saved", revision: 1, paymentPeriod: "2026-02" });
    expect(service.create(request)).toMatchObject({ status: "already-saved", revision: 1 });
    expect(service.query({ period: "2026-01" }).rows[0].value).toMatchObject({ net: "1250.5", gross: "1250.5", origin: { kind: "manual", requestId: "manual-1" } });
    expect(service.query({ period: "2026-02" }).payments).toBe("1250.5");
    expect(store.expenseBatches()).toEqual([]);
    expect(store.readPin().appRevision).toBe(1);
    expect(() => service.create({ ...request, fields: { ...fields, category: "Kira" } })).toThrow();
  } finally { store.close(); }
});
test("invalid amounts never become zero, and similar records need explicit review", () => {
  const store = openStore(":memory:"), service = new Expenses(store);
  try {
    expect(service.create({ action: "save", requestId: "bad", fields: { ...fields, tax: "" }, duplicateReview: null }).status).toBe("invalid");
    service.create({ action: "save", requestId: "first", fields, duplicateReview: null });
    const request = { action: "save" as const, requestId: "second", fields, duplicateReview: null };
    const review = service.create(request);
    expect(review).toMatchObject({ status: "duplicate-review", totalCount: 1 });
    if (review.status !== "duplicate-review") throw Error("review missing");
    expect(service.create({ ...request, duplicateReview: { fingerprint: review.fingerprint, keepSeparate: true } }).status).toBe("saved");
    expect(store.readPin().appRevision).toBe(2);
  } finally { store.close(); }
});
test("reference receipts replay original outcomes after correction and void without invalidating completeness", () => {
  const store = openStore(":memory:"), service = new Expenses(store);
  try {
    const input = { ...fields, sourceReference: "bill-1" }, request = { action: "save" as const, requestId: "origin", fields: input, duplicateReview: null };
    const saved = service.create(request);
    if (saved.status !== "saved") throw Error("save missing");
    store.confirmExpensesComplete({ period: "2026-01", reviewedRevision: saved.revision, complete: true, reason: "Synthetic review" });
    const before = store.recoveryGeneration().changed, pin = store.readPin();
    expect(service.create({ ...request, requestId: "identified" })).toMatchObject({ status: "already-present", revision: 1 });
    expect(store.readPin()).toEqual(pin);
    expect(service.query({ period: "2026-01" }).complete).toBe(true);
    expect(store.recoveryGeneration().changed).toBe(before + 1);
    store.changeExpense({ entityId: saved.entityId, expectedRevision: 1, reason: "Synthetic void", restoreRevision: null });
    expect(service.create({ ...request, requestId: "identified" })).toMatchObject({ status: "already-saved", revision: 1 });
    expect(service.create({ ...request, requestId: "new-id" }).status).toBe("reference-conflict");
    expect(service.create({ action: "resolve", requestId: "new-id" }).status).toBe("not-saved");
  } finally { store.close(); }
});
test("full duplicate set invalidates consent when a hidden match changes", () => {
  const store = openStore(":memory:"), service = new Expenses(store);
  try {
    for (let i = 0; i < 7; i++) {
      const request = { action: "save" as const, requestId: `match-${i}`, fields, duplicateReview: null }, review = service.create(request);
      if (review.status === "duplicate-review") service.create({ ...request, duplicateReview: { fingerprint: review.fingerprint, keepSeparate: true } });
    }
    const request = { action: "save" as const, requestId: "eighth", fields, duplicateReview: null }, review = service.create(request);
    if (review.status !== "duplicate-review") throw Error("review missing");
    expect(review.totalCount).toBe(7); expect(review.candidates).toHaveLength(5);
    const hidden = service.query({ period: "2026-01" }).rows.find(row => !review.candidates.some(candidate => candidate.entityId === row.entityId))!;
    store.changeExpense({ entityId: hidden.entityId, expectedRevision: hidden.revision, reason: "Synthetic change", restoreRevision: null });
    const refreshed = service.create({ ...request, duplicateReview: { fingerprint: review.fingerprint, keepSeparate: true } });
    expect(refreshed).toMatchObject({ status: "duplicate-review", totalCount: 6 });
    expect(service.create({ action: "resolve", requestId: "eighth" }).status).toBe("not-saved");
  } finally { store.close(); }
});
test("a persistence failure rolls back both receipt and expense", () => {
  const store = openStore(":memory:", { fault: boundary => { if (boundary === "expense-row") throw Error("Synthetic disk fault"); } }), service = new Expenses(store);
  try {
    expect(() => service.create({ action: "save", requestId: "rollback", fields, duplicateReview: null })).toThrow("Synthetic disk fault");
    expect(store.readPin().appRevision).toBe(0);
    expect(service.create({ action: "resolve", requestId: "rollback" }).status).toBe("not-saved");
  } finally { store.close(); }
});
test("receipts survive database restart and snapshot recovery validates their historical links", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises"), { tmpdir } = await import("node:os"), { join } = await import("node:path");
  const { validateSnapshot } = await import("../../src/recovery/validate");
  const root = await mkdtemp(join(tmpdir(), "manual-expense-")), path = join(root, "analytics.sqlite"), backup = join(root, "backup.sqlite");
  let store = openStore(path);
  try {
    const service = new Expenses(store), request = { action: "save" as const, requestId: "restart", fields: { ...fields, sourceReference: "restart-bill" }, duplicateReview: null };
    const saved = service.create(request); if (saved.status !== "saved") throw Error("save missing");
    service.create({ ...request, requestId: "identified-restart" });
    store.changeExpense({ entityId: saved.entityId, expectedRevision: saved.revision, reason: "Synthetic void", restoreRevision: null });
    await store.backupTo(backup);
    expect(validateSnapshot(backup).revisions).toBe(2);
    store.close(); store = openStore(path);
    expect(new Expenses(store).create(request)).toMatchObject({ status: "already-saved", revision: 1 });
    const oldPath = join(root, "old.sqlite"); const old = openStore(oldPath, { schemaVersion: 7 }); old.close();
    expect(validateSnapshot(oldPath, true).revisions).toBe(0);
    const upgraded = openStore(oldPath); expect(new Expenses(upgraded).create({ action: "resolve", requestId: "absent" })).toEqual({ status: "not-saved" }); upgraded.close();
  } finally { store.close(); await rm(root, { recursive: true, force: true }); }
});
test("Excel and manual references share identity in both directions, with conflicts blocked", async () => {
  const { workbook, row } = await import("../helpers/expense-fixtures");
  const canonical = { ...fields, category: "Kira", net: "50,00", tax: "0", gross: "50", taxTreatment: "non-recoverable" as const, taxEvidence: "tax-1", sourceReference: "ref-1", supportingReference: "bill-1" };
  for (const first of ["excel", "manual"]) {
    const store = openStore(":memory:"), service = new Expenses(store);
    try {
      if (first === "excel") { const preview = service.preview(await workbook([row])); service.confirm({ previewId: preview.previewId, keepCandidateRows: [] }); }
      else service.create({ action: "save", requestId: "manual-first", fields: canonical, duplicateReview: null });
      expect(service.create({ action: "save", requestId: "manual-second", fields: canonical, duplicateReview: null }).status).toBe("already-present");
      const preview = service.preview(await workbook([row])); expect(preview.rows[0].alreadyPresent).toBe(true);
      expect(service.create({ action: "save", requestId: "different", fields: { ...canonical, category: "Changed" }, duplicateReview: null }).status).toBe("reference-conflict");
      expect(store.readPin().appRevision).toBe(1);
    } finally { store.close(); }
  }
});
test("loss evidence blocks even duplicate acknowledgement; localized grouping and precision remain exact", () => {
  const store = openStore(":memory:"), service = new Expenses(store);
  try {
    for (const [text, expected] of [["1.234", "1234"], ["1,234", "1.234"], ["0,123456789012345678901234567890", "0.12345678901234567890123456789"]]) {
      const saved = service.create({ action: "save", requestId: `amount-${expected.replaceAll(".", "-")}`, fields: { ...fields, net: text, gross: text }, duplicateReview: null });
      expect(saved.status).toBe("saved");
      if (saved.status === "saved") expect(service.query({ period: "2026-01" }).rows.find(row => row.entityId === saved.entityId)?.value.net).toBe(expected);
    }
    for (const text of ["1.25", "-1", "0,1234567890123456789012345678901"]) expect(service.create({ action: "save", requestId: "invalid-amount", fields: { ...fields, net: text, gross: text }, duplicateReview: null }).status).toBe("invalid");
    const loss = { ...fields, date: "2026-01-20", classification: "inventory-loss" as const, loss: { evidence: "unique-loss", recognition: "separate" as const } };
    expect(service.create({ action: "save", requestId: "loss", fields: loss, duplicateReview: null }).status).toBe("saved");
    expect(service.create({ action: "save", requestId: "loss-again", fields: loss, duplicateReview: { fingerprint: "0".repeat(64), keepSeparate: true } })).toMatchObject({ status: "invalid", fieldErrors: { loss: expect.any(String) } });
  } finally { store.close(); }
});
test("manual creation invalidates only relevant completeness and source activation preserves receipts and pinned reports", async () => {
  const { sourcePackage } = await import("../helpers/store-fixtures");
  const store = openStore(":memory:"), service = new Expenses(store);
  try {
    store.importPackage(sourcePackage("a"));
    store.confirmExpensesComplete({ period: "2026-01", reviewedRevision: 0, complete: true, reason: "Synthetic review" });
    store.confirmExpensesComplete({ period: "2026-02", reviewedRevision: 0, complete: true, reason: "Synthetic review" });
    const pin = store.readPin(); store.acceptReport({ id: "manual-pin", pin, calculationVersion: "synthetic-v1", evidence: ["fixture:manual"], output: { literal: "150" } });
    const request = { action: "save" as const, requestId: "activation", fields: { ...fields, classification: "owner-contribution" as const }, duplicateReview: null };
    expect(service.create(request).status).toBe("saved");
    expect(service.query({ period: "2026-01" }).complete).toBe(false);
    expect(service.query({ period: "2026-02" }).complete).toBe(true);
    expect(service.query({ period: "2026-01" }).summary.excluded).toMatchObject([{ classification: "owner-contribution", amount: "1250.5" }]);
    store.importPackage(sourcePackage("b"));
    expect(new Expenses(store).create(request).status).toBe("already-saved");
    expect(store.readPinned(pin).app.filter(row => row.kind === "expense")).toEqual([]);
    expect(service.query({ period: "2026-01" }).rows).toHaveLength(1);
    const labour = service.create({ action: "save", requestId: "labour", fields: { ...fields, date: "2026-01-18", classification: "labour", labourPeriod: "2026-01", taxTreatment: "non-recoverable", taxEvidence: "aggregate" }, duplicateReview: null });
    expect(labour.status).toBe("saved"); expect(service.query({ period: "2026-01" }).summary.labour).toBe("1250.5");
  } finally { store.close(); }
});
test("two store connections converge on one request receipt", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises"), { tmpdir } = await import("node:os"), { join } = await import("node:path");
  const root = await mkdtemp(join(tmpdir(), "manual-two-stores-")), path = join(root, "analytics.sqlite"), first = openStore(path), second = openStore(path);
  try {
    const request = { action: "save" as const, requestId: "shared", fields, duplicateReview: null };
    expect(new Expenses(first).create(request).status).toBe("saved"); expect(new Expenses(second).create(request).status).toBe("already-saved");
    expect(first.readPin().appRevision).toBe(1); expect(second.readPin().appRevision).toBe(1);
  } finally { first.close(); second.close(); await rm(root, { recursive: true, force: true }); }
});
test("receipt insertion failure rolls back and malformed recovery links fail safely", async () => {
  const { mkdtemp, rm } = await import("node:fs/promises"), { tmpdir } = await import("node:os"), { join } = await import("node:path"), { DatabaseSync } = await import("node:sqlite");
  const { validateSnapshot } = await import("../../src/recovery/validate");
  const root = await mkdtemp(join(tmpdir(), "manual-receipt-fault-")), path = join(root, "analytics.sqlite"), store = openStore(path), db = new DatabaseSync(path);
  try {
    db.exec("CREATE TRIGGER synthetic_receipt_fault BEFORE INSERT ON expense_commands BEGIN SELECT RAISE(ABORT,'SYNTHETIC_RECEIPT_FAULT'); END");
    const service = new Expenses(store), request = { action: "save" as const, requestId: "receipt-fault", fields, duplicateReview: null };
    expect(() => service.create(request)).toThrow("SYNTHETIC_RECEIPT_FAULT"); expect(store.readPin().appRevision).toBe(0); expect(service.create({ action: "resolve", requestId: "receipt-fault" }).status).toBe("not-saved");
    db.exec("DROP TRIGGER synthetic_receipt_fault"); service.create(request); expect(validateSnapshot(path).revisions).toBe(1);
    const originalDigest = db.prepare("SELECT digest FROM expense_commands").get()!.digest;
    db.exec("DROP TRIGGER immutable_expense_command_update"); db.prepare("UPDATE expense_commands SET digest=?").run("0".repeat(64));
    db.exec("CREATE TRIGGER immutable_expense_command_update BEFORE UPDATE ON expense_commands BEGIN SELECT RAISE(ABORT,'IMMUTABLE_COMMAND'); END");
    expect(() => validateSnapshot(path)).toThrow();
    db.exec("DROP TRIGGER immutable_expense_command_update"); db.prepare("UPDATE expense_commands SET digest=?").run(originalDigest!);
    db.exec("CREATE TRIGGER immutable_expense_command_update BEFORE UPDATE ON expense_commands BEGIN SELECT RAISE(ABORT,'IMMUTABLE_COMMAND'); END");
    expect(validateSnapshot(path).revisions).toBe(1);
    db.exec("DROP TRIGGER immutable_expense_command_delete; DELETE FROM expense_commands");
    db.exec("CREATE TRIGGER immutable_expense_command_delete BEFORE DELETE ON expense_commands BEGIN SELECT RAISE(ABORT,'IMMUTABLE_COMMAND'); END");
    expect(() => validateSnapshot(path)).toThrow();
  } finally { db.close(); store.close(); await rm(root, { recursive: true, force: true }); }
});
test("receipt-only changes schedule encrypted backup and restore original Excel identification after void", async () => {
  const { mkdtemp, mkdir, rm } = await import("node:fs/promises"), { tmpdir } = await import("node:os"), { join } = await import("node:path");
  const { Recovery } = await import("../../src/recovery/backup"), { generateRecoveryKey } = await import("../../src/recovery/keys"), { workbook, row } = await import("../helpers/expense-fixtures");
  const root = await mkdtemp(join(tmpdir(), "manual-encrypted-")), destination = join(root, "retained"); await mkdir(destination);
  const key = generateRecoveryKey(); let recovery = await Recovery.open(join(root, "original.sqlite"), { destination, key });
  try {
    const service = new Expenses(recovery.store!), preview = service.preview(await workbook([row])); service.confirm({ previewId: preview.previewId, keepCandidateRows: [] });
    await recovery.backupNow(); expect(recovery.status().state).toBe("ready");
    const request = { action: "save" as const, requestId: "excel-identified", fields: { ...fields, category: "Kira", net: "50,00", gross: "50", sourceReference: "ref-1", supportingReference: "bill-1", taxTreatment: "non-recoverable" as const, taxEvidence: "tax-1" }, duplicateReview: null };
    const identified = service.create(request); expect(identified.status).toBe("already-present"); expect(recovery.status().state).toBe("pending");
    if (identified.status !== "already-present") throw Error("identification missing");
    recovery.store!.changeExpense({ entityId: identified.entityId, expectedRevision: identified.revision, restoreRevision: null, reason: "Synthetic void" });
    const status = await recovery.backupNow(), latest = status.backups.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    await recovery.close(); recovery = await Recovery.open(join(root, "restored.sqlite"));
    const restore = await recovery.prepareRestore(join(destination, `${latest.id}.esmerbackup`), key); await recovery.confirmRestore(restore.token);
    expect(new Expenses(recovery.store!).create(request)).toMatchObject({ status: "already-saved", revision: identified.revision });
    expect(new Expenses(recovery.store!).query({ period: "2026-01" }).rows[0].value).toMatchObject({ voided: true });
  } finally { await recovery.close(); await rm(root, { recursive: true, force: true }); }
});
test("malformed enum arrays are rejected at IPC and canonical persistence boundaries", async () => {
  const { validExpenseRequest } = await import("../../src/desktop/requests"), { validFields } = await import("../../src/expenses/validation");
  const store = openStore(":memory:"), service = new Expenses(store);
  try {
    for (const malformed of [{ ...fields, taxEvidence: "synthetic-tax", taxTreatment: ["unknown"] }, { ...fields, classification: "inventory-loss", loss: { evidence: "synthetic-loss", recognition: ["already-in-cost"] } }]) {
      const request = { action: "save", requestId: "enum-array", fields: malformed, duplicateReview: null };
      expect(validExpenseRequest("createExpense", request)).toBe(false);
      expect(validFields({ ...malformed, net: "1250.5", gross: "1250.5" })).toBe(false);
      expect(() => service.create(request as unknown as Parameters<Expenses["create"]>[0])).toThrow();
      expect(() => store.appendRevision({ kind: "expense", entityId: "malformed-enum", value: { ...malformed, net: "1250.5", gross: "1250.5", format: "expense-v1", origin: { kind: "manual", requestId: "enum-array" }, reason: "Synthetic", evidence: "synthetic", replacesRevision: null, voided: false } } as unknown as Parameters<typeof store.appendRevision>[0])).toThrow();
      expect(service.create({ action: "resolve", requestId: "enum-array" }).status).toBe("not-saved"); expect(store.readPin().appRevision).toBe(0);
    }
    service.create({ action: "save", requestId: "strict-unknown", fields: { ...fields, taxEvidence: "synthetic-tax" }, duplicateReview: null });
    expect(service.query({ period: "2026-01" }).summary).toMatchObject({ expenses: null, coverage: "incomplete", reasons: ["UNKNOWN_TAX"] });
  } finally { store.close(); }
});
