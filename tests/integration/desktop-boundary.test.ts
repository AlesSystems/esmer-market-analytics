import { expect, test, vi } from "vitest";
import { handleRequest } from "../../src/desktop/requests";
test.each([
  [false, "getAvailability", null, "UNTRUSTED_SENDER"],
  [true, "unknown", null, "UNKNOWN_OPERATION"],
  [true, "getAvailability", {}, "INVALID_PAYLOAD"],
  [
    true,
    "getAvailability",
    { path: "/private/file", credentials: "secret" },
    "INVALID_PAYLOAD",
  ],
  [true, "import", { sql: "DROP TABLE source" }, "UNKNOWN_OPERATION"],
  [true, "getAvailability", { sql: "SELECT * FROM source" }, "INVALID_PAYLOAD"],
] as const)(
  "rejects boundary input before privileged work (%s, %s)",
  async (trusted, operation, payload, code) => {
    const service = vi.fn();
    const result = await handleRequest(trusted, operation, payload, service);
    expect(result).toMatchObject({ status: "rejected", code });
    expect(JSON.stringify(result)).not.toMatch(/private|secret|DROP|SELECT/);
    expect(service).not.toHaveBeenCalled();
  },
);
test("valid request returns service availability, including failure", async () => {
  const result = {
    status: "unavailable",
    code: "SERVICE_UNAVAILABLE",
    message: "Yerel hizmet başlatılamadı.",
  } as const;
  const service = vi.fn().mockResolvedValue(result);
  expect(await handleRequest(true, "getAvailability", null, service)).toEqual(
    result,
  );
  expect(service).toHaveBeenCalledOnce();
});

test.each([
  [false, "importPackage", null, "UNTRUSTED_SENDER"],
  [true, "importPackage", { path: "/private/file" }, "INVALID_PAYLOAD"],
  [true, "importPackage", undefined, "INVALID_PAYLOAD"],
] as const)("rejects import before opening native dialog (%s)", async (trusted, operation, payload, code) => {
  const availability = vi.fn(); const selectAndImport = vi.fn();
  expect(await handleRequest(trusted, operation, payload, availability, selectAndImport)).toMatchObject({ status: "rejected", code });
  expect(availability).not.toHaveBeenCalled(); expect(selectAndImport).not.toHaveBeenCalled();
});
test("named no-argument import invokes only the privileged import callback", async () => {
  const availability = vi.fn(); const selectAndImport = vi.fn().mockResolvedValue({ status: "cancelled" });
  expect(await handleRequest(true, "importPackage", null, availability, selectAndImport)).toEqual({ status: "cancelled" });
  expect(selectAndImport).toHaveBeenCalledOnce(); expect(availability).not.toHaveBeenCalled();
});

test("job status and cancellation validate sender and exact payload before changing shared state", async () => {
  const status = vi.fn().mockReturnValue({status: "idle"});
  const cancel = vi.fn().mockReturnValue({status: "cancelling"});
  const invoke = (trusted: boolean, operation: string, payload: unknown) => handleRequest(trusted, operation, payload, vi.fn(), undefined, undefined, {status, cancel});
  expect(await invoke(true, "getOperationStatus", null)).toEqual({status: "idle"});
  expect(await invoke(true, "cancelOperation", {id: 1})).toEqual({status: "cancelling"});
  cancel.mockClear();
  expect(await invoke(false, "cancelOperation", {id: 1})).toMatchObject({code: "UNTRUSTED_SENDER"});
  for (const value of [null, {id: 0}, {id: 1.5}, {id: 1, cancellation: "spoof"}, {id: "1"}]) expect(await invoke(true, "cancelOperation", value)).toMatchObject({code: "INVALID_PAYLOAD"});
  expect(cancel).not.toHaveBeenCalled();
});
