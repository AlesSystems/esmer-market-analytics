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

test("a month beyond the range steps back into it, never to a neighbour outside", () => {
  expect(stepMonth("2025-12", -1, range)).toBe("2025-10");
  expect(stepMonth("2026-04", -1, range)).toBe("2025-10");
  expect(stepMonth("2025-06", 1, range)).toBe("2025-08");
  expect(stepMonth("2024-11", 1, range)).toBe("2025-08");
});

test("a month beyond the range still cannot step further away from it", () => {
  expect(stepMonth("2025-12", 1, range)).toBeNull();
  expect(stepMonth("2025-06", -1, range)).toBeNull();
});

test("the month just outside the range reaches the nearest covered month", () => {
  expect(stepMonth("2025-11", -1, range)).toBe("2025-10");
  expect(stepMonth("2025-07", 1, range)).toBe("2025-08");
});
