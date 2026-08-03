import { describe, expect, it } from "vitest";
import { createVoiceCaptureSchema, maxVoiceCaptureBytes, maxVoiceCaptureDurationMs, normalizedAudioMimeType, validateVoiceCapture } from "./voice";

describe("voice capture validation", () => {
  it("normalizes recorder codec parameters before validating the stored format", () => {
    expect(normalizedAudioMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
  });

  it("rejects unsupported, empty, oversized, and overlong recordings", () => {
    expect(validateVoiceCapture({ mimeType: "audio/wav", byteSize: 12, durationMs: 1_000 }).ok).toBe(false);
    expect(validateVoiceCapture({ mimeType: "audio/webm", byteSize: 0, durationMs: 1_000 }).ok).toBe(false);
    expect(validateVoiceCapture({ mimeType: "audio/webm", byteSize: maxVoiceCaptureBytes + 1, durationMs: 1_000 }).ok).toBe(false);
    expect(validateVoiceCapture({ mimeType: "audio/webm", byteSize: 12, durationMs: maxVoiceCaptureDurationMs + 1 }).ok).toBe(false);
  });

  it("requires an idempotency identifier at the API boundary", () => {
    const input = { idempotencyKey: "22222222-2222-4222-8222-222222222222", mimeType: "audio/mp4", byteSize: 100, durationMs: 2_000 };
    expect(createVoiceCaptureSchema.safeParse(input).success).toBe(true);
    expect(createVoiceCaptureSchema.safeParse({ ...input, idempotencyKey: "not-an-id" }).success).toBe(false);
  });
});
