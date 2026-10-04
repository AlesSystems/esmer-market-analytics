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
