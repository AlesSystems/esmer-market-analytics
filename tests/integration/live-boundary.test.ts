import { expect, test, vi } from "vitest";
import { handleRequest } from "../../src/desktop/requests";

test("live operations accept only trusted named commands without connection data", async () => {
  const live = vi.fn().mockResolvedValue({status: "live", configured: false});
  const invoke = (trusted: boolean, operation: string, payload: unknown) => handleRequest(trusted, operation, payload, vi.fn(), undefined, undefined, undefined, undefined, live);
  expect(await invoke(false, "configureLiveSource", null)).toMatchObject({code: "UNTRUSTED_SENDER"});
  for (const [operation, payload] of [["configureLiveSource", {password: "secret"}], ["refreshLiveSource", {sql: "SELECT"}], ["getLiveStatus", {}], ["setLiveEnabled", {enabled: true, server: "host"}], ["setLiveEnabled", {enabled: 1}]]) {
    expect(await invoke(true, operation as string, payload)).toMatchObject({code: "INVALID_PAYLOAD"});
  }
  expect(live).not.toHaveBeenCalled();
  for (const operation of ["configureLiveSource", "refreshLiveSource", "getLiveStatus"]) expect(await invoke(true, operation, null)).toMatchObject({status: "live"});
  expect(await invoke(true, "setLiveEnabled", {enabled: true})).toMatchObject({status: "live"});
  expect(live).toHaveBeenLastCalledWith("setLiveEnabled", {enabled: true});
});
