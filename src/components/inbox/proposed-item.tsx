"use client";

import { useState } from "react";
import { Check } from "@phosphor-icons/react";
import {
  acceptedDate,
  acceptedRecurrence,
  resolveProposalDate,
  resolveProposalRecurrence,
} from "@/lib/proposals/dates";
import { resolveDestination, type DestinationCatalog } from "@/lib/proposals/destinations";
import type { ProposalItem } from "@/lib/proposals/schema";
import { Button, SelectField, StatusMessage, TextField } from "@/components/ui/primitives";
import { post } from "@/components/inbox/api";
import { recordTypeLabels } from "@/components/inbox/capture-meta";
import { DateFields, type DateDraft } from "@/components/inbox/date-fields";
import {
  DestinationFields,
  destinationSelection,
  initialDestinationDraft,
  type DestinationDraft,
} from "@/components/inbox/destination";

export function ProposedItem({
  item,
  index,
  total,
  proposalId,
  catalog,
  today,
  done,
}: {
  item: ProposalItem;
  index: number;
  total: number;
  proposalId: string;
  catalog: DestinationCatalog;
  today: string;
  done: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  /* The capture's own date words, re-read here against the account's local today. Only a
     date this resolution settled is preselected; anything it could not is offered as a
     choice below and filed as no date until the user makes one. */
  const resolvedDate = resolveProposalDate(item, today);
  const resolvedRecurrence = resolveProposalRecurrence(item.recurrence, resolvedDate);
  const [draft, setDraft] = useState<DateDraft & { title: string }>({
    recordType: item.recordType,
    title: item.title,
    dateKind: resolvedDate.kind,
    date: acceptedDate(resolvedDate) ?? "",
    time: item.time ?? "",
    recurrenceRule: acceptedRecurrence(resolvedRecurrence) ?? "none",
  });
  /* Matched here rather than at interpretation time, so a domain or person created since
     the proposal was written is still offered. */
  const resolved = resolveDestination(item.destination, catalog);
  const [destination, setDestination] = useState<DestinationDraft>(() =>
    initialDestinationDraft(resolved),
  );

  async function action(choice: "accept" | "dismiss_item") {
    setBusy(true);
    setMessage("");
    try {
      await post(
        `/api/proposals/${proposalId}`,
        choice === "accept"
          ? {
              action: choice,
              proposalIndex: index,
              edited: {
                recordType: draft.recordType,
                title: draft.title.trim() || item.title,
                body: item.body,
                dateKind: draft.dateKind,
                date: draft.date || undefined,
                time: draft.time || undefined,
                /* A repeat is anchored on its first date, so it is only sent with one. */
                recurrenceRule:
                  draft.date && draft.recurrenceRule !== "none" ? draft.recurrenceRule : undefined,
                /* A retainer update has no destination columns, and its pickers are hidden.
                 Sending a selection anyway would create a domain or person that nothing
                 ends up pointing at. */
                destination:
                  draft.recordType === "retainer_update"
                    ? undefined
                    : destinationSelection(destination, resolved),
              },
            }
          : { action: choice, proposalIndex: index },
      );
      done();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That action did not go through.");
      setBusy(false);
    }
  }

  const confidenceChip = (label: string, value: number | undefined) =>
    value === undefined ? null : (
      <span className={`tag${Math.round(value * 100) < 70 ? " tag--attention" : ""}`}>
        {label} {Math.round(value * 100)}% sure
      </span>
    );

  return (
    <div className="review-panel">
      <div className="review-panel-head">
        <h4>{total > 1 ? `Record ${index + 1} of ${total}` : "Slipwell suggests filing this"}</h4>
        <span className="review-tags">
          <span className="tag tag--accent">{recordTypeLabels[item.recordType]}</span>
          {confidenceChip("Type", item.confidence?.recordType)}
          {confidenceChip("Title", item.confidence?.title)}
          {item.destination && confidenceChip("Destination", item.confidence?.destination)}
          {/* The model's own date confidence is only worth showing while it still stands.
            Once the resolver has declined to settle the date, its verdict is the honest
            one — "100% sure" beside "Date to confirm" would read as a contradiction. */}
          {resolvedDate.status === "unconfirmed"
            ? !draft.date && <span className="tag tag--attention">Date to confirm</span>
            : (item.datePhrase || item.date) && confidenceChip("Date", item.confidence?.date)}
        </span>
      </div>
      <p className="review-reason">{item.reason}</p>
      <div className="review-fields">
        <label className="field-label form-span">
          <span>Title</span>
          <TextField
            maxLength={280}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
            required
            value={draft.title}
          />
        </label>
        <label className="field-label">
          <span>Record type</span>
          <SelectField
            onChange={(event) =>
              setDraft({ ...draft, recordType: event.target.value as typeof draft.recordType })
            }
            value={draft.recordType}
          >
            <option value="task">Task</option>
            <option value="note">Note</option>
            <option value="retainer_update">Retainer update</option>
          </SelectField>
        </label>
        <DateFields
          draft={draft}
          item={item}
          onChange={(next) => setDraft({ ...draft, ...next })}
          recurrence={resolvedRecurrence}
          resolved={resolvedDate}
          today={today}
        />
        {draft.recordType === "retainer_update" ? (
          <p className="form-help form-span">
            A retainer update is still a prototype record. It keeps the name from the capture rather
            than linking to a domain, project, or person.
          </p>
        ) : (
          <DestinationFields
            catalog={catalog}
            draft={destination}
            onChange={setDestination}
            resolved={resolved}
          />
        )}
        <div className="form-span flex flex-wrap gap-2">
          <Button
            className="button-primary"
            disabled={busy || !draft.title.trim()}
            onClick={() => action("accept")}
          >
            <Check aria-hidden size={16} weight="bold" />
            {busy ? "Filing…" : "Accept and file"}
          </Button>
          <Button className="button-quiet" disabled={busy} onClick={() => action("dismiss_item")}>
            Not this one
          </Button>
        </div>
        {message && (
          <div className="form-span">
            <StatusMessage tone="error">{message}</StatusMessage>
          </div>
        )}
      </div>
    </div>
  );
}
