import { describe, expect, it } from "vitest";
import { taskDateLabel, workspaceCommandSchema } from "@/lib/workspace";

describe("working-prototype workspace commands", () => {
  it("accepts a small manual task and rejects unsafe priorities", () => {
    expect(workspaceCommandSchema.safeParse({ action: "create_task", title: "Send the report", priority: 3 }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "create_task", title: "Send the report", priority: 4 }).success).toBe(false);
  });

  it("keeps due, scheduled, and deferred semantics distinct in the UI", () => {
    expect(taskDateLabel({ due_on: "2026-08-04", scheduled_for: "2026-08-03", deferred_until: null })).toBe("Due 2026-08-04");
    expect(taskDateLabel({ due_on: null, scheduled_for: "2026-08-03", deferred_until: null })).toBe("Scheduled 2026-08-03");
    expect(taskDateLabel({ due_on: "2026-08-04", scheduled_for: null, deferred_until: "2026-08-06" })).toBe("Deferred until 2026-08-06");
  });

  it("requires a scheduled-date anchor before a task can repeat", () => {
    expect(workspaceCommandSchema.safeParse({ action: "create_task", title: "Weekly review", recurrenceRule: "weekly" }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ action: "create_task", title: "Weekly review", recurrenceRule: "weekly", scheduledFor: "2026-08-03" }).success).toBe(true);
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
      { action: "create_task", title: "Send the report", details: null, dueOn: null, scheduledFor: null, priority: "2", recurrenceRule: "none", domainId: null, projectId: null, personId: null },
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
});
