import { describe, expect, it } from "vitest";
import {
  INTERPRETATION_STALE_MS,
  captureAttentionLabel,
  captureStatusAfterApplications,
  capturesNeedingAttention,
  interpretationClaimFilter,
  isStrandedCapture,
} from "./capture-pipeline";

const now = new Date("2026-08-05T12:00:00.000Z");
const claimedAt = (msAgo: number) => new Date(now.getTime() - msAgo).toISOString();

describe("interpretationClaimFilter", () => {
  it("lets a queued capture be claimed and leaves a fresh claim alone", () => {
    const filter = interpretationClaimFilter("queued", now);
    expect(filter).toContain("status.eq.queued");
    expect(filter).toContain(`interpretation_claimed_at.lt.${new Date(now.getTime() - INTERPRETATION_STALE_MS).toISOString()}`);
    // A reviewable capture is only reclaimed when the user explicitly asks for a retry.
    expect(filter).not.toContain("status.eq.needs_review");
  });

  it("reclaims a reviewable or failed capture for an explicit retry", () => {
    const filter = interpretationClaimFilter("retry", now);
    expect(filter).toContain("status.eq.needs_review");
    expect(filter).toContain("status.eq.failed");
  });
});

describe("isStrandedCapture", () => {
  it("treats a stored but unclaimed capture as recoverable work", () => {
    expect(isStrandedCapture({ status: "queued", interpretation_claimed_at: null }, now)).toBe(true);
  });

  it("leaves an interpretation that is still running alone", () => {
    expect(isStrandedCapture({ status: "interpreting", interpretation_claimed_at: claimedAt(30_000) }, now)).toBe(false);
  });

  it("reclaims an interpretation whose request never came back", () => {
    expect(isStrandedCapture({ status: "interpreting", interpretation_claimed_at: claimedAt(INTERPRETATION_STALE_MS + 1000) }, now)).toBe(true);
  });

  it("does not treat a resolved capture as stranded", () => {
    expect(isStrandedCapture({ status: "needs_review", interpretation_claimed_at: claimedAt(600_000) }, now)).toBe(false);
    expect(isStrandedCapture({ status: "filed", interpretation_claimed_at: null }, now)).toBe(false);
  });
});

describe("captureStatusAfterApplications", () => {
  it("keeps a multi-intent capture in review until every proposed record is decided", () => {
    expect(captureStatusAfterApplications(3, [{ outcome: "filed" }])).toBe("needs_review");
    expect(captureStatusAfterApplications(3, [{ outcome: "filed" }, { outcome: "dismissed" }])).toBe("needs_review");
  });

  it("files the capture once every item has an outcome and at least one was filed", () => {
    expect(captureStatusAfterApplications(2, [{ outcome: "filed" }, { outcome: "dismissed" }])).toBe("filed");
    expect(captureStatusAfterApplications(1, [{ outcome: "filed" }])).toBe("filed");
  });

  it("discards the capture only when every proposed record was dismissed", () => {
    expect(captureStatusAfterApplications(2, [{ outcome: "dismissed" }, { outcome: "dismissed" }])).toBe("discarded");
  });
});

describe("capturesNeedingAttention", () => {
  it("surfaces queued, needs_review, and failed captures unconditionally", () => {
    const captures = [
      { id: "a", status: "queued", interpretation_claimed_at: null },
      { id: "b", status: "needs_review", interpretation_claimed_at: null },
      { id: "c", status: "failed", interpretation_claimed_at: null },
    ];
    expect(capturesNeedingAttention(captures, now).map((capture) => capture.id)).toEqual(["a", "b", "c"]);
  });

  it("leaves a fresh interpretation claim off the list but flags a stranded one", () => {
    const fresh = { id: "fresh", status: "interpreting", interpretation_claimed_at: claimedAt(30_000) };
    const stranded = { id: "stranded", status: "interpreting", interpretation_claimed_at: claimedAt(INTERPRETATION_STALE_MS + 1000) };
    expect(capturesNeedingAttention([fresh, stranded], now).map((capture) => capture.id)).toEqual(["stranded"]);
  });

  it("excludes resolved captures", () => {
    const captures = [
      { id: "a", status: "filed", interpretation_claimed_at: null },
      { id: "b", status: "discarded", interpretation_claimed_at: null },
    ];
    expect(capturesNeedingAttention(captures, now)).toEqual([]);
  });
});

describe("captureAttentionLabel", () => {
  it("uses plain, calm language that matches the Inbox's own tags for the same states", () => {
    expect(captureAttentionLabel({ status: "needs_review" }, now)).toBe("Needs review");
    expect(captureAttentionLabel({ status: "failed" }, now)).toBe("Interpretation failed");
    expect(captureAttentionLabel({ status: "queued", interpretation_claimed_at: null }, now)).toBe("Waiting to interpret");
  });

  it("distinguishes a fresh interpretation claim from a stranded one", () => {
    expect(captureAttentionLabel({ status: "interpreting", interpretation_claimed_at: claimedAt(30_000) }, now)).toBe("Interpreting");
    expect(captureAttentionLabel({ status: "interpreting", interpretation_claimed_at: claimedAt(INTERPRETATION_STALE_MS + 1000) }, now)).toBe("Waiting to interpret");
  });
});
