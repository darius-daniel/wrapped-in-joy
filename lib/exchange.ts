/**
 * Single source of truth for the gift-exchange timeline.
 *
 * Registration is frozen at the deadline. A re-pick window then stays open for
 * GRACE_HOURS, during which anyone whose pick points at a serial nobody
 * registered can choose a different serial before the draw runs.
 */

export const DEADLINE_ISO = "2026-11-25T00:00:00";
export const GRACE_HOURS = 48;

export const SIGNUP_DEADLINE = new Date(DEADLINE_ISO);
export const GRACE_ENDS = new Date(
  SIGNUP_DEADLINE.getTime() + GRACE_HOURS * 60 * 60 * 1000
);

export type ExchangePhase = "signup" | "grace" | "closed";

export function exchangePhaseAt(now: Date = new Date()): ExchangePhase {
  if (now.getTime() < SIGNUP_DEADLINE.getTime()) return "signup";
  if (now.getTime() < GRACE_ENDS.getTime()) return "grace";
  return "closed";
}
