import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { sourcePackage } from "../helpers/store-fixtures";

test("live refresh reads the current manifest without loading source facts", () => {
  const store = openStore(":memory:");
  try {
    expect(store.activeManifest()).toBeNull();
    store.importPackage(sourcePackage("a"));
    const first = store.readSnapshot();
    expect(store.activeManifest()).toEqual({ datasetId: first.pin.datasetId, metadata: first.metadata });
    store.importPackage(sourcePackage("b"));
    const second = store.readSnapshot();
    expect(store.activeManifest()).toEqual({ datasetId: second.pin.datasetId, metadata: second.metadata });
  } finally { store.close(); }
});
