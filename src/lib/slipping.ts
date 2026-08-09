import { localDate } from "@/lib/workspace";

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

export function coreSlippingExplanation(
  entity: CoreSlippingEntity,
  timezone: string,
  now = new Date(),
) {
  /* localDate resolves the account's local calendar day, not the UTC one — near local midnight
     this can differ from now.toISOString()'s day by a full day, which would misjudge whether a
     task/project is overdue or due for attention yet. Same fix as retainers.ts's slippingExplanation. */
  const today = localDate(timezone, now);
  const reference = entity.lastMeaningfulAttention ?? entity.createdAt;
  const elapsed = Math.max(
    0,
    Math.floor(
      (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${reference.slice(0, 10)}T00:00:00Z`)) /
        86_400_000,
    ),
  );
  const overdue = entity.dueOn ? today > entity.dueOn : false;
  if (elapsed < entity.cadenceDays && !overdue) return null;
  const severity =
    overdue ||
    (entity.priority === 3 && elapsed >= entity.cadenceDays) ||
    elapsed >= entity.cadenceDays * 2
      ? "urgent"
      : "attention";
  const label = entity.entityType === "task" ? "task" : "project";
  const duePart = overdue ? ` It was due ${entity.dueOn}.` : "";
  return {
    severity,
    reason: `No meaningful attention for ${elapsed} days; your expected cadence for this ${label} is ${entity.cadenceDays} days.${duePart}`,
  } as const;
}
