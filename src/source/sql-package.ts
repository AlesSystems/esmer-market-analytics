import { extractSqlServer, type SqlServerConfig } from "./sql-server";

export async function prepareSqlCandidate(config: SqlServerConfig, signal?: AbortSignal): Promise<Uint8Array> {
  await extractSqlServer(config, signal);
  throw new Error("UNSUPPORTED_MAPPING");
}
