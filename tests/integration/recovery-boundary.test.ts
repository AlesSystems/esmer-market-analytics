import { expect, test, vi } from "vitest";
import { handleRequest } from "../../src/desktop/requests";
import { mkdtemp, mkdir, readFile, rename, symlink, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const osStorage = vi.hoisted(() => ({available: true}));
vi.mock("electron", () => ({safeStorage: {
  isEncryptionAvailable: () => osStorage.available,
  getSelectedStorageBackend: () => "kwallet",
  encryptString: (value: string) => Buffer.from(value),
  decryptString: (value: Buffer) => value.toString("utf8"),
}}));

test("recovery requests accept only trusted named operations and exact renderer payloads", async () => {
  const recovery = vi.fn().mockResolvedValue({ status: "recovery", state: "setup-required", lastVerifiedAt: null, backups: [] });
  const invoke = (trusted: boolean, operation: string, payload: unknown) =>
    handleRequest(trusted, operation, payload, vi.fn(), undefined, undefined, undefined, undefined, undefined, recovery);

  expect(await invoke(false, "setupRecovery", null)).toMatchObject({ code: "UNTRUSTED_SENDER" });
  for (const [operation, payload] of [
    ["setupRecovery", { destination: "/private", key: "secret" }],
    ["prepareRestore", { backupPath: "/private", key: "secret" }],
    ["confirmRestore", { token: "valid", path: "/private" }],
    ["pinBackup", { backupId: "id", pinned: true, sql: "DELETE" }],
  ] as const) expect(await invoke(true, operation, payload)).toMatchObject({ code: "INVALID_PAYLOAD" });
  expect(recovery).not.toHaveBeenCalled();
  expect(await invoke(true, "getRecoveryStatus", null)).toMatchObject({ state: "setup-required" });
  expect(recovery).toHaveBeenCalledWith("getRecoveryStatus", null);
});

test("recovery locations reject prefix tricks and symlinks into app data", async () => {
  const root = await mkdtemp(join(tmpdir(), "esmer-recovery-paths-"));
  const userData = join(root, "data"), destination = join(root, "data-backups"), keyDirectory = join(root, "key"), alias = join(root, "alias");
  try {
    await Promise.all([mkdir(userData), mkdir(destination), mkdir(keyDirectory)]);
    await symlink(userData, alias, process.platform === "win32" ? "junction" : "dir");
    const {validRecoveryLocations} = await import("../../src/desktop/recovery-config");
    expect(await validRecoveryLocations(destination, join(keyDirectory, "key.txt"), userData)).toBe(true);
    expect(await validRecoveryLocations(alias, join(keyDirectory, "key.txt"), userData)).toBe(false);
    expect(await validRecoveryLocations(destination, join(alias, "key.txt"), userData)).toBe(false);
    expect(await validRecoveryLocations(destination, join(destination, "key.txt"), userData)).toBe(false);
  } finally { await rm(root, {recursive: true, force: true}); }
});

test("unavailable OS protection preserves existing config and oversized key files are rejected", async () => {
  const root = await mkdtemp(join(tmpdir(), "esmer-recovery-config-"));
  const userData = join(root, "data"), destination = join(root, "backups"), keyPath = join(root, "key.txt");
  try {
    await Promise.all([mkdir(userData), mkdir(destination)]);
    const {saveRecoveryConfig, loadRecoveryConfig, readRecoveryKeyFile} = await import("../../src/desktop/recovery-config");
    const config = {destination, key: Buffer.alloc(32, 7)};
    await saveRecoveryConfig(userData, config);
    const before = await readFile(join(userData, "recovery-config.json"));
    await rename(destination, `${destination}-unplugged`);
    expect(await loadRecoveryConfig(userData)).toEqual(config);
    await rename(`${destination}-unplugged`, destination);
    expect(await loadRecoveryConfig(userData)).toEqual(config);
    osStorage.available = false;
    await expect(saveRecoveryConfig(userData, {destination, key: Buffer.alloc(32, 8)})).rejects.toThrow("RECOVERY_CONFIG_UNAVAILABLE");
    await expect(loadRecoveryConfig(userData)).rejects.toThrow("RECOVERY_CONFIG_UNAVAILABLE");
    expect(await readFile(join(userData, "recovery-config.json"))).toEqual(before);
    await writeFile(keyPath, Buffer.alloc(1025));
    await expect(readRecoveryKeyFile(keyPath)).rejects.toThrow();
  } finally { osStorage.available = true; await rm(root, {recursive: true, force: true}); }
});
