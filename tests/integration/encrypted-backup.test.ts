import { afterEach, expect, test } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { openStore } from "../../src/store/store";
const directories: string[] = [];
afterEach(() => { for (const path of directories.splice(0)) rmSync(path, {recursive:true,force:true}); });
test("a committed app change retains pending backup intent after the store restarts", () => {
  const directory = mkdtempSync(join(tmpdir(), "encrypted-backup-")); directories.push(directory);
  const path = join(directory, "analytics.sqlite");
  const store = openStore(path);
  store.appendRevision({kind:"setting",entityId:"currency",value:{currency:"TRY",reason:"Recovery test",evidence:"fixture:recovery"}});
  store.close();
  const db = new DatabaseSync(path);
  try {
    const table = db.prepare("SELECT name FROM sqlite_master WHERE name='recovery_state'").get();
    expect(table, "business commits need durable backup intent").toBeDefined();
    const state = db.prepare("SELECT changed,verified FROM recovery_state WHERE singleton=1").get();
    expect(state?.changed).toBeGreaterThan(Number(state?.verified));
  } finally { db.close(); }
});
