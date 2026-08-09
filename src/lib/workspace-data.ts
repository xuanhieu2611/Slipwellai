import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkspaceData } from "@/lib/workspace";
import type {
  PeopleNotesPageData,
  RetainersPageData,
  RoutinesPageData,
  SearchPageData,
  TasksPageData,
  TodayPageData,
  WorkPageData,
} from "@/lib/workspace-page-data";

export type {
  PeopleNotesPageData,
  RetainersPageData,
  RoutinesPageData,
  SearchPageData,
  TasksPageData,
  TodayPageData,
  WorkPageData,
} from "@/lib/workspace-page-data";

/* A generous lower bound for the routine contribution heatmap (~53 weeks). Exact windowing
   happens client-side against the viewer's local "today", so this only needs to comfortably
   cover it, not match it exactly. */
const ROUTINE_HISTORY_DAYS = 380;

async function client() {
  return createSupabaseServerClient();
}

function routineHistoryCutoff() {
  return new Date(Date.now() - ROUTINE_HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

async function loadTimezone(supabase: Awaited<ReturnType<typeof client>>) {
  const preferences = await supabase.from("user_preferences").select("timezone").maybeSingle();
  return preferences.data?.timezone ?? "America/Vancouver";
}

async function loadDomains(supabase: Awaited<ReturnType<typeof client>>) {
  const domains = await supabase.from("domains").select("id, name, description, color, archived_at").is("archived_at", null).order("name");
  return (domains.data ?? []) as WorkspaceData["domains"];
}

async function loadTasks(supabase: Awaited<ReturnType<typeof client>>) {
  /* Unlike every other table here, tasks intentionally omits the archived_at filter: a
     soft-deleted task must still be readable so the workspace can render a Deleted section
     with a Restore action, per the delete/restore recovery promise. */
  const tasks = await supabase
    .from("tasks")
    .select("id, title, details, status, priority, due_on, scheduled_for, deferred_until, recurrence_rule, recurrence_interval, recurrence_unit, tags, domain_id, project_id, person_id, retainer_id, top_three_date, top_three_order, slipping_cadence_days, completed_at, archived_at, created_at")
    .order("created_at", { ascending: false });
  return (tasks.data ?? []) as WorkspaceData["tasks"];
}

async function loadProjects(supabase: Awaited<ReturnType<typeof client>>) {
  /* Unlike most other tables here, projects intentionally omits the archived_at filter: a
     soft-deleted project must still be readable so the workspace can render a Deleted section
     with a Restore action, matching the tasks delete/restore recovery promise. */
  const projects = await supabase
    .from("projects")
    .select("id, name, description, status, domain_id, person_id, start_on, target_on, slipping_cadence_days, archived_at, created_at")
    .order("created_at", { ascending: false });
  return (projects.data ?? []) as WorkspaceData["projects"];
}

async function loadPeople(supabase: Awaited<ReturnType<typeof client>>) {
  /* Unlike its earlier version, this intentionally omits the archived_at filter: a soft-deleted
     person must still be readable so the workspace can render a Deleted section with a Restore
     action, matching the tasks/projects delete/restore recovery promise. */
  const people = await supabase.from("people").select("id, name, context, domain_id, archived_at, created_at").order("name");
  return (people.data ?? []) as WorkspaceData["people"];
}

async function loadNotes(supabase: Awaited<ReturnType<typeof client>>) {
  /* Unlike its earlier version, this intentionally omits the archived_at filter: a soft-deleted
     note must still be readable so the workspace can render a Deleted section with a Restore
     action, matching the tasks/projects delete/restore recovery promise. */
  const notes = await supabase.from("notes").select("id, title, body, domain_id, project_id, person_id, review_on, archived_at, created_at").order("created_at", { ascending: false });
  return (notes.data ?? []) as WorkspaceData["notes"];
}

async function loadSignals(supabase: Awaited<ReturnType<typeof client>>) {
  const signals = await supabase.from("slipping_signals").select("id, entity_type, entity_id, reason, severity, outcome").eq("outcome", "open").order("created_at", { ascending: false }).limit(12);
  return (signals.data ?? []) as WorkspaceData["signals"];
}

async function loadCaptures(supabase: Awaited<ReturnType<typeof client>>) {
  /* interpretation_claimed_at is included so Today can tell a fresh interpretation claim
     apart from a stranded one (see isStrandedCapture) without a second query. */
  const captures = await supabase.from("captures").select("id, original_text, status, created_at, interpretation_claimed_at").order("created_at", { ascending: false }).limit(8);
  return (captures.data ?? []) as WorkspaceData["captures"];
}

async function loadCaptureAttention(supabase: Awaited<ReturnType<typeof client>>) {
  /* Deliberately a separate query from loadCaptures rather than a client-side filter over
     its 8-most-recent-of-any-status feed: a handful of quickly filed captures would otherwise
     crowd an older stuck one out of the recency cap, making it invisible on Today even though
     it is still sitting unresolved in Inbox. This is scoped to the non-terminal statuses
     instead, so an older needs_review/failed/queued capture always surfaces. capturesNeedingAttention
     (capture-pipeline.ts) still runs over the result to drop a still-fresh interpreting claim. */
  const attention = await supabase
    .from("captures")
    .select("id, original_text, status, created_at, interpretation_claimed_at")
    .in("status", ["queued", "interpreting", "needs_review", "failed"])
    .order("created_at", { ascending: false })
    .limit(20);
  return (attention.data ?? []) as WorkspaceData["captureAttention"];
}

async function loadRoutines(supabase: Awaited<ReturnType<typeof client>>) {
  const routines = await supabase.from("routines").select("id, name, period").is("archived_at", null).order("period").order("name");
  return (routines.data ?? []) as WorkspaceData["routines"];
}

async function loadRoutineCompletions(supabase: Awaited<ReturnType<typeof client>>) {
  const routineCompletions = await supabase.from("routine_completions").select("routine_id, local_date, outcome").gte("local_date", routineHistoryCutoff()).order("local_date", { ascending: false });
  return (routineCompletions.data ?? []) as WorkspaceData["routineCompletions"];
}

/** Full bag kept for integration tests and any caller that still needs every entity. */
export async function getWorkspaceData(): Promise<WorkspaceData> {
  const supabase = await client();
  const [
    timezone,
    domains,
    tasks,
    projects,
    milestones,
    checklistTemplates,
    checklistTemplateItems,
    checklistInstances,
    checklistItems,
    people,
    personInteractions,
    notes,
    routines,
    routineCompletions,
    signals,
    captures,
    captureAttention,
    projectActivity,
    retainers,
    retainerTemplateItems,
    retainerCycles,
    retainerCycleItems,
    retainerActivity,
  ] = await Promise.all([
    loadTimezone(supabase),
    loadDomains(supabase),
    loadTasks(supabase),
    loadProjects(supabase),
    supabase.from("project_milestones").select("id, project_id, title, position, status").order("position").then((r) => (r.data ?? []) as WorkspaceData["milestones"]),
    supabase.from("project_checklist_templates").select("id, name, description, version").is("archived_at", null).order("name").then((r) => (r.data ?? []) as WorkspaceData["checklistTemplates"]),
    supabase.from("project_checklist_template_items").select("id, template_id, title, position").is("archived_at", null).order("position").then((r) => (r.data ?? []) as WorkspaceData["checklistTemplateItems"]),
    supabase.from("project_checklist_instances").select("id, project_id, template_id, template_version").order("created_at").then((r) => (r.data ?? []) as WorkspaceData["checklistInstances"]),
    supabase.from("project_checklist_items").select("id, instance_id, title, position, status").order("position").then((r) => (r.data ?? []) as WorkspaceData["checklistItems"]),
    loadPeople(supabase),
    supabase.from("person_interactions").select("id, person_id, summary, follow_up_task_id, occurred_at").order("occurred_at", { ascending: false }).limit(100).then((r) => (r.data ?? []) as WorkspaceData["personInteractions"]),
    loadNotes(supabase),
    loadRoutines(supabase),
    loadRoutineCompletions(supabase),
    loadSignals(supabase),
    loadCaptures(supabase),
    loadCaptureAttention(supabase),
    supabase.from("activity_events").select("id, entity_id, event_type, metadata, occurred_at").eq("entity_type", "project").order("occurred_at", { ascending: false }).limit(300).then((r) => (r.data ?? []) as WorkspaceData["projectActivity"]),
    /* Unlike most other tables here, retainers intentionally omits the archived_at filter,
       matching tasks/projects: a soft-deleted retainer must still be readable so the workspace
       can render a Deleted section with a Restore action. */
    supabase.from("retainers").select("id, name, timezone, cycle_day, status, client_person_id, domain_id, archived_at, created_at").order("created_at", { ascending: false }).then((r) => (r.data ?? []) as WorkspaceData["retainers"]),
    supabase.from("retainer_deliverable_templates").select("id, retainer_id, title, expected_day, version, position, archived_at").is("archived_at", null).order("position").then((r) => (r.data ?? []) as WorkspaceData["retainerTemplateItems"]),
    supabase.from("retainer_cycles").select("id, retainer_id, cycle_start, cycle_end, generation_status").order("cycle_start", { ascending: false }).then((r) => (r.data ?? []) as WorkspaceData["retainerCycles"]),
    supabase.from("retainer_cycle_items").select("id, cycle_id, source_template_item_id, carried_from_item_id, title, expected_on, status, excluded_from_carry_forward, completed_at").order("expected_on", { ascending: false }).then((r) => (r.data ?? []) as WorkspaceData["retainerCycleItems"]),
    supabase.from("activity_events").select("id, entity_id, event_type, metadata, occurred_at").eq("entity_type", "retainer").order("occurred_at", { ascending: false }).limit(300).then((r) => (r.data ?? []) as WorkspaceData["retainerActivity"]),
  ]);

  return {
    timezone,
    domains,
    tasks,
    projects,
    milestones,
    checklistTemplates,
    checklistTemplateItems,
    checklistInstances,
    checklistItems,
    people,
    personInteractions,
    notes,
    routines,
    routineCompletions,
    signals,
    captures,
    captureAttention,
    projectActivity,
    retainers,
    retainerTemplateItems,
    retainerCycles,
    retainerCycleItems,
    retainerActivity,
  };
}

export async function getTodayData(): Promise<TodayPageData> {
  const supabase = await client();
  const [timezone, domains, tasks, projects, people, notes, routines, routineCompletions, signals, captures, captureAttention] = await Promise.all([
    loadTimezone(supabase),
    loadDomains(supabase),
    loadTasks(supabase),
    loadProjects(supabase),
    loadPeople(supabase),
    loadNotes(supabase),
    loadRoutines(supabase),
    loadRoutineCompletions(supabase),
    loadSignals(supabase),
    loadCaptures(supabase),
    loadCaptureAttention(supabase),
  ]);
  return { timezone, domains, tasks, projects, people, notes, routines, routineCompletions, signals, captures, captureAttention };
}

export async function getTasksData(): Promise<TasksPageData> {
  const supabase = await client();
  const [timezone, domains, tasks, projects, people, notes, signals] = await Promise.all([
    loadTimezone(supabase),
    loadDomains(supabase),
    loadTasks(supabase),
    loadProjects(supabase),
    loadPeople(supabase),
    loadNotes(supabase),
    loadSignals(supabase),
  ]);
  return { timezone, domains, tasks, projects, people, notes, signals };
}

export async function getWorkData(): Promise<WorkPageData> {
  const supabase = await client();
  const [timezone, domains, tasks, projects, milestones, checklistTemplates, checklistTemplateItems, checklistInstances, checklistItems, people, projectActivity] = await Promise.all([
    loadTimezone(supabase),
    loadDomains(supabase),
    loadTasks(supabase),
    loadProjects(supabase),
    supabase.from("project_milestones").select("id, project_id, title, position, status").order("position").then((r) => (r.data ?? []) as WorkspaceData["milestones"]),
    supabase.from("project_checklist_templates").select("id, name, description, version").is("archived_at", null).order("name").then((r) => (r.data ?? []) as WorkspaceData["checklistTemplates"]),
    supabase.from("project_checklist_template_items").select("id, template_id, title, position").is("archived_at", null).order("position").then((r) => (r.data ?? []) as WorkspaceData["checklistTemplateItems"]),
    supabase.from("project_checklist_instances").select("id, project_id, template_id, template_version").order("created_at").then((r) => (r.data ?? []) as WorkspaceData["checklistInstances"]),
    supabase.from("project_checklist_items").select("id, instance_id, title, position, status").order("position").then((r) => (r.data ?? []) as WorkspaceData["checklistItems"]),
    loadPeople(supabase),
    supabase.from("activity_events").select("id, entity_id, event_type, metadata, occurred_at").eq("entity_type", "project").order("occurred_at", { ascending: false }).limit(300).then((r) => (r.data ?? []) as WorkspaceData["projectActivity"]),
  ]);
  return { timezone, domains, tasks, projects, milestones, checklistTemplates, checklistTemplateItems, checklistInstances, checklistItems, people, projectActivity };
}

export async function getRetainersData(): Promise<RetainersPageData> {
  const supabase = await client();
  const [timezone, domains, people, retainers, retainerTemplateItems, retainerCycles, retainerCycleItems, retainerActivity] = await Promise.all([
    loadTimezone(supabase),
    loadDomains(supabase),
    loadPeople(supabase),
    supabase.from("retainers").select("id, name, timezone, cycle_day, status, client_person_id, domain_id, archived_at, created_at").order("created_at", { ascending: false }).then((r) => (r.data ?? []) as WorkspaceData["retainers"]),
    supabase.from("retainer_deliverable_templates").select("id, retainer_id, title, expected_day, version, position, archived_at").is("archived_at", null).order("position").then((r) => (r.data ?? []) as WorkspaceData["retainerTemplateItems"]),
    supabase.from("retainer_cycles").select("id, retainer_id, cycle_start, cycle_end, generation_status").order("cycle_start", { ascending: false }).then((r) => (r.data ?? []) as WorkspaceData["retainerCycles"]),
    supabase.from("retainer_cycle_items").select("id, cycle_id, source_template_item_id, carried_from_item_id, title, expected_on, status, excluded_from_carry_forward, completed_at").order("expected_on", { ascending: false }).then((r) => (r.data ?? []) as WorkspaceData["retainerCycleItems"]),
    supabase.from("activity_events").select("id, entity_id, event_type, metadata, occurred_at").eq("entity_type", "retainer").order("occurred_at", { ascending: false }).limit(300).then((r) => (r.data ?? []) as WorkspaceData["retainerActivity"]),
  ]);
  return { timezone, domains, people, retainers, retainerTemplateItems, retainerCycles, retainerCycleItems, retainerActivity };
}

export async function getPeopleNotesData(): Promise<PeopleNotesPageData> {
  const supabase = await client();
  const [timezone, domains, projects, people, personInteractions, notes] = await Promise.all([
    loadTimezone(supabase),
    loadDomains(supabase),
    loadProjects(supabase),
    loadPeople(supabase),
    supabase.from("person_interactions").select("id, person_id, summary, follow_up_task_id, occurred_at").order("occurred_at", { ascending: false }).limit(100).then((r) => (r.data ?? []) as WorkspaceData["personInteractions"]),
    loadNotes(supabase),
  ]);
  return { timezone, domains, projects, people, personInteractions, notes };
}

export async function getRoutinesData(): Promise<RoutinesPageData> {
  const supabase = await client();
  const [timezone, routines, routineCompletions] = await Promise.all([loadTimezone(supabase), loadRoutines(supabase), loadRoutineCompletions(supabase)]);
  return { timezone, routines, routineCompletions };
}

export async function getSearchData(): Promise<SearchPageData> {
  const supabase = await client();
  const [tasks, projects, people, notes, domains, captures] = await Promise.all([
    loadTasks(supabase),
    loadProjects(supabase),
    loadPeople(supabase),
    loadNotes(supabase),
    loadDomains(supabase),
    loadCaptures(supabase),
  ]);
  /* loadTasks/loadProjects/loadPeople/loadNotes intentionally return archived rows too, so pages
     with a Deleted/Restore section can render them; search is not one of those pages, so a
     soft-deleted record must not resurface here just because it is still readable. domains is
     already archived-filtered at the load function itself, and captures have no archive state. */
  return {
    tasks: tasks.filter((task) => !task.archived_at),
    projects: projects.filter((project) => !project.archived_at),
    people: people.filter((person) => !person.archived_at),
    notes: notes.filter((note) => !note.archived_at),
    domains,
    captures,
  };
}
