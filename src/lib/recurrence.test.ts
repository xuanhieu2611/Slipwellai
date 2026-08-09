import { describe, expect, it } from "vitest";
import { nextRecurrenceDate } from "@/lib/recurrence";

describe("nextRecurrenceDate", () => {
  it("keeps daily and weekly schedules anchored to the prior scheduled date", () => {
    expect(nextRecurrenceDate("2026-08-03", "daily")).toBe("2026-08-04");
    expect(nextRecurrenceDate("2026-08-03", "weekly")).toBe("2026-08-10");
  });

  it("bounds monthly schedules for short months without skipping a cycle", () => {
    expect(nextRecurrenceDate("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(nextRecurrenceDate("2028-01-31", "monthly")).toBe("2028-02-29");
  });

  it("clamps a Feb 29 yearly anchor to Feb 28 in the next non-leap year, mirroring the monthly short-month clamp", () => {
    expect(nextRecurrenceDate("2028-02-29", "yearly")).toBe("2029-02-28");
    expect(nextRecurrenceDate("2026-08-06", "yearly")).toBe("2027-08-06");
  });

  it("skips weekends for the weekdays rule", () => {
    expect(nextRecurrenceDate("2026-08-06", "weekdays")).toBe("2026-08-07"); // Thursday -> Friday
    expect(nextRecurrenceDate("2026-08-07", "weekdays")).toBe("2026-08-10"); // Friday -> Monday
  });

  it("advances by the custom interval and unit", () => {
    expect(nextRecurrenceDate("2026-08-03", "custom", { interval: 3, unit: "days" })).toBe(
      "2026-08-06",
    );
    expect(nextRecurrenceDate("2026-08-03", "custom", { interval: 2, unit: "weeks" })).toBe(
      "2026-08-17",
    );
  });
});
