/**
 * Whether Today has nothing left needing the user's attention right now. Pulled out as a pure
 * function (rather than left as an inline boolean expression in today-page.tsx) so the "all
 * caught up" decision has an explicit, unit-testable contract instead of only being checkable by
 * eyeballing a live render.
 */
export function isTodayAllCaughtUp(counts: {
  topThreeCount: number;
  dueTodayCount: number;
  unresolvedRoutineCount: number;
  reviewNoteCount: number;
  openSignalCount: number;
  attentionCaptureCount: number;
}): boolean {
  return (
    counts.topThreeCount === 0 &&
    counts.dueTodayCount === 0 &&
    counts.unresolvedRoutineCount === 0 &&
    counts.reviewNoteCount === 0 &&
    counts.openSignalCount === 0 &&
    counts.attentionCaptureCount === 0
  );
}
