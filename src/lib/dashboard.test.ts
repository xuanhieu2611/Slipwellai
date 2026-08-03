import { describe, expect, it } from "vitest";
import { newestProposalByCapture } from "./dashboard";

describe("newestProposalByCapture", () => {
  it("surfaces the newest retry state when a capture has multiple proposals", () => {
    const latest = newestProposalByCapture([
      { capture_id: "capture-1", id: "failed-retry", status: "failed" },
      { capture_id: "capture-1", id: "superseded-original", status: "superseded" },
    ]);

    expect(latest.get("capture-1")).toEqual({ capture_id: "capture-1", id: "failed-retry", status: "failed" });
  });
});
