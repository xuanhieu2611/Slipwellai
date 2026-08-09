import { z } from "zod";
import { localDate } from "@/lib/workspace";

export const createRetainerSchema = z.object({
  name: z.string().trim().min(1).max(160),
  timezone: z.string().trim().min(1).max(100),
  cycleDay: z.number().int().min(1).max(31),
  deliverableTitle: z.string().trim().min(1).max(280),
  expectedDay: z.number().int().min(1).max(31),
});

export const generateCycleSchema = z.object({
  cycleMonth: z.string().regex(/^\d{4}-\d{2}$/),
  idempotencyKey: z.string().uuid(),
});
export const signalActionSchema = z
  .object({
    outcome: z.enum(["marked_attention", "deferred", "dismissed", "cadence_changed"]),
    note: z.string().trim().max(500).optional(),
    cadenceDays: z.coerce.number().int().min(1).max(365).optional(),
  })
  .refine((value) => value.outcome !== "cadence_changed" || value.cadenceDays !== undefined, {
    message: "Choose a cadence between 1 and 365 days.",
    path: ["cadenceDays"],
  });

/* Pure calendar-string arithmetic (year/month/day numbers in, calendar date string out), so it is
   already timezone-neutral: the "month" a caller passes in is meant to already be the retainer's
   local calendar month (e.g. picked from a month input, or derived via localDate(timezone, now)
   upstream), and Date.UTC here is only ever used as a day-counting calculator, never to represent
   a real instant that would need converting into a timezone. The genuine timezone bug this module
   used to have was in slippingExplanation below, which compared against the UTC calendar day
   instead of the retainer's local one. */
const daysInMonth = (year: number, monthIndex: number) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

export const boundedMonthDay = (year: number, monthIndex: number, day: number) =>
  Math.min(day, daysInMonth(year, monthIndex));

export const cycleBounds = (month: string, cycleDay: number) => {
  const [year, calendarMonth] = month.split("-").map(Number);
  const monthIndex = calendarMonth - 1;
  const start = new Date(Date.UTC(year, monthIndex, boundedMonthDay(year, monthIndex, cycleDay)));
  const next = new Date(
    Date.UTC(year, monthIndex + 1, boundedMonthDay(year, monthIndex + 1, cycleDay)),
  );
  const end = new Date(next.getTime() - 24 * 60 * 60 * 1000);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};

export const expectedDate = (month: string, expectedDay: number) => {
  const [year, calendarMonth] = month.split("-").map(Number);
  const monthIndex = calendarMonth - 1;
  return new Date(Date.UTC(year, monthIndex, boundedMonthDay(year, monthIndex, expectedDay)))
    .toISOString()
    .slice(0, 10);
};

export const nextCycleMonth = (month: string) => {
  const [year, calendarMonth] = month.split("-").map(Number);
  return new Date(Date.UTC(year, calendarMonth, 1)).toISOString().slice(0, 7);
};

export const slippingExplanation = ({
  expectedOn,
  lastMeaningfulAttention,
  timezone,
  now = new Date(),
}: {
  expectedOn: string;
  lastMeaningfulAttention?: string;
  timezone: string;
  now?: Date;
}) => {
  /* localDate resolves the retainer's local calendar day, not the UTC one — near local midnight
     this can differ from now.toISOString()'s day by a full day, which would misjudge whether a
     deliverable is overdue yet for a retainer far from UTC. */
  const today = localDate(timezone, now);
  const reference = lastMeaningfulAttention ?? expectedOn;
  const elapsedDays = Math.max(
    0,
    Math.floor(
      (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${reference}T00:00:00Z`)) / 86400000,
    ),
  );
  if (today > expectedOn) {
    return {
      severity: elapsedDays >= 7 ? "urgent" : "attention",
      reason: `Expected on ${expectedOn}; it is still open and has had no meaningful attention for ${elapsedDays} days.`,
    };
  }
  if (elapsedDays >= 7) {
    return {
      severity: "attention",
      reason: `No meaningful attention for ${elapsedDays} days; the deliverable is still open.`,
    };
  }
  return null;
};
