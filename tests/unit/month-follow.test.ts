import { expect, test } from "vitest";
import { followedMonth, localMonth } from "../../src/ui/month-follow";

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

test("the no-data fallback month is the local calendar month, not the UTC one", () => {
  const zone = process.env.TZ;
  try {
    // 05:00 on 1 January in UTC+14 is still 31 December in UTC.
    process.env.TZ = "Pacific/Kiritimati";
    expect(localMonth(new Date(2026, 0, 1, 5, 0))).toBe("2026-01");
    process.env.TZ = "Pacific/Pago_Pago";
    expect(localMonth(new Date(2025, 11, 31, 23, 30))).toBe("2025-12");
  } finally { if (zone === undefined) delete process.env.TZ; else process.env.TZ = zone; }
});
