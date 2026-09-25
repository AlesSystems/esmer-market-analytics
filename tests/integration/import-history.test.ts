import { test, expect } from "vitest";
import { openStore } from "../../src/store/store";
import { businessPackage } from "../helpers/business-fixtures";

test("recent import history exposes persisted outcomes without changing the active dataset", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(businessPackage());
    const before = store.readSnapshot().pin;
    store.importPackage(new TextEncoder().encode("invalid"));
    const availability = store.availability();
    expect(availability).toMatchObject({ status: "ready", store: "loaded", recentImports: [
      { state: "failed", errorCode: "INVALID_PACKAGE" },
      { state: "active", cutoff: "2025-09-30" },
    ] });
    expect(store.readSnapshot().pin).toEqual(before);
  } finally { store.close(); }
});
