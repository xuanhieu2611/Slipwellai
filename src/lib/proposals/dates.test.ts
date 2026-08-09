import { describe, expect, it } from "vitest";
import {
  acceptedDate,
  acceptedRecurrence,
  addMonths,
  dateNotes,
  localToday,
  readDatePhrase,
  readRecurrencePhrase,
  resolveProposalDate,
  resolveProposalRecurrence,
} from "@/lib/proposals/dates";

/* 2026-08-05 is a Wednesday; every anchored expectation below is counted from it. */
const WEDNESDAY = "2026-08-05";

function reading(phrase: string, today = WEDNESDAY) {
  return readDatePhrase(phrase, today);
}

describe("localToday", () => {
  it("gives each account its own calendar day for the same instant", () => {
    const instant = new Date("2026-08-05T23:30:00Z");
    expect(localToday(instant, "America/Vancouver")).toBe("2026-08-05");
    expect(localToday(instant, "Pacific/Auckland")).toBe("2026-08-06");
  });

  it("falls back to UTC rather than throwing on an unusable timezone", () => {
    expect(localToday(new Date("2026-08-05T12:00:00Z"), "Not/AZone")).toBe("2026-08-05");
  });
});

describe("readDatePhrase", () => {
  it("reads the plain anchors", () => {
    expect(reading("today")).toEqual({ status: "exact", date: "2026-08-05" });
    expect(reading("tonight")).toEqual({ status: "exact", date: "2026-08-05" });
    expect(reading("tomorrow")).toEqual({ status: "exact", date: "2026-08-06" });
    expect(reading("tomorrow morning")).toEqual({ status: "exact", date: "2026-08-06" });
    expect(reading("the day after tomorrow")).toEqual({ status: "exact", date: "2026-08-07" });
    expect(reading("by Friday")).toEqual({ status: "exact", date: "2026-08-07" });
  });

  it("treats a bare clock time as today", () => {
    expect(reading("at 2pm")).toEqual({ status: "exact", date: "2026-08-05" });
    expect(reading("this morning")).toEqual({ status: "exact", date: "2026-08-05" });
    expect(reading("eod")).toEqual({ status: "exact", date: "2026-08-05" });
    expect(reading("Friday at 2:30pm")).toEqual({ status: "exact", date: "2026-08-07" });
  });

  it("counts relative spans that name a unit", () => {
    expect(reading("in 3 days")).toEqual({ status: "exact", date: "2026-08-08" });
    expect(reading("in a week")).toEqual({ status: "exact", date: "2026-08-12" });
    expect(reading("in 2 months")).toEqual({ status: "exact", date: "2026-10-05" });
  });

  it("refuses to pick a day out of a span", () => {
    for (const phrase of ["next week", "next month", "the middle of next week"]) {
      const result = reading(phrase);
      expect(result.status).toBe("ambiguous");
      if (result.status === "ambiguous") expect(result.options).toEqual([]);
    }
  });

  it("resolves the end of the month, including a leap February", () => {
    expect(reading("end of the month")).toEqual({ status: "exact", date: "2026-08-31" });
    expect(reading("end of the month", "2028-02-03")).toEqual({
      status: "exact",
      date: "2028-02-29",
    });
    expect(reading("end of the month", "2026-02-03")).toEqual({
      status: "exact",
      date: "2026-02-28",
    });
  });

  it("keeps both readings of next-weekday when they differ", () => {
    const result = reading("next Friday");
    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") {
      expect(result.options).toEqual(["2026-08-07", "2026-08-14"]);
      expect(result.note).toContain("Fri 7 Aug");
      expect(result.note).toContain("Fri 14 Aug");
    }
  });

  it("reads next-weekday exactly once the two readings agree", () => {
    // From Sunday 2026-08-09, the coming Friday already sits in the following Mon–Sun week.
    expect(reading("next Friday", "2026-08-09")).toEqual({ status: "exact", date: "2026-08-14" });
  });

  it("asks which one when the capture names the weekday it is already on", () => {
    const result = reading("Wednesday");
    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") expect(result.options).toEqual(["2026-08-05", "2026-08-12"]);
  });

  it("reads named months in either order and rolls a past month into next year", () => {
    expect(reading("August 12")).toEqual({ status: "exact", date: "2026-08-12" });
    expect(reading("12 August")).toEqual({ status: "exact", date: "2026-08-12" });
    expect(reading("Aug 12th 2027")).toEqual({ status: "exact", date: "2027-08-12" });
    expect(reading("March 3")).toEqual({ status: "exact", date: "2027-03-03" });
    expect(reading("February 30")).toEqual({ status: "unreadable" });
  });

  it("moves an ordinal day forward past months too short to hold it", () => {
    expect(reading("the 15th")).toEqual({ status: "exact", date: "2026-08-15" });
    expect(reading("the 3rd")).toEqual({ status: "exact", date: "2026-09-03" });
    expect(reading("the 31st", "2026-09-05")).toEqual({ status: "exact", date: "2026-10-31" });
  });

  it("will not choose between the two readings of a slashed date", () => {
    const result = reading("3/4");
    expect(result.status).toBe("ambiguous");
    if (result.status === "ambiguous") expect(result.options).toEqual(["2026-03-04", "2026-04-03"]);
    // Only one reading is a real date, so there is nothing to settle.
    expect(reading("15/8")).toEqual({ status: "exact", date: "2026-08-15" });
  });

  it("reports words it does not cover instead of guessing", () => {
    expect(reading("the Tuesday after next")).toEqual({ status: "unreadable" });
    expect(reading("when the invoice clears")).toEqual({ status: "unreadable" });
  });

  it("does not silently move a calendar day across a daylight-saving change", () => {
    // 2026-11-01 is the US DST change; adding days must stay on calendar days.
    expect(reading("in 2 days", "2026-10-31")).toEqual({ status: "exact", date: "2026-11-02" });
    expect(reading("in a week", "2026-10-30")).toEqual({ status: "exact", date: "2026-11-06" });
  });
});

describe("addMonths", () => {
  it("clamps to the last day of a short month", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2028-01-31", 1)).toBe("2028-02-29");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
  });
});

describe("resolveProposalDate", () => {
  it("confirms a date the capture's own words produce", () => {
    const resolved = resolveProposalDate(
      { datePhrase: "tomorrow", date: "2026-08-06", dateKind: "due" },
      WEDNESDAY,
    );
    expect(resolved).toMatchObject({ status: "confirmed", kind: "due", date: "2026-08-06" });
    expect(acceptedDate(resolved)).toBe("2026-08-06");
  });

  it("overrides a model date that disagrees with the capture's words", () => {
    const resolved = resolveProposalDate({ datePhrase: "tomorrow", date: "2026-08-13" }, WEDNESDAY);
    expect(resolved).toMatchObject({
      status: "corrected",
      date: "2026-08-06",
      proposedDate: "2026-08-13",
    });
    if (resolved.status === "corrected") expect(resolved.note).toContain("Thu 6 Aug");
    expect(acceptedDate(resolved)).toBe("2026-08-06");
  });

  it("files nothing when the phrase has two honest readings", () => {
    const resolved = resolveProposalDate(
      { datePhrase: "next Friday", date: "2026-08-07" },
      WEDNESDAY,
    );
    expect(resolved.status).toBe("unconfirmed");
    if (resolved.status === "unconfirmed")
      expect(resolved.options).toEqual(["2026-08-07", "2026-08-14"]);
    expect(acceptedDate(resolved)).toBeNull();
  });

  it("keeps an unverifiable model date as a suggestion only", () => {
    const unreadable = resolveProposalDate(
      { datePhrase: "the Tuesday after next", date: "2026-08-18" },
      WEDNESDAY,
    );
    expect(unreadable).toMatchObject({ status: "unconfirmed", options: ["2026-08-18"] });
    if (unreadable.status === "unconfirmed") expect(unreadable.note).toContain("Tue 18 Aug");
    expect(acceptedDate(unreadable)).toBeNull();
  });

  it("never preselects a date the capture did not put into words", () => {
    const resolved = resolveProposalDate({ date: "2026-08-20" }, WEDNESDAY);
    expect(resolved).toMatchObject({ status: "unconfirmed", options: ["2026-08-20"] });
    if (resolved.status === "unconfirmed")
      expect(resolved.note).toContain("not stated in your capture");
  });

  it("asks about a resolved date that has already passed", () => {
    const resolved = resolveProposalDate({ datePhrase: "yesterday" }, WEDNESDAY);
    expect(resolved.status).toBe("unconfirmed");
    if (resolved.status === "unconfirmed") expect(resolved.note).toContain("already passed");
  });

  it("stays silent when the capture proposed no date at all", () => {
    expect(resolveProposalDate({}, WEDNESDAY)).toEqual({ status: "none", kind: "due" });
    expect(resolveProposalDate({ dateKind: "scheduled" }, WEDNESDAY)).toEqual({
      status: "none",
      kind: "scheduled",
    });
  });

  it("carries the requested date semantics through", () => {
    const resolved = resolveProposalDate(
      { datePhrase: "Friday", date: "2026-08-07", dateKind: "scheduled" },
      WEDNESDAY,
    );
    expect(resolved).toMatchObject({ status: "confirmed", kind: "scheduled" });
  });
});

describe("readRecurrencePhrase", () => {
  it("reads the three supported cadences", () => {
    expect(readRecurrencePhrase("every day")).toEqual({ status: "rule", rule: "daily" });
    expect(readRecurrencePhrase("every Monday")).toEqual({ status: "rule", rule: "weekly" });
    expect(readRecurrencePhrase("weekly")).toEqual({ status: "rule", rule: "weekly" });
    expect(readRecurrencePhrase("every month")).toEqual({ status: "rule", rule: "monthly" });
    expect(readRecurrencePhrase("every 15th")).toEqual({ status: "rule", rule: "monthly" });
    expect(readRecurrencePhrase("every 1 week")).toEqual({ status: "rule", rule: "weekly" });
  });

  it("names a real repeat this MVP cannot express instead of rounding it off", () => {
    for (const phrase of [
      "every other Tuesday",
      "biweekly",
      "quarterly",
      "every 3 weeks",
      "every weekday",
    ]) {
      expect(readRecurrencePhrase(phrase).status).toBe("unsupported");
    }
  });

  it("reports words that are not a repeat at all", () => {
    expect(readRecurrencePhrase("on Friday")).toEqual({ status: "unreadable" });
  });
});

describe("resolveProposalRecurrence", () => {
  const confirmedDate = resolveProposalDate(
    { datePhrase: "Monday", date: "2026-08-10", dateKind: "scheduled" },
    WEDNESDAY,
  );

  it("confirms a repeat the capture's words support", () => {
    const resolved = resolveProposalRecurrence(
      { rule: "weekly", phrase: "every Monday" },
      confirmedDate,
    );
    expect(resolved).toEqual({ status: "confirmed", rule: "weekly" });
    expect(acceptedRecurrence(resolved)).toBe("weekly");
  });

  it("corrects a rule the phrase contradicts", () => {
    const resolved = resolveProposalRecurrence(
      { rule: "daily", phrase: "every month" },
      confirmedDate,
    );
    expect(resolved).toMatchObject({ status: "corrected", rule: "monthly", proposedRule: "daily" });
    expect(acceptedRecurrence(resolved)).toBe("monthly");
  });

  it("drops a repeat with no words behind it", () => {
    const resolved = resolveProposalRecurrence({ rule: "weekly" }, confirmedDate);
    expect(resolved.status).toBe("dropped");
    expect(acceptedRecurrence(resolved)).toBeNull();
  });

  it("drops an unsupported cadence rather than filing the wrong one", () => {
    const resolved = resolveProposalRecurrence(
      { rule: "weekly", phrase: "every other Tuesday" },
      confirmedDate,
    );
    expect(resolved.status).toBe("dropped");
    if (resolved.status === "dropped") expect(resolved.note).toContain("daily, weekly, or monthly");
  });

  it("will not repeat from a date the user has not settled", () => {
    const unsettled = resolveProposalDate({ datePhrase: "next Friday" }, WEDNESDAY);
    const resolved = resolveProposalRecurrence(
      { rule: "weekly", phrase: "every Friday" },
      unsettled,
    );
    expect(resolved).toMatchObject({ status: "needs_date", rule: "weekly" });
    expect(acceptedRecurrence(resolved)).toBeNull();
  });

  it("stays silent when nothing repeats", () => {
    expect(resolveProposalRecurrence(undefined, confirmedDate)).toEqual({ status: "none" });
  });
});

describe("dateNotes", () => {
  it("says everything that was not settled, and nothing that was", () => {
    const confirmed = resolveProposalDate(
      { datePhrase: "tomorrow", date: "2026-08-06" },
      WEDNESDAY,
    );
    expect(dateNotes(confirmed, { status: "none" })).toEqual([]);

    const unconfirmed = resolveProposalDate({ datePhrase: "next Friday" }, WEDNESDAY);
    const dropped = resolveProposalRecurrence({ rule: "weekly", phrase: "quarterly" }, unconfirmed);
    expect(dateNotes(unconfirmed, dropped)).toHaveLength(2);
  });
});
