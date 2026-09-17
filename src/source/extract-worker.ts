import { parentPort, workerData } from "node:worker_threads";
import { statSync } from "node:fs";
import { openSyntheticReadOnly } from "./connection.ts";

const port = parentPort!;
let db: ReturnType<typeof openSyntheticReadOnly> | undefined;
let stream = 0;
let cursor: bigint | null = null;
let queryCount = 0;
let rowCount = 0;
const queries = [
  ["documents", "SELECT rowid AS extractionRowId, id, kind, date, supplierId FROM documents WHERE (? IS NULL OR rowid > ?) ORDER BY rowid LIMIT ?"],
  ["lines", "SELECT rowid AS extractionRowId, id, documentId, quantity, net, cost FROM lines WHERE (? IS NULL OR rowid > ?) ORDER BY rowid LIMIT ?"],
  ["suppliers", "SELECT rowid AS extractionRowId, id FROM suppliers WHERE (? IS NULL OR rowid > ?) AND id IN (SELECT supplierId FROM documents WHERE kind IN ('purchase', 'supplier-return')) ORDER BY rowid LIMIT ?"],
] as const;
function close() { db?.close(); db = undefined; port.close(); }
try {
  const stat = statSync(workerData.path);
  if (!stat.isFile() || stat.size > 64 * 1024 * 1024) throw new Error("INVALID_SOURCE");
  db = openSyntheticReadOnly(workerData.path);
  port.on("message", () => {
    try {
      if (stream === queries.length) { port.postMessage({ done: true }); close(); return; }
      if (++queryCount > 403) throw new Error("QUERY_LIMIT");
      const [name, sql] = queries[stream];
      const statement = db!.prepare(sql); statement.setReadBigInts(true);
      const rows = statement.all(cursor, cursor, 256);
      const records = rows.map(row => { const record = { ...row }; delete record.extractionRowId; return record; });
      rowCount += records.length;
      if (rowCount > 100_000 || Buffer.byteLength(JSON.stringify(records)) > 256 * 1024) throw new Error("ROW_LIMIT");
      if (rows.length) cursor = rows.at(-1)!.extractionRowId as bigint;
      if (records.length < 256) { stream++; cursor = null; }
      port.postMessage({ stream: name, records });
    } catch (error) {
      const retryable = error instanceof Error && "errcode" in error && error.errcode === 5;
      port.postMessage({ error: retryable ? "SOURCE_BUSY" : "EXTRACTION_FAILED" }); close();
    }
  });
  port.postMessage({ ready: true });
} catch (error) { port.postMessage({ error: error instanceof Error && error.message === "SOURCE_BUSY" ? "SOURCE_BUSY" : "EXTRACTION_FAILED" }); close(); }
