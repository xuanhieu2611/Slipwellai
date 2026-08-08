import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { DEFAULT_TIMEZONE } from "@/lib/proposals/dates";
import { slippingExplanation } from "@/lib/retainers";
import { coreSlippingExplanation } from "@/lib/slipping";
import { requireUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body: unknown = await request.json();
  if (!body || typeof body !== "object") return badRequest("Choose what to evaluate.");
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  if ("scope" in body && body.scope === "core") {
    const [tasksResult, projectsResult, activityResult, preferencesResult] = await Promise.all([
      supabase.from("tasks").select("id, title, created_at, priority, due_on, slipping_cadence_days").eq("status", "open").is("archived_at", null),
      supabase.from("projects").select("id, name, created_at, target_on, slipping_cadence_days").eq("status", "active").is("archived_at", null),
      supabase.from("activity_events").select("entity_type, entity_id, occurred_at").in("entity_type", ["task", "project"]).order("occurred_at", { ascending: false }),
      supabase.from("user_preferences").select("timezone").maybeSingle(),
    ]);
    if (tasksResult.error || projectsResult.error || activityResult.error) return serverError();
    const timezone = preferencesResult.data?.timezone ?? DEFAULT_TIMEZONE;
    const lastAttention = new Map<string, string>();
    for (const event of activityResult.data ?? []) {
      const key = `${event.entity_type}:${event.entity_id}`;
      if (!lastAttention.has(key)) lastAttention.set(key, event.occurred_at);
    }
    let created = 0;
    const entities = [
      ...(tasksResult.data ?? []).map((task) => ({ entityType: "task" as const, entityId: task.id, title: task.title, createdAt: task.created_at, priority: task.priority, dueOn: task.due_on, cadenceDays: task.slipping_cadence_days ?? 14 })),
      ...(projectsResult.data ?? []).map((project) => ({ entityType: "project" as const, entityId: project.id, title: project.name, createdAt: project.created_at, dueOn: project.target_on, cadenceDays: project.slipping_cadence_days ?? 7 })),
    ];
    for (const entity of entities) {
      const explanation = coreSlippingExplanation({ ...entity, lastMeaningfulAttention: lastAttention.get(`${entity.entityType}:${entity.entityId}`) }, timezone);
      if (!explanation) continue;
      const { error } = await supabase.from("slipping_signals").insert({ entity_type: entity.entityType, entity_id: entity.entityId, reason: explanation.reason, severity: explanation.severity, cadence_days: entity.cadenceDays });
      if (error) {
        if (error.code === "23505") continue;
        return serverError();
      }
      created += 1;
    }
    return NextResponse.json({ ok: true, created });
  }
  if (!("retainerId" in body) || typeof body.retainerId !== "string") return badRequest("Choose a retainer to evaluate.");
  const { data: retainer } = await supabase.from("retainers").select("timezone").eq("id", body.retainerId).maybeSingle();
  if (!retainer) return badRequest("Retainer not found.");
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
    const explanation = slippingExplanation({ expectedOn: item.expected_on, lastMeaningfulAttention: activity?.occurred_at, timezone: retainer.timezone });
    if (!explanation) continue;
    const { error } = await supabase.from("slipping_signals").insert({
      retainer_id: body.retainerId,
      cycle_item_id: item.id,
      entity_type: "retainer_cycle_item",
      entity_id: item.id,
      reason: explanation.reason,
      severity: explanation.severity,
    });
    if (error) {
      if (error.code === "23505") continue;
      return serverError();
    }
    created += 1;
  }
  return NextResponse.json({ ok: true, created });
}
