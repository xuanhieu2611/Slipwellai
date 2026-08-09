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

    const result = await claimCaptureForInterpretation({
      supabase: supabase as never,
      captureId,
      reason: "queued",
      now,
    });

    expect(result).toEqual({ id: captureId, original_text: "stored words" });
    expect(calls.update).toEqual({
      status: "interpreting",
      failure_code: null,
      interpretation_claimed_at: now.toISOString(),
    });
    expect(calls.or).toContain("status.eq.queued");
  });

  it("returns nothing when another request already holds the claim, so interpretation is not duplicated", async () => {
    const { supabase } = claimClient(null);

    const result = await claimCaptureForInterpretation({
      supabase: supabase as never,
      captureId,
      reason: "queued",
    });

    expect(result).toBeNull();
  });
});

describe("interpretCapture", () => {
  /* Rows keyed by table so a read can answer with something specific; anything unlisted
     reads as empty, which is what an account with no records looks like. */
  function stubClient(rows: Record<string, unknown[]> = {}) {
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
            const data = rows[table] ?? [];
            const chain = {
              is: () => chain,
              in: () => chain,
              order: () => chain,
              limit: () => chain,
              maybeSingle: () => ({ data: data[0] ?? null }),
              then: (resolve: (result: { data: unknown[] }) => unknown) => resolve({ data }),
            };
            return chain;
          },
        };
      },
    };
    return { supabase, inserts, updates };
  }

  it("keeps a failed interpretation recoverable through an addressable failed proposal", async () => {
    const { supabase, inserts, updates } = stubClient();
    const provider = {
      propose: vi
        .fn()
        .mockRejectedValue(new ProposalProviderError("proposal_timeout", "timed out")),
    } as ProposalProvider;

    const result = await interpretCapture({
      supabase: supabase as never,
      capture: { id: captureId, original_text: "private test capture" },
      provider,
    });

    expect(result).toEqual({
      error: "The proposal service is unavailable. Your original capture is ready for retry.",
    });
    expect(inserts).toContainEqual({
      table: "proposals",
      value: expect.objectContaining({
        capture_id: captureId,
        status: "failed",
        proposal_json: {},
      }),
    });
    expect(updates).toContainEqual({
      table: "captures",
      value: { status: "needs_review", failure_code: "proposal_timeout" },
    });
  });

  /* Without the account's own taxonomy the model can only guess at a destination, and a
     guessed name matches nothing. This is what lets a capture route into records the user
     already has. */
  it("gives the provider the destinations this account already has", async () => {
    const domain = { id: "22222222-2222-4222-8222-222222222222", name: "Client work" };
    const { supabase } = stubClient({
      domains: [domain],
      people: [
        { id: "33333333-3333-4333-8333-333333333333", name: "Dana Rivera", domain_id: domain.id },
      ],
      user_preferences: [{ timezone: "Europe/Lisbon" }],
    });
    const propose = vi
      .fn()
      .mockResolvedValue({ schemaVersion: "3", sourceCaptureId: captureId, proposals: [] });

    await interpretCapture({
      supabase: supabase as never,
      capture: { id: captureId, original_text: "note for dana" },
      provider: { propose },
    });

    expect(propose).toHaveBeenCalledWith(
      expect.objectContaining({
        timezone: "Europe/Lisbon",
        catalog: expect.objectContaining({ domains: [domain] }),
      }),
    );
  });
});
