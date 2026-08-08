import { describe, expect, it } from "vitest";
import { cycleBounds, expectedDate, nextCycleMonth, signalActionSchema, slippingExplanation } from "./retainers";

describe("retainer cycle bounds", () => {
  it("clamps a 31st-day cycle in February of a non-leap year", () => {
    expect(cycleBounds("2026-02", 31)).toEqual({ start: "2026-02-28", end: "2026-03-30" });
  });

  it("clamps a 31st-day cycle to Feb 29 in a leap year", () => {
    expect(cycleBounds("2028-02", 31)).toEqual({ start: "2028-02-29", end: "2028-03-30" });
  });

  it("clamps a short 30-day month the same way for expectedDate", () => {
    expect(expectedDate("2026-04", 31)).toBe("2026-04-30");
  });
});

describe("Slipping explanations", () => {
  it("explains overdue open work without treating a cosmetic edit as attention", () => {
    expect(slippingExplanation({ expectedOn: "2026-07-20", timezone: "America/Vancouver", now: new Date("2026-08-02T10:00:00Z") })).toMatchObject({ severity: "urgent" });
  });

  /* America/Vancouver falls back from PDT (UTC-7) to PST (UTC-8) at 2026-11-01T09:00:00Z. At
     2026-11-01T05:00:00Z the still-PDT offset puts local time at 2026-10-31T22:00, a full UTC
     calendar day behind the "2026-11-01" a naive now.toISOString() comparison would use — which
     would wrongly read a deliverable expected "2026-10-31" as already overdue a day early. */
  it("resolves the local calendar day, not the UTC one, just before a fall-back DST transition", () => {
    expect(slippingExplanation({ expectedOn: "2026-10-31", timezone: "America/Vancouver", now: new Date("2026-11-01T05:00:00Z") })).toBeNull();
  });

  it("resolves the local calendar day correctly once the post-transition PST offset applies", () => {
    expect(slippingExplanation({ expectedOn: "2026-10-31", timezone: "America/Vancouver", now: new Date("2026-11-01T09:01:00Z") })).toMatchObject({ severity: "attention" });
  });
});

describe("retainer cycle navigation", () => {
  it("moves from December into January of the following year", () => {
    expect(nextCycleMonth("2026-12")).toBe("2027-01");
  });
});

describe("signalActionSchema", () => {
  it("rejects cadence_changed without a cadenceDays value", () => {
    expect(signalActionSchema.safeParse({ outcome: "cadence_changed" }).success).toBe(false);
  });

  it("accepts cadence_changed with a cadenceDays value in range", () => {
    const result = signalActionSchema.safeParse({ outcome: "cadence_changed", cadenceDays: 21 });
    expect(result.success).toBe(true);
    expect(result.success && result.data.cadenceDays).toBe(21);
  });

  it("rejects a cadenceDays value outside 1-365", () => {
    expect(signalActionSchema.safeParse({ outcome: "cadence_changed", cadenceDays: 0 }).success).toBe(false);
    expect(signalActionSchema.safeParse({ outcome: "cadence_changed", cadenceDays: 366 }).success).toBe(false);
  });

  it("still parses the existing three outcomes without cadenceDays", () => {
    expect(signalActionSchema.safeParse({ outcome: "marked_attention" }).success).toBe(true);
    expect(signalActionSchema.safeParse({ outcome: "deferred" }).success).toBe(true);
    expect(signalActionSchema.safeParse({ outcome: "dismissed" }).success).toBe(true);
  });
});
