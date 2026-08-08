/* Turning a proposed *date phrase* into a date the user can trust.
 *
 * A model resolves "next Friday" against whatever it believes today is, and it is
 * confidently wrong often enough that a filed date is the least verifiable thing a
 * proposal produces — a task quietly due a week late looks exactly like one due on time.
 * So the model is asked for two things: the words the capture actually used, and its own
 * reading of them. This module re-resolves the words deterministically against the user's
 * local today and compares:
 *
 * 1. The deterministic reading wins whenever there is one. The model's date is a hint.
 * 2. A phrase with more than one honest reading ("next Friday", "next week", "3/4")
 *    resolves to nothing and states both readings. Picking one is the invention this
 *    exists to prevent.
 * 3. A date with no supporting words in the capture is never preselected. "Never invent a
 *    specific date" means an unverifiable date is a question, not a default.
 *
 * Everything here is pure and works on `YYYY-MM-DD` strings with UTC arithmetic, so a
 * daylight-saving change cannot move a calendar day. The only timezone-sensitive step is
 * `localToday`, which turns an instant into the user's local date once, up front.
 */

export type DateKind = "due" | "scheduled";
export type RecurrenceRule = "daily" | "weekly" | "monthly";

/* Used only when an account has no confirmed timezone yet. Onboarding collects one, so
   this is a floor rather than a product decision. */
export const DEFAULT_TIMEZONE = "America/Vancouver";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAYS: Record<string, number> = {
  sunday: 0, sun: 0,
  monday: 1, mon: 1,
  tuesday: 2, tue: 2, tues: 2,
  wednesday: 3, wed: 3, weds: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4,
  friday: 5, fri: 5,
  saturday: 6, sat: 6,
};

const MONTHS: Record<string, number> = {
  january: 1, jan: 1,
  february: 2, feb: 2,
  march: 3, mar: 3,
  april: 4, apr: 4,
  may: 5,
  june: 6, jun: 6,
  july: 7, jul: 7,
  august: 8, aug: 8,
  september: 9, sep: 9, sept: 9,
  october: 10, oct: 10,
  november: 11, nov: 11,
  december: 12, dec: 12,
};

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function isCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day));
  return utc.getUTCFullYear() === year && utc.getUTCMonth() === month - 1 && utc.getUTCDate() === day;
}

function parts(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

function fromParts(year: number, month: number, day: number): string {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  const { year, month, day } = parts(date);
  return fromParts(year, month, day + days);
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/* Clamped, so "in a month" from 31 January is 28 or 29 February rather than 3 March. */
export function addMonths(date: string, months: number): string {
  const { year, month, day } = parts(date);
  const absolute = year * 12 + (month - 1) + months;
  const targetYear = Math.floor(absolute / 12);
  const targetMonth = (absolute % 12) + 1;
  return fromParts(targetYear, targetMonth, Math.min(day, daysInMonth(targetYear, targetMonth)));
}

export function weekdayOf(date: string): number {
  const { year, month, day } = parts(date);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

/* The user's local calendar date for an instant. Every other function here takes this as
   its anchor, which keeps timezone handling in one place. */
export function localToday(now: Date, timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "UTC", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  }
}

/* Locale-independent on purpose: this label goes into review copy and into tests, and it
   has to mean the same thing on every machine. */
export function formatDateLabel(date: string, today?: string): string {
  if (!isCalendarDate(date)) return date;
  const { year, month, day } = parts(date);
  const suffix = today && parts(today).year !== year ? ` ${year}` : "";
  return `${WEEKDAY_LABELS[weekdayOf(date)]} ${day} ${MONTH_LABELS[month - 1]}${suffix}`;
}

/* The next occurrence of a weekday strictly after the anchor. */
function nextWeekday(today: string, weekday: number): string {
  const ahead = (weekday - weekdayOf(today) + 7) % 7;
  return addDays(today, ahead === 0 ? 7 : ahead);
}

/* The occurrence of a weekday in the Monday–Sunday week after the anchor's week. */
function weekdayInFollowingWeek(today: string, weekday: number): string {
  const mondayOffset = (weekdayOf(today) + 6) % 7;
  const nextMonday = addDays(today, 7 - mondayOffset);
  return addDays(nextMonday, (weekday + 6) % 7);
}

/* The next date carrying this day of the month, skipping months too short to have it. */
function nextDayOfMonth(today: string, day: number): string | null {
  if (day < 1 || day > 31) return null;
  const anchor = parts(today);
  for (let ahead = 0; ahead < 14; ahead += 1) {
    const absolute = anchor.year * 12 + (anchor.month - 1) + ahead;
    const year = Math.floor(absolute / 12);
    const month = (absolute % 12) + 1;
    if (day > daysInMonth(year, month)) continue;
    const candidate = fromParts(year, month, day);
    if (candidate >= today) return candidate;
  }
  return null;
}

function normalize(phrase: string): string {
  return phrase
    .toLowerCase()
    .replace(/[.,!?"'’“”]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export type PhraseReading =
  /* One honest reading. */
  | { status: "exact"; date: string }
  /* More than one honest reading, or a reading Slipwell will not choose between. */
  | { status: "ambiguous"; options: string[]; note: string }
  /* Words this grammar does not cover. The model's date, if any, stays a suggestion. */
  | { status: "unreadable" };

const CLOCK_TIME = /\b(at\s+)?\d{1,2}(:\d{2})?\s*(am|pm)\b|\b(at\s+)\d{1,2}(:\d{2})\b|\b(at\s+)\d{1,2}\b/;
const DAYPART = /\b(first thing|early|late)?\s*(in the )?(morning|afternoon|evening|night)$/;

/**
 * Reads a date phrase against a local anchor date. `today` must be a calendar date in the
 * user's timezone.
 */
export function readDatePhrase(phrase: string, today: string): PhraseReading {
  let text = normalize(phrase);
  if (!text) return { status: "unreadable" };

  if (DATE_PATTERN.test(text)) return isCalendarDate(text) ? { status: "exact", date: text } : { status: "unreadable" };

  /* A phrase that is only a clock time ("at 2pm"), a part of the day, or "eod" is about
     today: the capture named an hour without giving it another day. Strip those markers
     first so "tomorrow morning" still reads as tomorrow. */
  const stripped = [CLOCK_TIME, DAYPART, /\b(end of day|eod|by the end of the day)$/].reduce((value, pattern) => value.replace(pattern, " ").replace(/\s+/g, " ").trim(), text);
  const impliesToday = stripped !== text;
  text = stripped;

  text = text.replace(/^(by|on|due|due on|before|starting|start|starts|from|no later than|sometime|some time|this coming)\s+/, "").trim();
  if (!text || text === "this") return impliesToday ? { status: "exact", date: today } : { status: "unreadable" };

  if (/^(today|tonight|this (morning|afternoon|evening)|right now|now|asap)$/.test(text)) return { status: "exact", date: today };
  if (/^(tomorrow|tmrw|tmr)$/.test(text)) return { status: "exact", date: addDays(today, 1) };
  if (/^(the )?day after tomorrow$/.test(text)) return { status: "exact", date: addDays(today, 2) };
  if (/^(yesterday|last \w+)$/.test(text)) {
    return { status: "ambiguous", options: [], note: `“${phrase.trim()}” points at a date that has already passed. Choose the date you meant.` };
  }

  const relative = /^in (a|an|\d{1,3}) (day|days|week|weeks|month|months)$/.exec(text)
    ?? /^(a|an|\d{1,3}) (day|days|week|weeks|month|months) from (today|now)$/.exec(text);
  if (relative) {
    const count = relative[1] === "a" || relative[1] === "an" ? 1 : Number(relative[1]);
    const unit = relative[2];
    if (unit.startsWith("day")) return { status: "exact", date: addDays(today, count) };
    if (unit.startsWith("week")) return { status: "exact", date: addDays(today, count * 7) };
    return { status: "exact", date: addMonths(today, count) };
  }

  /* Real spans with no day in them. Guessing Monday, or Friday, or the 1st is the kind of
     quiet decision that makes a date untrustworthy. */
  if (/^(next|this|the) (week|month|quarter|year)$/.test(text) || /^(the )?(end|start|beginning|middle|mid) of (next |the |this )?(week|month|quarter|year)$/.test(text)) {
    if (/end of (the |this )?month$/.test(text)) {
      const { year, month } = parts(today);
      return { status: "exact", date: fromParts(year, month, daysInMonth(year, month)) };
    }
    return { status: "ambiguous", options: [], note: `“${phrase.trim()}” names a span, not a day. Pick the date you want.` };
  }

  const weekday = /^(next|this|coming|every|each)?\s*([a-z]+)(\s+next week)?$/.exec(text);
  if (weekday) {
    const index = WEEKDAYS[weekday[2]];
    if (index !== undefined) {
      const upcoming = nextWeekday(today, index);
      const following = weekdayInFollowingWeek(today, index);
      const qualifier = weekday[1];
      if (qualifier === "next" || weekday[3]) {
        /* "Next Friday" splits people: the coming Friday, or the one in the following
           week. When those are the same date there is nothing to settle. */
        if (upcoming === following) return { status: "exact", date: upcoming };
        return {
          status: "ambiguous",
          options: [upcoming, following],
          note: `“${phrase.trim()}” could mean ${formatDateLabel(upcoming, today)} or ${formatDateLabel(following, today)}.`,
        };
      }
      if (weekdayOf(today) === index) {
        return {
          status: "ambiguous",
          options: [today, upcoming],
          note: `Today is ${WEEKDAY_LABELS[index]}day, so “${phrase.trim()}” could mean today or ${formatDateLabel(upcoming, today)}.`,
        };
      }
      return { status: "exact", date: upcoming };
    }
  }

  const monthFirst = /^([a-z]+) (\d{1,2})(st|nd|rd|th)?( (\d{4}))?$/.exec(text);
  const dayFirst = /^(\d{1,2})(st|nd|rd|th)? (of )?([a-z]+)( (\d{4}))?$/.exec(text);
  const named = monthFirst
    ? { month: MONTHS[monthFirst[1]], day: Number(monthFirst[2]), year: monthFirst[5] ? Number(monthFirst[5]) : null }
    : dayFirst
      ? { month: MONTHS[dayFirst[4]], day: Number(dayFirst[1]), year: dayFirst[6] ? Number(dayFirst[6]) : null }
      : null;
  if (named && named.month !== undefined) {
    if (named.day < 1 || named.day > daysInMonth(named.year ?? parts(today).year, named.month)) return { status: "unreadable" };
    if (named.year) {
      const date = fromParts(named.year, named.month, named.day);
      return isCalendarDate(date) ? { status: "exact", date } : { status: "unreadable" };
    }
    /* No year: the next time that day comes around, which is what a capture means. */
    const thisYear = fromParts(parts(today).year, named.month, named.day);
    if (thisYear >= today) return { status: "exact", date: thisYear };
    const nextYear = parts(today).year + 1;
    return { status: "exact", date: fromParts(nextYear, named.month, Math.min(named.day, daysInMonth(nextYear, named.month))) };
  }

  const ordinal = /^(the )?(\d{1,2})(st|nd|rd|th)$/.exec(text);
  if (ordinal) {
    const date = nextDayOfMonth(today, Number(ordinal[2]));
    return date ? { status: "exact", date } : { status: "unreadable" };
  }

  /* 3/4 is 3 April to most of the world and 4 March in the United States. Slipwell does
     not know which the user meant, and a wrong month is worse than a question. */
  const numeric = /^(\d{1,2})\/(\d{1,2})(\/(\d{2}|\d{4}))?$/.exec(text);
  if (numeric) {
    const first = Number(numeric[1]);
    const second = Number(numeric[2]);
    const year = numeric[4] ? (numeric[4].length === 2 ? 2000 + Number(numeric[4]) : Number(numeric[4])) : parts(today).year;
    const resolve = (month: number, day: number) =>
      month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month) ? fromParts(year, month, day) : null;
    const monthFirstDate = resolve(first, second);
    const dayFirstDate = resolve(second, first);
    if (monthFirstDate && dayFirstDate && monthFirstDate !== dayFirstDate) {
      return {
        status: "ambiguous",
        options: [monthFirstDate, dayFirstDate].sort(),
        note: `“${phrase.trim()}” could be ${formatDateLabel(monthFirstDate, today)} or ${formatDateLabel(dayFirstDate, today)}, depending on whether the month or the day comes first.`,
      };
    }
    const only = monthFirstDate ?? dayFirstDate;
    if (only) return { status: "exact", date: only };
  }

  return { status: "unreadable" };
}

export type ProposedDateInput = {
  dateKind?: DateKind;
  date?: string;
  time?: string;
  datePhrase?: string;
};

export type ResolvedProposalDate =
  /* Nothing about a date was proposed. */
  | { status: "none"; kind: DateKind }
  /* The capture's words resolve to this date, and the model agreed (or offered nothing). */
  | { status: "confirmed"; kind: DateKind; date: string; phrase?: string }
  /* The capture's words resolve to this date and the model proposed a different one. */
  | { status: "corrected"; kind: DateKind; date: string; proposedDate: string; note: string }
  /* Nothing is preselected. `options` are one-click candidates worth offering. */
  | { status: "unconfirmed"; kind: DateKind; options: string[]; note: string };

/* The date that may be filed without the user choosing one. */
export function acceptedDate(resolved: ResolvedProposalDate): string | null {
  return resolved.status === "confirmed" || resolved.status === "corrected" ? resolved.date : null;
}

export function resolveProposalDate(item: ProposedDateInput, today: string): ResolvedProposalDate {
  const kind: DateKind = item.dateKind ?? "due";
  const proposed = item.date && isCalendarDate(item.date) ? item.date : undefined;
  const phrase = item.datePhrase?.trim();

  if (!phrase) {
    if (!proposed) return { status: "none", kind };
    /* A date the capture never put into words. It may well be right, but nothing in the
       source supports it, so it takes one deliberate click. A proposal that sat unreviewed
       for a few days is the common case, which is why the note says when it has gone
       stale rather than presenting it as current. */
    return {
      status: "unconfirmed",
      kind,
      options: [proposed],
      note: proposed < today
        ? `This date is not stated in your capture, and ${formatDateLabel(proposed, today)} has already passed. Choose the date you meant, or clear it.`
        : "This date is not stated in your capture, so Slipwell could not check it. Confirm it or clear it.",
    };
  }

  const reading = readDatePhrase(phrase, today);

  if (reading.status === "ambiguous") {
    const options = [...new Set([...reading.options, ...(proposed ? [proposed] : [])])].sort();
    return { status: "unconfirmed", kind, options, note: reading.note };
  }

  if (reading.status === "unreadable") {
    if (!proposed) {
      return { status: "unconfirmed", kind, options: [], note: `Slipwell could not turn “${phrase}” into a date. Set one if this needs a date.` };
    }
    return {
      status: "unconfirmed",
      kind,
      options: [proposed],
      note: `Slipwell could not check “${phrase}” on its own. ${formatDateLabel(proposed, today)} is a suggestion. Confirm it before filing.`,
    };
  }

  if (reading.date < today) {
    return {
      status: "unconfirmed",
      kind,
      options: [...new Set([reading.date, ...(proposed ? [proposed] : [])])].sort(),
      note: `“${phrase}” resolves to ${formatDateLabel(reading.date, today)}, which has already passed. Confirm the date you meant.`,
    };
  }

  if (!proposed || proposed === reading.date) return { status: "confirmed", kind, date: reading.date, phrase };

  return {
    status: "corrected",
    kind,
    date: reading.date,
    proposedDate: proposed,
    note: `“${phrase}” is ${formatDateLabel(reading.date, today)}. Slipwell used that instead of the ${formatDateLabel(proposed, today)} the model suggested.`,
  };
}

export type RecurrenceReading =
  | { status: "rule"; rule: RecurrenceRule }
  /* A real repeat that this MVP's daily/weekly/monthly recurrence cannot express. */
  | { status: "unsupported"; note: string }
  | { status: "unreadable" };

export function readRecurrencePhrase(phrase: string): RecurrenceReading {
  const text = normalize(phrase);
  if (!text) return { status: "unreadable" };

  const interval = /\bevery (\d{1,3}) (day|days|week|weeks|month|months)\b/.exec(text);
  if (interval && Number(interval[1]) !== 1) {
    return { status: "unsupported", note: `Slipwell repeats daily, weekly, or monthly. “${phrase.trim()}” is not one of those yet, so this was filed without a repeat.` };
  }
  if (/\b(every other|alternate|bi-?weekly|bi-?monthly|fortnight|quarterly|every quarter|yearly|annually|every year|twice|semi-?monthly|every weekday|weekdays)\b/.test(text)) {
    return { status: "unsupported", note: `Slipwell repeats daily, weekly, or monthly. “${phrase.trim()}” is not one of those yet, so this was filed without a repeat.` };
  }

  if (interval) {
    const unit = interval[2];
    return { status: "rule", rule: unit.startsWith("day") ? "daily" : unit.startsWith("week") ? "weekly" : "monthly" };
  }
  if (/\b(daily|every ?day|each day|every morning|every evening|every night)\b/.test(text)) return { status: "rule", rule: "daily" };
  if (/\b(weekly|every week|each week)\b/.test(text)) return { status: "rule", rule: "weekly" };
  if (/\b(monthly|every month|each month)\b/.test(text)) return { status: "rule", rule: "monthly" };

  const weekdayRepeat = /\b(every|each) ([a-z]+)s?\b/.exec(text);
  if (weekdayRepeat && WEEKDAYS[weekdayRepeat[2].replace(/s$/, "")] !== undefined) return { status: "rule", rule: "weekly" };

  const monthDayRepeat = /\b(every|each) (the )?(\d{1,2})(st|nd|rd|th)\b/.exec(text);
  if (monthDayRepeat) return { status: "rule", rule: "monthly" };

  return { status: "unreadable" };
}

export type ResolvedRecurrence =
  | { status: "none" }
  | { status: "confirmed"; rule: RecurrenceRule }
  | { status: "corrected"; rule: RecurrenceRule; proposedRule: RecurrenceRule; note: string }
  /* Recurrence was dropped: either unsupported, or unverifiable from the phrase. */
  | { status: "dropped"; note: string }
  /* A repeat with no first date. The task schema anchors recurrence on a real date, and
     an anchor Slipwell picked itself would repeat on the wrong day forever. */
  | { status: "needs_date"; rule: RecurrenceRule; note: string };

export function acceptedRecurrence(resolved: ResolvedRecurrence): RecurrenceRule | null {
  return resolved.status === "confirmed" || resolved.status === "corrected" ? resolved.rule : null;
}

export function resolveProposalRecurrence(
  recurrence: { rule: RecurrenceRule; phrase?: string } | undefined,
  date: ResolvedProposalDate,
): ResolvedRecurrence {
  if (!recurrence) return { status: "none" };

  const phrase = recurrence.phrase?.trim();
  if (!phrase) {
    return { status: "dropped", note: "A repeat was suggested but your capture does not say it repeats, so it was left off. Set it yourself if it should repeat." };
  }

  const reading = readRecurrencePhrase(phrase);
  if (reading.status === "unsupported") return { status: "dropped", note: reading.note };
  if (reading.status === "unreadable") {
    return { status: "dropped", note: `Slipwell could not confirm “${phrase}” as a repeat, so this was filed without one.` };
  }

  const anchored = acceptedDate(date);
  if (!anchored) {
    return {
      status: "needs_date",
      rule: reading.rule,
      note: `A repeating task needs a first date. Choose one and this will repeat ${reading.rule}.`,
    };
  }

  if (reading.rule !== recurrence.rule) {
    return {
      status: "corrected",
      rule: reading.rule,
      proposedRule: recurrence.rule,
      note: `“${phrase}” reads as ${reading.rule}, so Slipwell used that instead of ${recurrence.rule}.`,
    };
  }

  return { status: "confirmed", rule: reading.rule };
}

/* Everything the date and repeat resolution could not settle, in the order review shows
   it. Kept here so the review card and any later surface say the same thing. */
export function dateNotes(date: ResolvedProposalDate, recurrence: ResolvedRecurrence): string[] {
  const notes: string[] = [];
  if (date.status === "corrected" || date.status === "unconfirmed") notes.push(date.note);
  if (recurrence.status === "corrected" || recurrence.status === "dropped" || recurrence.status === "needs_date") notes.push(recurrence.note);
  return notes;
}
