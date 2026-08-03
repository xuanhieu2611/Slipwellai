import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkspaceData } from "@/lib/workspace";

export async function getWorkspaceData(): Promise<WorkspaceData> {
  const supabase = await createSupabaseServerClient();
  const [preferences, domains, tasks, projects, milestones, checklistTemplates, checklistTemplateItems, checklistInstances, checklistItems, people, notes, routines, routineCompletions, signals, captures] = await Promise.all([
    supabase.from("user_preferences").select("timezone").maybeSingle(),
    supabase.from("domains").select("id, name, color, archived_at").is("archived_at", null).order("name"),
    supabase.from("tasks").select("id, title, details, status, priority, due_on, scheduled_for, deferred_until, recurrence_rule, domain_id, project_id, person_id, top_three_date, top_three_order, created_at").is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name, description, status, domain_id, target_on, created_at").is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("project_milestones").select("id, project_id, title, position, status").order("position"),
    supabase.from("project_checklist_templates").select("id, name, description, version").is("archived_at", null).order("name"),
    supabase.from("project_checklist_template_items").select("id, template_id, title, position").order("position"),
    supabase.from("project_checklist_instances").select("id, project_id, template_id, template_version").order("created_at"),
    supabase.from("project_checklist_items").select("id, instance_id, title, position, status").order("position"),
    supabase.from("people").select("id, name, context, domain_id, created_at").is("archived_at", null).order("name"),
    supabase.from("notes").select("id, title, body, domain_id, project_id, person_id, review_on, created_at").is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("routines").select("id, name, period").is("archived_at", null).order("period").order("name"),
    supabase.from("routine_completions").select("routine_id, local_date, outcome").order("local_date", { ascending: false }).limit(100),
    supabase.from("slipping_signals").select("id, entity_type, entity_id, reason, severity, outcome").eq("outcome", "open").order("created_at", { ascending: false }).limit(12),
    supabase.from("captures").select("id, original_text, status, created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  return {
    timezone: preferences.data?.timezone ?? "America/Vancouver",
    domains: (domains.data ?? []) as WorkspaceData["domains"],
    tasks: (tasks.data ?? []) as WorkspaceData["tasks"],
    projects: (projects.data ?? []) as WorkspaceData["projects"],
    milestones: (milestones.data ?? []) as WorkspaceData["milestones"],
    checklistTemplates: (checklistTemplates.data ?? []) as WorkspaceData["checklistTemplates"],
    checklistTemplateItems: (checklistTemplateItems.data ?? []) as WorkspaceData["checklistTemplateItems"],
    checklistInstances: (checklistInstances.data ?? []) as WorkspaceData["checklistInstances"],
    checklistItems: (checklistItems.data ?? []) as WorkspaceData["checklistItems"],
    people: (people.data ?? []) as WorkspaceData["people"],
    notes: (notes.data ?? []) as WorkspaceData["notes"],
    routines: (routines.data ?? []) as WorkspaceData["routines"],
    routineCompletions: (routineCompletions.data ?? []) as WorkspaceData["routineCompletions"],
    signals: (signals.data ?? []) as WorkspaceData["signals"],
    captures: (captures.data ?? []) as WorkspaceData["captures"],
  };
}
