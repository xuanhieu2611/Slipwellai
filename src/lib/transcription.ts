import { env } from "@/lib/env";

export class TranscriptionError extends Error {
  constructor(
    public readonly code:
      | "transcription_not_configured"
      | "transcription_provider_error"
      | "transcription_invalid_response",
    message: string,
  ) {
    super(message);
  }
}

export async function transcribeAudio({ audio, mimeType }: { audio: Blob; mimeType: string }) {
  if (!process.env.OPENROUTER_API_KEY)
    throw new TranscriptionError(
      "transcription_not_configured",
      "Voice transcription is not configured yet.",
    );
  const apiKey = env.openRouterApiKey();
  const form = new FormData();
  form.append("model", env.openRouterTranscriptionModel());
  form.append("language", "en");
  form.append("response_format", "json");
  form.append(
    "file",
    new File([audio], `capture.${mimeType.split("/")[1] ?? "webm"}`, { type: mimeType }),
  );

  const response = await fetch("https://openrouter.ai/api/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });
  if (!response.ok)
    throw new TranscriptionError(
      "transcription_provider_error",
      "The transcription provider could not process this recording.",
    );
  const payload: unknown = await response.json();
  if (
    !payload ||
    typeof payload !== "object" ||
    !("text" in payload) ||
    typeof payload.text !== "string" ||
    !payload.text.trim()
  ) {
    throw new TranscriptionError(
      "transcription_invalid_response",
      "The transcription provider returned an invalid transcript.",
    );
  }
  return payload.text.trim();
}
