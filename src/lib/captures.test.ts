import { describe, expect, it, vi } from "vitest";
import { interpretCapture } from "./captures";
import { ProposalProviderError, type ProposalProvider } from "./proposals/provider";

const captureId = "11111111-1111-4111-8111-111111111111";

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
