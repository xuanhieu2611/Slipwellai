import { describe, expect, it } from "vitest";
import { cycleBounds, nextCycleMonth, slippingExplanation } from "./retainers";

describe("retainer cycle bounds", () => {
  it("clamps a 31st-day cycle in February", () => {
    expect(cycleBounds("2026-02", 31)).toEqual({ start: "2026-02-28", end: "2026-03-30" });
  });
});

describe("Slipping explanations", () => {
  it("explains overdue open work without treating a cosmetic edit as attention", () => {
    expect(slippingExplanation({ expectedOn: "2026-07-20", now: new Date("2026-08-02T10:00:00Z") })).toMatchObject({ severity: "urgent" });
  });
});

describe("retainer cycle navigation", () => {
  it("moves from December into January of the following year", () => {
    expect(nextCycleMonth("2026-12")).toBe("2027-01");
  });
});
