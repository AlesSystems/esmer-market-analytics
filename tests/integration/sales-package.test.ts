import { expect, test } from "vitest";
import { readPackage } from "../../src/source/package";
import { openStore } from "../../src/store/store";
import { sourcePackage } from "../helpers/store-fixtures";

import { salesPackage, salesRecords } from "../helpers/sales-fixtures";

test("typed synthetic sales round-trips through package and durable store without changing legacy facts", () => {
  const store = openStore(":memory:");
  try {
    expect(store.importPackage(sourcePackage("a")).status).toBe("active");
    const legacy = store.readSnapshot();
    expect(Object.hasOwn(legacy.records.documents[0], "sales")).toBe(false);
    const bytes = salesPackage();
    const parsed = readPackage(bytes);
    expect(parsed.ok && parsed.metadata.mappingVersion).toBe("synthetic-sales-v1");
    expect(store.importPackage(bytes).status).toBe("active");
    expect(store.readSnapshot().records).toEqual(salesRecords);
    expect(store.readPinned(legacy.pin)).toEqual(legacy);
  } finally { store.close(); }
});
