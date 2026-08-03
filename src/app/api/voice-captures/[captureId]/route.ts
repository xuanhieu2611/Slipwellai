import { NextRequest, NextResponse } from "next/server";
import { interpretCapture } from "@/lib/captures";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { TranscriptionError, transcribeAudio } from "@/lib/transcription";
import { updateVoiceTranscriptSchema } from "@/lib/voice";
import { requireUser } from "@/lib/supabase/server";

async function getVoiceCapture(captureId: string) {
  const { supabase, user } = await requireUser();
  if (!user) return { supabase, capture: null, response: unauthorized() };
  const { data: capture, error } = await supabase
    .from("captures")
    .select("id, source_type, status, audio_storage_path, audio_mime_type, transcript_text")
    .eq("id", captureId)
    .maybeSingle();
  if (error || !capture || capture.source_type !== "voice" || !capture.audio_storage_path || capture.audio_storage_path === "pending") {
    return { supabase, capture: null, response: badRequest("Voice capture not found.") };
  }
  return { supabase, capture, response: null };
}

export async function GET(_request: NextRequest, context: { params: Promise<{ captureId: string }> }) {
  const { captureId } = await context.params;
  const lookup = await getVoiceCapture(captureId);
  if (lookup.response || !lookup.capture) return lookup.response;
  const { data, error } = await lookup.supabase.storage.from("capture-audio").createSignedUrl(lookup.capture.audio_storage_path, 60);
  if (error || !data?.signedUrl) return serverError();
  return NextResponse.json({ url: data.signedUrl, expiresInSeconds: 60 });
}

export async function POST(_request: NextRequest, context: { params: Promise<{ captureId: string }> }) {
  const { captureId } = await context.params;
  const lookup = await getVoiceCapture(captureId);
  if (lookup.response || !lookup.capture) return lookup.response;
  const { supabase, capture } = lookup;
  if (!capture.audio_mime_type) return badRequest("Voice capture metadata is incomplete.");

  await supabase.from("captures").update({ status: "transcribing", failure_code: null }).eq("id", capture.id);
  const startedAt = Date.now();
  try {
    const { data: audio, error: downloadError } = await supabase.storage.from("capture-audio").download(capture.audio_storage_path);
    if (downloadError || !audio) throw new TranscriptionError("transcription_provider_error", "The original recording could not be loaded.");
    const transcript = await transcribeAudio({ audio, mimeType: capture.audio_mime_type });
    const { error: transcriptError } = await supabase
      .from("captures")
      .update({ transcript_text: transcript, transcription_model: process.env.OPENAI_TRANSCRIPTION_MODEL ?? "gpt-4o-mini-transcribe", transcription_latency_ms: Date.now() - startedAt, status: "interpreting" })
      .eq("id", capture.id);
    if (transcriptError) throw transcriptError;
    const result = await interpretCapture({ supabase, capture: { id: capture.id, original_text: transcript } });
    return NextResponse.json({ captureId: capture.id, status: result.error ? "needs_review" : "needs_review", warning: result.error });
  } catch (error) {
    const failureCode = error instanceof TranscriptionError ? error.code : "transcription_provider_error";
    await supabase
      .from("captures")
      .update({ status: "failed", failure_code: failureCode, transcription_latency_ms: Date.now() - startedAt })
      .eq("id", capture.id);
    return NextResponse.json({ captureId: capture.id, status: "failed", warning: "The original recording is preserved. Retry transcription when you are ready." });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ captureId: string }> }) {
  const parsed = updateVoiceTranscriptSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest("Enter a transcript of up to 10,000 characters.");
  const { captureId } = await context.params;
  const lookup = await getVoiceCapture(captureId);
  if (lookup.response || !lookup.capture) return lookup.response;
  const { supabase, capture } = lookup;
  const [captureUpdate, proposalUpdate] = await Promise.all([
    supabase.from("captures").update({ transcript_text: parsed.data.transcript, status: "interpreting", failure_code: null }).eq("id", capture.id),
    supabase.from("proposals").update({ status: "superseded" }).eq("capture_id", capture.id).in("status", ["ready", "failed"]),
  ]);
  if (captureUpdate.error || proposalUpdate.error) return serverError();
  const result = await interpretCapture({ supabase, capture: { id: capture.id, original_text: parsed.data.transcript } });
  return NextResponse.json({ captureId: capture.id, status: "needs_review", warning: result.error });
}
