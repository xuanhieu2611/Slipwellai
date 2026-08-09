/* Pipeline rules for a capture between "stored" and "resolved". These are pure so the
   Inbox and the route handlers agree on what a capture's state means, without dragging
   the server-only proposal provider into the browser bundle. */

/* A claim older than this belonged to a request that never came back — a closed tab, a
   dropped connection, a crashed handler. Reclaiming it is what keeps a capture from
   being stranded in `interpreting` with no way to act on it. */
export const INTERPRETATION_STALE_MS = 2 * 60 * 1000;

export type ClaimReason = "queued" | "retry";

/* PostgREST filter for "nobody else is working on this capture right now". A queued
   capture has never been claimed; an interpreting capture is free again only once its
   claim has gone stale. Explicit user retry additionally reclaims a capture that already
   has a failed or reviewable proposal. */
export function interpretationClaimFilter(reason: ClaimReason, now: Date) {
  const staleBefore = new Date(now.getTime() - INTERPRETATION_STALE_MS).toISOString();
  const clauses = [
    "status.eq.queued",
    `and(status.eq.interpreting,interpretation_claimed_at.lt.${staleBefore})`,
    "and(status.eq.interpreting,interpretation_claimed_at.is.null)",
  ];
  if (reason === "retry") clauses.push("status.eq.needs_review", "status.eq.failed");
  return clauses.join(",");
}

/* A capture whose interpretation never finished. The Inbox shows these with their own
   recovery actions rather than hiding them behind the needs-review filter. */
export function isStrandedCapture(
  capture: { status: string; interpretation_claimed_at?: string | null },
  now: Date = new Date(),
) {
  if (capture.status === "queued") return true;
  if (capture.status !== "interpreting") return false;
  if (!capture.interpretation_claimed_at) return true;
  return now.getTime() - new Date(capture.interpretation_claimed_at).getTime() > INTERPRETATION_STALE_MS;
}

/* A capture is only finished once every proposed item has an outcome. Filing one of
   three intents must leave the other two in review instead of closing the capture. */
export function captureStatusAfterApplications(
  proposedItemCount: number,
  applications: ReadonlyArray<{ outcome: string }>,
) {
  if (applications.length < proposedItemCount) return "needs_review" as const;
  return applications.some((application) => application.outcome === "filed") ? ("filed" as const) : ("discarded" as const);
}

type AttentionCapture = { status: string; interpretation_claimed_at?: string | null };

/* A `filed` or `discarded` capture is resolved and belongs in history, not on Today. A
   fresh `interpreting` claim is normal in-flight work and only becomes worth flagging once
   it goes stale — reuses isStrandedCapture rather than re-deriving the same staleness rule. */
export function captureNeedsAttention(capture: AttentionCapture, now: Date = new Date()) {
  switch (capture.status) {
    case "needs_review":
    case "failed":
    case "queued":
      return true;
    case "interpreting":
      return isStrandedCapture(capture, now);
    default:
      return false;
  }
}

/** Today's recovery list: the subset of a capture feed still waiting on the user. */
export function capturesNeedingAttention<T extends AttentionCapture>(captures: readonly T[], now: Date = new Date()): T[] {
  return captures.filter((capture) => captureNeedsAttention(capture, now));
}

/* Plain-language status for a capture Today is flagging, matching the tag language the
   Inbox already uses for the same states (PendingCapture, Review) so the two surfaces never
   describe the same capture differently. */
export function captureAttentionLabel(capture: AttentionCapture, now: Date = new Date()) {
  switch (capture.status) {
    case "needs_review":
      return "Needs review";
    case "failed":
      return "Interpretation failed";
    case "queued":
    case "interpreting":
      return isStrandedCapture(capture, now) ? "Waiting to interpret" : "Interpreting";
    default:
      return "Needs attention";
  }
}
