import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { createCaptureSchema } from "@/lib/proposals/schema";
import { requireUser } from "@/lib/supabase/server";

/* This handler does one thing: durably store the words. Interpretation runs in
   POST /api/captures/[captureId]/interpret so the acknowledgement never waits on a
   model, and so a capture whose interpretation never starts stays a queued capture the
   Inbox can recover instead of a request that vanished with the tab. */
export async function POST(request: NextRequest) {
  const parsed = createCaptureSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest("Enter a capture of up to 10,000 characters.");

  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const { data: capture, error } = await supabase
    .from("captures")
    .insert({
      original_text: parsed.data.text,
      status: "queued",
      idempotency_key: parsed.data.idempotencyKey,
    })
    .select("id, status")
    .single();

  if (error?.code === "23505") {
    // Same key, same capture: return the original instead of a bare "duplicate" the
    // client cannot act on, so a retried submission converges on one capture.
    const { data: existing } = await supabase
      .from("captures")
      .select("id, status")
      .eq("idempotency_key", parsed.data.idempotencyKey)
      .maybeSingle();
    if (existing)
      return NextResponse.json({
        captureId: existing.id,
        status: existing.status,
        duplicate: true,
      });
  }
  if (error || !capture) return serverError();

  return NextResponse.json({ captureId: capture.id, status: capture.status });
}
