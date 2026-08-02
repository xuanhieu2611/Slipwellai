import { describe, expect, it } from "vitest";
import { proposalEnvelopeSchema } from "./schema";

describe("proposal schema", () => {
  const base = { schemaVersion: "1", sourceCaptureId: "8b4d6c4b-3d7b-4655-9c42-0c4f2eff95d1", proposals: [{ recordType: "task", title: "Send analytics", confidence: { recordType: 0.9, title: 0.9 }, needsReview: true, reason: "A requested action was explicit." }] };
  it("accepts a review-first proposal", () => expect(proposalEnvelopeSchema.parse(base).proposals).toHaveLength(1));
  it("rejects an unversioned response", () => expect(proposalEnvelopeSchema.safeParse({ ...base, schemaVersion: "2" }).success).toBe(false));
});
