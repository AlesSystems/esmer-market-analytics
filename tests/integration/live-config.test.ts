import { expect, test, vi } from "vitest";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
const storage = vi.hoisted(() => ({available: true}));
vi.mock("electron", () => ({safeStorage: {
  isEncryptionAvailable: () => storage.available,
  getSelectedStorageBackend: () => "kwallet",
  encryptString: (value: string) => Buffer.from(value).map(byte => byte ^ 0xff),
  decryptString: (value: Buffer) => value.map(byte => byte ^ 0xff).toString(),
}}));
import { loadLiveConfig, readLiveConfigFile, saveLiveConfig } from "../../src/desktop/live-config";
const config = {server: "localhost", port: 1433, database: "fixture", user: "reader", password: "synthetic-secret", scope: "isolated-copy" as const, lineage: "test", expectedDatabaseId: "00000000-0000-0000-0000-000000000001", from: "2026-01-01", to: "2026-01-31", trustServerCertificate: true};
test("protected live configuration defaults absent and preserves encrypted credentials plus explicit enable state", async () => {
  const directory = await mkdtemp(join(tmpdir(), "live-config-"));
  try {
    expect(await loadLiveConfig(directory)).toBeNull();
    await saveLiveConfig(directory, {config, enabled: false});
    const saved = await readFile(join(directory, "live-source.enc"));
    expect(saved.toString()).not.toContain(config.password);
    expect(await loadLiveConfig(directory)).toEqual({config, enabled: false});
    await saveLiveConfig(directory, {config, enabled: true});
    expect(await loadLiveConfig(directory)).toEqual({config, enabled: true});
    storage.available = false;
    await expect(loadLiveConfig(directory)).rejects.toThrow("LIVE_CONFIG_UNAVAILABLE");
    await expect(saveLiveConfig(directory, {config, enabled: false})).rejects.toThrow("LIVE_CONFIG_UNAVAILABLE");
  } finally {storage.available = true; await rm(directory, {recursive: true, force: true});}
});
test("native selected config rejects extra keys, production scope and oversize without leaking content", async () => {
  const directory = await mkdtemp(join(tmpdir(), "live-config-")), file = join(directory, "selected.json");
  try {
    for (const value of [{...config, sql: "SELECT"}, {...config, scope: "production"}, {...config, password: "p".repeat(20_000)}]) {
      await writeFile(file, JSON.stringify(value));
      await expect(readLiveConfigFile(file)).rejects.toThrow("LIVE_CONFIG_UNAVAILABLE");
    }
    await writeFile(file, JSON.stringify(config));
    expect(await readLiveConfigFile(file)).toEqual(config);
  } finally {await rm(directory, {recursive: true, force: true});}
});
