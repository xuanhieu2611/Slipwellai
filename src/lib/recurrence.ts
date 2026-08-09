export type RecurrenceUnit = "days" | "weeks";
export type RecurrenceRule = "daily" | "weekly" | "monthly" | "yearly" | "weekdays" | "custom";
export type CustomRecurrence = { interval: number; unit: RecurrenceUnit };

function addDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function weekdayOf(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function nextRecurrenceDate(date: string, rule: RecurrenceRule, custom?: CustomRecurrence) {
  const [year, month, day] = date.split("-").map(Number);
  if (rule === "daily") return addDays(date, 1);
  if (rule === "weekly") return addDays(date, 7);
  if (rule === "weekdays") {
    /* Monday-Friday only: advance one day at a time until landing off the weekend, so a Friday
       anchor lands on Monday rather than Saturday. */
    let next = addDays(date, 1);
    while (weekdayOf(next) === 0 || weekdayOf(next) === 6) next = addDays(next, 1);
    return next;
  }
  if (rule === "custom") {
    const interval = custom?.interval ?? 1;
    return addDays(date, custom?.unit === "weeks" ? interval * 7 : interval);
  }
  if (rule === "yearly") {
    const targetYear = year + 1;
    /* Mirrors the existing monthly short-month clamp below: a Feb 29 anchor in a leap year
       advances to Feb 28 the following non-leap year, staying in February rather than rolling
       into March. */
    const lastDay = lastDayOfMonth(targetYear, month);
    return new Date(Date.UTC(targetYear, month - 1, Math.min(day, lastDay)))
      .toISOString()
      .slice(0, 10);
  }
  const targetMonth = month + 1;
  const targetYear = targetMonth === 13 ? year + 1 : year;
  const normalizedMonth = targetMonth === 13 ? 1 : targetMonth;
  const lastDay = lastDayOfMonth(targetYear, normalizedMonth);
  return new Date(Date.UTC(targetYear, normalizedMonth - 1, Math.min(day, lastDay)))
    .toISOString()
    .slice(0, 10);
}
