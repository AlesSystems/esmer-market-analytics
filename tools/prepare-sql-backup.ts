import { open, link, unlink } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { extractSqlServer, parseSqlServerConfig } from "../src/source/sql-server.ts";
import { writeRawPackage } from "../src/source/raw-package.ts";

// Preparation runs only against the user's isolated restored copy. The desktop never restores SQL databases.
try {
  const [configPath, outputPath, ...extra] = process.argv.slice(2);
  if (!configPath || !outputPath || extra.length) throw Error("INVALID_ARGUMENTS");
  const file = await open(configPath, "r");
  let config;
  try {
    const stat = await file.stat();
    if (!stat.isFile() || stat.size > 16 * 1024 || process.platform !== "win32" && (stat.mode & 0o077) !== 0) throw Error("INVALID_CONFIG_FILE");
    config = parseSqlServerConfig(JSON.parse(await file.readFile("utf8")));
  } finally { await file.close(); }
  const snapshot = await extractSqlServer(config);
  const bytes = writeRawPackage(snapshot, config.lineage, randomUUID());
  const temporary = `${outputPath}.${randomUUID()}.tmp`;
  const output = await open(temporary, "wx", 0o600);
  try {
    try { await output.writeFile(bytes); await output.sync(); } finally { await output.close(); }
    await link(temporary, outputPath);
  } finally { await unlink(temporary); }
  process.stdout.write("SQL_BACKUP_PREVIEW_PREPARED\n");
} catch {
  process.stderr.write("SQL_BACKUP_PREPARATION_FAILED\n");
  process.exitCode = 1;
}
