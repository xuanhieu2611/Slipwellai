import { describe, expect, it, vi } from "vitest";
import { claimCaptureForInterpretation, interpretCapture } from "./captures";
import { ProposalProviderError, type ProposalProvider } from "./proposals/provider";

const captureId = "11111111-1111-4111-8111-111111111111";

describe("claimCaptureForInterpretation", () => {
  function claimClient(claimed: { id: string; original_text: string } | null) {
    const calls: { update?: unknown; or?: string } = {};
    const supabase = {
      from() {
        return {
          update(value: unknown) {
            calls.update = value;
            return {
              eq: () => ({
                or(filter: string) {
                  calls.or = filter;
                  return { select: () => ({ maybeSingle: () => ({ data: claimed }) }) };
                },
              }),
            };
          },
        };
      },
    };
    return { supabase, calls };
  }

  it("hands the capture to the request that won the claim and records when it was taken", async () => {
    const now = new Date("2026-08-05T12:00:00.000Z");
    const { supabase, calls } = claimClient({ id: captureId, original_text: "stored words" });

    const result = await claimCaptureForInterpretation({ supabase: supabase as never, captureId, reason: "queued", now });

    expect(result).toEqual({ id: captureId, original_text: "stored words" });
    expect(calls.update).toEqual({ status: "interpreting", failure_code: null, interpretation_claimed_at: now.toISOString() });
    expect(calls.or).toContain("status.eq.queued");
  });

  it("returns nothing when another request already holds the claim, so interpretation is not duplicated", async () => {
    const { supabase } = claimClient(null);

    const result = await claimCaptureForInterpretation({ supabase: supabase as never, captureId, reason: "queued" });

    expect(result).toBeNull();
  });
});

describe("interpretCapture", () => {
  it("keeps a failed interpretation recoverable through an addressable failed proposal", async () => {
    const inserts: Array<{ table: string; value: unknown }> = [];
    const updates: Array<{ table: string; value: unknown }> = [];
    const supabase = {
      from(table: string) {
        return {
          insert(value: unknown) {
            inserts.push({ table, value });
            return {};
          },
          update(value: unknown) {
            updates.push({ table, value });
            return { eq: () => ({}) };
          },
          select() {
            return { maybeSingle: () => ({ data: null }) };
          },
        };
      },
    };
    const provider = {
      propose: vi.fn().mockRejectedValue(new ProposalProviderError("proposal_timeout", "timed out")),
    } as ProposalProvider;

    const result = await interpretCapture({
      supabase: supabase as never,
      capture: { id: captureId, original_text: "private test capture" },
      provider,
    });

    expect(result).toEqual({ error: "The proposal service is unavailable. Your original capture is ready for retry." });
    expect(inserts).toContainEqual({
      table: "proposals",
      value: expect.objectContaining({ capture_id: captureId, status: "failed", proposal_json: {} }),
    });
    expect(updates).toContainEqual({
      table: "captures",
      value: { status: "needs_review", failure_code: "proposal_timeout" },
    });
  });
});
