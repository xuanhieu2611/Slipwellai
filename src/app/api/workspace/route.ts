import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { nextRecurrenceDate, type RecurrenceRule } from "@/lib/recurrence";
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

  async function recordActivity(entityType: string, entityId: string, eventType: string, metadata: Record<string, string> = {}) {
    const { error } = await supabase.from("activity_events").insert({ entity_type: entityType, entity_id: entityId, event_type: eventType, metadata });
    if (error) throw error;
  }

  try {
    if (command.action === "create_domain") {
      const { error } = await supabase.from("domains").insert({ name: command.name, description: command.description, color: command.color });
      if (error) throw error;
    } else if (command.action === "create_task") {
      await verifyRelations(command);
      const recurrenceRule = command.recurrenceRule === "none" ? null : command.recurrenceRule;
      const { data: task, error } = await supabase.from("tasks").insert({ title: command.title, details: command.details, due_on: command.dueOn ?? null, scheduled_for: command.scheduledFor ?? null, priority: command.priority, recurrence_rule: recurrenceRule, recurrence_anchor: recurrenceRule ? command.scheduledFor : null, domain_id: command.domainId ?? null, project_id: command.projectId ?? null, person_id: command.personId ?? null }).select("id").single();
      if (error || !task) throw error ?? new Error("Task creation failed.");
      if (recurrenceRule) {
        const { error: rootError } = await supabase.from("tasks").update({ recurrence_root_id: task.id }).eq("id", task.id);
        if (rootError) throw rootError;
      }
      if (command.projectId) await recordActivity("project", command.projectId, "task_created", { taskId: task.id });
    } else if (command.action === "create_project") {
      await verifyRelations(command);
      const { data: project, error } = await supabase.from("projects").insert({ name: command.name, description: command.description, domain_id: command.domainId ?? null, target_on: command.targetOn ?? null }).select("id").single();
      if (error || !project) throw error ?? new Error("Project creation failed.");
      await recordActivity("project", project.id, "created");
    } else if (command.action === "create_milestone") {
      const { data: project } = await supabase.from("projects").select("id").eq("id", command.projectId).maybeSingle();
      if (!project) return badRequest("Project not found.");
      const { count } = await supabase.from("project_milestones").select("id", { count: "exact", head: true }).eq("project_id", command.projectId);
      const { error } = await supabase.from("project_milestones").insert({ project_id: command.projectId, title: command.title, position: (count ?? 0) + 1 });
      if (error) throw error;
      await recordActivity("project", command.projectId, "milestone_created");
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
      const { data: task } = await supabase.from("tasks").select("id, title, details, priority, due_on, scheduled_for, recurrence_rule, recurrence_root_id, recurrence_anchor, domain_id, project_id, person_id, source_capture_id").eq("id", command.taskId).maybeSingle();
      if (!task) return badRequest("Task not found.");
      if (command.action === "complete_task" && task.recurrence_rule && task.recurrence_anchor) {
        const rule = task.recurrence_rule as RecurrenceRule;
        const rootId = task.recurrence_root_id ?? task.id;
        const nextAnchor = nextRecurrenceDate(task.recurrence_anchor, rule);
        const { data: existing, error: existingError } = await supabase.from("tasks").select("id").eq("recurrence_root_id", rootId).eq("recurrence_anchor", nextAnchor).maybeSingle();
        if (existingError) throw existingError;
        if (!existing) {
          const { error: nextError } = await supabase.from("tasks").insert({ title: task.title, details: task.details, priority: task.priority, due_on: task.due_on ? nextRecurrenceDate(task.due_on, rule) : null, scheduled_for: task.scheduled_for ? nextRecurrenceDate(task.scheduled_for, rule) : null, recurrence_rule: rule, recurrence_root_id: rootId, recurrence_anchor: nextAnchor, domain_id: task.domain_id, project_id: task.project_id, person_id: task.person_id, source_capture_id: task.source_capture_id });
          if (nextError && nextError.code !== "23505") throw nextError;
        }
      }
      const changes = command.action === "complete_task" ? { status: "completed", completed_at: new Date().toISOString(), deferred_until: null } : command.action === "reopen_task" ? { status: "open", completed_at: null } : { status: "open", deferred_until: command.until ?? null };
      const { error } = await supabase.from("tasks").update(changes).eq("id", command.taskId);
      if (error) throw error;
      const eventType = command.action === "complete_task" ? "completed" : command.action === "reopen_task" ? "reopened" : "deferred";
      await recordActivity("task", command.taskId, eventType);
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
    } else if (command.action === "complete_milestone" || command.action === "reopen_milestone") {
      const { data: milestone } = await supabase.from("project_milestones").select("id, project_id").eq("id", command.milestoneId).maybeSingle();
      if (!milestone) return badRequest("Milestone not found.");
      const { error } = await supabase.from("project_milestones").update(command.action === "complete_milestone" ? { status: "completed", completed_at: new Date().toISOString() } : { status: "open", completed_at: null }).eq("id", milestone.id);
      if (error) throw error;
      await recordActivity("project", milestone.project_id, command.action === "complete_milestone" ? "milestone_completed" : "milestone_reopened");
    } else if (command.action === "record_project_progress" || command.action === "pause_project" || command.action === "complete_project") {
      const { data: project } = await supabase.from("projects").select("id").eq("id", command.projectId).maybeSingle();
      if (!project) return badRequest("Project not found.");
      if (command.action === "complete_project") {
        const { count } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", project.id).eq("status", "open");
        if ((count ?? 0) > 0) return badRequest("Resolve this project’s open tasks before completing it.");
      }
      if (command.action !== "record_project_progress") {
        const { error } = await supabase.from("projects").update({ status: command.action === "pause_project" ? "paused" : "completed" }).eq("id", project.id);
        if (error) throw error;
      }
      const eventType = command.action === "record_project_progress" ? "progress_recorded" : command.action === "pause_project" ? "paused" : "completed";
      await recordActivity("project", project.id, eventType);
    }
  } catch {
    return serverError();
  }
  return NextResponse.json({ ok: true });
}
