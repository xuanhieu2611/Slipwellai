import { z } from "zod";

export const maxVoiceCaptureDurationMs = 5 * 60 * 1_000;
export const maxVoiceCaptureBytes = 25 * 1024 * 1024;

const allowedAudioMimeTypes = ["audio/webm", "audio/mp4", "audio/ogg", "audio/mpeg"] as const;
export type AllowedAudioMimeType = (typeof allowedAudioMimeTypes)[number];

export function normalizedAudioMimeType(value: string): AllowedAudioMimeType | null {
  const mimeType = value.toLowerCase().split(";", 1)[0];
  return allowedAudioMimeTypes.includes(mimeType as AllowedAudioMimeType) ? mimeType as AllowedAudioMimeType : null;
}

export function validateVoiceCapture({ mimeType, byteSize, durationMs }: { mimeType: string; byteSize: number; durationMs: number }) {
  const normalizedMimeType = normalizedAudioMimeType(mimeType);
  if (!normalizedMimeType) return { ok: false as const, error: "This browser recorded an unsupported audio format." };
  if (!Number.isFinite(byteSize) || byteSize < 1 || byteSize > maxVoiceCaptureBytes) return { ok: false as const, error: "Voice captures must be smaller than 25 MB." };
  if (!Number.isFinite(durationMs) || durationMs < 1 || durationMs > maxVoiceCaptureDurationMs) return { ok: false as const, error: "Voice captures can be up to five minutes long." };
  return { ok: true as const, mimeType: normalizedMimeType };
}

export const createVoiceCaptureSchema = z.object({
  idempotencyKey: z.uuid(),
  mimeType: z.string().min(1).max(100),
  byteSize: z.number().int().positive().max(maxVoiceCaptureBytes),
  durationMs: z.number().int().positive().max(maxVoiceCaptureDurationMs),
}).superRefine((value, context) => {
  if (!normalizedAudioMimeType(value.mimeType)) context.addIssue({ code: "custom", path: ["mimeType"], message: "Unsupported audio format." });
});

export const updateVoiceTranscriptSchema = z.object({
  transcript: z.string().trim().min(1).max(10_000),
});
