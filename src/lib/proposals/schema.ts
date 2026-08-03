import { z } from "zod";

export const recordTypeSchema = z.enum(["task", "note", "retainer_update"]);

const dueTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24-hour HH:MM.");

export const proposalItemSchema = z.object({
  recordType: recordTypeSchema,
  title: z.string().trim().min(1).max(280),
  body: z.string().trim().max(5000).optional(),
  destinationName: z.string().trim().max(160).optional(),
  dueOn: z.string().date().optional(),
  dueTime: dueTimeSchema.optional(),
  confidence: z.object({
    recordType: z.number().min(0).max(1),
    title: z.number().min(0).max(1),
    destination: z.number().min(0).max(1).optional(),
    date: z.number().min(0).max(1).optional(),
  }),
  needsReview: z.boolean(),
  reason: z.string().trim().min(1).max(500),
});

export const proposalEnvelopeSchema = z.object({
  schemaVersion: z.literal("1"),
  sourceCaptureId: z.string().uuid(),
  proposals: z.array(proposalItemSchema).min(1).max(3),
});

export type ProposalEnvelope = z.infer<typeof proposalEnvelopeSchema>;
export type ProposalItem = z.infer<typeof proposalItemSchema>;

export const createCaptureSchema = z.object({
  text: z.string().trim().min(1).max(10000),
  idempotencyKey: z.string().uuid(),
});

export const proposalActionSchema = z.object({
  action: z.enum(["accept", "discard", "retry", "undo"]),
  proposalIndex: z.number().int().min(0).max(2).default(0),
  recordId: z.string().uuid().optional(),
  edited: z
    .object({
      recordType: recordTypeSchema,
      title: z.string().trim().min(1).max(280),
      body: z.string().trim().max(5000).optional(),
      destinationName: z.string().trim().max(160).optional(),
      dueOn: z.string().date().optional(),
      dueTime: dueTimeSchema.optional(),
    })
    .optional(),
});
