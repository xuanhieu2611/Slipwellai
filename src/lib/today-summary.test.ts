import { describe, expect, it } from "vitest";
import { isTodayAllCaughtUp } from "./today-summary";

const emptyCounts = {
  topThreeCount: 0,
  dueTodayCount: 0,
  unresolvedRoutineCount: 0,
  reviewNoteCount: 0,
  openSignalCount: 0,
  attentionCaptureCount: 0,
};

describe("isTodayAllCaughtUp", () => {
  it("is true when every section is empty", () => {
    expect(isTodayAllCaughtUp(emptyCounts)).toBe(true);
  });

  it.each([
    ["topThreeCount", { topThreeCount: 1 }],
    ["dueTodayCount", { dueTodayCount: 1 }],
    ["unresolvedRoutineCount", { unresolvedRoutineCount: 1 }],
    ["reviewNoteCount", { reviewNoteCount: 1 }],
    ["openSignalCount", { openSignalCount: 1 }],
    ["attentionCaptureCount", { attentionCaptureCount: 1 }],
  ])("is false when %s alone is non-zero", (_label, override) => {
    expect(isTodayAllCaughtUp({ ...emptyCounts, ...override })).toBe(false);
  });
});
