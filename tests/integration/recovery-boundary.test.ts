import { expect, test, vi } from "vitest";
import { handleRequest } from "../../src/desktop/requests";

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
