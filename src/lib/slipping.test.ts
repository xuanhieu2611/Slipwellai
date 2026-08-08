import { describe, expect, it } from "vitest";
import { coreSlippingExplanation } from "@/lib/slipping";

describe("core Slipping explanations", () => {
  const now = new Date("2026-08-20T12:00:00Z");

  it("uses meaningful activity rather than an arbitrary update timestamp", () => {
    const signal = coreSlippingExplanation({ entityType: "project", entityId: "project", title: "Launch", createdAt: "2026-08-01T12:00:00Z", lastMeaningfulAttention: "2026-08-15T12:00:00Z", cadenceDays: 7 }, "America/Vancouver", now);
    expect(signal).toBeNull();
  });

  it("explains the cadence and escalates an overdue high-priority task", () => {
    const signal = coreSlippingExplanation({ entityType: "task", entityId: "task", title: "Send report", createdAt: "2026-08-01T12:00:00Z", lastMeaningfulAttention: "2026-08-02T12:00:00Z", dueOn: "2026-08-10", priority: 3, cadenceDays: 14 }, "America/Vancouver", now);
    expect(signal).toEqual({ severity: "urgent", reason: "No meaningful attention for 18 days; your expected cadence for this task is 14 days. It was due 2026-08-10." });
  });

  /* America/Vancouver falls back from PDT (UTC-7) to PST (UTC-8) at 2026-11-01T09:00:00Z. At
     2026-11-01T05:00:00Z the still-PDT offset puts local time at 2026-10-31T22:00, a full UTC
     calendar day behind the "2026-11-01" a naive now.toISOString() comparison would use — which
     would wrongly read a task due "2026-10-31" as already overdue a day early. */
  it("resolves the local calendar day, not the UTC one, just before a fall-back DST transition", () => {
    const signal = coreSlippingExplanation({ entityType: "task", entityId: "task", title: "Send report", createdAt: "2026-10-01T12:00:00Z", lastMeaningfulAttention: "2026-10-25T12:00:00Z", dueOn: "2026-10-31", cadenceDays: 14 }, "America/Vancouver", new Date("2026-11-01T05:00:00Z"));
    expect(signal).toBeNull();
  });

  it("resolves the local calendar day correctly once the post-transition PST offset applies", () => {
    const signal = coreSlippingExplanation({ entityType: "task", entityId: "task", title: "Send report", createdAt: "2026-10-01T12:00:00Z", lastMeaningfulAttention: "2026-10-25T12:00:00Z", dueOn: "2026-10-31", cadenceDays: 14 }, "America/Vancouver", new Date("2026-11-01T09:01:00Z"));
    expect(signal).toMatchObject({ severity: "urgent" });
    expect(signal?.reason).toContain("It was due 2026-10-31.");
  });
});
