import { describe, expect, it } from "vitest";
import { captureAudioPath, createVoiceCaptureSchema, maxVoiceCaptureBytes, maxVoiceCaptureDurationMs, normalizedAudioMimeType, validateVoiceCapture } from "./voice";

describe("voice capture validation", () => {
  it("normalizes recorder codec parameters before validating the stored format", () => {
    expect(normalizedAudioMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(captureAudioPath("11111111-1111-4111-8111-111111111111", "22222222-2222-4222-8222-222222222222", "audio/webm;codecs=opus")).toContain("original.webm");
  });

  it("rejects unsupported, empty, oversized, and overlong recordings", () => {
    expect(validateVoiceCapture({ mimeType: "audio/wav", byteSize: 12, durationMs: 1_000 }).ok).toBe(false);
    expect(validateVoiceCapture({ mimeType: "audio/webm", byteSize: 0, durationMs: 1_000 }).ok).toBe(false);
    expect(validateVoiceCapture({ mimeType: "audio/webm", byteSize: maxVoiceCaptureBytes + 1, durationMs: 1_000 }).ok).toBe(false);
    expect(validateVoiceCapture({ mimeType: "audio/webm", byteSize: 12, durationMs: maxVoiceCaptureDurationMs + 1 }).ok).toBe(false);
  });

  it("requires independent capture and idempotency identifiers at the API boundary", () => {
    const input = { captureId: "11111111-1111-4111-8111-111111111111", idempotencyKey: "22222222-2222-4222-8222-222222222222", mimeType: "audio/mp4", byteSize: 100, durationMs: 2_000 };
    expect(createVoiceCaptureSchema.safeParse(input).success).toBe(true);
    expect(createVoiceCaptureSchema.safeParse({ ...input, captureId: "not-an-id" }).success).toBe(false);
  });
});
