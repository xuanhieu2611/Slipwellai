import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { slippingExplanation } from "@/lib/retainers";
import { requireUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  if (!body || typeof body !== "object" || !("retainerId" in body) || typeof body.retainerId !== "string") return badRequest("Choose a retainer to evaluate.");
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const { data: cycles } = await supabase
    .from("retainer_cycles")
    .select("id")
    .eq("retainer_id", body.retainerId)
    .order("cycle_start", { ascending: false })
    .limit(1);
  const cycle = cycles?.[0];
  if (!cycle) return badRequest("Generate a cycle first.");
  const { data: items } = await supabase.from("retainer_cycle_items").select("id, expected_on").eq("cycle_id", cycle.id).eq("status", "open");
  const { data: activity } = await supabase
    .from("activity_events")
    .select("occurred_at")
    .eq("entity_type", "retainer")
    .eq("entity_id", body.retainerId)
    .order("occurred_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let created = 0;
  for (const item of items ?? []) {
    const explanation = slippingExplanation({ expectedOn: item.expected_on, lastMeaningfulAttention: activity?.occurred_at });
    if (!explanation) continue;
    const { data: existing } = await supabase.from("slipping_signals").select("id").eq("cycle_item_id", item.id).eq("outcome", "open").maybeSingle();
    if (existing) continue;
    const { error } = await supabase.from("slipping_signals").insert({
      retainer_id: body.retainerId,
      cycle_item_id: item.id,
      reason: explanation.reason,
      severity: explanation.severity,
    });
    if (error) return serverError();
    created += 1;
  }
  return NextResponse.json({ ok: true, created });
}
