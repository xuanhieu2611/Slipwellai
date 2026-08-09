"use client";

import {
  dateNotes,
  formatDateLabel,
  type DateKind,
  type RecurrenceRule,
  type ResolvedProposalDate,
  type ResolvedRecurrence,
} from "@/lib/proposals/dates";
import type { ProposalItem } from "@/lib/proposals/schema";
import { Button, SelectField, TextField } from "@/components/ui/primitives";

export type DateDraft = {
  recordType: "task" | "note" | "retainer_update";
  dateKind: DateKind;
  date: string;
  time: string;
  recurrenceRule: RecurrenceRule | "none";
};

/* Dates in review. A date the capture's own words produced arrives filled in and says so;
   anything the resolver could not settle arrives empty, explains why in words, and offers
   the readings worth one click. An empty date field is the honest state for "Slipwell does
   not know" - filing without a date loses nothing, and filing the wrong one is invisible. */
export function DateFields({
  draft,
  item,
  onChange,
  recurrence,
  resolved,
  today,
}: {
  draft: DateDraft;
  item: ProposalItem;
  onChange: (next: Partial<DateDraft>) => void;
  recurrence: ResolvedRecurrence;
  resolved: ResolvedProposalDate;
  today: string;
}) {
  const notes = dateNotes(resolved, recurrence);
  const options = resolved.status === "unconfirmed" ? resolved.options : [];
  const isNote = draft.recordType === "note";

  return (
    <fieldset className="review-group">
      <legend>{isNote ? "When to look at it again" : "When it happens"}</legend>
      <div className="review-group-grid">
        {!isNote && (
          <label className="field-label">
            <span>Date means</span>
            <SelectField
              onChange={(event) => onChange({ dateKind: event.target.value as DateKind })}
              value={draft.dateKind}
            >
              <option value="due">Due by</option>
              <option value="scheduled">Work on</option>
            </SelectField>
          </label>
        )}
        <label className="field-label">
          <span>{isNote ? "Review on" : "Date"}</span>
          {/* Clearing the date clears the repeat with it: a repeat with no anchor cannot be filed. */}
          <TextField
            onChange={(event) =>
              onChange({
                date: event.target.value,
                ...(event.target.value ? {} : { recurrenceRule: "none" as const }),
              })
            }
            type="date"
            value={draft.date}
          />
        </label>
        {!isNote && (
          <label className="field-label">
            <span>Time (optional)</span>
            <TextField
              onChange={(event) => onChange({ time: event.target.value })}
              type="time"
              value={draft.time}
            />
          </label>
        )}
        {draft.recordType === "task" && (
          <label className="field-label">
            <span>Repeats</span>
            <SelectField
              disabled={!draft.date}
              onChange={(event) =>
                onChange({ recurrenceRule: event.target.value as DateDraft["recurrenceRule"] })
              }
              value={draft.recurrenceRule}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </SelectField>
          </label>
        )}
      </div>
      {resolved.status === "confirmed" && resolved.phrase && (
        <p className="form-help">Read from “{resolved.phrase}” in your capture.</p>
      )}
      {item.datePhrase && resolved.status === "none" && (
        <p className="form-help">No date was filed from “{item.datePhrase}”.</p>
      )}
      {notes.map((note) => (
        <p className="form-help" key={note}>
          {note}
        </p>
      ))}
      {!draft.date && options.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((option) => (
            <Button
              className="button-secondary"
              key={option}
              onClick={() => onChange({ date: option })}
            >
              Use {formatDateLabel(option, today)}
            </Button>
          ))}
        </div>
      )}
      {!draft.date && draft.recordType === "task" && (
        <p className="form-help">
          Filing without a date is fine. It stays in your task list and out of Today.
        </p>
      )}
    </fieldset>
  );
}
