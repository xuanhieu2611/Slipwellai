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
});
