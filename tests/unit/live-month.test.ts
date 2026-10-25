import { expect, test } from "vitest";
import { latestLiveMonth } from "../../src/source/live-month";

test("a connection bound in the past selects the month of its end date", () => {
  expect(latestLiveMonth({from: "2025-08-01", to: "2025-09-30"}, "2026-10-25")).toBe("2025-09");
  expect(latestLiveMonth({from: "2025-08-01", to: "2025-09-15"}, "2026-10-25")).toBe("2025-09");
});

test("a connection bound in the future selects the current month", () => {
  expect(latestLiveMonth({from: "2025-08-01", to: "2026-12-31"}, "2026-10-25")).toBe("2026-10");
  expect(latestLiveMonth({from: "2026-10-25", to: "2026-10-25"}, "2026-10-25")).toBe("2026-10");
  expect(latestLiveMonth({from: "2025-08-01", to: "2026-10-25"}, "2026-10-01")).toBe("2026-10");
});

test("a connection that starts after today (or after its own end) has no month", () => {
  expect(() => latestLiveMonth({from: "2026-11-01", to: "2026-12-31"}, "2026-10-25")).toThrow("WINDOW_OUTSIDE_CONFIG");
  expect(() => latestLiveMonth({from: "2026-10-26", to: "2026-12-31"}, "2026-10-25")).toThrow("WINDOW_OUTSIDE_CONFIG");
});

test("invalid dates are rejected", () => {
  expect(() => latestLiveMonth({from: "2025-08-01", to: "2025-09-30"}, "today")).toThrow("INVALID_ARGUMENTS");
});
