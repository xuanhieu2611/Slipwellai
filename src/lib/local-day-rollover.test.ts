import { describe, expect, it } from "vitest";
import { localDayRolledOver, nextRolloverCheckDelayMs } from "./local-day-rollover";

describe("nextRolloverCheckDelayMs", () => {
  it("schedules just after the next minute boundary from the start of a minute", () => {
    expect(nextRolloverCheckDelayMs(new Date("2026-08-09T23:58:00.000Z"))).toBe(61_000);
  });

  it("schedules just after the next minute boundary from mid-minute", () => {
    expect(nextRolloverCheckDelayMs(new Date("2026-08-09T23:58:30.000Z"))).toBe(31_000);
  });

  it("schedules just after the next minute boundary from just before it ticks over", () => {
    expect(nextRolloverCheckDelayMs(new Date("2026-08-09T23:58:59.999Z"))).toBe(1_001);
  });

  it("always returns a delay past the boundary, never exactly on it", () => {
    // Exactly on a minute boundary is the one instant most likely to alias with the wall clock
    // actually ticking over; the +1s pad must survive it.
    expect(nextRolloverCheckDelayMs(new Date("2026-08-09T23:59:00.000Z"))).toBe(61_000);
  });
});

describe("localDayRolledOver", () => {
  it("is false while the local day is unchanged", () => {
    expect(localDayRolledOver("2026-08-09", "2026-08-09")).toBe(false);
  });

  it("is true once the local day advances", () => {
    expect(localDayRolledOver("2026-08-10", "2026-08-09")).toBe(true);
  });

  it("is true if the local day somehow moves backward too (defensive, not expected in practice)", () => {
    expect(localDayRolledOver("2026-08-08", "2026-08-09")).toBe(true);
  });
});
