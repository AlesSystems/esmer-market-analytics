import { expect, test } from "vitest";
import { stepMonth } from "../../src/ui/month-step";

const range = { from: "2025-08-01", to: "2025-10-20" };

test("a step stays inside the data range and aria-disables at both ends", () => {
  expect(stepMonth("2025-09", -1, range)).toBe("2025-08");
  expect(stepMonth("2025-09", 1, range)).toBe("2025-10");
  expect(stepMonth("2025-08", -1, range)).toBeNull();
  expect(stepMonth("2025-10", 1, range)).toBeNull();
});

test("a step crosses the year boundary", () => {
  expect(stepMonth("2026-01", -1, null)).toBe("2025-12");
  expect(stepMonth("2025-12", 1, null)).toBe("2026-01");
});

test("without a data range every valid month is reachable", () => {
  expect(stepMonth("2026-10", -1, null)).toBe("2026-09");
  expect(stepMonth("2026-10", 1, null)).toBe("2026-11");
});
