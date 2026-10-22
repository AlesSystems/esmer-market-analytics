import { randomUUID } from "node:crypto";
import { extractSqlServer } from "../src/source/sql-server.ts";
import { writeRawPackage } from "../src/source/raw-package.ts";
import { readConnectionFile, writeNewPrivateFile } from "./private-files.ts";

try {
  const [configPath, outputPath, ...extra] = process.argv.slice(2);
  if (!configPath || !outputPath || extra.length) throw Error("INVALID_ARGUMENTS");
  const config = await readConnectionFile(configPath);
  const snapshot = await extractSqlServer(config);
  await writeNewPrivateFile(outputPath, writeRawPackage(snapshot, config.lineage, randomUUID()));
  process.stdout.write("SQL_BACKUP_PREVIEW_PREPARED\n");
} catch {
  process.stderr.write("SQL_BACKUP_PREPARATION_FAILED\n");
  process.exitCode = 1;
}
