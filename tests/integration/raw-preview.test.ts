import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { readRawPackage, writeRawPackage } from "../../src/source/raw-package";
import { rawSnapshot } from "../helpers/raw-fixture";
import { sourcePackage } from "../helpers/store-fixtures";

test("imports exact raw values without changing the financial dataset or app history", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(sourcePackage("a"));
    const before = store.readSnapshot();
    const bytes = writeRawPackage(rawSnapshot(), "fixture:raw", "batch-1");
    expect(store.importSourcePreview(bytes).status).toBe("preview-imported");
    expect(store.readSnapshot()).toEqual(before);
    const result = store.readSourcePreview({ stream: "headers", offset: 0 });
    expect(result.status).toBe("source-preview");
    if (result.status !== "source-preview") throw Error("missing preview");
    expect(result.rows[0].GENELTOPLAM).toBe("123.4567890123456789");
    expect(result.metadata.provenance).toBe("isolated-sql-backup");
    expect(store.importSourcePreview(Buffer.from("{}"))).toEqual({status: "failed", code: "INVALID_PACKAGE"});
    expect(store.readSourcePreview({stream: "headers", offset: 0})).toEqual(result);
  } finally { store.close(); }
});

test("rejects private columns, orphan IDs and financial type mismatches", () => {
  for (const mutate of [
    (s: ReturnType<typeof rawSnapshot>) => { s.headers[0].CUSTOMER_NAME = "private"; },
    (s: ReturnType<typeof rawSnapshot>) => { s.lines[0].FIS = "999"; },
    (s: ReturnType<typeof rawSnapshot>) => { s.lines[0].FIS_TURU = "35"; },
  ]) {
    const snapshot = rawSnapshot(); mutate(snapshot);
    expect(() => writeRawPackage(snapshot, "fixture:raw", "batch-1")).toThrow();
  }
  expect(readRawPackage(Buffer.from("{}"))).toBeNull();
});
