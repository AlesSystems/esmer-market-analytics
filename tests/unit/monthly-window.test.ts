import { expect, test } from "vitest";
import { monthWindow } from "../../src/source/sql-package";

test("selected month plus up to five previous calendar months", () => {
  expect(monthWindow("2025-09")).toEqual({from: "2025-04-01", to: "2025-09-30", months: 6});
  expect(monthWindow("2025-09", 1)).toEqual({from: "2025-09-01", to: "2025-09-30", months: 1});
  expect(monthWindow("2025-02", 3)).toEqual({from: "2024-12-01", to: "2025-02-28", months: 3});
  expect(monthWindow("2024-02", 1)).toEqual({from: "2024-02-01", to: "2024-02-29", months: 1});
  expect(monthWindow("2025-01", 6)).toEqual({from: "2024-08-01", to: "2025-01-31", months: 6});
});

test("rejects malformed months and windows outside one to six months", () => {
  for (const month of ["2025-13", "2025-00", "2025-9", "25-09", "2025-09-01", "1899-12", "1900-01"]) expect(() => monthWindow(month)).toThrow("INVALID_ARGUMENTS");
  for (const months of [0, 7, 1.5, -1, Number.NaN]) expect(() => monthWindow("2025-09", months)).toThrow("INVALID_ARGUMENTS");
  expect(() => monthWindow("1900-03", 6)).toThrow("INVALID_ARGUMENTS");
  expect(monthWindow("1900-06", 6).from).toBe("1900-01-01");
});
