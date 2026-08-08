import { env } from "@/lib/env";
import { emptyCatalog, type DestinationCatalog } from "@/lib/proposals/destinations";
import { currentProposalEnvelopeSchema, type ProposalEnvelope } from "@/lib/proposals/schema";

export type ProposeInput = {
  captureId: string;
  originalText: string;
  now?: Date;
  timezone?: string;
  catalog?: DestinationCatalog;
};

export interface ProposalProvider {
  propose(input: ProposeInput): Promise<ProposalEnvelope>;
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
  "{schemaVersion:'3',sourceCaptureId:string,proposals:[{recordType:'task'|'note'|'retainer_update',title:string,body?:string,destination?:{domainName?:string,projectName?:string,personName?:string},dateKind?:'due'|'scheduled',datePhrase?:string,date?:'YYYY-MM-DD',time?:'HH:MM' (24-hour),recurrence?:{rule:'daily'|'weekly'|'monthly',phrase:string},confidence:{recordType:number,title:number,destination?:number,date?:number},needsReview:boolean,reason:string}]}. " +
  "The user message includes `now` (an ISO date), `time` (24-hour HH:MM), and `timezone` describing the current moment in the user's local time. " +
  "Dates: `datePhrase` must be the capture's own words about when this happens ('next Friday', 'by the 15th', 'end of the month'), copied verbatim and never paraphrased or invented. " +
  "`date` is your reading of those words resolved against `now` in that timezone — never against your own notion of the current date. " +
  "Slipwell re-resolves `datePhrase` itself and prefers its own reading, so an accurate phrase matters more than an accurate date. " +
  "If the capture says nothing about when, omit datePhrase and date entirely rather than choosing a plausible day. " +
  "Set dateKind 'due' when the words are a deadline ('by', 'due', 'before') and 'scheduled' when they are a start or a working day ('on Tuesday', 'start Monday'). " +
  "If the capture states a specific time of day (e.g. 'at 2pm', '2:30pm'), convert it to 24-hour HH:MM and put it in `time`; if the capture gives no time, omit `time` rather than guessing one. " +
  "Include `recurrence` only when the capture says the work repeats, with `phrase` copied from the capture ('every Monday', 'every other week') and `rule` your reading of it. Slipwell supports daily, weekly, and monthly only, and it checks the phrase; still copy the phrase exactly even when it describes a cadence outside those three. " +
  "The user message also includes `destinations`: the domains, projects, and people this account already has. " +
  "If the capture clearly refers to one of them, copy that name into destination exactly as it is spelled in the list. " +
  "If the capture names a domain, project, or person that is not in the list, put the name the capture used and set needsReview true. " +
  "If the capture refers to no destination at all, omit destination entirely — do not pick a plausible one. " +
  "Never invent people, destinations, dates, or commitments. Mark uncertain material fields needsReview true. " +
  "Always return at least one proposal. A short capture with no date, time, or destination is still a valid task — propose it as recordType 'task' with needsReview true and explain what is uncertain in reason; never return an empty proposals array.";

function stripCodeFence(content: string): string {
  const trimmed = content.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fenced ? fenced[1] : trimmed;
}

export class OpenRouterProposalProvider implements ProposalProvider {
  async propose({ captureId, originalText, now = new Date(), timezone = "America/Vancouver", catalog = emptyCatalog }: ProposeInput) {
    const models = [env.openRouterModel(), ...env.openRouterFallbackModels()];
    /* Names only, and only the taxonomy needed to route this capture. No descriptions, no
       note bodies, no other account data. */
    const destinations = {
      domains: catalog.domains.map((domain) => domain.name),
      projects: catalog.projects.map((project) => project.name),
      people: catalog.people.map((person) => person.name),
    };
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
            { role: "user", content: JSON.stringify({ sourceCaptureId: captureId, capture: originalText, now: nowDate, time: nowTime, timezone, destinations }) },
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
      const parsed = currentProposalEnvelopeSchema.safeParse(parsedJson);
      if (!parsed.success) {
        // Field paths and error codes only - never the offending values, which can echo capture text.
        const issues = parsed.error.issues.map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.code}`);
        console.error("proposal_invalid_output", { captureId, model: models[0], issues });
        throw new ProposalProviderError("proposal_invalid_output", "OpenRouter response did not match the proposal schema.");
      }
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
