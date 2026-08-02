import { env } from "@/lib/env";
import { proposalEnvelopeSchema, type ProposalEnvelope } from "@/lib/proposals/schema";

export interface ProposalProvider {
  propose(input: { captureId: string; originalText: string }): Promise<ProposalEnvelope>;
}

export class OpenRouterProposalProvider implements ProposalProvider {
  async propose({ captureId, originalText }: { captureId: string; originalText: string }) {
    const models = [env.openRouterModel(), ...env.openRouterFallbackModels()];
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
          {
            role: "system",
            content:
              "You turn one user capture into 1–3 review-first Slipwell proposals. Return only valid JSON matching this shape: {schemaVersion:'1',sourceCaptureId:string,proposals:[{recordType:'task'|'note'|'retainer_update',title:string,body?:string,destinationName?:string,dueOn?:'YYYY-MM-DD',confidence:{recordType:number,title:number,destination?:number,date?:number},needsReview:boolean,reason:string}]}. Never invent people, destinations, dates, or commitments. Mark uncertain material fields needsReview true.",
          },
          { role: "user", content: JSON.stringify({ sourceCaptureId: captureId, capture: originalText }) },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) throw new Error(`OpenRouter request failed (${response.status}).`);
    const payload: unknown = await response.json();
    const content = (
      payload as { choices?: Array<{ message?: { content?: string } }> }
    ).choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter returned no proposal content.");

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(content);
    } catch {
      throw new Error("OpenRouter response was not valid JSON.");
    }
    const parsed = proposalEnvelopeSchema.parse(parsedJson);
    if (parsed.sourceCaptureId !== captureId) throw new Error("Proposal was linked to the wrong capture.");
    return parsed;
  }
}

export const proposalProvider: ProposalProvider = new OpenRouterProposalProvider();
