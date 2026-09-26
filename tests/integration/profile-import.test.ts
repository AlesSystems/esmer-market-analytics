import { expect, test } from "vitest";
import { parseProfileCount, runProfile } from "../../tools/profile-import";

test("synthetic profile checks replacement totals and retained state through backup", async () => {
  const receipt = await runProfile(2);
  expect(receipt.fixture).toMatchObject({ name: "synthetic-business-profile-v1", documents: 2, lines: 2 });
  expect(receipt.results).toEqual({ firstNetSales: "200", firstEstimatedCost: "120", firstEstimatedGrossProfit: "80", replacementNetSales: "220", replacementEstimatedCost: "120", replacementEstimatedGrossProfit: "100", preserved: true, exactText: true });
  expect(receipt.stages.map(stage => stage.name)).toContain("backup-reopen");
  expect(receipt.files.packageBytes).toBeGreaterThan(0);
}, 30000);

test("profile count rejects malformed and unbounded CLI requests", () => {
  expect(parseProfileCount([])).toBe(100);
  expect(parseProfileCount(["25000"])).toBe(25000);
  for (const args of [["0"], ["1.5"], ["NaN"], ["25001"], ["1e3"], ["100", "source.json"]]) expect(() => parseProfileCount(args)).toThrow("INVALID_PROFILE_COUNT");
});
