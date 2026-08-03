import { afterEach, describe, expect, it, vi } from "vitest";
import { TranscriptionError, transcribeAudio } from "./transcription";

describe("OpenRouter transcription adapter", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends transient audio to OpenRouter using its multipart-compatible endpoint", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ text: "Remember to send the proposal." }), {
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(transcribeAudio({ audio: new Blob(["audio"], { type: "audio/webm" }), mimeType: "audio/webm" })).resolves.toBe(
      "Remember to send the proposal.",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://openrouter.ai/api/v1/audio/transcriptions",
      expect.objectContaining({ method: "POST", headers: { Authorization: "Bearer test-key" } }),
    );
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = request.body as FormData;
    expect(body.get("model")).toBe("openai/gpt-4o-transcribe");
    expect(body.get("response_format")).toBe("json");
    expect(body.get("file")).toBeInstanceOf(File);
  });

  it("requires the existing OpenRouter server credential", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");

    await expect(transcribeAudio({ audio: new Blob(["audio"]), mimeType: "audio/webm" })).rejects.toEqual(
      new TranscriptionError("transcription_not_configured", "Voice transcription is not configured yet."),
    );
  });
});
