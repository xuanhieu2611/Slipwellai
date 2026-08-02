import { NextRequest, NextResponse } from "next/server";
import { interpretCapture } from "@/lib/captures";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { createCaptureSchema } from "@/lib/proposals/schema";
import { requireUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const parsed = createCaptureSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest("Enter a capture of up to 10,000 characters.");

  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const { data: capture, error } = await supabase
    .from("captures")
    .insert({ original_text: parsed.data.text, idempotency_key: parsed.data.idempotencyKey })
    .select("id, original_text")
    .single();

  if (error?.code === "23505") {
    return NextResponse.json({ status: "duplicate" });
  }
  if (error || !capture) return serverError();

  const result = await interpretCapture({ supabase, capture });
  return NextResponse.json({ captureId: capture.id, status: result.error ? "needs_review" : "ready", warning: result.error });
}
