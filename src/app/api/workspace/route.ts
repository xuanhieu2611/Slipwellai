import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { requireUser } from "@/lib/supabase/server";
import { workspaceCommandSchema } from "@/lib/workspace";

const relationTables = { domainId: "domains", projectId: "projects", personId: "people" } as const;

export async function POST(request: NextRequest) {
  const parsed = workspaceCommandSchema.safeParse(await request.json());
  if (!parsed.success) return badRequest("That workspace change was not valid.");
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();
  const command = parsed.data;

  async function verifyRelations(values: Partial<Record<keyof typeof relationTables, string | null | undefined>>) {
    for (const [key, table] of Object.entries(relationTables) as Array<[keyof typeof relationTables, (typeof relationTables)[keyof typeof relationTables]]>) {
      const value = values[key];
      if (!value) continue;
      const { data } = await supabase.from(table).select("id").eq("id", value).maybeSingle();
      if (!data) throw new Error("A linked record is unavailable.");
    }
  }

  try {
    if (command.action === "create_domain") {
      const { error } = await supabase.from("domains").insert({ name: command.name, description: command.description, color: command.color });
      if (error) throw error;
    } else if (command.action === "create_task") {
      await verifyRelations(command);
      const { error } = await supabase.from("tasks").insert({ title: command.title, details: command.details, due_on: command.dueOn ?? null, scheduled_for: command.scheduledFor ?? null, priority: command.priority, domain_id: command.domainId ?? null, project_id: command.projectId ?? null, person_id: command.personId ?? null });
      if (error) throw error;
    } else if (command.action === "create_project") {
      await verifyRelations(command);
      const { error } = await supabase.from("projects").insert({ name: command.name, description: command.description, domain_id: command.domainId ?? null, target_on: command.targetOn ?? null });
      if (error) throw error;
    } else if (command.action === "create_person") {
      await verifyRelations(command);
      const { error } = await supabase.from("people").insert({ name: command.name, context: command.context, domain_id: command.domainId ?? null });
      if (error) throw error;
    } else if (command.action === "create_note") {
      await verifyRelations(command);
      const { error } = await supabase.from("notes").insert({ title: command.title, body: command.body, domain_id: command.domainId ?? null, project_id: command.projectId ?? null, person_id: command.personId ?? null, review_on: command.reviewOn ?? null });
      if (error) throw error;
    } else if (command.action === "create_routine") {
      const { error } = await supabase.from("routines").insert({ name: command.name, period: command.period });
      if (error) throw error;
    } else if (command.action === "complete_task" || command.action === "reopen_task" || command.action === "defer_task") {
      const changes = command.action === "complete_task" ? { status: "completed", completed_at: new Date().toISOString(), deferred_until: null } : command.action === "reopen_task" ? { status: "open", completed_at: null } : { status: "open", deferred_until: command.until ?? null };
      const { error } = await supabase.from("tasks").update(changes).eq("id", command.taskId);
      if (error) throw error;
      const eventType = command.action === "complete_task" ? "completed" : command.action === "reopen_task" ? "reopened" : "deferred";
      await supabase.from("activity_events").insert({ entity_type: "task", entity_id: command.taskId, event_type: eventType, metadata: {} });
    } else if (command.action === "set_top_three") {
      const { data: selected } = await supabase.from("tasks").select("id, top_three_date").eq("id", command.taskId).maybeSingle();
      if (!selected) return badRequest("Task not found.");
      if (selected.top_three_date === command.localDate) return NextResponse.json({ ok: true });
      const { count } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("top_three_date", command.localDate);
      if ((count ?? 0) >= 3) return badRequest("Today already has three priorities. Remove one first.");
      const { error } = await supabase.from("tasks").update({ top_three_date: command.localDate, top_three_order: (count ?? 0) + 1 }).eq("id", command.taskId);
      if (error) throw error;
    } else if (command.action === "clear_top_three") {
      const { error } = await supabase.from("tasks").update({ top_three_date: null, top_three_order: null }).eq("id", command.taskId);
      if (error) throw error;
    } else if (command.action === "resolve_routine") {
      const { error } = await supabase.from("routine_completions").upsert({ routine_id: command.routineId, local_date: command.localDate, outcome: command.outcome }, { onConflict: "routine_id,local_date" });
      if (error) throw error;
    }
  } catch {
    return serverError();
  }
  return NextResponse.json({ ok: true });
}
