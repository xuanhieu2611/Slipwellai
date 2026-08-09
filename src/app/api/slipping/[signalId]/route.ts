import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { signalActionSchema } from "@/lib/retainers";
import { requireUser } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ signalId: string }> },
) {
  const { signalId } = await context.params;
  const parsed = signalActionSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest("Choose a valid Slipping action.");
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  if (parsed.data.outcome === "cadence_changed") {
    const { data: existing } = await supabase
      .from("slipping_signals")
      .select("entity_type, entity_id")
      .eq("id", signalId)
      .maybeSingle();
    if (!existing) return badRequest("Signal not found.");
    if (existing.entity_type !== "task" && existing.entity_type !== "project")
      return badRequest("Cadence can only be changed for tasks and projects.");
    const table = existing.entity_type === "task" ? "tasks" : "projects";
    const { error: cadenceError } = await supabase
      .from(table)
      .update({ slipping_cadence_days: parsed.data.cadenceDays })
      .eq("id", existing.entity_id);
    if (cadenceError) return serverError();
  }
  const { data: signal, error } = await supabase
    .from("slipping_signals")
    .update({
      outcome: parsed.data.outcome,
      outcome_note: parsed.data.note ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", signalId)
    .select("retainer_id, entity_type, entity_id")
    .single();
  if (error || !signal) return serverError();
  const { error: activityError } = await supabase.from("activity_events").insert({
    entity_type: signal.entity_type,
    entity_id:
      signal.entity_type === "retainer_cycle_item" && signal.retainer_id
        ? signal.retainer_id
        : signal.entity_id,
    event_type: `slipping_${parsed.data.outcome}`,
  });
  if (activityError) return serverError();
  return NextResponse.json({ ok: true });
}
