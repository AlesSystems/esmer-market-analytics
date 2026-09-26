import { safeStorage } from "electron";
import { join } from "node:path";
import { readPackageFile } from "./package-file";
import { durableWrite } from "../recovery/files";
import { parseSqlServerConfig, type SqlServerConfig } from "../source/sql-server";

export type SavedLiveConfig = {config: SqlServerConfig; enabled: boolean};
function protectedStorage() {
  if (!safeStorage.isEncryptionAvailable() || process.platform === "linux" && safeStorage.getSelectedStorageBackend() === "basic_text") throw new Error("LIVE_CONFIG_UNAVAILABLE");
}
export async function readLiveConfigFile(path: string): Promise<SqlServerConfig> {
  try { return parseSqlServerConfig(JSON.parse(Buffer.from(await readPackageFile(path, 16_384)).toString("utf8"))); }
  catch { throw new Error("LIVE_CONFIG_UNAVAILABLE"); }
}
export async function loadLiveConfig(userData: string): Promise<SavedLiveConfig | null> {
  try {
    const bytes = await readPackageFile(join(userData, "live-source.enc"), 32_768);
    protectedStorage();
    const saved = JSON.parse(safeStorage.decryptString(Buffer.from(bytes)));
    if (!saved || Object.keys(saved).sort().join() !== "config,enabled" || typeof saved.enabled !== "boolean") throw new Error();
    return {config: parseSqlServerConfig(saved.config), enabled: saved.enabled};
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("LIVE_CONFIG_UNAVAILABLE");
  }
}
export async function saveLiveConfig(userData: string, saved: SavedLiveConfig): Promise<void> {
  try {
    protectedStorage();
    const config = parseSqlServerConfig(saved.config);
    if (typeof saved.enabled !== "boolean") throw new Error();
    await durableWrite(join(userData, "live-source.enc"), safeStorage.encryptString(JSON.stringify({config, enabled: saved.enabled})));
  } catch { throw new Error("LIVE_CONFIG_UNAVAILABLE"); }
}
