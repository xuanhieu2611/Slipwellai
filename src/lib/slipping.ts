export type CoreSlippingEntity = {
  entityType: "task" | "project";
  entityId: string;
  title: string;
  createdAt: string;
  priority?: number;
  dueOn?: string | null;
  lastMeaningfulAttention?: string | null;
  cadenceDays: number;
};

function utcDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function elapsedDays(from: string, now: Date) {
  return Math.max(0, Math.floor((Date.parse(`${utcDay(now)}T00:00:00Z`) - Date.parse(`${from.slice(0, 10)}T00:00:00Z`)) / 86_400_000));
}

export function coreSlippingExplanation(entity: CoreSlippingEntity, now = new Date()) {
  const reference = entity.lastMeaningfulAttention ?? entity.createdAt;
  const elapsed = elapsedDays(reference, now);
  const overdue = entity.dueOn ? utcDay(now) > entity.dueOn : false;
  if (elapsed < entity.cadenceDays && !overdue) return null;
  const severity = overdue || (entity.priority === 3 && elapsed >= entity.cadenceDays) || elapsed >= entity.cadenceDays * 2 ? "urgent" : "attention";
  const label = entity.entityType === "task" ? "task" : "project";
  const duePart = overdue ? ` It was due ${entity.dueOn}.` : "";
  return {
    severity,
    reason: `No meaningful attention for ${elapsed} days; your expected cadence for this ${label} is ${entity.cadenceDays} days.${duePart}`,
  } as const;
}
