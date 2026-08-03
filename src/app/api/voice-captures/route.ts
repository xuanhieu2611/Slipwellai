import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";
import { captureAudioPath, createVoiceCaptureSchema } from "@/lib/voice";

export async function POST(request: NextRequest) {
  const parsed = createVoiceCaptureSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest("That recording is too large, too long, or uses an unsupported audio format.");
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const idempotencyKey = parsed.data.idempotencyKey;
  const { data: existing } = await supabase
    .from("captures")
    .select("id, audio_storage_path")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();
  if (existing?.audio_storage_path) return NextResponse.json({ captureId: existing.id, storagePath: existing.audio_storage_path, status: "duplicate" });

  const storagePath = captureAudioPath(user.id, parsed.data.captureId, parsed.data.mimeType);
  const { data: capture, error } = await supabase
    .from("captures")
    .insert({
      id: parsed.data.captureId,
      original_text: null,
      source_type: "voice",
      status: "uploading",
      idempotency_key: idempotencyKey,
      audio_storage_path: storagePath,
      audio_mime_type: parsed.data.mimeType.split(";", 1)[0],
      audio_byte_size: parsed.data.byteSize,
      audio_duration_ms: parsed.data.durationMs,
    })
    .select("id")
    .single();

  if (error?.code === "23505") {
    const { data: duplicate } = await supabase.from("captures").select("id, audio_storage_path").eq("idempotency_key", idempotencyKey).single();
    if (duplicate?.audio_storage_path) return NextResponse.json({ captureId: duplicate.id, storagePath: duplicate.audio_storage_path, status: "duplicate" });
  }
  if (error || !capture) return serverError();

  return NextResponse.json({ captureId: capture.id, storagePath, status: "uploading" });
}
