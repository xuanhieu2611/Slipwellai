import { z } from "zod";

export const recordTypeSchema = z.enum(["task", "note", "retainer_update"]);

const dueTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM.");

const confidenceSchema = z.object({
  recordType: z.number().min(0).max(1),
  title: z.number().min(0).max(1),
  destination: z.number().min(0).max(1).optional(),
  date: z.number().min(0).max(1).optional(),
});

/* The model proposes destination *names*, never identifiers. Turning a name into a record
   happens server-side against owner-scoped rows, so the model cannot address another
   account's record by guessing an id, and a name matching nothing stays an open question
   in review rather than quietly creating a domain, project, or person. */
export const proposedDestinationSchema = z.object({
  domainName: z.string().trim().max(80).optional(),
  projectName: z.string().trim().max(160).optional(),
  personName: z.string().trim().max(160).optional(),
});

export type ProposedDestination = z.infer<typeof proposedDestinationSchema>;

const proposalItemFields = {
  recordType: recordTypeSchema,
  title: z.string().trim().min(1).max(280),
  body: z.string().trim().max(5000).optional(),
  dueOn: z.string().date().optional(),
  dueTime: dueTimeSchema.optional(),
  confidence: confidenceSchema,
  needsReview: z.boolean(),
  reason: z.string().trim().min(1).max(500),
};

/* Version 1 could only name one destination and never said what kind of thing it was, so
   accepting a proposal produced a task with no domain, project, or person. Proposals
   stored before version 2 still have to open in review, so both shapes stay parseable and
   `toCurrentEnvelope` upgrades the older one on read. */
export const proposalItemV1Schema = z.object({
  ...proposalItemFields,
  destinationName: z.string().trim().max(160).optional(),
});

export const proposalItemSchema = z.object({
  ...proposalItemFields,
  destination: proposedDestinationSchema.optional(),
});

export const proposalEnvelopeV1Schema = z.object({
  schemaVersion: z.literal("1"),
  sourceCaptureId: z.string().uuid(),
  proposals: z.array(proposalItemV1Schema).min(1).max(3),
});

export const proposalEnvelopeV2Schema = z.object({
  schemaVersion: z.literal("2"),
  sourceCaptureId: z.string().uuid(),
  proposals: z.array(proposalItemSchema).min(1).max(3),
});

/* What a provider is asked to return today. Older versions are read, never written. */
export const currentProposalEnvelopeSchema = proposalEnvelopeV2Schema;

export const proposalEnvelopeSchema = z.discriminatedUnion("schemaVersion", [
  proposalEnvelopeV1Schema,
  proposalEnvelopeV2Schema,
]);

export type ProposalEnvelope = z.infer<typeof proposalEnvelopeV2Schema>;
export type ProposalItem = z.infer<typeof proposalItemSchema>;
export type AnyProposalEnvelope = z.infer<typeof proposalEnvelopeSchema>;

export function toCurrentEnvelope(envelope: AnyProposalEnvelope): ProposalEnvelope {
  if (envelope.schemaVersion === "2") return envelope;
  return {
    schemaVersion: "2",
    sourceCaptureId: envelope.sourceCaptureId,
    /* Version 1's single destination was labelled "Person or client" in review, so that is
       the only faithful reading of it. */
    proposals: envelope.proposals.map(({ destinationName, ...item }) => ({
      ...item,
      destination: destinationName ? { personName: destinationName } : undefined,
    })),
  };
}

/* One place for "read a stored proposal", so no call site forgets the upgrade. */
export function parseProposalEnvelope(value: unknown): ProposalEnvelope | null {
  const parsed = proposalEnvelopeSchema.safeParse(value);
  return parsed.success ? toCurrentEnvelope(parsed.data) : null;
}

export const createCaptureSchema = z.object({
  text: z.string().trim().min(1).max(10000),
  idempotencyKey: z.string().uuid(),
});

/* What review sends back: identifiers the user picked from their own records, or an
   explicit request to create a name-only record. Never a name the server is expected to
   silently resolve — an unmatched name is a decision, not a default. */
export const destinationSelectionSchema = z
  .object({
    domainId: z.string().uuid().nullish(),
    projectId: z.string().uuid().nullish(),
    personId: z.string().uuid().nullish(),
    createDomainName: z.string().trim().min(1).max(80).nullish(),
    createPersonName: z.string().trim().min(1).max(160).nullish(),
  })
  .refine((selection) => !(selection.domainId && selection.createDomainName), {
    message: "Choose an existing domain or create one, not both.",
    path: ["createDomainName"],
  })
  .refine((selection) => !(selection.personId && selection.createPersonName), {
    message: "Choose an existing person or create one, not both.",
    path: ["createPersonName"],
  });

export type DestinationSelection = z.infer<typeof destinationSelectionSchema>;

export const fileManuallySchema = z.object({
  recordType: z.enum(["task", "note"]),
  title: z.string().trim().min(1).max(280),
  body: z.string().trim().max(5000).optional(),
  dueOn: z.string().date().optional(),
  dueTime: dueTimeSchema.optional(),
  destination: destinationSelectionSchema.optional(),
});

export type FileManuallyInput = z.infer<typeof fileManuallySchema>;

export const proposalActionSchema = z.object({
  action: z.enum(["accept", "discard", "retry", "undo", "dismiss_item"]),
  proposalIndex: z.number().int().min(0).max(2).default(0),
  recordId: z.string().uuid().optional(),
  edited: z
    .object({
      recordType: recordTypeSchema,
      title: z.string().trim().min(1).max(280),
      body: z.string().trim().max(5000).optional(),
      dueOn: z.string().date().optional(),
      dueTime: dueTimeSchema.optional(),
      destination: destinationSelectionSchema.optional(),
    })
    .optional(),
});
