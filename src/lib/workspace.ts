import { z } from "zod";

const id = z.uuid();
const shortText = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((value) => value || null);
const optionalId = id.optional().nullable();

export const workspaceCommandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create_domain"), name: shortText(80), description: optionalText(1_000), color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default("#215944") }),
  z.object({ action: z.literal("create_task"), title: shortText(280), details: optionalText(10_000), dueOn: z.iso.date().optional().nullable(), scheduledFor: z.iso.date().optional().nullable(), priority: z.coerce.number().int().min(1).max(3).default(2), recurrenceRule: z.enum(["none", "daily", "weekly", "monthly"]).default("none"), domainId: optionalId, projectId: optionalId, personId: optionalId }).refine((task) => task.recurrenceRule === "none" || Boolean(task.scheduledFor), { message: "Recurring tasks need a scheduled date.", path: ["scheduledFor"] }),
  z.object({ action: z.literal("create_project"), name: shortText(160), description: optionalText(10_000), domainId: optionalId, targetOn: z.iso.date().optional().nullable() }),
  z.object({ action: z.literal("create_milestone"), projectId: id, title: shortText(280) }),
  z.object({ action: z.literal("create_checklist_template"), name: shortText(160), description: optionalText(1_000) }),
  z.object({ action: z.literal("add_checklist_template_item"), templateId: id, title: shortText(280) }),
  z.object({ action: z.literal("apply_checklist_template"), templateId: id, projectId: id }),
  z.object({ action: z.literal("create_person"), name: shortText(160), context: optionalText(1_000), domainId: optionalId }),
  z.object({ action: z.literal("create_person_interaction"), personId: id, summary: shortText(4_000), followUpTitle: optionalText(280) }),
  z.object({ action: z.literal("create_note"), title: shortText(280), body: optionalText(20_000), domainId: optionalId, projectId: optionalId, personId: optionalId, reviewOn: z.iso.date().optional().nullable() }),
  z.object({ action: z.literal("create_routine"), name: shortText(160), period: z.enum(["morning", "afternoon", "evening", "anytime"]).default("anytime") }),
  z.object({ action: z.literal("complete_task"), taskId: id }),
  z.object({ action: z.literal("reopen_task"), taskId: id }),
  z.object({ action: z.literal("defer_task"), taskId: id, until: z.iso.date().optional().nullable() }),
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
  tasks: Array<{ id: string; title: string; details: string | null; status: "open" | "completed" | "canceled" | "archived"; priority: number; due_on: string | null; scheduled_for: string | null; deferred_until: string | null; recurrence_rule: "daily" | "weekly" | "monthly" | null; domain_id: string | null; project_id: string | null; person_id: string | null; top_three_date: string | null; top_three_order: number | null; created_at: string }>;
  projects: Array<{ id: string; name: string; description: string | null; status: string; domain_id: string | null; target_on: string | null; created_at: string }>;
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
