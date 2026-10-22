import { expect, test } from "vitest";
import { openStore } from "../../src/store/store";
import { writeRawEstimatePackage } from "../../src/source/raw-package";
import type { SqlSnapshot } from "../../src/source/sql-server";
import { rawSnapshot } from "../helpers/raw-fixture";
import { sourcePackage } from "../helpers/store-fixtures";

const months = (first: number) => Array.from({length: 6}, (_, i) => `2025-${String(first + i).padStart(2, "0")}`);
function multiMonth(first: number, offset: number): SqlSnapshot {
  const base = rawSnapshot(), header = base.headers[0], line = base.lines[0];
  const periods = months(first);
  const headers = periods.map((period, i) => ({...header, ID: String(offset + i), FIS_TARIHI: `${period}-15T10:00:00.000`}));
  const lines = periods.map((_, i) => ({...line, ID: String(offset + 100 + i), FIS: String(offset + i), STOK: String(1 + i % 2), BELGE_TARIHINDEKI_SON_ALIS_FIYATI: "40"}));
  const products = [{ID: "1", NAME: "Süt 1 L", CATEGORY: "Süt ürünleri", UNIT: "adet"}, {ID: "2", NAME: "Ekmek", CATEGORY: null, UNIT: null}];
  const last = periods.at(-1)!;
  return {...base, from: `${periods[0]}-01`, to: `${last}-${new Date(Date.UTC(Number(last.slice(0, 4)), Number(last.slice(5)), 0)).getUTCDate()}`, headers, lines, products};
}

test("a newer multi-month estimate package keeps expenses, settings, report history and accepted reports", () => {
  const store = openStore(":memory:");
  try {
    store.importPackage(sourcePackage("a"));
    store.appendRevision({kind: "expense", entityId: "expense-1", value: {net: "50", date: "2025-06-15", reason: "Synthetic rent", evidence: "fixture:expense"}});
    store.appendRevision({kind: "setting", entityId: "currency", value: {currency: "TRY", reason: "TRY only", evidence: "fixture:setting"}});
    const pinned = store.readSnapshot();
    store.acceptReport({id: "report-1", pin: pinned.pin, calculationVersion: "synthetic-v1", evidence: ["fixture:a"], output: {net: "150"}});
    const first = store.importSourcePreview(writeRawEstimatePackage(multiMonth(4, 1000), "fixture:monthly", "month-2025-09"));
    expect(first.status).toBe("preview-imported");
    const before = {snapshot: store.readSnapshot(), revisions: store.revisionHistory(), expenses: store.expenseBatches(), history: store.history(), reports: store.listMonthlyReports("2025-01"), report: store.readReport("report-1")};
    const newer = store.importSourcePreview(writeRawEstimatePackage(multiMonth(5, 2000), "fixture:monthly", "month-2025-10"));
    expect(newer.status).toBe("preview-imported");
    if (newer.status !== "preview-imported" || first.status !== "preview-imported") throw Error("import failed");
    expect(newer.hash).not.toBe(first.hash);
    expect({snapshot: store.readSnapshot(), revisions: store.revisionHistory(), expenses: store.expenseBatches(), history: store.history(), reports: store.listMonthlyReports("2025-01"), report: store.readReport("report-1")}).toEqual(before);
    const workspace = store.querySourceWorkspace({hash: null, period: null, view: "overview", scope: "all", documentType: null, productId: null, documentId: null, offset: 0});
    expect(workspace).toMatchObject({status: "source-workspace", sourceFormat: "sql-backup-estimate-v2"});
    const lines = store.readSourcePreview({stream: "lines", offset: 0});
    if (lines.status !== "source-preview") throw Error("missing preview");
    expect(lines.hash).toBe(newer.hash);
    expect(lines.metadata).toMatchObject({from: "2025-05-01", to: "2025-10-31"});
    expect(lines.total).toBe(6);
    expect(store.importSourcePreview(Buffer.from("{}"))).toEqual({status: "failed", code: "INVALID_PACKAGE"});
    expect(store.readSourcePreview({stream: "lines", offset: 0})).toEqual(lines);
  } finally { store.close(); }
});
