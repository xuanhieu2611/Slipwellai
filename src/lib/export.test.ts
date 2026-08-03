import { describe, expect, it } from "vitest";
import { exportFilename } from "@/lib/export";

describe("export filename", () => {
  it("uses a predictable portable JSON filename", () => {
    expect(exportFilename(new Date("2026-08-02T12:00:00Z"))).toBe("slipwell-export-2026-08-02.json");
  });
});
