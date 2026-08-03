import { describe, expect, it } from "vitest";
import { coreSlippingExplanation } from "@/lib/slipping";

describe("core Slipping explanations", () => {
  const now = new Date("2026-08-20T12:00:00Z");

  it("uses meaningful activity rather than an arbitrary update timestamp", () => {
    const signal = coreSlippingExplanation({ entityType: "project", entityId: "project", title: "Launch", createdAt: "2026-08-01T12:00:00Z", lastMeaningfulAttention: "2026-08-15T12:00:00Z", cadenceDays: 7 }, now);
    expect(signal).toBeNull();
  });

  it("explains the cadence and escalates an overdue high-priority task", () => {
    const signal = coreSlippingExplanation({ entityType: "task", entityId: "task", title: "Send report", createdAt: "2026-08-01T12:00:00Z", lastMeaningfulAttention: "2026-08-02T12:00:00Z", dueOn: "2026-08-10", priority: 3, cadenceDays: 14 }, now);
    expect(signal).toEqual({ severity: "urgent", reason: "No meaningful attention for 18 days; your expected cadence for this task is 14 days. It was due 2026-08-10." });
  });
});
