import { DatabaseSync, constants } from "node:sqlite";

const columns: Record<string, readonly string[]> = {
  sqlite_master: ["name", "type"],
  synthetic_marker: ["version"], documents: ["ROWID", "id", "kind", "date", "supplierId"],
  lines: ["ROWID", "id", "documentId", "quantity", "net", "cost"], suppliers: ["ROWID", "id"],
};
export function openSyntheticReadOnly(path: string): DatabaseSync {
  const db = new DatabaseSync(path, { readOnly: true, enableDoubleQuotedStringLiterals: false, allowExtension: false, timeout: 50 });
  try {
    db.setAuthorizer((action, table, column) => {
      if (action === constants.SQLITE_SELECT || action === constants.SQLITE_TRANSACTION) return constants.SQLITE_OK;
      if (action === constants.SQLITE_READ && table && column && columns[table]?.includes(column)) return constants.SQLITE_OK;
      return constants.SQLITE_DENY;
    });
    db.exec("BEGIN");
    const tables = db.prepare("SELECT name, type FROM sqlite_master WHERE name IN ('synthetic_marker', 'documents', 'lines', 'suppliers')").all();
    if (tables.length !== 4 || tables.some(table => table.type !== "table")) throw new Error("INVALID_SOURCE");
    const marker = db.prepare("SELECT version FROM synthetic_marker LIMIT 2").all();
    if (marker.length !== 1 || marker[0].version !== "synthetic-relational-v1") throw new Error("INVALID_SOURCE");
    return db;
  } catch (error) { db.close(); throw new Error(error instanceof Error && "errcode" in error && error.errcode === 5 ? "SOURCE_BUSY" : "INVALID_SOURCE"); }
}
