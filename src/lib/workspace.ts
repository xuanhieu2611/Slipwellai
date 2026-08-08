import { z } from "zod";

const id = z.uuid();
const shortText = (max: number) => z.string().trim().min(1).max(max);
/* The forms post null for every cleared optional field, so nullish is the shape the client actually sends. */
const optionalText = (max: number) => z.string().trim().max(max).nullish().transform((value) => value || null);
const optionalId = id.optional().nullable();

export const workspaceCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_domain"), name: shortText(80), description: optionalText(1_000), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#C47B5B") }),
  z.object({ action: z.literal("update_domain"), domainId: id, name: shortText(80), description: optionalText(1_000), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/) }),
  z.object({ action: z.literal("create_task"), title: shortText(280), details: optionalText(10_000), dueOn: z.iso.date().optional().nullable(), scheduledFor: z.iso.date().optional().nullable(), priority: z.coerce.number().int().min(1).max(3).default(2), recurrenceRule: z.enum(["none", "daily", "weekly", "monthly", "yearly", "weekdays", "custom"]).default("none"), recurrenceInterval: z.coerce.number().int().min(1).max(30).optional().nullable(), recurrenceUnit: z.enum(["days", "weeks"]).optional().nullable(), tags: z.array(shortText(40)).max(20).default([]), domainId: optionalId, projectId: optionalId, personId: optionalId, retainerId: optionalId, slippingCadenceDays: z.coerce.number().int().min(1).max(365).optional().nullable(), idempotencyKey: z.string().uuid() })
    .refine((task) => task.recurrenceRule === "none" || Boolean(task.scheduledFor), { message: "Recurring tasks need a scheduled date.", path: ["scheduledFor"] })
    .refine((task) => task.recurrenceRule !== "custom" || (Boolean(task.recurrenceInterval) && Boolean(task.recurrenceUnit)), { message: "A custom repeat needs an interval and a unit.", path: ["recurrenceInterval"] }),
  z.object({ action: z.literal("update_task"), taskId: id, title: shortText(280), details: optionalText(10_000), dueOn: z.iso.date().optional().nullable(), scheduledFor: z.iso.date().optional().nullable(), priority: z.coerce.number().int().min(1).max(3).default(2), tags: z.array(shortText(40)).max(20).default([]), domainId: optionalId, projectId: optionalId, personId: optionalId, retainerId: optionalId, slippingCadenceDays: z.coerce.number().int().min(1).max(365).optional().nullable() }),
  z.object({ action: z.literal("create_project"), name: shortText(160), description: optionalText(10_000), domainId: optionalId, personId: optionalId, startOn: z.iso.date().optional().nullable(), targetOn: z.iso.date().optional().nullable(), slippingCadenceDays: z.coerce.number().int().min(1).max(365).optional().nullable(), idempotencyKey: z.string().uuid() }),
  z.object({ action: z.literal("update_project"), projectId: id, name: shortText(160), description: optionalText(10_000), domainId: optionalId, personId: optionalId, startOn: z.iso.date().optional().nullable(), targetOn: z.iso.date().optional().nullable(), slippingCadenceDays: z.coerce.number().int().min(1).max(365).optional().nullable() }),
  z.object({ action: z.literal("resume_project"), projectId: id }),
  z.object({ action: z.literal("cancel_project"), projectId: id }),
  z.object({ action: z.literal("delete_project"), projectId: id }),
  z.object({ action: z.literal("restore_project"), projectId: id }),
  z.object({ action: z.literal("create_milestone"), projectId: id, title: shortText(280) }),
  z.object({ action: z.literal("delete_milestone"), milestoneId: id }),
  z.object({ action: z.literal("create_checklist_template"), name: shortText(160), description: optionalText(1_000) }),
  z.object({ action: z.literal("delete_checklist_template"), templateId: id }),
  z.object({ action: z.literal("add_checklist_template_item"), templateId: id, title: shortText(280) }),
  /* applyToExisting is the explicit current/future scope control: unchecked (the default) only
     bumps the template version so the edit affects future applications, matching add's existing
     behavior; checked also rewrites the title on still-open items in already-applied checklists. */
  z.object({ action: z.literal("update_checklist_template_item"), itemId: id, title: shortText(280), applyToExisting: z.coerce.boolean().default(false) }),
  z.object({ action: z.literal("delete_checklist_template_item"), itemId: id }),
  z.object({ action: z.literal("apply_checklist_template"), templateId: id, projectId: id }),
  z.object({ action: z.literal("create_person"), name: shortText(160), context: optionalText(1_000), domainId: optionalId }),
  z.object({ action: z.literal("create_person_interaction"), personId: id, summary: shortText(4_000), followUpTitle: optionalText(280) }),
  z.object({ action: z.literal("create_note"), title: shortText(280), body: optionalText(20_000), domainId: optionalId, projectId: optionalId, personId: optionalId, reviewOn: z.iso.date().optional().nullable() }),
  z.object({ action: z.literal("create_routine"), name: shortText(160), period: z.enum(["morning", "afternoon", "evening", "anytime"]).default("anytime") }),
  z.object({ action: z.literal("complete_task"), taskId: id }),
  z.object({ action: z.literal("reopen_task"), taskId: id }),
  z.object({ action: z.literal("defer_task"), taskId: id, until: z.iso.date().optional().nullable() }),
  z.object({ action: z.literal("cancel_task"), taskId: id }),
  z.object({ action: z.literal("delete_task"), taskId: id }),
  z.object({ action: z.literal("restore_task"), taskId: id }),
  z.object({ action: z.literal("archive_domain"), domainId: id }),
  z.object({ action: z.literal("set_top_three"), taskId: id, localDate: z.iso.date() }),
  z.object({ action: z.literal("clear_top_three"), taskId: id }),
  /* taskIds is the complete, already-reordered list of that day's top-three task ids (drag-and-drop
     sends the whole list rather than a single from/to move, so the server can just re-stamp order
     without reasoning about partial moves). The server still verifies every id actually belongs to
     that date's top three before writing anything. */
  z.object({ action: z.literal("reorder_top_three"), localDate: z.iso.date(), taskIds: z.array(id).min(1).max(3) }),
  z.object({ action: z.literal("resolve_routine"), routineId: id, localDate: z.iso.date(), outcome: z.enum(["completed", "skipped"]) }),
  z.object({ action: z.literal("complete_milestone"), milestoneId: id }),
  z.object({ action: z.literal("reopen_milestone"), milestoneId: id }),
  z.object({ action: z.literal("record_project_progress"), projectId: id }),
  z.object({ action: z.literal("pause_project"), projectId: id }),
  z.object({ action: z.literal("complete_project"), projectId: id }),
  z.object({ action: z.literal("complete_checklist_item"), itemId: id }),
  z.object({ action: z.literal("reopen_checklist_item"), itemId: id }),
  /* Unlike update_checklist_template_item's two-way applyToExisting flag, the tracker explicitly
     calls for a three-way scope here: "future" (default) only changes what the next generated
     cycle produces, leaving the template item's own row untouched otherwise would be wrong —
     rather, "future" is the one that writes the template row (title/expectedDay/version bump);
     "current" instead leaves the template row alone and only rewrites still-open items already
     generated into the latest cycle; "both" does both. */
  z.object({ action: z.literal("update_retainer_template_item"), itemId: id, title: shortText(280), expectedDay: z.coerce.number().int().min(1).max(31), scope: z.enum(["future", "current", "both"]).default("future") }),
  z.object({ action: z.literal("delete_retainer_template_item"), itemId: id }),
  /* There is deliberately no delete command for a retainer_cycle_item: incomplete work is never
     silently discarded at rollover, only ever moved through status transitions (completed,
     closed, carried_forward) or excluded from the next carry-forward while staying open. */
  z.object({ action: z.literal("close_retainer_cycle_item"), itemId: id }),
  z.object({ action: z.literal("leave_retainer_cycle_item_in_prior_cycle"), itemId: id }),
  z.object({ action: z.literal("pause_retainer"), retainerId: id }),
  z.object({ action: z.literal("resume_retainer"), retainerId: id }),
  /* Ending a retainer preserves history and never silently decides what happens to remaining open
     work, so the caller must say explicitly: leave it open (visible, unresolved, on the record)
     or close it out along with the retainer. */
  z.object({ action: z.literal("end_retainer"), retainerId: id, openItemResolution: z.enum(["leave_open", "close_all"]) }),
  /* clientPersonId reuses the existing people table rather than a new entity, per the confirmed
     design decision: this codebase's "client" is just a person_id, the same as a project's. */
  z.object({ action: z.literal("create_retainer"), name: shortText(160), timezone: shortText(100), cycleDay: z.coerce.number().int().min(1).max(31), clientPersonId: optionalId, domainId: optionalId, idempotencyKey: z.string().uuid() }),
  z.object({ action: z.literal("update_retainer"), retainerId: id, name: shortText(160), timezone: shortText(100), cycleDay: z.coerce.number().int().min(1).max(31), clientPersonId: optionalId, domainId: optionalId }),
  z.object({ action: z.literal("create_retainer_template_item"), retainerId: id, title: shortText(280), expectedDay: z.coerce.number().int().min(1).max(31) }),
  z.object({ action: z.literal("delete_retainer"), retainerId: id }),
  z.object({ action: z.literal("restore_retainer"), retainerId: id }),
  z.object({ action: z.literal("generate_retainer_cycle"), retainerId: id, cycleMonth: z.string().regex(/^\d{4}-\d{2}$/), idempotencyKey: z.string().uuid() }),
  z.object({ action: z.literal("complete_retainer_cycle_item"), itemId: id }),
  z.object({ action: z.literal("reopen_retainer_cycle_item"), itemId: id }),
]);

export type WorkspaceCommand = z.infer<typeof workspaceCommandSchema>;

export type WorkspaceData = {
  timezone: string;
  domains: Array<{ id: string; name: string; description: string | null; color: string; archived_at: string | null }>;
  tasks: Array<{ id: string; title: string; details: string | null; status: "open" | "completed" | "canceled" | "archived"; priority: number; due_on: string | null; scheduled_for: string | null; deferred_until: string | null; recurrence_rule: "daily" | "weekly" | "monthly" | "yearly" | "weekdays" | "custom" | null; recurrence_interval: number | null; recurrence_unit: "days" | "weeks" | null; tags: string[]; domain_id: string | null; project_id: string | null; person_id: string | null; retainer_id: string | null; top_three_date: string | null; top_three_order: number | null; slipping_cadence_days: number | null; completed_at: string | null; archived_at: string | null; created_at: string }>;
  projects: Array<{ id: string; name: string; description: string | null; status: string; domain_id: string | null; person_id: string | null; start_on: string | null; target_on: string | null; slipping_cadence_days: number | null; archived_at: string | null; created_at: string }>;
  milestones: Array<{ id: string; project_id: string; title: string; position: number; status: "open" | "completed" }>;
  checklistTemplates: Array<{ id: string; name: string; description: string | null; version: number }>;
  checklistTemplateItems: Array<{ id: string; template_id: string; title: string; position: number }>;
  checklistInstances: Array<{ id: string; project_id: string; template_id: string; template_version: number }>;
  checklistItems: Array<{ id: string; instance_id: string; title: string; position: number; status: "open" | "completed" }>;
  people: Array<{ id: string; name: string; context: string | null; domain_id: string | null; created_at: string }>;
  personInteractions: Array<{ id: string; person_id: string; summary: string; follow_up_task_id: string | null; occurred_at: string }>;
  notes: Array<{ id: string; title: string; body: string | null; domain_id: string | null; project_id: string | null; person_id: string | null; review_on: string | null; created_at: string }>;
  routines: Array<{ id: string; name: string; period: "morning" | "afternoon" | "evening" | "anytime" }>;
  routineCompletions: Array<{ routine_id: string; local_date: string; outcome: "completed" | "skipped" }>;
  signals: Array<{ id: string; entity_type: "task" | "project" | "retainer_cycle_item"; entity_id: string; reason: string; severity: "attention" | "urgent" | "informational"; outcome: string }>;
  captures: Array<{ id: string; original_text: string; status: string; created_at: string }>;
  projectActivity: Array<{ id: string; entity_id: string; event_type: string; metadata: Record<string, string>; occurred_at: string }>;
  retainers: Array<{ id: string; name: string; timezone: string; cycle_day: number; status: "active" | "paused" | "ended"; client_person_id: string | null; domain_id: string | null; archived_at: string | null; created_at: string }>;
  retainerTemplateItems: Array<{ id: string; retainer_id: string; title: string; expected_day: number; version: number; position: number; archived_at: string | null }>;
  retainerCycles: Array<{ id: string; retainer_id: string; cycle_start: string; cycle_end: string; generation_status: string }>;
  retainerCycleItems: Array<{ id: string; cycle_id: string; source_template_item_id: string; carried_from_item_id: string | null; title: string; expected_on: string; status: "open" | "completed" | "carried_forward" | "canceled" | "closed"; excluded_from_carry_forward: boolean; completed_at: string | null }>;
  retainerActivity: Array<{ id: string; entity_id: string; event_type: string; metadata: Record<string, string>; occurred_at: string }>;
};

export function localDate(timezone: string, now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function taskDateLabel(task: Pick<WorkspaceData["tasks"][number], "due_on" | "scheduled_for" | "deferred_until">) {
  if (task.deferred_until) return `Deferred until ${task.deferred_until}`;
  if (task.due_on) return `Due ${task.due_on}`;
  if (task.scheduled_for) return `Scheduled ${task.scheduled_for}`;
  return "Unscheduled";
}

/* Mirrors taskDateLabel's own priority: a deferred date overrides due/scheduled for
   "is this on today's list" the same way it overrides them for display. */
export function isTaskOnDay(task: Pick<WorkspaceData["tasks"][number], "due_on" | "scheduled_for" | "deferred_until">, day: string) {
  if (task.deferred_until) return task.deferred_until === day;
  return task.due_on === day || task.scheduled_for === day;
}

export function taskPlanningDate(task: Pick<WorkspaceData["tasks"][number], "due_on" | "scheduled_for" | "deferred_until">) {
  return task.deferred_until ?? task.due_on ?? task.scheduled_for;
}

function calendarDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

/** Returns a stable six-week, Monday-first calendar grid for the month containing `day`. */
export function calendarMonthGrid(day: string) {
  const [year, month] = day.split("-").map(Number);
  const firstWeekday = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysBeforeMonth = (firstWeekday + 6) % 7;
  return Array.from({ length: 42 }, (_, index) => calendarDate(year, month, index - daysBeforeMonth + 1));
}

export function shiftCalendarMonth(day: string, amount: number) {
  const [year, month] = day.split("-").map(Number);
  return calendarDate(year, month + amount, 1);
}

function addDays(day: string, amount: number) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, date + amount)).toISOString().slice(0, 10);
}

/** Returns the Monday that starts the week containing `day`. */
export function calendarWeekStart(day: string) {
  const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
  return addDays(day, -((weekday + 6) % 7));
}

/** Returns the seven Monday-first ISO dates of the week containing `day`. */
export function calendarWeekDays(day: string) {
  const start = calendarWeekStart(day);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

/** Returns seven days with `day` in the center (3 before, day, 3 after). */
export function centeredWeekDays(day: string) {
  return Array.from({ length: 7 }, (_, index) => addDays(day, index - 3));
}

export function shiftCalendarWeek(day: string, amount: number) {
  return addDays(day, amount * 7);
}

type RoutineOutcome = "completed" | "skipped";
type RoutineCompletion = { local_date: string; outcome: RoutineOutcome };

/* Walks backward from today counting consecutive completed days. Today itself is skipped when
   unresolved rather than treated as a break, since it simply hasn't happened yet; every earlier
   day still needs an explicit "completed" record to keep the streak alive. */
export function routineCurrentStreak(completions: RoutineCompletion[], today: string) {
  const outcomeByDate = new Map(completions.map((completion) => [completion.local_date, completion.outcome]));
  let streak = 0;
  let cursor = today;
  if (outcomeByDate.get(cursor) !== "completed") cursor = addDays(cursor, -1);
  while (outcomeByDate.get(cursor) === "completed") {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export type RoutineHeatmapCell = { date: string; outcome: RoutineOutcome | null; isToday: boolean; isFuture: boolean };
export type RoutineHeatmapWeek = { start: string; cells: RoutineHeatmapCell[]; monthLabel: string | null };

/** Returns `weeks` Monday-first columns ending with the week containing `today`, each with a
 *  month label when that column is the first to fall in a new month (for header labels). */
export function routineHeatmapWeeks(completions: RoutineCompletion[], today: string, weeks = 53): RoutineHeatmapWeek[] {
  const outcomeByDate = new Map(completions.map((completion) => [completion.local_date, completion.outcome]));
  const lastWeekStart = calendarWeekStart(today);
  const firstWeekStart = shiftCalendarWeek(lastWeekStart, -(weeks - 1));
  let lastMonth = "";
  return Array.from({ length: weeks }, (_, index) => {
    const start = shiftCalendarWeek(firstWeekStart, index);
    const cells = calendarWeekDays(start).map((date) => ({
      date,
      outcome: outcomeByDate.get(date) ?? null,
      isToday: date === today,
      isFuture: date > today,
    }));
    const month = start.slice(0, 7);
    const monthLabel = month !== lastMonth ? new Date(`${start}T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" }) : null;
    lastMonth = month;
    return { start, cells, monthLabel };
  });
}

export function recurrenceLabel(task: Pick<WorkspaceData["tasks"][number], "recurrence_rule" | "recurrence_interval" | "recurrence_unit">) {
  if (!task.recurrence_rule) return null;
  if (task.recurrence_rule === "custom") return `Every ${task.recurrence_interval} ${task.recurrence_unit}`;
  if (task.recurrence_rule === "weekdays") return "Weekdays";
  return task.recurrence_rule.charAt(0).toUpperCase() + task.recurrence_rule.slice(1);
}

const PROJECT_ACTIVITY_LABELS: Record<string, string> = {
  created: "Project created",
  resumed: "Project resumed",
  canceled: "Project canceled",
  deleted: "Project deleted",
  restored: "Project restored",
  paused: "Project paused",
  completed: "Project completed",
  progress_recorded: "Progress recorded",
  milestone_created: "Milestone added",
  milestone_deleted: "Milestone deleted",
  milestone_completed: "Milestone completed",
  milestone_reopened: "Milestone reopened",
  checklist_applied: "Checklist applied",
  checklist_item_completed: "Checklist item completed",
  checklist_item_reopened: "Checklist item reopened",
  task_created: "Task added",
};

/* Falls back to a de-slugged event_type rather than an "unknown event" placeholder, so a future
   recordActivity call that this label map hasn't caught up with still renders something readable. */
export function activityEventLabel(eventType: string) {
  return PROJECT_ACTIVITY_LABELS[eventType] ?? eventType.replace(/_/g, " ");
}

/* A separate map rather than reusing PROJECT_ACTIVITY_LABELS: several event_type strings are
   shared between the two (created, paused, resumed), and project's copy ("Project paused") would
   be wrong on a retainer's own activity timeline. */
const RETAINER_ACTIVITY_LABELS: Record<string, string> = {
  created: "Retainer created",
  updated: "Retainer updated",
  paused: "Retainer paused",
  resumed: "Retainer resumed",
  ended: "Retainer ended",
  cycle_generated: "Cycle generated",
  template_item_created: "Deliverable added",
  template_item_updated: "Deliverable updated",
  template_item_deleted: "Deliverable removed",
  cycle_item_completed: "Deliverable completed",
  cycle_item_reopened: "Deliverable reopened",
  cycle_item_closed: "Deliverable closed",
  cycle_item_left_in_prior_cycle: "Deliverable left in its prior cycle",
};

export function retainerActivityEventLabel(eventType: string) {
  return RETAINER_ACTIVITY_LABELS[eventType] ?? eventType.replace(/_/g, " ");
}
