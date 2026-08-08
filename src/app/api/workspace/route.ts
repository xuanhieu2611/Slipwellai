import { NextRequest, NextResponse } from "next/server";
import { badRequest, serverError, unauthorized } from "@/lib/http";
import { nextRecurrenceDate, type RecurrenceRule } from "@/lib/recurrence";
import { cycleBounds, expectedDate } from "@/lib/retainers";
import { requireUser } from "@/lib/supabase/server";
import { workspaceCommandSchema } from "@/lib/workspace";

const relationTables = { domainId: "domains", projectId: "projects", personId: "people", retainerId: "retainers" } as const;

export async function POST(request: NextRequest) {
  const parsed = workspaceCommandSchema.safeParse(await request.json());
  if (!parsed.success) {
    /* Name the offending field: a bare rejection gives the person no way to tell which input to fix. */
    const field = parsed.error.issues[0]?.path.filter((segment) => typeof segment === "string").join(".");
    return badRequest(field ? `That workspace change was not valid (${field}).` : "That workspace change was not valid.");
  }
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
      const { data: task, error } = await supabase.from("tasks").insert({ title: command.title, details: command.details, due_on: command.dueOn ?? null, scheduled_for: command.scheduledFor ?? null, priority: command.priority, recurrence_rule: recurrenceRule, recurrence_anchor: recurrenceRule ? command.scheduledFor : null, recurrence_interval: recurrenceRule === "custom" ? command.recurrenceInterval : null, recurrence_unit: recurrenceRule === "custom" ? command.recurrenceUnit : null, tags: command.tags, domain_id: command.domainId ?? null, project_id: command.projectId ?? null, person_id: command.personId ?? null, retainer_id: command.retainerId ?? null, slipping_cadence_days: command.slippingCadenceDays ?? null, idempotency_key: command.idempotencyKey }).select("id").single();
      if (error?.code === "23505") {
        // Same key, same owner: a retried double-submit converges on the task already created instead of a second one.
        const { data: existing } = await supabase.from("tasks").select("id").eq("idempotency_key", command.idempotencyKey).maybeSingle();
        if (existing) return NextResponse.json({ ok: true, duplicate: true });
      }
      if (error || !task) throw error ?? new Error("Task creation failed.");
      if (recurrenceRule) {
        const { error: rootError } = await supabase.from("tasks").update({ recurrence_root_id: task.id }).eq("id", task.id);
        if (rootError) throw rootError;
      }
      if (command.projectId) await recordActivity("project", command.projectId, "task_created", { taskId: task.id });
    } else if (command.action === "update_task") {
      const { data: task } = await supabase.from("tasks").select("id").eq("id", command.taskId).maybeSingle();
      if (!task) return badRequest("Task not found.");
      await verifyRelations(command);
      const { error } = await supabase.from("tasks").update({ title: command.title, details: command.details, due_on: command.dueOn ?? null, scheduled_for: command.scheduledFor ?? null, priority: command.priority, tags: command.tags, domain_id: command.domainId ?? null, project_id: command.projectId ?? null, person_id: command.personId ?? null, retainer_id: command.retainerId ?? null, slipping_cadence_days: command.slippingCadenceDays ?? null }).eq("id", command.taskId);
      if (error) throw error;
    } else if (command.action === "delete_task" || command.action === "restore_task") {
      /* Both toggle archived_at, the same soft-delete flag every other entity in this schema already
         uses; every read query already filters on archived_at is null, so setting it is the whole
         deletion mechanism and clearing it is the whole recovery mechanism. There is no permanent-purge
         path yet — that is out of scope until Step 12 (export/deletion). */
      const { data: task } = await supabase.from("tasks").select("id").eq("id", command.taskId).maybeSingle();
      if (!task) return badRequest("Task not found.");
      const { error } = await supabase.from("tasks").update({ archived_at: command.action === "delete_task" ? new Date().toISOString() : null }).eq("id", command.taskId);
      if (error) throw error;
      await recordActivity("task", command.taskId, command.action === "delete_task" ? "deleted" : "restored");
    } else if (command.action === "archive_domain") {
      const { data: domain } = await supabase.from("domains").select("id").eq("id", command.domainId).maybeSingle();
      if (!domain) return badRequest("Domain not found.");
      const [openTasks, activeProjects, people, notes] = await Promise.all([
        supabase.from("tasks").select("id", { count: "exact", head: true }).eq("domain_id", command.domainId).eq("status", "open").is("archived_at", null),
        supabase.from("projects").select("id", { count: "exact", head: true }).eq("domain_id", command.domainId).in("status", ["planned", "active", "paused"]).is("archived_at", null),
        supabase.from("people").select("id", { count: "exact", head: true }).eq("domain_id", command.domainId).is("archived_at", null),
        supabase.from("notes").select("id", { count: "exact", head: true }).eq("domain_id", command.domainId).is("archived_at", null),
      ]);
      if (openTasks.error || activeProjects.error || people.error || notes.error) throw openTasks.error ?? activeProjects.error ?? people.error ?? notes.error;
      const counts = { tasks: openTasks.count ?? 0, projects: activeProjects.count ?? 0, people: people.count ?? 0, notes: notes.count ?? 0 };
      // Require an explicit resolution rather than silently orphaning or hiding linked records: block with a clear count instead of a full reassignment UI.
      if (counts.tasks + counts.projects + counts.people + counts.notes > 0) {
        const parts: string[] = [];
        if (counts.tasks) parts.push(`${counts.tasks} open task${counts.tasks === 1 ? "" : "s"}`);
        if (counts.projects) parts.push(`${counts.projects} active project${counts.projects === 1 ? "" : "s"}`);
        if (counts.people) parts.push(`${counts.people} linked ${counts.people === 1 ? "person" : "people"}`);
        if (counts.notes) parts.push(`${counts.notes} linked note${counts.notes === 1 ? "" : "s"}`);
        return badRequest(`This domain still has ${parts.join(", ")}. Reassign or resolve them before archiving.`);
      }
      const { error } = await supabase.from("domains").update({ archived_at: new Date().toISOString() }).eq("id", command.domainId);
      if (error) throw error;
    } else if (command.action === "create_project") {
      await verifyRelations(command);
      const { data: project, error } = await supabase.from("projects").insert({ name: command.name, description: command.description, domain_id: command.domainId ?? null, person_id: command.personId ?? null, start_on: command.startOn ?? null, target_on: command.targetOn ?? null, slipping_cadence_days: command.slippingCadenceDays ?? null, idempotency_key: command.idempotencyKey }).select("id").single();
      if (error?.code === "23505") {
        // Same key, same owner: a retried double-submit converges on the project already created instead of a second one.
        const { data: existing } = await supabase.from("projects").select("id").eq("idempotency_key", command.idempotencyKey).maybeSingle();
        if (existing) return NextResponse.json({ ok: true, duplicate: true });
      }
      if (error || !project) throw error ?? new Error("Project creation failed.");
      await recordActivity("project", project.id, "created");
    } else if (command.action === "update_project") {
      const { data: project } = await supabase.from("projects").select("id").eq("id", command.projectId).maybeSingle();
      if (!project) return badRequest("Project not found.");
      /* command.projectId here is the project being edited, not a relation to verify — passing the
         whole command would collide with relationTables' unrelated "projectId" (a task/note's project
         link), so only the actual FK fields go through the ownership check. */
      await verifyRelations({ domainId: command.domainId, personId: command.personId });
      const { error } = await supabase.from("projects").update({ name: command.name, description: command.description, domain_id: command.domainId ?? null, person_id: command.personId ?? null, start_on: command.startOn ?? null, target_on: command.targetOn ?? null, slipping_cadence_days: command.slippingCadenceDays ?? null }).eq("id", command.projectId);
      if (error) throw error;
    } else if (command.action === "resume_project") {
      const { data: project } = await supabase.from("projects").select("id, status").eq("id", command.projectId).maybeSingle();
      if (!project) return badRequest("Project not found.");
      if (project.status !== "paused") return badRequest("Only a paused project can be resumed.");
      const { error } = await supabase.from("projects").update({ status: "active" }).eq("id", command.projectId);
      if (error) throw error;
      await recordActivity("project", command.projectId, "resumed");
    } else if (command.action === "cancel_project") {
      const { data: project } = await supabase.from("projects").select("id").eq("id", command.projectId).maybeSingle();
      if (!project) return badRequest("Project not found.");
      const { error } = await supabase.from("projects").update({ status: "canceled" }).eq("id", command.projectId);
      if (error) throw error;
      await recordActivity("project", command.projectId, "canceled");
    } else if (command.action === "delete_project" || command.action === "restore_project") {
      /* Mirrors delete_task/restore_task: toggle the existing archived_at column, independent of
         status, so a canceled/completed project's history is preserved rather than overwritten. */
      const { data: project } = await supabase.from("projects").select("id").eq("id", command.projectId).maybeSingle();
      if (!project) return badRequest("Project not found.");
      const { error } = await supabase.from("projects").update({ archived_at: command.action === "delete_project" ? new Date().toISOString() : null }).eq("id", command.projectId);
      if (error) throw error;
      await recordActivity("project", command.projectId, command.action === "delete_project" ? "deleted" : "restored");
    } else if (command.action === "create_milestone") {
      const { data: project } = await supabase.from("projects").select("id").eq("id", command.projectId).maybeSingle();
      if (!project) return badRequest("Project not found.");
      const { count } = await supabase.from("project_milestones").select("id", { count: "exact", head: true }).eq("project_id", command.projectId);
      const { error } = await supabase.from("project_milestones").insert({ project_id: command.projectId, title: command.title, position: (count ?? 0) + 1 });
      if (error) throw error;
      await recordActivity("project", command.projectId, "milestone_created");
    } else if (command.action === "delete_milestone") {
      const { data: milestone } = await supabase.from("project_milestones").select("id, project_id").eq("id", command.milestoneId).maybeSingle();
      if (!milestone) return badRequest("Milestone not found.");
      const { error } = await supabase.from("project_milestones").delete().eq("id", command.milestoneId);
      if (error) throw error;
      await recordActivity("project", milestone.project_id, "milestone_deleted");
    } else if (command.action === "create_checklist_template") {
      const { error } = await supabase.from("project_checklist_templates").insert({ name: command.name, description: command.description });
      if (error) throw error;
    } else if (command.action === "delete_checklist_template") {
      // Soft delete, same as every other entity here: the archived_at filter already applied in
      // getWorkspaceData drops it from the library, and on-delete-restrict FKs stay untouched.
      const { data: template } = await supabase.from("project_checklist_templates").select("id").eq("id", command.templateId).maybeSingle();
      if (!template) return badRequest("Checklist template not found.");
      const { error } = await supabase.from("project_checklist_templates").update({ archived_at: new Date().toISOString() }).eq("id", command.templateId);
      if (error) throw error;
    } else if (command.action === "add_checklist_template_item") {
      const { data: template } = await supabase.from("project_checklist_templates").select("id, version").eq("id", command.templateId).is("archived_at", null).maybeSingle();
      if (!template) return badRequest("Checklist template not found.");
      const { count, error: countError } = await supabase.from("project_checklist_template_items").select("id", { count: "exact", head: true }).eq("template_id", template.id);
      if (countError) throw countError;
      const { error } = await supabase.from("project_checklist_template_items").insert({ template_id: template.id, title: command.title, position: (count ?? 0) + 1 });
      if (error) throw error;
      const { error: versionError } = await supabase.from("project_checklist_templates").update({ version: template.version + 1 }).eq("id", template.id);
      if (versionError) throw versionError;
    } else if (command.action === "update_checklist_template_item") {
      const { data: item } = await supabase.from("project_checklist_template_items").select("id, template_id").eq("id", command.itemId).is("archived_at", null).maybeSingle();
      if (!item) return badRequest("Checklist template item not found.");
      const { data: template } = await supabase.from("project_checklist_templates").select("id, version").eq("id", item.template_id).maybeSingle();
      if (!template) return badRequest("Checklist template not found.");
      const { error } = await supabase.from("project_checklist_template_items").update({ title: command.title }).eq("id", item.id);
      if (error) throw error;
      // Bumping the version, exactly like adding a step, keeps this future-applications-only by
      // default; applyToExisting is the explicit opt-in to also touch already-applied checklists.
      const { error: versionError } = await supabase.from("project_checklist_templates").update({ version: template.version + 1 }).eq("id", template.id);
      if (versionError) throw versionError;
      if (command.applyToExisting) {
        const { error: existingError } = await supabase.from("project_checklist_items").update({ title: command.title }).eq("source_template_item_id", item.id).eq("status", "open");
        if (existingError) throw existingError;
      }
    } else if (command.action === "delete_checklist_template_item") {
      const { data: item } = await supabase.from("project_checklist_template_items").select("id, template_id").eq("id", command.itemId).is("archived_at", null).maybeSingle();
      if (!item) return badRequest("Checklist template item not found.");
      const { data: template } = await supabase.from("project_checklist_templates").select("id, version").eq("id", item.template_id).maybeSingle();
      if (!template) return badRequest("Checklist template not found.");
      const { error } = await supabase.from("project_checklist_template_items").update({ archived_at: new Date().toISOString() }).eq("id", item.id);
      if (error) throw error;
      const { error: versionError } = await supabase.from("project_checklist_templates").update({ version: template.version + 1 }).eq("id", template.id);
      if (versionError) throw versionError;
    } else if (command.action === "apply_checklist_template") {
      const [templateResult, projectResult, itemsResult] = await Promise.all([
        supabase.from("project_checklist_templates").select("id, version").eq("id", command.templateId).is("archived_at", null).maybeSingle(),
        supabase.from("projects").select("id").eq("id", command.projectId).maybeSingle(),
        supabase.from("project_checklist_template_items").select("id, title, position").eq("template_id", command.templateId).is("archived_at", null).order("position"),
      ]);
      const template = templateResult.data;
      if (!template || !projectResult.data) return badRequest("Project or checklist template not found.");
      if (itemsResult.error) throw itemsResult.error;
      if (!itemsResult.data?.length) return badRequest("Add at least one checklist item before applying this template.");
      const { error: instanceInsertError } = await supabase.from("project_checklist_instances").upsert({ project_id: projectResult.data.id, template_id: template.id, template_version: template.version }, { onConflict: "project_id,template_id,template_version", ignoreDuplicates: true });
      if (instanceInsertError) throw instanceInsertError;
      const { data: instance, error: instanceError } = await supabase.from("project_checklist_instances").select("id").eq("project_id", projectResult.data.id).eq("template_id", template.id).eq("template_version", template.version).single();
      if (instanceError || !instance) throw instanceError ?? new Error("Checklist instance not found.");
      const { error: itemError } = await supabase.from("project_checklist_items").upsert(itemsResult.data.map((item) => ({ instance_id: instance.id, source_template_item_id: item.id, title: item.title, position: item.position })), { onConflict: "instance_id,source_template_item_id", ignoreDuplicates: true });
      if (itemError) throw itemError;
      await recordActivity("project", projectResult.data.id, "checklist_applied");
    } else if (command.action === "create_person") {
      await verifyRelations(command);
      const { error } = await supabase.from("people").insert({ name: command.name, context: command.context, domain_id: command.domainId ?? null });
      if (error) throw error;
    } else if (command.action === "create_person_interaction") {
      const { data: person } = await supabase.from("people").select("id").eq("id", command.personId).maybeSingle();
      if (!person) return badRequest("Person not found.");
      let followUpTaskId: string | null = null;
      if (command.followUpTitle) {
        const { data: task, error: taskError } = await supabase.from("tasks").insert({ title: command.followUpTitle, person_id: person.id }).select("id").single();
        if (taskError || !task) throw taskError ?? new Error("Follow-up task creation failed.");
        followUpTaskId = task.id;
      }
      const { error } = await supabase.from("person_interactions").insert({ person_id: person.id, summary: command.summary, follow_up_task_id: followUpTaskId });
      if (error) throw error;
    } else if (command.action === "create_note") {
      await verifyRelations(command);
      const { error } = await supabase.from("notes").insert({ title: command.title, body: command.body, domain_id: command.domainId ?? null, project_id: command.projectId ?? null, person_id: command.personId ?? null, review_on: command.reviewOn ?? null });
      if (error) throw error;
    } else if (command.action === "create_routine") {
      const { error } = await supabase.from("routines").insert({ name: command.name, period: command.period });
      if (error) throw error;
    } else if (command.action === "complete_task" || command.action === "reopen_task" || command.action === "defer_task" || command.action === "cancel_task") {
      const { data: task } = await supabase.from("tasks").select("id, title, details, priority, due_on, scheduled_for, recurrence_rule, recurrence_root_id, recurrence_anchor, recurrence_interval, recurrence_unit, domain_id, project_id, person_id, source_capture_id").eq("id", command.taskId).maybeSingle();
      if (!task) return badRequest("Task not found.");
      if (command.action === "complete_task" && task.recurrence_rule && task.recurrence_anchor) {
        const rule = task.recurrence_rule as RecurrenceRule;
        const custom = task.recurrence_interval && task.recurrence_unit ? { interval: task.recurrence_interval, unit: task.recurrence_unit as "days" | "weeks" } : undefined;
        const rootId = task.recurrence_root_id ?? task.id;
        const nextAnchor = nextRecurrenceDate(task.recurrence_anchor, rule, custom);
        const { data: existing, error: existingError } = await supabase.from("tasks").select("id").eq("recurrence_root_id", rootId).eq("recurrence_anchor", nextAnchor).maybeSingle();
        if (existingError) throw existingError;
        if (!existing) {
          const { error: nextError } = await supabase.from("tasks").insert({ title: task.title, details: task.details, priority: task.priority, due_on: task.due_on ? nextRecurrenceDate(task.due_on, rule, custom) : null, scheduled_for: task.scheduled_for ? nextRecurrenceDate(task.scheduled_for, rule, custom) : null, recurrence_rule: rule, recurrence_root_id: rootId, recurrence_anchor: nextAnchor, recurrence_interval: task.recurrence_interval, recurrence_unit: task.recurrence_unit, domain_id: task.domain_id, project_id: task.project_id, person_id: task.person_id, source_capture_id: task.source_capture_id });
          if (nextError && nextError.code !== "23505") throw nextError;
        }
      }
      const changes = command.action === "complete_task" ? { status: "completed", completed_at: new Date().toISOString(), deferred_until: null } : command.action === "reopen_task" ? { status: "open", completed_at: null } : command.action === "cancel_task" ? { status: "canceled", deferred_until: null } : { status: "open", deferred_until: command.until ?? null };
      const { error } = await supabase.from("tasks").update(changes).eq("id", command.taskId);
      if (error) throw error;
      const eventType = command.action === "complete_task" ? "completed" : command.action === "reopen_task" ? "reopened" : command.action === "cancel_task" ? "canceled" : "deferred";
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
    } else if (command.action === "complete_checklist_item" || command.action === "reopen_checklist_item") {
      const { data: item } = await supabase.from("project_checklist_items").select("id, instance_id").eq("id", command.itemId).maybeSingle();
      if (!item) return badRequest("Checklist item not found.");
      const { data: instance } = await supabase.from("project_checklist_instances").select("project_id").eq("id", item.instance_id).maybeSingle();
      if (!instance) return badRequest("Checklist instance not found.");
      const { error } = await supabase.from("project_checklist_items").update(command.action === "complete_checklist_item" ? { status: "completed", completed_at: new Date().toISOString() } : { status: "open", completed_at: null }).eq("id", item.id);
      if (error) throw error;
      await recordActivity("project", instance.project_id, command.action === "complete_checklist_item" ? "checklist_item_completed" : "checklist_item_reopened");
    } else if (command.action === "update_retainer_template_item") {
      const { data: item } = await supabase.from("retainer_deliverable_templates").select("id, retainer_id, version").eq("id", command.itemId).is("archived_at", null).maybeSingle();
      if (!item) return badRequest("Retainer deliverable not found.");
      if (command.scope === "future" || command.scope === "both") {
        const { error } = await supabase.from("retainer_deliverable_templates").update({ title: command.title, expected_day: command.expectedDay, version: item.version + 1 }).eq("id", item.id);
        if (error) throw error;
      }
      if (command.scope === "current" || command.scope === "both") {
        const { data: latestCycle } = await supabase.from("retainer_cycles").select("id").eq("retainer_id", item.retainer_id).order("cycle_start", { ascending: false }).limit(1).maybeSingle();
        if (latestCycle) {
          const { error } = await supabase.from("retainer_cycle_items").update({ title: command.title }).eq("cycle_id", latestCycle.id).eq("source_template_item_id", item.id).eq("status", "open");
          if (error) throw error;
        }
      }
      await recordActivity("retainer", item.retainer_id, "template_item_updated", { scope: command.scope });
    } else if (command.action === "delete_retainer_template_item") {
      // Soft delete, same reasoning as delete_checklist_template_item: retainer_cycle_items.source_template_item_id
      // references this row with on delete restrict, so a hard delete is blocked once it has produced cycle work.
      const { data: item } = await supabase.from("retainer_deliverable_templates").select("id, retainer_id").eq("id", command.itemId).is("archived_at", null).maybeSingle();
      if (!item) return badRequest("Retainer deliverable not found.");
      const { error } = await supabase.from("retainer_deliverable_templates").update({ archived_at: new Date().toISOString() }).eq("id", item.id);
      if (error) throw error;
      await recordActivity("retainer", item.retainer_id, "template_item_deleted");
    } else if (command.action === "close_retainer_cycle_item" || command.action === "leave_retainer_cycle_item_in_prior_cycle") {
      const { data: item } = await supabase.from("retainer_cycle_items").select("id, cycle_id, status").eq("id", command.itemId).maybeSingle();
      if (!item) return badRequest("Retainer cycle item not found.");
      if (item.status !== "open") return badRequest("Only an open deliverable can be resolved this way.");
      const { data: cycle } = await supabase.from("retainer_cycles").select("retainer_id").eq("id", item.cycle_id).maybeSingle();
      if (!cycle) return badRequest("Retainer cycle not found.");
      const changes = command.action === "close_retainer_cycle_item" ? { status: "closed" as const } : { excluded_from_carry_forward: true };
      const { error } = await supabase.from("retainer_cycle_items").update(changes).eq("id", item.id);
      if (error) throw error;
      await recordActivity("retainer", cycle.retainer_id, command.action === "close_retainer_cycle_item" ? "cycle_item_closed" : "cycle_item_left_in_prior_cycle", { cycleItemId: item.id });
    } else if (command.action === "pause_retainer" || command.action === "resume_retainer") {
      const { data: retainer } = await supabase.from("retainers").select("id, status").eq("id", command.retainerId).maybeSingle();
      if (!retainer) return badRequest("Retainer not found.");
      const requiredStatus = command.action === "pause_retainer" ? "active" : "paused";
      if (retainer.status !== requiredStatus) return badRequest(command.action === "pause_retainer" ? "Only an active retainer can be paused." : "Only a paused retainer can be resumed.");
      // Resuming never generates a make-up cycle for the paused period — generation stays an
      // explicit, separate action, so there is nothing here that could duplicate or invent a cycle.
      const { error } = await supabase.from("retainers").update({ status: command.action === "pause_retainer" ? "paused" : "active" }).eq("id", retainer.id);
      if (error) throw error;
      await recordActivity("retainer", retainer.id, command.action === "pause_retainer" ? "paused" : "resumed");
    } else if (command.action === "end_retainer") {
      const { data: retainer } = await supabase.from("retainers").select("id, status").eq("id", command.retainerId).maybeSingle();
      if (!retainer) return badRequest("Retainer not found.");
      if (retainer.status === "ended") return badRequest("This retainer has already ended.");
      if (command.openItemResolution === "close_all") {
        const { data: cycles, error: cyclesError } = await supabase.from("retainer_cycles").select("id").eq("retainer_id", retainer.id);
        if (cyclesError) throw cyclesError;
        const cycleIds = (cycles ?? []).map((cycle) => cycle.id);
        if (cycleIds.length) {
          const { error: closeError } = await supabase.from("retainer_cycle_items").update({ status: "closed" }).in("cycle_id", cycleIds).eq("status", "open");
          if (closeError) throw closeError;
        }
      }
      const { error } = await supabase.from("retainers").update({ status: "ended" }).eq("id", retainer.id);
      if (error) throw error;
      await recordActivity("retainer", retainer.id, "ended", { openItemResolution: command.openItemResolution });
    } else if (command.action === "create_retainer") {
      await verifyRelations({ domainId: command.domainId, personId: command.clientPersonId });
      const { data: retainer, error } = await supabase.from("retainers").insert({ name: command.name, timezone: command.timezone, cycle_day: command.cycleDay, client_person_id: command.clientPersonId ?? null, domain_id: command.domainId ?? null, idempotency_key: command.idempotencyKey }).select("id").single();
      if (error?.code === "23505") {
        // Same key, same owner: a retried double-submit converges on the retainer already created instead of a second one.
        const { data: existing } = await supabase.from("retainers").select("id").eq("idempotency_key", command.idempotencyKey).maybeSingle();
        if (existing) return NextResponse.json({ ok: true, duplicate: true });
      }
      if (error || !retainer) throw error ?? new Error("Retainer creation failed.");
      await recordActivity("retainer", retainer.id, "created");
    } else if (command.action === "update_retainer") {
      const { data: retainer } = await supabase.from("retainers").select("id").eq("id", command.retainerId).maybeSingle();
      if (!retainer) return badRequest("Retainer not found.");
      await verifyRelations({ domainId: command.domainId, personId: command.clientPersonId });
      const { error } = await supabase.from("retainers").update({ name: command.name, timezone: command.timezone, cycle_day: command.cycleDay, client_person_id: command.clientPersonId ?? null, domain_id: command.domainId ?? null }).eq("id", command.retainerId);
      if (error) throw error;
      await recordActivity("retainer", command.retainerId, "updated");
    } else if (command.action === "create_retainer_template_item") {
      const { data: retainer } = await supabase.from("retainers").select("id").eq("id", command.retainerId).maybeSingle();
      if (!retainer) return badRequest("Retainer not found.");
      const { count, error: countError } = await supabase.from("retainer_deliverable_templates").select("id", { count: "exact", head: true }).eq("retainer_id", retainer.id).is("archived_at", null);
      if (countError) throw countError;
      const { error } = await supabase.from("retainer_deliverable_templates").insert({ retainer_id: retainer.id, title: command.title, expected_day: command.expectedDay, position: (count ?? 0) + 1 });
      if (error) throw error;
      await recordActivity("retainer", retainer.id, "template_item_created");
    } else if (command.action === "delete_retainer" || command.action === "restore_retainer") {
      const { data: retainer } = await supabase.from("retainers").select("id").eq("id", command.retainerId).maybeSingle();
      if (!retainer) return badRequest("Retainer not found.");
      const { error } = await supabase.from("retainers").update({ archived_at: command.action === "delete_retainer" ? new Date().toISOString() : null }).eq("id", command.retainerId);
      if (error) throw error;
      await recordActivity("retainer", command.retainerId, command.action === "delete_retainer" ? "deleted" : "restored");
    } else if (command.action === "complete_retainer_cycle_item" || command.action === "reopen_retainer_cycle_item") {
      const { data: item } = await supabase.from("retainer_cycle_items").select("id, cycle_id").eq("id", command.itemId).maybeSingle();
      if (!item) return badRequest("Retainer cycle item not found.");
      const { data: cycle } = await supabase.from("retainer_cycles").select("retainer_id").eq("id", item.cycle_id).maybeSingle();
      if (!cycle) return badRequest("Retainer cycle not found.");
      const { error } = await supabase.from("retainer_cycle_items").update(command.action === "complete_retainer_cycle_item" ? { status: "completed", completed_at: new Date().toISOString() } : { status: "open", completed_at: null }).eq("id", item.id);
      if (error) throw error;
      await recordActivity("retainer", cycle.retainer_id, command.action === "complete_retainer_cycle_item" ? "cycle_item_completed" : "cycle_item_reopened", { cycleItemId: item.id });
    } else if (command.action === "generate_retainer_cycle") {
      const { data: retainer } = await supabase.from("retainers").select("id, cycle_day, status").eq("id", command.retainerId).maybeSingle();
      if (!retainer) return badRequest("Retainer not found.");
      if (retainer.status !== "active") return badRequest("That retainer is not active.");

      const bounds = cycleBounds(command.cycleMonth, retainer.cycle_day);

      const { data: templates, error: templatesError } = await supabase
        .from("retainer_deliverable_templates")
        .select("id, title, expected_day, version")
        .eq("retainer_id", retainer.id)
        .is("archived_at", null);
      if (templatesError) throw templatesError;
      const newItems = (templates ?? []).map((template) => ({
        sourceTemplateItemId: template.id,
        sourceTemplateVersion: template.version,
        title: template.title,
        expectedOn: expectedDate(command.cycleMonth, template.expected_day),
      }));

      const { data: priorCycle, error: priorCycleError } = await supabase
        .from("retainer_cycles")
        .select("id")
        .eq("retainer_id", retainer.id)
        .lt("cycle_start", bounds.start)
        .order("cycle_start", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (priorCycleError) throw priorCycleError;
      let carryForwardItems: Array<{ sourceTemplateItemId: string; sourceTemplateVersion: number; carriedFromItemId: string; title: string; expectedOn: string }> = [];
      if (priorCycle) {
        const { data: priorItems, error: priorItemsError } = await supabase
          .from("retainer_cycle_items")
          .select("id, title, source_template_item_id, source_template_version")
          .eq("cycle_id", priorCycle.id)
          .eq("status", "open")
          .eq("excluded_from_carry_forward", false);
        if (priorItemsError) throw priorItemsError;
        carryForwardItems = (priorItems ?? []).map((item) => ({
          sourceTemplateItemId: item.source_template_item_id,
          sourceTemplateVersion: item.source_template_version,
          carriedFromItemId: item.id,
          title: `${item.title} (carried forward)`,
          expectedOn: bounds.start,
        }));
      }

      const { data: result, error: generateError } = await supabase.rpc("generate_retainer_cycle", {
        p_retainer_id: retainer.id,
        p_cycle_start: bounds.start,
        p_cycle_end: bounds.end,
        p_idempotency_key: command.idempotencyKey,
        p_new_items: newItems,
        p_carry_forward_items: carryForwardItems,
      }).select().maybeSingle() as { data: { out_cycle_id: string } | null; error: unknown };
      if (generateError || !result) throw generateError ?? new Error("Cycle generation failed.");

      await recordActivity("retainer", retainer.id, "cycle_generated", { cycleId: result.out_cycle_id });
    } else if (command.action === "record_project_progress" || command.action === "pause_project" || command.action === "complete_project") {
      const { data: project } = await supabase.from("projects").select("id").eq("id", command.projectId).maybeSingle();
      if (!project) return badRequest("Project not found.");
      if (command.action === "complete_project") {
        const { count } = await supabase.from("tasks").select("id", { count: "exact", head: true }).eq("project_id", project.id).eq("status", "open");
        if ((count ?? 0) > 0) return badRequest("Resolve this project’s open tasks before completing it.");
        const { data: instances, error: instancesError } = await supabase.from("project_checklist_instances").select("id").eq("project_id", project.id);
        if (instancesError) throw instancesError;
        if (instances?.length) {
          const { count: checklistCount, error: checklistError } = await supabase.from("project_checklist_items").select("id", { count: "exact", head: true }).in("instance_id", instances.map((instance) => instance.id)).eq("status", "open");
          if (checklistError) throw checklistError;
          if ((checklistCount ?? 0) > 0) return badRequest("Resolve this project’s open checklist items before completing it.");
        }
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
