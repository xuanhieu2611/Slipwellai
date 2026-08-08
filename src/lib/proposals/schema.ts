import { z } from "zod";

export const recordTypeSchema = z.enum(["task", "note", "retainer_update"]);

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM.");

const recurrenceRuleSchema = z.enum(["daily", "weekly", "monthly"]);

/* Every field here is optional, including recordType and title. A model that drops this
   whole object (or part of it) has still proposed a usable record - confidence is only
   ever shown as a chip in review, never used to gate what gets filed, so a missing score
   should not sink an otherwise valid proposal. */
const confidenceSchema = z.object({
  recordType: z.number().min(0).max(1).optional(),
  title: z.number().min(0).max(1).optional(),
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

/* Same idea as a destination name: the model returns the words the capture used and its
   own reading of them, and `@/lib/proposals/dates` decides which one is filed. A phrase
   is capped short because it is a fragment of the capture, not a copy of it. */
export const proposedRecurrenceSchema = z.object({
  rule: recurrenceRuleSchema,
  phrase: z.string().trim().max(120).optional(),
});

const proposalItemFields = {
  recordType: recordTypeSchema,
  title: z.string().trim().min(1).max(280),
  body: z.string().trim().max(5000).optional(),
  confidence: confidenceSchema.optional(),
  needsReview: z.boolean(),
  reason: z.string().trim().min(1).max(500),
};

/* Version 1 could only name one destination and never said what kind of thing it was, so
   accepting a proposal produced a task with no domain, project, or person. Proposals
   stored before the current version still have to open in review, so every shape stays
   parseable and `toCurrentEnvelope` upgrades the older ones on read. */
export const proposalItemV1Schema = z.object({
  ...proposalItemFields,
  destinationName: z.string().trim().max(160).optional(),
  dueOn: z.string().date().optional(),
  dueTime: timeSchema.optional(),
});

export const proposalItemV2Schema = z.object({
  ...proposalItemFields,
  destination: proposedDestinationSchema.optional(),
  dueOn: z.string().date().optional(),
  dueTime: timeSchema.optional(),
});

/* Version 3 stops treating the model's resolved date as the answer. `datePhrase` is the
   capture's own words ("next Friday"), `date` is the model's reading of them, and the
   server re-resolves the phrase deterministically before anything is filed. `dateKind`
   separates a deadline from a start, which the record model has always distinguished and
   the proposal could not say. */
export const proposalItemSchema = z.object({
  ...proposalItemFields,
  destination: proposedDestinationSchema.optional(),
  dateKind: z.enum(["due", "scheduled"]).optional(),
  datePhrase: z.string().trim().max(120).optional(),
  date: z.string().date().optional(),
  time: timeSchema.optional(),
  recurrence: proposedRecurrenceSchema.optional(),
});

export const proposalEnvelopeV1Schema = z.object({
  schemaVersion: z.literal("1"),
  sourceCaptureId: z.string().uuid(),
  proposals: z.array(proposalItemV1Schema).min(1).max(3),
});

export const proposalEnvelopeV2Schema = z.object({
  schemaVersion: z.literal("2"),
  sourceCaptureId: z.string().uuid(),
  proposals: z.array(proposalItemV2Schema).min(1).max(3),
});

export const proposalEnvelopeV3Schema = z.object({
  schemaVersion: z.literal("3"),
  sourceCaptureId: z.string().uuid(),
  proposals: z.array(proposalItemSchema).min(1).max(3),
});

/* What a provider is asked to return today. Older versions are read, never written. */
export const currentProposalEnvelopeSchema = proposalEnvelopeV3Schema;

export const proposalEnvelopeSchema = z.discriminatedUnion("schemaVersion", [
  proposalEnvelopeV1Schema,
  proposalEnvelopeV2Schema,
  proposalEnvelopeV3Schema,
]);

export type ProposalEnvelope = z.infer<typeof proposalEnvelopeV3Schema>;
export type ProposalItem = z.infer<typeof proposalItemSchema>;
export type AnyProposalEnvelope = z.infer<typeof proposalEnvelopeSchema>;

export function toCurrentEnvelope(envelope: AnyProposalEnvelope): ProposalEnvelope {
  if (envelope.schemaVersion === "3") return envelope;

  /* An older proposal carries a date with no words behind it. It is upgraded rather than
     discarded, and the date resolver treats a phrase-less date as a suggestion, so a
     proposal stored before this version opens in review with its date to confirm rather
     than filed on the strength of a reading nothing can check. */
  const upgradeDates = (item: { dueOn?: string; dueTime?: string }) => ({
    dateKind: item.dueOn ? ("due" as const) : undefined,
    date: item.dueOn,
    time: item.dueTime,
  });

  if (envelope.schemaVersion === "2") {
    return {
      schemaVersion: "3",
      sourceCaptureId: envelope.sourceCaptureId,
      proposals: envelope.proposals.map(({ dueOn, dueTime, ...item }) => ({ ...item, ...upgradeDates({ dueOn, dueTime }) })),
    };
  }

  return {
    schemaVersion: "3",
    sourceCaptureId: envelope.sourceCaptureId,
    /* Version 1's single destination was labelled "Person or client" in review, so that is
       the only faithful reading of it. */
    proposals: envelope.proposals.map(({ destinationName, dueOn, dueTime, ...item }) => ({
      ...item,
      ...upgradeDates({ dueOn, dueTime }),
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

/* The date fields a filed record is created from. `recurrenceRule` needs a date because a
   repeating task is anchored on one: `tasks.recurring_tasks_need_anchor` rejects the row
   otherwise, and an anchor the server invented would repeat on the wrong day forever. */
const filedDateFields = {
  dateKind: z.enum(["due", "scheduled"]).optional(),
  date: z.string().date().optional(),
  time: timeSchema.optional(),
  recurrenceRule: recurrenceRuleSchema.optional(),
};

const requiresDateForRecurrence = <T extends { date?: string; recurrenceRule?: string }>(value: T) => !value.recurrenceRule || Boolean(value.date);
const recurrenceNeedsDate = { message: "A repeating task needs a first date.", path: ["date"] };

export const fileManuallySchema = z
  .object({
    recordType: z.enum(["task", "note"]),
    title: z.string().trim().min(1).max(280),
    body: z.string().trim().max(5000).optional(),
    destination: destinationSelectionSchema.optional(),
    ...filedDateFields,
  })
  .refine(requiresDateForRecurrence, recurrenceNeedsDate);

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
      destination: destinationSelectionSchema.optional(),
      ...filedDateFields,
    })
    .refine(requiresDateForRecurrence, recurrenceNeedsDate)
    .optional(),
});

/* The date columns a record is written with, from either the review payload or the
   deterministic resolution of an unedited proposal. A repeat is anchored on its date, so
   a repeating task is always scheduled as well as optionally due. */
export function filedDateColumns(input: { dateKind?: "due" | "scheduled"; date?: string | null; time?: string | null; recurrenceRule?: "daily" | "weekly" | "monthly" | null }) {
  const date = input.date || null;
  const recurrenceRule = date ? input.recurrenceRule || null : null;
  const scheduled = input.dateKind === "scheduled" || Boolean(recurrenceRule);
  return {
    due_on: date && input.dateKind !== "scheduled" ? date : null,
    scheduled_for: date && scheduled ? date : null,
    due_time: input.time || null,
    recurrence_rule: recurrenceRule,
    recurrence_anchor: recurrenceRule ? date : null,
  };
}
