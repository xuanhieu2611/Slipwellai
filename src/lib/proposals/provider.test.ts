import { describe, expect, it, vi } from "vitest";
import { OpenRouterProposalProvider, ProposalProviderError } from "./provider";

const captureId = "11111111-1111-4111-8111-111111111111";

describe("OpenRouterProposalProvider", () => {
  it("requires ZDR and rejects malformed provider output without retaining it", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "not JSON" } }] }), {
        status: 200,
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.OPENROUTER_MODEL = "test-model";

    await expect(
      new OpenRouterProposalProvider().propose({ captureId, originalText: "private text" }),
    ).rejects.toMatchObject({
      code: "proposal_invalid_output",
    } satisfies Partial<ProposalProviderError>);

    const request = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(request.provider).toEqual({
      data_collection: "deny",
      zdr: true,
      require_parameters: true,
    });
  });

  it("categorizes provider failures without exposing response bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("private echo", { status: 503 })),
    );
    process.env.OPENROUTER_API_KEY = "test-key";
    process.env.OPENROUTER_MODEL = "test-model";

    await expect(
      new OpenRouterProposalProvider().propose({ captureId, originalText: "private text" }),
    ).rejects.toMatchObject({
      code: "proposal_provider_error",
      message: "OpenRouter request failed (503).",
    } satisfies Partial<ProposalProviderError>);
  });
});
