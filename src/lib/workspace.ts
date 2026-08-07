import { z } from "zod";

const id = z.uuid();
const shortText = (max: number) => z.string().trim().min(1).max(max);
/* The forms post null for every cleared optional field, so nullish is the shape the client actually sends. */
const optionalText = (max: number) => z.string().trim().max(max).nullish().transform((value) => value || null);
const optionalId = id.optional().nullable();

export const workspaceCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_domain"), name: shortText(80), description: optionalText(1_000), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#215944") }),
  z.object({ action: z.literal("create_task"), title: shortText(280), details: optionalText(10_000), dueOn: z.iso.date().optional().nullable(), scheduledFor: z.iso.date().optional().nullable(), priority: z.coerce.number().int().min(1).max(3).default(2), recurrenceRule: z.enum(["none", "daily", "weekly", "monthly", "yearly", "weekdays", "custom"]).default("none"), recurrenceInterval: z.coerce.number().int().min(1).max(30).optional().nullable(), recurrenceUnit: z.enum(["days", "weeks"]).optional().nullable(), tags: z.array(shortText(40)).max(20).default([]), domainId: optionalId, projectId: optionalId, personId: optionalId, idempotencyKey: z.string().uuid() })
    .refine((task) => task.recurrenceRule === "none" || Boolean(task.scheduledFor), { message: "Recurring tasks need a scheduled date.", path: ["scheduledFor"] })
    .refine((task) => task.recurrenceRule !== "custom" || (Boolean(task.recurrenceInterval) && Boolean(task.recurrenceUnit)), { message: "A custom repeat needs an interval and a unit.", path: ["recurrenceInterval"] }),
  z.object({ action: z.literal("update_task"), taskId: id, title: shortText(280), details: optionalText(10_000), dueOn: z.iso.date().optional().nullable(), scheduledFor: z.iso.date().optional().nullable(), priority: z.coerce.number().int().min(1).max(3).default(2), tags: z.array(shortText(40)).max(20).default([]), domainId: optionalId, projectId: optionalId, personId: optionalId }),
  z.object({ action: z.literal("create_project"), name: shortText(160), description: optionalText(10_000), domainId: optionalId, personId: optionalId, startOn: z.iso.date().optional().nullable(), targetOn: z.iso.date().optional().nullable(), idempotencyKey: z.string().uuid() }),
  z.object({ action: z.literal("update_project"), projectId: id, name: shortText(160), description: optionalText(10_000), domainId: optionalId, personId: optionalId, startOn: z.iso.date().optional().nullable(), targetOn: z.iso.date().optional().nullable() }),
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
  z.object({ action: z.literal("resolve_routine"), routineId: id, localDate: z.iso.date(), outcome: z.enum(["completed", "skipped"]) }),
  z.object({ action: z.literal("complete_milestone"), milestoneId: id }),
  z.object({ action: z.literal("reopen_milestone"), milestoneId: id }),
  z.object({ action: z.literal("record_project_progress"), projectId: id }),
  z.object({ action: z.literal("pause_project"), projectId: id }),
  z.object({ action: z.literal("complete_project"), projectId: id }),
  z.object({ action: z.literal("complete_checklist_item"), itemId: id }),
  z.object({ action: z.literal("reopen_checklist_item"), itemId: id }),
]);

export type WorkspaceCommand = z.infer<typeof workspaceCommandSchema>;

export type WorkspaceData = {
  timezone: string;
  domains: Array<{ id: string; name: string; color: string; archived_at: string | null }>;
  tasks: Array<{ id: string; title: string; details: string | null; status: "open" | "completed" | "canceled" | "archived"; priority: number; due_on: string | null; scheduled_for: string | null; deferred_until: string | null; recurrence_rule: "daily" | "weekly" | "monthly" | "yearly" | "weekdays" | "custom" | null; recurrence_interval: number | null; recurrence_unit: "days" | "weeks" | null; tags: string[]; domain_id: string | null; project_id: string | null; person_id: string | null; top_three_date: string | null; top_three_order: number | null; completed_at: string | null; archived_at: string | null; created_at: string }>;
  projects: Array<{ id: string; name: string; description: string | null; status: string; domain_id: string | null; person_id: string | null; start_on: string | null; target_on: string | null; archived_at: string | null; created_at: string }>;
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
  signals: Array<{ id: string; entity_type: "task" | "project" | "retainer"; entity_id: string; reason: string; severity: "attention" | "urgent" | "informational"; outcome: string }>;
  captures: Array<{ id: string; original_text: string; status: string; created_at: string }>;
  projectActivity: Array<{ id: string; entity_id: string; event_type: string; metadata: Record<string, string>; occurred_at: string }>;
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
