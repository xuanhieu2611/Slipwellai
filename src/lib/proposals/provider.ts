import { env } from "@/lib/env";
import { proposalEnvelopeSchema, type ProposalEnvelope } from "@/lib/proposals/schema";

export interface ProposalProvider {
  propose(input: { captureId: string; originalText: string; now?: Date; timezone?: string }): Promise<ProposalEnvelope>;
}

export type ProposalFailureCode = "proposal_timeout" | "proposal_provider_error" | "proposal_invalid_output";

export class ProposalProviderError extends Error {
  constructor(
    public readonly code: ProposalFailureCode,
    message: string,
  ) {
    super(message);
    this.name = "ProposalProviderError";
  }
}

const SYSTEM_PROMPT =
  "You turn one user capture into 1–3 review-first Slipwell proposals. Return only valid JSON matching this shape: " +
  "{schemaVersion:'1',sourceCaptureId:string,proposals:[{recordType:'task'|'note'|'retainer_update',title:string,body?:string,destinationName?:string,dueOn?:'YYYY-MM-DD',dueTime?:'HH:MM' (24-hour),confidence:{recordType:number,title:number,destination?:number,date?:number},needsReview:boolean,reason:string}]}. " +
  "The user message includes `now` (an ISO date), `time` (24-hour HH:MM), and `timezone` describing the current moment in the user's local time. " +
  "Resolve relative dates ('today', 'tomorrow', 'next Friday') against that `now`, in that timezone — never against your own notion of the current date. " +
  "If the capture states a specific time of day (e.g. 'at 2pm', '2:30pm'), convert it to 24-hour HH:MM and put it in dueTime; if the capture gives no time, omit dueTime rather than guessing one. " +
  "Never invent people, destinations, dates, or commitments. Mark uncertain material fields needsReview true. " +
  "Always return at least one proposal. A short capture with no date, time, or destination is still a valid task — propose it as recordType 'task' with needsReview true and explain what is uncertain in reason; never return an empty proposals array.";

function stripCodeFence(content: string): string {
  const trimmed = content.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fenced ? fenced[1] : trimmed;
}

export class OpenRouterProposalProvider implements ProposalProvider {
  async propose({ captureId, originalText, now = new Date(), timezone = "America/Vancouver" }: { captureId: string; originalText: string; now?: Date; timezone?: string }) {
    const models = [env.openRouterModel(), ...env.openRouterFallbackModels()];
    const nowDate = new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
    const nowTime = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(now);
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.openRouterApiKey()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: models[0],
          ...(models.length > 1 ? { models } : {}),
          response_format: { type: "json_object" },
          provider: {
            data_collection: "deny",
            zdr: true,
            require_parameters: true,
          },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: JSON.stringify({ sourceCaptureId: captureId, capture: originalText, now: nowDate, time: nowTime, timezone }) },
          ],
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(15_000),
      });

      // Do not persist or log provider response bodies: they can echo private capture text.
      if (!response.ok) {
        throw new ProposalProviderError("proposal_provider_error", `OpenRouter request failed (${response.status}).`);
      }
      const payload: unknown = await response.json();
      const content = (
        payload as { choices?: Array<{ message?: { content?: string } }> }
      ).choices?.[0]?.message?.content;
      if (!content) throw new ProposalProviderError("proposal_invalid_output", "OpenRouter returned no proposal content.");

      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(stripCodeFence(content));
      } catch {
        throw new ProposalProviderError("proposal_invalid_output", "OpenRouter response was not valid JSON.");
      }
      const parsed = proposalEnvelopeSchema.safeParse(parsedJson);
      if (!parsed.success) throw new ProposalProviderError("proposal_invalid_output", "OpenRouter response did not match the proposal schema.");
      if (parsed.data.sourceCaptureId !== captureId) {
        throw new ProposalProviderError("proposal_invalid_output", "Proposal was linked to the wrong capture.");
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof ProposalProviderError) throw error;
      if (error instanceof DOMException && error.name === "TimeoutError") {
        throw new ProposalProviderError("proposal_timeout", "OpenRouter request timed out.");
      }
      throw new ProposalProviderError("proposal_provider_error", "OpenRouter request could not be completed.");
    }
  }
}

export const proposalProvider: ProposalProvider = new OpenRouterProposalProvider();
