import { expect, test } from "vitest";
import { followedMonth } from "../../src/ui/month-follow";

const base = { chosen: false, current: "2025-09", latest: "2025-10", draftOpen: false };

test("an unchosen month follows the newest source month", () => {
  expect(followedMonth(base)).toBe("2025-10");
  expect(followedMonth({ ...base, current: null })).toBe("2025-10");
});
test("an owner-chosen month, or one from unreadable preferences, never moves", () => {
  expect(followedMonth({ ...base, chosen: true })).toBeNull();
});
test("an open expense draft blocks the automatic change", () => {
  expect(followedMonth({ ...base, draftOpen: true })).toBeNull();
});
test("no change when already on the newest month or the source month is invalid", () => {
  expect(followedMonth({ ...base, current: "2025-10" })).toBeNull();
  expect(followedMonth({ ...base, latest: "garbage" })).toBeNull();
});
