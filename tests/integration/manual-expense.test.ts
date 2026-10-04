import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { Expenses } from "../../src/expenses/import";
const fields = { date: "2026-01-15", paymentDate: "2026-02-01", category: "Elektrik", classification: "operating-expense" as const, net: "1.250,50", tax: "0", gross: "1.250,50", taxTreatment: "unknown" as const, taxEvidence: null, supportingReference: null, sourceReference: null, labourPeriod: null, loss: null };
test("manual creation is exact, app-owned and survives a lost reply without another revision", () => {
  const store = openStore(":memory:"), service = new Expenses(store);
  try {
    const request = { action: "save" as const, requestId: "manual-1", fields, duplicateReview: null };
    const saved = service.create(request);
    expect(saved).toMatchObject({ status: "saved", revision: 1, incurredPeriod: "2026-01" });
    expect(new Expenses(store).create({ action: "resolve", requestId: "manual-1" })).toMatchObject({ status: "already-saved", revision: 1 });
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
