import {afterEach, expect, test, vi} from "vitest";
import {Connection} from "tedious";
import {extractSqlServer, parseSqlServerConfig} from "../../src/source/sql-server";

const config = {
  server: "localhost", port: 1433, database: "fixture", user: "reader", password: "synthetic-only",
  scope: "isolated-copy" as const, lineage: "auth-boundary",
  expectedDatabaseId: "00000000-0000-4000-8000-000000000001", from: "2025-10-01", to: "2025-10-31",
};

afterEach(() => vi.restoreAllMocks());

// Use the real driver's constructor/normalization, but never open a socket or contact a source.
function captureConnection() {
  const observed: Connection["config"][] = [];
  const connect = vi.spyOn(Connection.prototype, "connect").mockImplementation(function (this: Connection, listener) {
    observed.push(this.config);
    queueMicrotask(() => listener?.(new Error("synthetic connection failure")));
    return this;
  });
  return {observed, connect};
}

test("source extraction selects SQL authentication with TLS even for URL-like credential text", async () => {
  const {observed, connect} = captureConnection();
  for (const trustServerCertificate of [false, true]) {
    const input = parseSqlServerConfig({...config, trustServerCertificate, user: "reader@example.invalid", password: "https://example.invalid/?code=synthetic&client_info=synthetic"});
    await expect(extractSqlServer(input)).rejects.toThrow(/^SOURCE_UNAVAILABLE$/);
    expect(observed.at(-1)?.authentication).toEqual({type: "default", options: {userName: input.user, password: input.password}});
    expect(observed.at(-1)?.options).toMatchObject({encrypt: true, trustServerCertificate, columnEncryptionSetting: false});
  }
  expect(connect).toHaveBeenCalledTimes(2);
});

test.each([
  {authentication: {type: "azure-active-directory-default", options: {}}},
  {authentication: {type: "token-credential", options: {credential: "synthetic"}}},
  {authCode: "https://example.invalid/?code=synthetic"},
  {authority: "https://example.invalid"},
  {options: {authentication: {type: "azure-active-directory-password"}, columnEncryptionSetting: true}},
  JSON.parse('{"\\u0061uthentication":{"type":"azure-active-directory-default"}}'),
  JSON.parse('{"__proto__":{"authentication":{"type":"azure-active-directory-default"}}}'),
  {constructor: {prototype: {authentication: {type: "azure-active-directory-default"}}}},
])("rejects injected driver/OAuth configuration before connecting (%#)", async extra => {
  const {connect} = captureConnection();
  await expect(extractSqlServer({...config, ...extra})).rejects.toThrow(/^SOURCE_REJECTED$/);
  expect(connect).not.toHaveBeenCalled();
});

test("inherited authentication options cannot select an OAuth flow", async () => {
  const {observed} = captureConnection();
  const input = Object.assign(Object.create({authentication: {type: "azure-active-directory-default"}, authority: "https://example.invalid"}), config);
  await expect(extractSqlServer(input)).rejects.toThrow(/^SOURCE_UNAVAILABLE$/);
  expect(observed[0]?.authentication).toEqual({type: "default", options: {userName: config.user, password: config.password}});
});
