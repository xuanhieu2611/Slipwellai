import { interpretationClaimFilter, type ClaimReason } from "@/lib/capture-pipeline";
import { loadDestinationCatalog } from "@/lib/proposals/catalog";
import { ProposalProviderError, proposalProvider, type ProposalFailureCode } from "@/lib/proposals/provider";
import type { ProposalEnvelope } from "@/lib/proposals/schema";

type SupabaseClient = Awaited<ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>>;

export type ClaimedCapture = { id: string; original_text: string };

/* Returns the capture only to the caller that won the claim. A second concurrent
   request sees no row and must not start a duplicate interpretation. */
export async function claimCaptureForInterpretation({
  supabase,
  captureId,
  reason,
  now = new Date(),
}: {
  supabase: SupabaseClient;
  captureId: string;
  reason: ClaimReason;
  now?: Date;
}): Promise<ClaimedCapture | null> {
  const { data } = await supabase
    .from("captures")
    .update({ status: "interpreting", failure_code: null, interpretation_claimed_at: now.toISOString() })
    .eq("id", captureId)
    .or(interpretationClaimFilter(reason, now))
    .select("id, original_text")
    .maybeSingle();
  return (data as ClaimedCapture | null) ?? null;
}

// Malformed JSON from the model is usually a one-off blip, so retry once before surfacing a failure.
async function proposeWithRetry(provider: typeof proposalProvider, input: Parameters<typeof proposalProvider.propose>[0]): ReturnType<typeof proposalProvider.propose> {
  try {
    return await provider.propose(input);
  } catch (error) {
    if (error instanceof ProposalProviderError && error.code === "proposal_invalid_output") {
      return provider.propose(input);
    }
    throw error;
  }
}

export async function interpretCapture({
  supabase,
  capture,
  provider = proposalProvider,
}: {
  supabase: SupabaseClient;
  capture: { id: string; original_text: string };
  provider?: typeof proposalProvider;
}): Promise<{ proposal?: ProposalEnvelope; error?: string }> {
  const startedAt = Date.now();
  /* The catalog is read per interpretation rather than cached: a domain or person created
     a moment ago should be routable by the next capture. */
  const [{ data: preferences }, catalog] = await Promise.all([
    supabase.from("user_preferences").select("timezone").maybeSingle(),
    loadDestinationCatalog(supabase),
  ]);
  const timezone = preferences?.timezone ?? "America/Vancouver";

  try {
    const proposal = await proposeWithRetry(provider, { captureId: capture.id, originalText: capture.original_text, now: new Date(), timezone, catalog });
    const { error: proposalError } = await supabase.from("proposals").insert({
      capture_id: capture.id,
      schema_version: proposal.schemaVersion,
      status: "ready",
      proposal_json: proposal,
      model_id: process.env.OPENROUTER_MODEL ?? null,
      latency_ms: Date.now() - startedAt,
    });
    if (proposalError) throw proposalError;
    await supabase.from("captures").update({ status: "needs_review" }).eq("id", capture.id);
    return { proposal };
  } catch (error) {
    const failureCode: ProposalFailureCode =
      error instanceof ProposalProviderError ? error.code : "proposal_provider_error";
    // A failed proposal makes the recovery action addressable without retaining provider output.
    await supabase.from("proposals").insert({
      capture_id: capture.id,
      status: "failed",
      proposal_json: {},
      model_id: process.env.OPENROUTER_MODEL ?? null,
      latency_ms: Date.now() - startedAt,
    });
    await supabase
      .from("captures")
      .update({ status: "needs_review", failure_code: failureCode })
      .eq("id", capture.id);
    return { error: "The proposal service is unavailable. Your original capture is ready for retry." };
  }
}
