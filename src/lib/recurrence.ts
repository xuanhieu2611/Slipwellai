export type RecurrenceRule = "daily" | "weekly" | "monthly";

export function nextRecurrenceDate(date: string, rule: RecurrenceRule) {
  const [year, month, day] = date.split("-").map(Number);
  if (rule === "daily") return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
  if (rule === "weekly") return new Date(Date.UTC(year, month - 1, day + 7)).toISOString().slice(0, 10);
  const targetMonth = month + 1;
  const targetYear = targetMonth === 13 ? year + 1 : year;
  const normalizedMonth = targetMonth === 13 ? 1 : targetMonth;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth, 0)).getUTCDate();
  return new Date(Date.UTC(targetYear, normalizedMonth - 1, Math.min(day, lastDay))).toISOString().slice(0, 10);
}
