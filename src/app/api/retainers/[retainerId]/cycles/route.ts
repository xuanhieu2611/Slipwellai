import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { cycleBounds, expectedDate, generateCycleSchema } from "@/lib/retainers";
import { requireUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest, context: { params: Promise<{ retainerId: string }> }) {
  const { retainerId } = await context.params;
  const parsed = generateCycleSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest("Choose a calendar month to generate.");
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const { data: retainer } = await supabase.from("retainers").select("id, cycle_day, status").eq("id", retainerId).single();
  if (!retainer || retainer.status !== "active") return badRequest("That retainer is not active.");

  const bounds = cycleBounds(parsed.data.cycleMonth, retainer.cycle_day);
  const { data: cycle, error: cycleError } = await supabase
    .from("retainer_cycles")
    .upsert({ retainer_id: retainer.id, cycle_start: bounds.start, cycle_end: bounds.end }, { onConflict: "retainer_id,cycle_start" })
    .select("id, cycle_start")
    .single();
  if (cycleError || !cycle) return serverError();

  const { data: existingItems } = await supabase.from("retainer_cycle_items").select("id").eq("cycle_id", cycle.id).limit(1);
  if ((existingItems ?? []).length === 0) {
    const { data: templates } = await supabase
      .from("retainer_deliverable_templates")
      .select("id, title, expected_day, carry_forward")
      .eq("retainer_id", retainer.id);
    const items = (templates ?? []).map((template) => ({
      cycle_id: cycle.id,
      template_id: template.id,
      title: template.title,
      expected_on: expectedDate(parsed.data.cycleMonth, template.expected_day),
    }));
    if (items.length > 0) {
      const { error: itemError } = await supabase.from("retainer_cycle_items").insert(items);
      if (itemError) return serverError();
    }

    const { data: priorCycle } = await supabase
      .from("retainer_cycles")
      .select("id")
      .eq("retainer_id", retainer.id)
      .lt("cycle_start", cycle.cycle_start)
      .order("cycle_start", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (priorCycle) {
      const { data: priorItems } = await supabase
        .from("retainer_cycle_items")
        .select("id, title, expected_on, status, template_id")
        .eq("cycle_id", priorCycle.id)
        .eq("status", "open");
      const carryForward = (priorItems ?? []).map((item) => ({
        cycle_id: cycle.id,
        template_id: item.template_id,
        carried_from_item_id: item.id,
        title: `${item.title} (carried forward)`,
        expected_on: bounds.start,
      }));
      if (carryForward.length > 0) {
        const { error: carryError } = await supabase.from("retainer_cycle_items").insert(carryForward);
        if (carryError) return serverError();
        const priorIds = (priorItems ?? []).map((item) => item.id);
        await supabase.from("retainer_cycle_items").update({ status: "carried_forward" }).in("id", priorIds);
      }
    }
  }

  await supabase.from("activity_events").insert({ entity_type: "retainer", entity_id: retainer.id, event_type: "cycle_generated", metadata: { cycleId: cycle.id } });
  return NextResponse.json({ ok: true, cycleId: cycle.id, cycleStart: cycle.cycle_start });
}
