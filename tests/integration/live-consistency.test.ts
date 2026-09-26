import { expect, test } from "vitest";
import { parseSqlServerConfig, extractSqlServer } from "../../src/source/sql-server";

const config = { server: "localhost", port: 1433, database: "fixture", user: "reader", password: "private", scope: "isolated-copy", lineage: "test-source", expectedDatabaseId: "f51ae321-96f0-4bdf-9497-6b106180ff25", from: "2025-01-01", to: "2025-12-31" };

test("SQL configuration rejects undeclared scope, extra keys, invalid dates and insecure implicit defaults", () => {
  expect(parseSqlServerConfig(config).trustServerCertificate).toBe(false);
  for (const invalid of [{ ...config, scope: "production" }, { ...config, sql: "SELECT secret" }, { ...config, from: "2025-02-30" }, { ...config, to: "2024-12-31" }, { ...config, port: 0 }, { ...config, user: "sa" }, { ...config, expectedDatabaseId: "anything" }]) expect(() => parseSqlServerConfig(invalid)).toThrow("SOURCE_REJECTED");
});

test("cancelled extraction rejects before a connection and leaks no credential", async () => {
  await expect(extractSqlServer(parseSqlServerConfig(config), AbortSignal.abort())).rejects.toThrow(/^CANCELLED$/);
});

test("connection failure returns a fixed error without connection details", async () => {
  await expect(extractSqlServer(parseSqlServerConfig({ ...config, port: 1 }))).rejects.toThrow(/^SOURCE_UNAVAILABLE$/);
});

test.skipIf(!process.env.ESMER_SQL_TEST_CONFIG)("isolated SQL extraction preserves exact strings and a repeatable declared population", async () => {
  const { readFile } = await import("node:fs/promises");
  const input = parseSqlServerConfig(JSON.parse(await readFile(process.env.ESMER_SQL_TEST_CONFIG!, "utf8")));
  const first = await extractSqlServer(input);
  const second = await extractSqlServer(input);
  expect(first.headers.length).toBeGreaterThan(0);
  expect(first.lines.length).toBeGreaterThan(0);
  expect(second.headers).toEqual(first.headers);
  expect(second.lines).toEqual(first.lines);
  expect(first.databaseId.toLowerCase()).toBe(input.expectedDatabaseId.toLowerCase());
  for (const row of [...first.headers, ...first.lines]) {
    expect(row.ID).toMatch(/^\d+$/);
    expect(Object.values(row).every(value => value === null || typeof value === "string")).toBe(true);
    expect(Object.keys(row)).not.toEqual(expect.arrayContaining(["MUSTERI_AD", "ADRES", "EMAIL"]));
  }
}, 120_000);
