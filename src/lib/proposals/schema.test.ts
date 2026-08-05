import { describe, expect, it } from "vitest";
import { currentProposalEnvelopeSchema, destinationSelectionSchema, parseProposalEnvelope, proposalEnvelopeSchema } from "./schema";

const captureId = "8b4d6c4b-3d7b-4655-9c42-0c4f2eff95d1";
const item = { recordType: "task", title: "Send analytics", confidence: { recordType: 0.9, title: 0.9 }, needsReview: true, reason: "A requested action was explicit." };

describe("proposal schema", () => {
  const v1 = { schemaVersion: "1", sourceCaptureId: captureId, proposals: [item] };
  const v2 = { schemaVersion: "2", sourceCaptureId: captureId, proposals: [item] };

  it("accepts a review-first proposal", () => expect(proposalEnvelopeSchema.parse(v2).proposals).toHaveLength(1));
  it("rejects an unversioned response", () => expect(proposalEnvelopeSchema.safeParse({ ...v2, schemaVersion: "3" }).success).toBe(false));

  it("asks providers for the current version only", () => {
    expect(currentProposalEnvelopeSchema.safeParse(v2).success).toBe(true);
    expect(currentProposalEnvelopeSchema.safeParse(v1).success).toBe(false);
  });

  /* Proposals stored before structured destinations existed still have to open in review;
     a reviewable capture must not become unreadable because the schema moved on. */
  it("upgrades a stored version 1 proposal", () => {
    const upgraded = parseProposalEnvelope({ ...v1, proposals: [{ ...item, destinationName: "Rivera Studio" }] });
    expect(upgraded?.schemaVersion).toBe("2");
    expect(upgraded?.proposals[0].destination).toEqual({ personName: "Rivera Studio" });
  });

  it("leaves a version 1 proposal without a destination unrouted", () => {
    expect(parseProposalEnvelope(v1)?.proposals[0].destination).toBeUndefined();
  });

  it("returns null instead of throwing on an unusable stored proposal", () => {
    expect(parseProposalEnvelope({})).toBeNull();
    expect(parseProposalEnvelope({ ...v2, proposals: [] })).toBeNull();
  });

  it("keeps the model out of the identifier business", () => {
    const parsed = currentProposalEnvelopeSchema.parse({
      ...v2,
      proposals: [{ ...item, destination: { projectName: "Q3 launch", domainId: "8b4d6c4b-3d7b-4655-9c42-0c4f2eff95d1" } }],
    });
    expect(parsed.proposals[0].destination).toEqual({ projectName: "Q3 launch" });
  });
});

describe("destination selection", () => {
  it("accepts an existing record", () => {
    expect(destinationSelectionSchema.safeParse({ domainId: captureId, projectId: null, personId: null }).success).toBe(true);
  });

  it("accepts an explicit create request", () => {
    expect(destinationSelectionSchema.safeParse({ createDomainName: "Client work" }).success).toBe(true);
  });

  /* Choosing a domain and creating one at the same time has no single correct outcome, so
     it is rejected rather than resolved by precedence. */
  it("rejects choosing and creating the same kind of destination", () => {
    expect(destinationSelectionSchema.safeParse({ domainId: captureId, createDomainName: "Client work" }).success).toBe(false);
    expect(destinationSelectionSchema.safeParse({ personId: captureId, createPersonName: "Dana" }).success).toBe(false);
  });

  it("rejects an identifier that is not a uuid", () => {
    expect(destinationSelectionSchema.safeParse({ projectId: "'; drop table tasks; --" }).success).toBe(false);
  });
});
