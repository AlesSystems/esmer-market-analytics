export const APPLICATION_ID = 1163087186;
export const SCHEMA_VERSION = 5;
export const schema = `
CREATE TABLE datasets (
  id TEXT PRIMARY KEY, lineage TEXT NOT NULL, manifest_json TEXT NOT NULL CHECK(json_valid(manifest_json)),
  warnings_json TEXT NOT NULL CHECK(json_valid(warnings_json)), summary_json TEXT NOT NULL CHECK(json_valid(summary_json))
) STRICT;
CREATE TABLE package_history (hash TEXT PRIMARY KEY, activated INTEGER NOT NULL CHECK(activated IN (0,1))) STRICT;
CREATE TABLE import_batches (
  id TEXT PRIMARY KEY, dataset_id TEXT, state TEXT NOT NULL CHECK(state IN ('staged','validated','active','failed','cancelled')),
  error_code TEXT, created_at TEXT NOT NULL, difference_json TEXT CHECK(difference_json IS NULL OR json_valid(difference_json))
) STRICT;
CREATE TABLE source_suppliers (dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE, id TEXT NOT NULL, ordinal INTEGER NOT NULL, PRIMARY KEY(dataset_id,id)) STRICT;
CREATE TABLE source_documents (
  dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE, id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('sale','purchase','customer-return','supplier-return')), date TEXT NOT NULL, supplier_id TEXT, ordinal INTEGER NOT NULL,
  PRIMARY KEY(dataset_id,id), FOREIGN KEY(dataset_id,supplier_id) REFERENCES source_suppliers(dataset_id,id)
) STRICT;
CREATE TABLE source_lines (
  dataset_id TEXT NOT NULL REFERENCES datasets(id) ON DELETE CASCADE, id TEXT NOT NULL, document_id TEXT NOT NULL,
  quantity TEXT NOT NULL, net TEXT NOT NULL, cost TEXT, ordinal INTEGER NOT NULL, PRIMARY KEY(dataset_id,id),
  FOREIGN KEY(dataset_id,document_id) REFERENCES source_documents(dataset_id,id)
) STRICT;
CREATE TABLE active_dataset (singleton INTEGER PRIMARY KEY CHECK(singleton=1), dataset_id TEXT NOT NULL REFERENCES datasets(id)) STRICT;
CREATE TABLE rollback_dataset (singleton INTEGER PRIMARY KEY CHECK(singleton=1), dataset_id TEXT NOT NULL REFERENCES datasets(id)) STRICT;
CREATE TABLE app_revisions (
  revision INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL CHECK(kind IN ('expense','adjustment','confirmation','setting')),
  entity_id TEXT NOT NULL, value_json TEXT NOT NULL CHECK(json_valid(value_json)), created_at TEXT NOT NULL
) STRICT;
CREATE TABLE adjustment_targets (
  revision INTEGER PRIMARY KEY REFERENCES app_revisions(revision), dataset_id TEXT NOT NULL REFERENCES datasets(id),
  source_kind TEXT NOT NULL CHECK(source_kind IN ('document','line')), source_id TEXT NOT NULL, fingerprint TEXT NOT NULL
) STRICT;
CREATE TABLE report_versions (
  id TEXT PRIMARY KEY, dataset_id TEXT REFERENCES datasets(id), app_revision INTEGER REFERENCES app_revisions(revision),
  calculation_version TEXT NOT NULL, content_json TEXT NOT NULL CHECK(json_valid(content_json))
) STRICT;
CREATE TABLE evidence_references (
  id INTEGER PRIMARY KEY, report_id TEXT REFERENCES report_versions(id), batch_id TEXT REFERENCES import_batches(id),
  identity TEXT NOT NULL, CHECK((report_id IS NULL) != (batch_id IS NULL))
) STRICT;
CREATE TRIGGER immutable_revision_update BEFORE UPDATE ON app_revisions BEGIN SELECT RAISE(ABORT,'IMMUTABLE_REVISION'); END;
CREATE TRIGGER immutable_revision_delete BEFORE DELETE ON app_revisions BEGIN SELECT RAISE(ABORT,'IMMUTABLE_REVISION'); END;
CREATE TRIGGER immutable_report_update BEFORE UPDATE ON report_versions BEGIN SELECT RAISE(ABORT,'IMMUTABLE_REPORT'); END;
CREATE TRIGGER immutable_report_delete BEFORE DELETE ON report_versions BEGIN SELECT RAISE(ABORT,'IMMUTABLE_REPORT'); END;
`;

export const salesMigration = `ALTER TABLE source_documents ADD COLUMN sales_json TEXT CHECK(sales_json IS NULL OR json_valid(sales_json));
ALTER TABLE source_lines ADD COLUMN sales_json TEXT CHECK(sales_json IS NULL OR json_valid(sales_json));`;

export const businessMigration = `ALTER TABLE source_documents ADD COLUMN purchasing_json TEXT CHECK(purchasing_json IS NULL OR json_valid(purchasing_json));
ALTER TABLE source_lines ADD COLUMN business_json TEXT CHECK(business_json IS NULL OR json_valid(business_json));
ALTER TABLE source_suppliers ADD COLUMN name TEXT;`;

export const expenseMigration = `CREATE TABLE expense_batches (
  batch_id TEXT PRIMARY KEY, created_at TEXT NOT NULL, count INTEGER NOT NULL,
  first_revision INTEGER NOT NULL, last_revision INTEGER NOT NULL
) STRICT;
CREATE TRIGGER immutable_expense_batch_update BEFORE UPDATE ON expense_batches BEGIN SELECT RAISE(ABORT,'IMMUTABLE_BATCH'); END;
CREATE TRIGGER immutable_expense_batch_delete BEFORE DELETE ON expense_batches BEGIN SELECT RAISE(ABORT,'IMMUTABLE_BATCH'); END;`;
