import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { createRetainerSchema } from "@/lib/retainers";
import { requireUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const parsed = createRetainerSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest("Add a retainer name and one monthly deliverable.");
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const { data: retainer, error } = await supabase
    .from("retainers")
    .insert({ name: parsed.data.name, timezone: parsed.data.timezone, cycle_day: parsed.data.cycleDay })
    .select("id")
    .single();
  if (error || !retainer) return serverError();

  const { error: templateError } = await supabase.from("retainer_deliverable_templates").insert({
    retainer_id: retainer.id,
    title: parsed.data.deliverableTitle,
    expected_day: parsed.data.expectedDay,
  });
  if (templateError) return serverError();
  await supabase.from("activity_events").insert({ entity_type: "retainer", entity_id: retainer.id, event_type: "created" });
  return NextResponse.json({ ok: true, retainerId: retainer.id });
}
