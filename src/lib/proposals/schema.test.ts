import { describe, expect, it } from "vitest";
import {
  currentProposalEnvelopeSchema,
  destinationSelectionSchema,
  filedDateColumns,
  fileManuallySchema,
  parseProposalEnvelope,
  proposalActionSchema,
  proposalEnvelopeSchema,
} from "./schema";

const captureId = "8b4d6c4b-3d7b-4655-9c42-0c4f2eff95d1";
const item = {
  recordType: "task",
  title: "Send analytics",
  confidence: { recordType: 0.9, title: 0.9 },
  needsReview: true,
  reason: "A requested action was explicit.",
};

describe("proposal schema", () => {
  const v1 = { schemaVersion: "1", sourceCaptureId: captureId, proposals: [item] };
  const v2 = { schemaVersion: "2", sourceCaptureId: captureId, proposals: [item] };
  const v3 = { schemaVersion: "3", sourceCaptureId: captureId, proposals: [item] };

  it("accepts a review-first proposal", () =>
    expect(proposalEnvelopeSchema.parse(v3).proposals).toHaveLength(1));
  it("rejects an unversioned response", () =>
    expect(proposalEnvelopeSchema.safeParse({ ...v3, schemaVersion: "4" }).success).toBe(false));

  it("asks providers for the current version only", () => {
    expect(currentProposalEnvelopeSchema.safeParse(v3).success).toBe(true);
    expect(currentProposalEnvelopeSchema.safeParse(v2).success).toBe(false);
    expect(currentProposalEnvelopeSchema.safeParse(v1).success).toBe(false);
  });

  /* Proposals stored before structured destinations existed still have to open in review;
     a reviewable capture must not become unreadable because the schema moved on. */
  it("upgrades a stored version 1 proposal", () => {
    const upgraded = parseProposalEnvelope({
      ...v1,
      proposals: [{ ...item, destinationName: "Rivera Studio", dueOn: "2026-08-12" }],
    });
    expect(upgraded?.schemaVersion).toBe("3");
    expect(upgraded?.proposals[0].destination).toEqual({ personName: "Rivera Studio" });
    expect(upgraded?.proposals[0]).toMatchObject({ date: "2026-08-12", dateKind: "due" });
  });

  /* An older proposal's date has no phrase behind it, which is exactly how the resolver
     tells "the capture said this" from "the model decided this". */
  it("upgrades a version 2 date without inventing words for it", () => {
    const upgraded = parseProposalEnvelope({
      ...v2,
      proposals: [{ ...item, dueOn: "2026-08-12", dueTime: "09:00" }],
    });
    expect(upgraded?.proposals[0]).toMatchObject({
      date: "2026-08-12",
      time: "09:00",
      dateKind: "due",
    });
    expect(upgraded?.proposals[0].datePhrase).toBeUndefined();
  });

  it("leaves a version 1 proposal without a destination unrouted", () => {
    expect(parseProposalEnvelope(v1)?.proposals[0].destination).toBeUndefined();
  });

  it("returns null instead of throwing on an unusable stored proposal", () => {
    expect(parseProposalEnvelope({})).toBeNull();
    expect(parseProposalEnvelope({ ...v3, proposals: [] })).toBeNull();
  });

  it("keeps the model out of the identifier business", () => {
    const parsed = currentProposalEnvelopeSchema.parse({
      ...v3,
      proposals: [
        {
          ...item,
          destination: {
            projectName: "Q3 launch",
            domainId: "8b4d6c4b-3d7b-4655-9c42-0c4f2eff95d1",
          },
        },
      ],
    });
    expect(parsed.proposals[0].destination).toEqual({ projectName: "Q3 launch" });
  });

  it("keeps the capture's own date words with the date", () => {
    const parsed = currentProposalEnvelopeSchema.parse({
      ...v3,
      proposals: [
        {
          ...item,
          datePhrase: "next Friday",
          date: "2026-08-14",
          dateKind: "scheduled",
          recurrence: { rule: "weekly", phrase: "every Friday" },
        },
      ],
    });
    expect(parsed.proposals[0]).toMatchObject({
      datePhrase: "next Friday",
      dateKind: "scheduled",
      recurrence: { rule: "weekly", phrase: "every Friday" },
    });
  });
});

describe("filed date input", () => {
  const filed = { recordType: "task", title: "Send analytics" };

  it("rejects a repeat with no first date, which the task table would reject too", () => {
    expect(fileManuallySchema.safeParse({ ...filed, recurrenceRule: "weekly" }).success).toBe(
      false,
    );
    expect(
      fileManuallySchema.safeParse({ ...filed, recurrenceRule: "weekly", date: "2026-08-14" })
        .success,
    ).toBe(true);
    expect(
      proposalActionSchema.safeParse({
        action: "accept",
        edited: { ...filed, recurrenceRule: "weekly" },
      }).success,
    ).toBe(false);
  });

  it("rejects a time that is not a 24-hour clock time", () => {
    expect(fileManuallySchema.safeParse({ ...filed, time: "2pm" }).success).toBe(false);
    expect(fileManuallySchema.safeParse({ ...filed, time: "14:00" }).success).toBe(true);
  });
});

describe("filedDateColumns", () => {
  it("separates a deadline from a start date", () => {
    expect(filedDateColumns({ dateKind: "due", date: "2026-08-14", time: "09:00" })).toMatchObject({
      due_on: "2026-08-14",
      scheduled_for: null,
      due_time: "09:00",
    });
    expect(filedDateColumns({ dateKind: "scheduled", date: "2026-08-14" })).toMatchObject({
      due_on: null,
      scheduled_for: "2026-08-14",
    });
  });

  it("anchors a repeat on its own date", () => {
    expect(
      filedDateColumns({ dateKind: "due", date: "2026-08-14", recurrenceRule: "weekly" }),
    ).toMatchObject({
      due_on: "2026-08-14",
      scheduled_for: "2026-08-14",
      recurrence_rule: "weekly",
      recurrence_anchor: "2026-08-14",
    });
  });

  /* Belt and braces behind the schema refinement: a repeat can never reach the database
     without the anchor its check constraint requires. */
  it("drops a repeat that lost its date", () => {
    expect(filedDateColumns({ recurrenceRule: "weekly" })).toMatchObject({
      recurrence_rule: null,
      recurrence_anchor: null,
      scheduled_for: null,
    });
  });

  it("writes nothing when no date was chosen", () => {
    expect(filedDateColumns({})).toEqual({
      due_on: null,
      scheduled_for: null,
      due_time: null,
      recurrence_rule: null,
      recurrence_anchor: null,
    });
  });
});

describe("destination selection", () => {
  it("accepts an existing record", () => {
    expect(
      destinationSelectionSchema.safeParse({ domainId: captureId, projectId: null, personId: null })
        .success,
    ).toBe(true);
  });

  it("accepts an explicit create request", () => {
    expect(destinationSelectionSchema.safeParse({ createDomainName: "Client work" }).success).toBe(
      true,
    );
  });

  /* Choosing a domain and creating one at the same time has no single correct outcome, so
     it is rejected rather than resolved by precedence. */
  it("rejects choosing and creating the same kind of destination", () => {
    expect(
      destinationSelectionSchema.safeParse({ domainId: captureId, createDomainName: "Client work" })
        .success,
    ).toBe(false);
    expect(
      destinationSelectionSchema.safeParse({ personId: captureId, createPersonName: "Dana" })
        .success,
    ).toBe(false);
  });

  it("rejects an identifier that is not a uuid", () => {
    expect(
      destinationSelectionSchema.safeParse({ projectId: "'; drop table tasks; --" }).success,
    ).toBe(false);
  });
});
