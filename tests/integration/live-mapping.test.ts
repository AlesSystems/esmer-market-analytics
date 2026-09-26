import { expect, test, vi } from "vitest";
import { prepareSqlCandidate } from "../../src/source/sql-package";
import { parseSqlServerConfig } from "../../src/source/sql-server";
vi.mock("../../src/source/sql-server", async importOriginal => ({
  ...await importOriginal<typeof import("../../src/source/sql-server")>(),
  extractSqlServer: async () => ({ headers: [], lines: [] }),
}));

test("unapproved real source records cannot masquerade as a synthetic analytics package", async () => {
  const config = parseSqlServerConfig({ server: "localhost", port: 14333, database: "fixture", user: "reader", password: "synthetic", scope: "isolated-copy", lineage: "fixture", expectedDatabaseId: "f51ae321-96f0-4bdf-9497-6b106180ff25", from: "2025-10-01", to: "2025-10-12" });
  await expect(prepareSqlCandidate(config)).rejects.toThrow(/^UNSUPPORTED_MAPPING$/);
});
