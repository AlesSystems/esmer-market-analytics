import { DatabaseSync } from "node:sqlite";

export function createSyntheticSource(path: string) {
  const db = new DatabaseSync(path);
  db.exec(`
    CREATE TABLE synthetic_marker (version TEXT NOT NULL);
    INSERT INTO synthetic_marker VALUES ('synthetic-relational-v1');
    CREATE TABLE documents (id TEXT PRIMARY KEY, kind TEXT, date TEXT, supplierId TEXT, customerName TEXT);
    CREATE TABLE lines (id TEXT PRIMARY KEY, documentId TEXT, quantity TEXT, net TEXT, cost TEXT);
    CREATE TABLE suppliers (id TEXT PRIMARY KEY, privateName TEXT);
    CREATE TABLE customers (secret TEXT);
    INSERT INTO documents VALUES ('9007199254740993', 'sale', '2026-01-01', NULL, 'PRIVATE_CUSTOMER_SENTINEL');
    INSERT INTO documents VALUES ('purchase-1', 'purchase', '2026-01-02', 'supplier-1', NULL);
    INSERT INTO lines VALUES ('line-1', '9007199254740993', '0.125000000000000001', '12345678901234567890.123456789', NULL);
    INSERT INTO suppliers VALUES ('supplier-1', 'PRIVATE_SUPPLIER_SENTINEL');
    INSERT INTO suppliers VALUES ('customer-only', 'PRIVATE_CUSTOMER_SENTINEL');
    INSERT INTO customers VALUES ('PRIVATE_PAYROLL_SENTINEL');
  `);
  db.close();
}
export const metadata = {
  lineage: "synthetic-test", extractionId: "synthetic-batch-1", extractedAt: "2026-01-03T00:00:00.000Z",
  cutoff: "2026-01-02", coverage: { from: "2026-01-01", to: "2026-01-02", complete: false },
};
