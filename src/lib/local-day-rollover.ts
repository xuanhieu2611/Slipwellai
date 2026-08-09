/**
 * Local-midnight rollover for Today while a browser tab stays open.
 *
 * Computing "ms until the next local midnight" directly for an arbitrary IANA timezone would
 * need either a timezone-aware date library or hand-rolled DST-aware arithmetic (a local day can
 * be 23, 24, or 25 hours long around a DST transition, and Slipwell already treats DST as a
 * release-critical correctness risk elsewhere — see retainers.ts/slipping.ts). Rather than take
 * that on again here, the chosen mechanism polls roughly once a minute and compares the
 * account's local calendar day (via the same Intl-based `dateInZone`/`localDate` string, already
 * used everywhere else in this codebase) against the last known day. `Intl.DateTimeFormat`
 * already resolves DST correctly, so a plain string comparison is enough, it self-corrects if a
 * check is missed (e.g. a throttled/backgrounded tab or a laptop sleeping through the boundary),
 * and it never needs its own DST logic.
 */

/** Delay until slightly after the next minute boundary, so the local-day string is never read
 *  in the same instant the wall clock ticks over. */
export function nextRolloverCheckDelayMs(now: Date): number {
  const msIntoCurrentMinute = now.getTime() % 60_000;
  return 60_000 - msIntoCurrentMinute + 1_000;
}

/** True when the account's local calendar day has advanced past the last day this view knew
 *  about. A plain inequality, but named and exported so the rollover hook's intent reads clearly
 *  and so it has a unit-testable seam independent of any timer or DOM behavior. */
export function localDayRolledOver(currentDay: string, knownDay: string): boolean {
  return currentDay !== knownDay;
}
