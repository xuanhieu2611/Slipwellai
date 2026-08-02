import { z } from "zod";

export const createRetainerSchema = z.object({
  name: z.string().trim().min(1).max(160),
  timezone: z.string().trim().min(1).max(100),
  cycleDay: z.number().int().min(1).max(31),
  deliverableTitle: z.string().trim().min(1).max(280),
  expectedDay: z.number().int().min(1).max(31),
});

export const generateCycleSchema = z.object({ cycleMonth: z.string().regex(/^\d{4}-\d{2}$/) });
export const signalActionSchema = z.object({ outcome: z.enum(["marked_attention", "deferred", "dismissed"]), note: z.string().trim().max(500).optional() });

const daysInMonth = (year: number, monthIndex: number) => new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

export const boundedMonthDay = (year: number, monthIndex: number, day: number) => Math.min(day, daysInMonth(year, monthIndex));

export const cycleBounds = (month: string, cycleDay: number) => {
  const [year, calendarMonth] = month.split("-").map(Number);
  const monthIndex = calendarMonth - 1;
  const start = new Date(Date.UTC(year, monthIndex, boundedMonthDay(year, monthIndex, cycleDay)));
  const next = new Date(Date.UTC(year, monthIndex + 1, boundedMonthDay(year, monthIndex + 1, cycleDay)));
  const end = new Date(next.getTime() - 24 * 60 * 60 * 1000);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
};

export const expectedDate = (month: string, expectedDay: number) => {
  const [year, calendarMonth] = month.split("-").map(Number);
  const monthIndex = calendarMonth - 1;
  return new Date(Date.UTC(year, monthIndex, boundedMonthDay(year, monthIndex, expectedDay))).toISOString().slice(0, 10);
};

export const slippingExplanation = ({
  expectedOn,
  lastMeaningfulAttention,
  now = new Date(),
}: {
  expectedOn: string;
  lastMeaningfulAttention?: string;
  now?: Date;
}) => {
  const today = now.toISOString().slice(0, 10);
  const reference = lastMeaningfulAttention ?? expectedOn;
  const elapsedDays = Math.max(0, Math.floor((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${reference}T00:00:00Z`)) / 86400000));
  if (today > expectedOn) {
    return {
      severity: elapsedDays >= 7 ? "urgent" : "attention",
      reason: `Expected on ${expectedOn}; it is still open and has had no meaningful attention for ${elapsedDays} days.`,
    };
  }
  if (elapsedDays >= 7) {
    return { severity: "attention", reason: `No meaningful attention for ${elapsedDays} days; the deliverable is still open.` };
  }
  return null;
};
