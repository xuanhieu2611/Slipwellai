import { NextRequest, NextResponse } from "next/server";
import { claimCaptureForInterpretation, interpretCapture } from "@/lib/captures";
import { badRequest, unauthorized } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";

/* Interpretation is a separate, repeatable request against a stored capture. Claiming
   the capture is what makes it idempotent: two tabs, a double click, or a retry after a
   timeout all resolve to one interpretation, and whoever loses the claim simply reports
   the current state. */
export async function POST(_request: NextRequest, context: { params: Promise<{ captureId: string }> }) {
  const { captureId } = await context.params;
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const claimed = await claimCaptureForInterpretation({ supabase, captureId, reason: "queued" });
  if (!claimed) {
    const { data: capture } = await supabase.from("captures").select("status").eq("id", captureId).maybeSingle();
    if (!capture) return badRequest("That capture was not found.");
    return NextResponse.json({ captureId, status: capture.status, claimed: false });
  }

  const result = await interpretCapture({ supabase, capture: claimed });
  return NextResponse.json({ captureId, status: "needs_review", claimed: true, warning: result.error });
}
