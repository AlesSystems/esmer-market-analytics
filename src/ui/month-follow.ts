import { validSelectedMonth } from "../domain/month";

/**
 * The month an unchosen selection should automatically move to, or null to leave it alone.
 * Only a month the owner never picked follows the newest source month, and never while an expense draft is open.
 */
export function followedMonth(input: { chosen: boolean; current: string | null; latest: string; draftOpen: boolean }): string | null {
  if (input.chosen || input.draftOpen || !validSelectedMonth(input.latest) || input.latest === input.current) return null;
  return input.latest;
}
