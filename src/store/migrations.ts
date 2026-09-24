import { DatabaseSync } from "node:sqlite";
import { APPLICATION_ID, SCHEMA_VERSION, schema, salesMigration, businessMigration, expenseMigration, recoveryMigration } from "./schema";

export function migrate(db: DatabaseSync, target = SCHEMA_VERSION) {
  const version = Number(db.prepare("PRAGMA user_version").get()!.user_version);
  const applicationId = Number(db.prepare("PRAGMA application_id").get()!.application_id);
  const empty = !db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get();
  if (![1, 2, 3, 4, 5, 6].includes(target) || version > target || (version === 0 ? !empty || applicationId !== 0 : applicationId !== APPLICATION_ID)) throw new Error("UNSUPPORTED_STORE");
  if (version !== 0) {
    const expected = new DatabaseSync(":memory:");
    try {
      expected.exec(schema);
      if (version >= 3) expected.exec(salesMigration);
      if (version >= 4) expected.exec(businessMigration);
      if (version >= 5) expected.exec(expenseMigration);
      if (version >= 6) expected.exec(recoveryMigration);
      const tables = expected.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      for (const { name } of tables) {
        const actual = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(String(name));
        const definition = expected.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(String(name));
        if (actual?.sql !== definition?.sql) throw new Error("UNSUPPORTED_STORE");
      }
      for (const { name, sql } of expected.prepare("SELECT name,sql FROM sqlite_master WHERE type='trigger'").all()) {
        if (db.prepare("SELECT sql FROM sqlite_master WHERE type='trigger' AND name=?").get(String(name))?.sql !== sql) throw new Error("UNSUPPORTED_STORE");
      }
      if (db.prepare("PRAGMA quick_check").get()?.quick_check !== "ok" || db.prepare("PRAGMA foreign_key_check").all().length) throw new Error("UNSUPPORTED_STORE");
    } finally { expected.close(); }
  }
  db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000");
  if (version === target) return;
  db.exec("BEGIN IMMEDIATE");
  try {
    if (version === 0) db.exec(schema);
    if (version < 2 && target >= 2) db.exec("CREATE INDEX app_entity_revision ON app_revisions(kind,entity_id,revision); CREATE INDEX batch_dataset ON import_batches(dataset_id)");
    if (version < 3 && target >= 3) db.exec(salesMigration);
    if (version < 4 && target >= 4) db.exec(businessMigration);
    if (version < 5 && target >= 5) db.exec(expenseMigration);
    if (version < 6 && target >= 6) db.exec(recoveryMigration);
    db.exec(`PRAGMA application_id=${APPLICATION_ID}; PRAGMA user_version=${target}; COMMIT`);
  } catch (error) { if (db.isTransaction) db.exec("ROLLBACK"); throw error; }
}
