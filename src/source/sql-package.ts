import { randomUUID } from "node:crypto";
import { extractSqlServer, type SqlServerConfig } from "./sql-server";
import { writeRawPackage } from "./raw-package";

export async function prepareSqlCandidate(config: SqlServerConfig, signal?: AbortSignal): Promise<Uint8Array> {
  const snapshot = await extractSqlServer(config, signal);
  return writeRawPackage(snapshot, config.lineage, randomUUID());
}
