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
});
