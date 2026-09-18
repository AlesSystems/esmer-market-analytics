import type { DatabaseSync } from "node:sqlite";
import { APPLICATION_ID, SCHEMA_VERSION, schema } from "./schema";

export function migrate(db: DatabaseSync, target = SCHEMA_VERSION) {
  const version = Number(db.prepare("PRAGMA user_version").get()!.user_version);
  const applicationId = Number(db.prepare("PRAGMA application_id").get()!.application_id);
  const empty = !db.prepare("SELECT name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' LIMIT 1").get();
  if (![1, 2].includes(target) || version > target || (version === 0 ? !empty || applicationId !== 0 : applicationId !== APPLICATION_ID)) throw new Error("UNSUPPORTED_STORE");
  db.exec("PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000");
  if (version === target) return;
  db.exec("BEGIN IMMEDIATE");
  try {
    if (version === 0) db.exec(schema);
    if (version < 2 && target >= 2) db.exec("CREATE INDEX app_entity_revision ON app_revisions(kind,entity_id,revision); CREATE INDEX batch_dataset ON import_batches(dataset_id)");
    db.exec(`PRAGMA application_id=${APPLICATION_ID}; PRAGMA user_version=${target}; COMMIT`);
  } catch (error) { db.exec("ROLLBACK"); throw error; }
}
