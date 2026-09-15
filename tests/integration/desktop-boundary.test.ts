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
