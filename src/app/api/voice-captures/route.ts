import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";
import { createVoiceCaptureSchema, validateVoiceCapture } from "@/lib/voice";
import { TranscriptionError, transcribeAudio } from "@/lib/transcription";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const audio = formData.get("audio");
  const parsed = createVoiceCaptureSchema.safeParse({
    idempotencyKey: formData.get("idempotencyKey"),
    mimeType: audio instanceof File ? audio.type : "",
    byteSize: audio instanceof File ? audio.size : 0,
    durationMs: Number(formData.get("durationMs")),
  });
  if (!parsed.success) return badRequest("That recording is too large, too long, or uses an unsupported audio format.");
  if (!(audio instanceof File)) return badRequest("Choose a voice recording to transcribe.");
  const validated = validateVoiceCapture(parsed.data);
  if (!validated.ok) return badRequest(validated.error);
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const idempotencyKey = parsed.data.idempotencyKey;
  const { data: existing } = await supabase
    .from("captures")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing) return NextResponse.json({ captureId: existing.id, status: "duplicate" });

  const startedAt = Date.now();
  let transcript: string;
  try {
    transcript = await transcribeAudio({ audio, mimeType: validated.mimeType });
  } catch (error) {
    const message = error instanceof TranscriptionError && error.code === "transcription_not_configured"
      ? "Voice transcription is not configured. Please use text capture instead."
      : "Voice transcription failed and the recording was discarded. Please use text capture instead.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
  if (transcript.length > 10_000) return badRequest("The transcript is too long to capture safely. Please use text capture instead.");

  const { data: capture, error } = await supabase
    .from("captures")
    .insert({
      original_text: transcript,
      source_type: "voice",
      status: "queued",
      idempotency_key: idempotencyKey,
      transcription_model: env.openRouterTranscriptionModel(),
      transcription_latency_ms: Date.now() - startedAt,
    })
    .select("id, status")
    .single();

  if (error?.code === "23505") {
    const { data: duplicate } = await supabase.from("captures").select("id, status").eq("idempotency_key", idempotencyKey).single();
    if (duplicate) return NextResponse.json({ captureId: duplicate.id, status: duplicate.status, duplicate: true });
  }
  if (error || !capture) return serverError();

  /* The transcript is the source and is now stored. Interpretation runs as its own
     request, the same as typed capture, so a queued voice capture stays recoverable. */
  return NextResponse.json({ captureId: capture.id, status: capture.status });
}
