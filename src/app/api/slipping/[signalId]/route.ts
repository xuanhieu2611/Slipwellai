import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { signalActionSchema } from "@/lib/retainers";
import { requireUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest, context: { params: Promise<{ signalId: string }> }) {
  const { signalId } = await context.params;
  const parsed = signalActionSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest("Choose a valid Slipping action.");
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const { data: signal, error } = await supabase
    .from("slipping_signals")
    .update({ outcome: parsed.data.outcome, outcome_note: parsed.data.note ?? null, resolved_at: new Date().toISOString() })
    .eq("id", signalId)
    .select("retainer_id, entity_type, entity_id")
    .single();
  if (error || !signal) return serverError();
  const { error: activityError } = await supabase.from("activity_events").insert({
    entity_type: signal.entity_type,
    entity_id: signal.entity_type === "retainer" && signal.retainer_id ? signal.retainer_id : signal.entity_id,
    event_type: `slipping_${parsed.data.outcome}`,
  });
  if (activityError) return serverError();
  return NextResponse.json({ ok: true });
}
