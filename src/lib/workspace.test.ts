import { describe, expect, it } from "vitest";
import { isTaskOnDay, taskDateLabel, workspaceCommandSchema } from "@/lib/workspace";

describe("working-prototype workspace commands", () => {
  it("accepts a small manual task and rejects unsafe priorities", () => {
    const idempotencyKey = "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98";
    expect(workspaceCommandSchema.safeParse({ action: "create_task", title: "Send the report", priority: 3, idempotencyKey }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "create_task", title: "Send the report", priority: 4, idempotencyKey }).success).toBe(false);
  });

  it("keeps due, scheduled, and deferred semantics distinct in the UI", () => {
    expect(taskDateLabel({ due_on: "2026-08-04", scheduled_for: "2026-08-03", deferred_until: null })).toBe("Due 2026-08-04");
    expect(taskDateLabel({ due_on: null, scheduled_for: "2026-08-03", deferred_until: null })).toBe("Scheduled 2026-08-03");
    expect(taskDateLabel({ due_on: "2026-08-04", scheduled_for: null, deferred_until: "2026-08-06" })).toBe("Deferred until 2026-08-06");
  });

  it("requires a scheduled-date anchor before a task can repeat", () => {
    const idempotencyKey = "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98";
    expect(workspaceCommandSchema.safeParse({ action: "create_task", title: "Weekly review", recurrenceRule: "weekly", idempotencyKey }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ action: "create_task", title: "Weekly review", recurrenceRule: "weekly", scheduledFor: "2026-08-03", idempotencyKey }).success).toBe(true);
  });

  it("accepts a template application only with valid project and template identities", () => {
    expect(workspaceCommandSchema.safeParse({ action: "apply_checklist_template", templateId: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98", projectId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d" }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "apply_checklist_template", templateId: "not-an-id", projectId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d" }).success).toBe(false);
  });

  /* The forms read every optional input through FormData and send null when it is blank, so the
     schema has to accept that exact shape. Omitted-field tests alone let this regression through. */
  it("accepts the null-for-blank payloads the creation forms actually post", () => {
    const posted = [
      { action: "create_domain", name: "Client work", description: null, color: "#2348c8" },
      { action: "create_project", name: "Launch the September report", description: null, domainId: null, targetOn: null },
      { action: "create_task", title: "Send the report", details: null, dueOn: null, scheduledFor: null, priority: "2", recurrenceRule: "none", domainId: null, projectId: null, personId: null, idempotencyKey: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98" },
      { action: "create_person", name: "Priya", context: null, domainId: null },
      { action: "create_note", title: "Call notes", body: null, domainId: null, projectId: null, personId: null, reviewOn: null },
      { action: "create_checklist_template", name: "Monthly client report", description: null },
      { action: "create_person_interaction", personId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d", summary: "Discussed the report", followUpTitle: null },
    ];
    for (const command of posted) expect(workspaceCommandSchema.safeParse(command), command.action).toMatchObject({ success: true });
  });

  it("normalizes blank optional text to null rather than an empty string", () => {
    const parsed = workspaceCommandSchema.parse({ action: "create_domain", name: "Client work", description: null, color: "#2348c8" });
    expect(parsed).toMatchObject({ description: null });
    expect(workspaceCommandSchema.parse({ action: "create_domain", name: "Client work", description: "  Trim me  " })).toMatchObject({ description: "Trim me" });
  });

  it("still rejects required text that is missing or blank", () => {
    expect(workspaceCommandSchema.safeParse({ action: "create_domain", name: null }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ action: "create_task", title: "   " }).success).toBe(false);
  });

  it("requires a private person identity and interaction summary", () => {
    expect(workspaceCommandSchema.safeParse({ action: "create_person_interaction", personId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d", summary: "Discussed next month’s report", followUpTitle: "Send recap" }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "create_person_interaction", personId: "not-an-id", summary: "" }).success).toBe(false);
  });

  it("accepts a task update with the null-for-blank shape the edit form posts, and rejects a missing title", () => {
    const posted = { action: "update_task", taskId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d", title: "Send the revised report", details: null, dueOn: null, scheduledFor: null, priority: "2", domainId: null, projectId: null, personId: null };
    expect(workspaceCommandSchema.safeParse(posted)).toMatchObject({ success: true });
    expect(workspaceCommandSchema.safeParse({ ...posted, title: "   " }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ ...posted, taskId: "not-an-id" }).success).toBe(false);
  });

  it("lets a task update repoint domain, project, and person, mirroring create_task's relation fields", () => {
    const parsed = workspaceCommandSchema.parse({ action: "update_task", taskId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d", title: "Send the revised report", domainId: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98", projectId: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98", personId: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98" });
    expect(parsed).toMatchObject({ domainId: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98", projectId: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98", personId: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98" });
    expect(workspaceCommandSchema.safeParse({ action: "update_task", taskId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d", title: "x", domainId: "not-an-id" }).success).toBe(false);
  });

  it("prioritizes a deferred date over due/scheduled dates when deciding what belongs on a given day, matching taskDateLabel's own priority", () => {
    expect(isTaskOnDay({ due_on: "2026-08-06", scheduled_for: null, deferred_until: "2026-08-10" }, "2026-08-06")).toBe(false);
    expect(isTaskOnDay({ due_on: "2026-08-06", scheduled_for: null, deferred_until: "2026-08-10" }, "2026-08-10")).toBe(true);
    expect(isTaskOnDay({ due_on: "2026-08-06", scheduled_for: null, deferred_until: null }, "2026-08-06")).toBe(true);
    expect(isTaskOnDay({ due_on: null, scheduled_for: null, deferred_until: null }, "2026-08-06")).toBe(false);
  });

  it("accepts cancel, delete, and restore commands for a valid task id and rejects a bad one", () => {
    const taskId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    expect(workspaceCommandSchema.safeParse({ action: "cancel_task", taskId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "delete_task", taskId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "restore_task", taskId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "cancel_task", taskId: "not-an-id" }).success).toBe(false);
  });

  it("requires a stable idempotency key to create a task, and defaults tags to an empty array", () => {
    const base = { action: "create_task", title: "Send the report", idempotencyKey: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98" };
    expect(workspaceCommandSchema.safeParse(base).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ ...base, idempotencyKey: undefined }).success).toBe(false);
    expect(workspaceCommandSchema.parse(base)).toMatchObject({ tags: [] });
    expect(workspaceCommandSchema.parse({ ...base, tags: ["client", "urgent"] })).toMatchObject({ tags: ["client", "urgent"] });
  });

  it("lets a task update carry tags, mirroring create_task's field, and defaults to an empty array", () => {
    const taskId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    expect(workspaceCommandSchema.parse({ action: "update_task", taskId, title: "Send the revised report" })).toMatchObject({ tags: [] });
    expect(workspaceCommandSchema.parse({ action: "update_task", taskId, title: "Send the revised report", tags: ["billing"] })).toMatchObject({ tags: ["billing"] });
  });

  it("accepts the yearly and weekdays recurrence rules with a scheduled anchor", () => {
    const idempotencyKey = "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98";
    expect(workspaceCommandSchema.safeParse({ action: "create_task", title: "Renew the domain", recurrenceRule: "yearly", scheduledFor: "2026-08-06", idempotencyKey }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "create_task", title: "Standup", recurrenceRule: "weekdays", scheduledFor: "2026-08-06", idempotencyKey }).success).toBe(true);
  });

  it("requires an interval and unit for a custom repeat, and rejects an interval outside 1-30", () => {
    const idempotencyKey = "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98";
    const base = { action: "create_task", title: "Water the plants", recurrenceRule: "custom", scheduledFor: "2026-08-06", idempotencyKey };
    expect(workspaceCommandSchema.safeParse(base).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ ...base, recurrenceInterval: 3, recurrenceUnit: "days" }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ ...base, recurrenceInterval: 31, recurrenceUnit: "days" }).success).toBe(false);
  });

  it("accepts an archive_domain command only with a valid domain id", () => {
    expect(workspaceCommandSchema.safeParse({ action: "archive_domain", domainId: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98" }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "archive_domain", domainId: "not-an-id" }).success).toBe(false);
  });
});
