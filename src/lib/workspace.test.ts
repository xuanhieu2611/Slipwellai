import { describe, expect, it } from "vitest";
import { activityEventLabel, calendarMonthGrid, centeredWeekDays, isTaskOnDay, routineCurrentStreak, routineHeatmapWeeks, shiftCalendarMonth, taskDateLabel, taskPlanningDate, workspaceCommandSchema } from "@/lib/workspace";

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
      { action: "create_domain", name: "Client work", description: null, color: "#2348c8", slippingCadenceDays: null },
      { action: "create_project", name: "Launch the September report", description: null, domainId: null, personId: null, startOn: null, targetOn: null, idempotencyKey: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98" },
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

  it("accepts update/delete/restore for people and notes with the null-for-blank shape the edit forms post, and rejects a missing name/title", () => {
    const personId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    const noteId = "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98";
    const postedPerson = { action: "update_person", personId, name: "Priya", context: null, domainId: null };
    expect(workspaceCommandSchema.safeParse(postedPerson)).toMatchObject({ success: true });
    expect(workspaceCommandSchema.safeParse({ ...postedPerson, name: "   " }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ ...postedPerson, personId: "not-an-id" }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ action: "delete_person", personId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "restore_person", personId }).success).toBe(true);

    const postedNote = { action: "update_note", noteId, title: "Call notes", body: null, domainId: null, projectId: null, personId: null, reviewOn: null };
    expect(workspaceCommandSchema.safeParse(postedNote)).toMatchObject({ success: true });
    expect(workspaceCommandSchema.safeParse({ ...postedNote, title: "   " }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ ...postedNote, noteId: "not-an-id" }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ action: "delete_note", noteId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "restore_note", noteId }).success).toBe(true);
  });

  it("prioritizes a deferred date over due/scheduled dates when deciding what belongs on a given day, matching taskDateLabel's own priority", () => {
    expect(isTaskOnDay({ due_on: "2026-08-06", scheduled_for: null, deferred_until: "2026-08-10" }, "2026-08-06")).toBe(false);
    expect(isTaskOnDay({ due_on: "2026-08-06", scheduled_for: null, deferred_until: "2026-08-10" }, "2026-08-10")).toBe(true);
    expect(isTaskOnDay({ due_on: "2026-08-06", scheduled_for: null, deferred_until: null }, "2026-08-06")).toBe(true);
    expect(isTaskOnDay({ due_on: null, scheduled_for: null, deferred_until: null }, "2026-08-06")).toBe(false);
  });

  it("uses the same planning-date priority for calendar placement and labels", () => {
    expect(taskPlanningDate({ due_on: "2026-08-06", scheduled_for: "2026-08-05", deferred_until: "2026-08-10" })).toBe("2026-08-10");
    expect(taskPlanningDate({ due_on: "2026-08-06", scheduled_for: "2026-08-05", deferred_until: null })).toBe("2026-08-06");
    expect(taskPlanningDate({ due_on: null, scheduled_for: "2026-08-05", deferred_until: null })).toBe("2026-08-05");
    expect(taskPlanningDate({ due_on: null, scheduled_for: null, deferred_until: null })).toBeNull();
  });

  it("builds a Monday-first six-week month grid and crosses year boundaries", () => {
    const august = calendarMonthGrid("2026-08-17");
    expect(august).toHaveLength(42);
    expect(august[0]).toBe("2026-07-27");
    expect(august[41]).toBe("2026-09-06");
    expect(shiftCalendarMonth("2026-12-18", 1)).toBe("2027-01-01");
    expect(shiftCalendarMonth("2026-01-18", -1)).toBe("2025-12-01");
  });

  it("centers a seven-day strip on the given day so upcoming work stays visible", () => {
    // Saturday Aug 8 should show Wed–Tue, with today at index 3.
    expect(centeredWeekDays("2026-08-08")).toEqual([
      "2026-08-05",
      "2026-08-06",
      "2026-08-07",
      "2026-08-08",
      "2026-08-09",
      "2026-08-10",
      "2026-08-11",
    ]);
  });

  it("accepts cancel, delete, and restore commands for a valid task id and rejects a bad one", () => {
    const taskId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    expect(workspaceCommandSchema.safeParse({ action: "cancel_task", taskId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "delete_task", taskId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "restore_task", taskId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "cancel_task", taskId: "not-an-id" }).success).toBe(false);
  });

  it("requires a stable idempotency key to create a project, and accepts its person/start-date fields", () => {
    const base = { action: "create_project", name: "Launch the September report", idempotencyKey: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98" };
    expect(workspaceCommandSchema.safeParse(base).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ ...base, idempotencyKey: undefined }).success).toBe(false);
    const parsed = workspaceCommandSchema.parse({ ...base, personId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d", startOn: "2026-08-01" });
    expect(parsed).toMatchObject({ personId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d", startOn: "2026-08-01" });
  });

  it("accepts a project update with the null-for-blank shape the edit form posts, and rejects a missing name", () => {
    const posted = { action: "update_project", projectId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d", name: "Launch the revised report", description: null, domainId: null, personId: null, startOn: null, targetOn: null };
    expect(workspaceCommandSchema.safeParse(posted)).toMatchObject({ success: true });
    expect(workspaceCommandSchema.safeParse({ ...posted, name: "   " }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ ...posted, projectId: "not-an-id" }).success).toBe(false);
  });

  it("accepts resume, cancel, delete, restore, and milestone-delete commands for a valid id and rejects a bad one", () => {
    const projectId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    expect(workspaceCommandSchema.safeParse({ action: "resume_project", projectId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "cancel_project", projectId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "delete_project", projectId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "restore_project", projectId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "delete_milestone", milestoneId: projectId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "cancel_project", projectId: "not-an-id" }).success).toBe(false);
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

  it("accepts an update_domain command with the null-for-blank shape the edit form posts", () => {
    const posted = {
      action: "update_domain",
      domainId: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98",
      name: "Client work",
      description: null,
      color: "#C47B5B",
      slippingCadenceDays: null,
    };
    expect(workspaceCommandSchema.safeParse(posted).success).toBe(true);
    expect(workspaceCommandSchema.parse({ ...posted, description: "  Ads retainer  " })).toMatchObject({ description: "Ads retainer" });
    expect(workspaceCommandSchema.safeParse({ ...posted, name: "   " }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ ...posted, color: "blue" }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ ...posted, domainId: "not-an-id" }).success).toBe(false);
  });

  /* Domains reuse the same optional 1-365 cadence field as tasks and projects (see the create_task/
     create_project schemas above), so the acceptance range needs the same boundary coverage. */
  it("accepts a domain's default attention cadence within 1-365 and rejects values outside that range", () => {
    const create = { action: "create_domain", name: "Client work", color: "#C47B5B" };
    expect(workspaceCommandSchema.safeParse({ ...create, slippingCadenceDays: 1 }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ ...create, slippingCadenceDays: 365 }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ ...create, slippingCadenceDays: 0 }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ ...create, slippingCadenceDays: 366 }).success).toBe(false);
    expect(workspaceCommandSchema.parse({ ...create, slippingCadenceDays: undefined })).toMatchObject({ slippingCadenceDays: undefined });

    const update = { action: "update_domain", domainId: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98", name: "Client work", color: "#C47B5B" };
    expect(workspaceCommandSchema.safeParse({ ...update, slippingCadenceDays: 1 }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ ...update, slippingCadenceDays: 365 }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ ...update, slippingCadenceDays: 0 }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ ...update, slippingCadenceDays: 366 }).success).toBe(false);
  });

  it("accepts checklist template item edit/delete and template delete for a valid id, defaulting applyToExisting to false", () => {
    const itemId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    const templateId = "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98";
    const parsed = workspaceCommandSchema.parse({ action: "update_checklist_template_item", itemId, title: "Send the draft" });
    expect(parsed).toMatchObject({ applyToExisting: false });
    expect(workspaceCommandSchema.parse({ action: "update_checklist_template_item", itemId, title: "Send the draft", applyToExisting: true })).toMatchObject({ applyToExisting: true });
    expect(workspaceCommandSchema.safeParse({ action: "update_checklist_template_item", itemId, title: "   " }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ action: "delete_checklist_template_item", itemId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "delete_checklist_template", templateId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "delete_checklist_template", templateId: "not-an-id" }).success).toBe(false);
  });

  it("labels known project activity event types and falls back to a de-slugged label for an unknown one", () => {
    expect(activityEventLabel("milestone_completed")).toBe("Milestone completed");
    expect(activityEventLabel("checklist_applied")).toBe("Checklist applied");
    expect(activityEventLabel("some_future_event")).toBe("some future event");
  });

  it("accepts a retainer template item edit, defaulting scope to future, and rejects a bad expected day", () => {
    const itemId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    const parsed = workspaceCommandSchema.parse({ action: "update_retainer_template_item", itemId, title: "Monthly report", expectedDay: 15 });
    expect(parsed).toMatchObject({ scope: "future" });
    expect(workspaceCommandSchema.parse({ action: "update_retainer_template_item", itemId, title: "Monthly report", expectedDay: 15, scope: "current" })).toMatchObject({ scope: "current" });
    expect(workspaceCommandSchema.parse({ action: "update_retainer_template_item", itemId, title: "Monthly report", expectedDay: 15, scope: "both" })).toMatchObject({ scope: "both" });
    expect(workspaceCommandSchema.safeParse({ action: "update_retainer_template_item", itemId, title: "Monthly report", expectedDay: 32 }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ action: "update_retainer_template_item", itemId, title: "Monthly report", expectedDay: 15, scope: "sometimes" }).success).toBe(false);
  });

  it("accepts a retainer template item delete for a valid id and rejects a bad one", () => {
    expect(workspaceCommandSchema.safeParse({ action: "delete_retainer_template_item", itemId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d" }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "delete_retainer_template_item", itemId: "not-an-id" }).success).toBe(false);
  });

  it("accepts close and leave-in-prior-cycle commands for a valid retainer cycle item id and rejects a bad one", () => {
    const itemId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    expect(workspaceCommandSchema.safeParse({ action: "close_retainer_cycle_item", itemId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "leave_retainer_cycle_item_in_prior_cycle", itemId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "close_retainer_cycle_item", itemId: "not-an-id" }).success).toBe(false);
  });

  it("accepts pause and resume retainer commands for a valid id and rejects a bad one", () => {
    const retainerId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    expect(workspaceCommandSchema.safeParse({ action: "pause_retainer", retainerId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "resume_retainer", retainerId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "pause_retainer", retainerId: "not-an-id" }).success).toBe(false);
  });

  it("requires an explicit open-item resolution to end a retainer, rather than defaulting one silently", () => {
    const retainerId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    expect(workspaceCommandSchema.safeParse({ action: "end_retainer", retainerId, openItemResolution: "leave_open" }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "end_retainer", retainerId, openItemResolution: "close_all" }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "end_retainer", retainerId }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ action: "end_retainer", retainerId, openItemResolution: "silently_decide" }).success).toBe(false);
  });

  it("requires a stable idempotency key to create a retainer, and accepts its client/domain links", () => {
    const base = { action: "create_retainer", name: "Rivera Studio monthly retainer", timezone: "America/Vancouver", cycleDay: 1, idempotencyKey: "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98" };
    expect(workspaceCommandSchema.safeParse(base).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ ...base, idempotencyKey: undefined }).success).toBe(false);
    const parsed = workspaceCommandSchema.parse({ ...base, clientPersonId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d", domainId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d" });
    expect(parsed).toMatchObject({ clientPersonId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d", domainId: "847a0e15-63ef-4a68-98f7-51fdbe09f29d" });
    expect(workspaceCommandSchema.safeParse({ ...base, cycleDay: 32 }).success).toBe(false);
  });

  it("accepts a retainer update and a retainer template item creation for valid ids", () => {
    const retainerId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    expect(workspaceCommandSchema.safeParse({ action: "update_retainer", retainerId, name: "Rivera Studio", timezone: "America/Vancouver", cycleDay: 1 }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "create_retainer_template_item", retainerId, title: "Monthly report", expectedDay: 15 }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "create_retainer_template_item", retainerId, title: "Monthly report", expectedDay: 32 }).success).toBe(false);
  });

  it("lets a task be created or updated with a retainer link, mirroring the project relation field", () => {
    const idempotencyKey = "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98";
    const retainerId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    expect(workspaceCommandSchema.parse({ action: "create_task", title: "Send the report", retainerId, idempotencyKey })).toMatchObject({ retainerId });
    expect(workspaceCommandSchema.parse({ action: "update_task", taskId: retainerId, title: "Send the report", retainerId })).toMatchObject({ retainerId });
  });

  it("accepts delete and restore commands for a valid retainer id and rejects a bad one", () => {
    const retainerId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    expect(workspaceCommandSchema.safeParse({ action: "delete_retainer", retainerId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "restore_retainer", retainerId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "delete_retainer", retainerId: "not-an-id" }).success).toBe(false);
  });

  it("requires a stable idempotency key and a valid calendar month to generate a retainer cycle", () => {
    const retainerId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    const idempotencyKey = "6f1d9b6d-7a94-4de2-bf85-14da8b7c6b98";
    expect(workspaceCommandSchema.safeParse({ action: "generate_retainer_cycle", retainerId, cycleMonth: "2026-09", idempotencyKey }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "generate_retainer_cycle", retainerId, cycleMonth: "2026-09" }).success).toBe(false);
    expect(workspaceCommandSchema.safeParse({ action: "generate_retainer_cycle", retainerId, cycleMonth: "not-a-month", idempotencyKey }).success).toBe(false);
  });

  it("counts a routine's current streak, treating an unresolved today as still open but an unresolved earlier day as a break", () => {
    expect(routineCurrentStreak([{ local_date: "2026-08-06", outcome: "completed" }, { local_date: "2026-08-07", outcome: "completed" }, { local_date: "2026-08-08", outcome: "completed" }], "2026-08-08")).toBe(3);
    expect(routineCurrentStreak([{ local_date: "2026-08-06", outcome: "completed" }, { local_date: "2026-08-07", outcome: "completed" }], "2026-08-08")).toBe(2);
    expect(routineCurrentStreak([{ local_date: "2026-08-05", outcome: "completed" }, { local_date: "2026-08-07", outcome: "completed" }], "2026-08-08")).toBe(1);
    expect(routineCurrentStreak([{ local_date: "2026-08-07", outcome: "skipped" }], "2026-08-08")).toBe(0);
    expect(routineCurrentStreak([], "2026-08-08")).toBe(0);
  });

  it("builds a 53-week, Monday-first heatmap grid ending on today's week, with a month label only where the month changes", () => {
    const weeks = routineHeatmapWeeks([{ local_date: "2026-08-06", outcome: "completed" }, { local_date: "2026-08-07", outcome: "skipped" }], "2026-08-08", 53);
    expect(weeks).toHaveLength(53);
    const lastWeek = weeks[52];
    expect(lastWeek.cells).toHaveLength(7);
    expect(lastWeek.cells.map((cell) => cell.date)).toContain("2026-08-08");
    const today = lastWeek.cells.find((cell) => cell.date === "2026-08-08");
    expect(today).toMatchObject({ outcome: null, isToday: true, isFuture: false });
    const completedDay = lastWeek.cells.find((cell) => cell.date === "2026-08-06");
    expect(completedDay).toMatchObject({ outcome: "completed", isToday: false });
    const skippedDay = lastWeek.cells.find((cell) => cell.date === "2026-08-07");
    expect(skippedDay).toMatchObject({ outcome: "skipped" });
    const futureDay = lastWeek.cells.find((cell) => cell.date === "2026-08-09");
    expect(futureDay).toMatchObject({ outcome: null, isFuture: true });
    const monthLabels = weeks.map((week) => week.monthLabel).filter(Boolean);
    expect(monthLabels.length).toBeGreaterThan(1);
    expect(weeks[0].monthLabel).not.toBeNull();
  });

  it("accepts complete and reopen commands for a valid retainer cycle item id and rejects a bad one", () => {
    const itemId = "847a0e15-63ef-4a68-98f7-51fdbe09f29d";
    expect(workspaceCommandSchema.safeParse({ action: "complete_retainer_cycle_item", itemId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "reopen_retainer_cycle_item", itemId }).success).toBe(true);
    expect(workspaceCommandSchema.safeParse({ action: "complete_retainer_cycle_item", itemId: "not-an-id" }).success).toBe(false);
  });
});
