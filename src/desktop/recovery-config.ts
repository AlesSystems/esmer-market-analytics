import { safeStorage } from "electron";
import { readFile, realpath, rm } from "node:fs/promises";
import { dirname, isAbsolute, join, relative, sep } from "node:path";
import { decodeRecoveryKey, encodeRecoveryKey } from "../recovery/keys";
import type { RecoveryConfig } from "../recovery/contracts";
import { durableWrite, syncDirectory } from "../recovery/files";
import { readPackageFile } from "./package-file";

function protectedStorage(): boolean {
  return safeStorage.isEncryptionAvailable() && (process.platform !== "linux" || safeStorage.getSelectedStorageBackend() !== "basic_text");
}

export function outsideUserData(path: string, userData: string): boolean {
  if (!isAbsolute(path)) return false;
  const rest = relative(userData, path);
  return rest === ".." || rest.startsWith(`..${sep}`) || isAbsolute(rest);
}

export async function validRecoveryLocations(destination: string, keyFile: string, userData: string): Promise<boolean> {
  const [target, keyParent, appData] = await Promise.all([realpath(destination), realpath(dirname(keyFile)), realpath(userData)]);
  if (!outsideUserData(target, appData) || !outsideUserData(keyParent, appData)) return false;
  return outsideUserData(keyParent, target);
}

export async function readRecoveryKeyFile(path: string): Promise<Buffer> {
  return decodeRecoveryKey(await readPackageFile(path, 1024));
}

export async function loadRecoveryConfig(userData: string): Promise<RecoveryConfig | null> {
  const file = join(userData, "recovery-config.json");
  let raw: string;
  try { raw = await readFile(file, "utf8"); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw new Error("RECOVERY_CONFIG_UNAVAILABLE");
  }
  try {
    const saved = JSON.parse(raw);
    if (!protectedStorage() || typeof saved.destination !== "string" || !outsideUserData(saved.destination, userData) || typeof saved.wrappedKey !== "string") throw new Error("RECOVERY_CONFIG_UNAVAILABLE");
    const canonicalDestination = await realpath(saved.destination).catch(error => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    });
    if (canonicalDestination && !outsideUserData(canonicalDestination, await realpath(userData))) throw new Error("RECOVERY_CONFIG_UNAVAILABLE");
    const key = decodeRecoveryKey(safeStorage.decryptString(Buffer.from(saved.wrappedKey, "base64")));
    return {destination: saved.destination, key};
  } catch { throw new Error("RECOVERY_CONFIG_UNAVAILABLE"); }
}

export async function saveRecoveryConfig(userData: string, config: RecoveryConfig): Promise<void> {
  if (!protectedStorage() || !outsideUserData(await realpath(config.destination), await realpath(userData))) throw new Error("RECOVERY_CONFIG_UNAVAILABLE");
  const file = join(userData, "recovery-config.json");
  const wrappedKey = safeStorage.encryptString(encodeRecoveryKey(config.key)).toString("base64");
  await durableWrite(file, JSON.stringify({destination: config.destination, wrappedKey}));
}

export async function restoreRecoveryConfig(userData: string, previous: Buffer | undefined): Promise<void> {
  const file = join(userData, "recovery-config.json");
  if (!previous) { await rm(file, {force: true}); await syncDirectory(userData); return; }
  await durableWrite(file, previous);
}
