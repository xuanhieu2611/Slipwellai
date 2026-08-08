"use client";

import { type FormEvent, useState, useSyncExternalStore } from "react";
import { ArrowClockwise, Check, Keyboard, Microphone, Plus, TrashSimple, WarningCircle } from "@phosphor-icons/react";
import { isStrandedCapture } from "@/lib/capture-pipeline";
import {
  acceptedDate,
  acceptedRecurrence,
  dateNotes,
  formatDateLabel,
  resolveProposalDate,
  resolveProposalRecurrence,
  type DateKind,
  type RecurrenceRule,
  type ResolvedProposalDate,
  type ResolvedRecurrence,
} from "@/lib/proposals/dates";
import { resolveDestination, unmatchedNames, type DestinationCatalog, type ResolvedDestination } from "@/lib/proposals/destinations";
import { parseProposalEnvelope, type DestinationSelection, type ProposalItem } from "@/lib/proposals/schema";
import type { DashboardData } from "@/lib/dashboard";
import { Button, EmptyState, SelectField, StatusMessage, TextField } from "@/components/ui/primitives";
import { useCapture } from "@/components/capture-dialog";

async function post(path: string, body: unknown) {
  const response = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data: unknown = await response.json();
  if (!response.ok) throw new Error(typeof data === "object" && data && "error" in data ? String(data.error) : "Request failed.");
  return data;
}

function captureAge(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return days <= 1 ? "yesterday" : `${days} days ago`;
}

const noSubscription = () => () => {};

/* Client-only so a relative label never disagrees with the server-rendered markup. */
function CaptureAge({ iso }: { iso: string }) {
  const label = useSyncExternalStore(noSubscription, () => captureAge(iso), () => "");
  return label ? <time dateTime={iso}>{label}</time> : null;
}

const failureCopy: Record<string, string> = {
  proposal_timeout: "Interpreting this capture took too long. Try again, or discard it if you no longer need it.",
  proposal_invalid_output: "Slipwell could not read a usable record out of these words. Try again, or discard this and capture it with a little more context.",
  proposal_provider_error: "The interpretation service did not respond. Your words are saved. Try again in a moment.",
};

const recordTypeLabels = { task: "Task", note: "Note", retainer_update: "Retainer update" } as const;

function CaptureOrigin({ capture }: { capture: DashboardData["captures"][number] }) {
  return <span className="review-origin">
    {capture.source_type === "voice" ? <Microphone aria-hidden size={15} /> : <Keyboard aria-hidden size={15} />}
    {capture.source_type === "voice" ? "Voice transcript" : "Typed"}
    <CaptureAge iso={capture.created_at} />
  </span>;
}

/* A name the account does not have is offered as an explicit choice, never preselected.
   Defaulting to it would let a fast Accept create a person or domain the user never had —
   the opposite of a proposal the user stays in control of. */
const CREATE = "create";

type DestinationDraft = { domain: string; project: string; person: string };

function initialDestinationDraft(resolved: ResolvedDestination): DestinationDraft {
  return {
    domain: resolved.domain.status === "matched" ? resolved.domain.id : "",
    project: resolved.project.status === "matched" ? resolved.project.id : "",
    person: resolved.person.status === "matched" ? resolved.person.id : "",
  };
}

function destinationSelection(draft: DestinationDraft, resolved: ResolvedDestination): DestinationSelection {
  const unmatched = unmatchedNames(resolved);
  return {
    domainId: draft.domain && draft.domain !== CREATE ? draft.domain : null,
    projectId: draft.project || null,
    personId: draft.person && draft.person !== CREATE ? draft.person : null,
    createDomainName: draft.domain === CREATE ? unmatched.domain : null,
    createPersonName: draft.person === CREATE ? unmatched.person : null,
  };
}

/* Everything the match could not settle, said out loud. An unmatched or ambiguous name is
   the reason this capture is in review, so it is never left implied by an empty select. */
function destinationNotes(resolved: ResolvedDestination, catalog: DestinationCatalog): string[] {
  const notes: string[] = [];
  if (resolved.domainInheritedFrom) notes.push(`Domain taken from the ${resolved.domainInheritedFrom} it belongs to.`);
  for (const [label, match] of [["domain", resolved.domain], ["project", resolved.project], ["person", resolved.person]] as const) {
    if (match.status === "unmatched") {
      notes.push(
        label === "project"
          ? `No project called “${match.name}”. Create it in Work first, or file this without one.`
          : `No ${label} called “${match.name}” yet. Choose “Create ${match.name}” to add it, or leave it out.`,
      );
    }
    if (match.status === "ambiguous") notes.push(`${match.candidateIds.length} of your ${label}s are called “${match.name}”. Choose which one.`);
  }
  if (notes.length === 0 && catalog.domains.length === 0 && catalog.projects.length === 0 && catalog.people.length === 0) {
    notes.push("You have no domains, projects, or people yet. Create some in Work or People and captures will route into them.");
  }
  return notes;
}

function DestinationFields({
  catalog,
  draft,
  onChange,
  resolved,
}: {
  catalog: DestinationCatalog;
  draft: DestinationDraft;
  onChange: (draft: DestinationDraft) => void;
  resolved: ResolvedDestination;
}) {
  const unmatched = unmatchedNames(resolved);
  return <fieldset className="review-group">
    <legend>Where it belongs</legend>
    <div className="review-group-grid">
      <label className="field-label"><span>Domain</span>
        <SelectField onChange={(event) => onChange({ ...draft, domain: event.target.value })} value={draft.domain}>
          <option value="">No domain</option>
          {catalog.domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}
          {unmatched.domain && <option value={CREATE}>Create “{unmatched.domain}”</option>}
        </SelectField>
      </label>
      <label className="field-label"><span>Project</span>
        <SelectField onChange={(event) => onChange({ ...draft, project: event.target.value })} value={draft.project}>
          <option value="">No project</option>
          {catalog.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
        </SelectField>
      </label>
      <label className="field-label"><span>Person</span>
        <SelectField onChange={(event) => onChange({ ...draft, person: event.target.value })} value={draft.person}>
          <option value="">Nobody in particular</option>
          {catalog.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
          {unmatched.person && <option value={CREATE}>Create “{unmatched.person}”</option>}
        </SelectField>
      </label>
    </div>
    {destinationNotes(resolved, catalog).map((note) => <p className="form-help" key={note}>{note}</p>)}
  </fieldset>;
}

type DateDraft = {
  recordType: "task" | "note" | "retainer_update";
  dateKind: DateKind;
  date: string;
  time: string;
  recurrenceRule: RecurrenceRule | "none";
};

/* Dates in review. A date the capture's own words produced arrives filled in and says so;
   anything the resolver could not settle arrives empty, explains why in words, and offers
   the readings worth one click. An empty date field is the honest state for "Slipwell does
   not know" — filing without a date loses nothing, and filing the wrong one is invisible. */
function DateFields({
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

  return <fieldset className="review-group">
    <legend>{isNote ? "When to look at it again" : "When it happens"}</legend>
    <div className="review-group-grid">
      {!isNote && <label className="field-label"><span>Date means</span>
        <SelectField onChange={(event) => onChange({ dateKind: event.target.value as DateKind })} value={draft.dateKind}>
          <option value="due">Due by</option>
          <option value="scheduled">Work on</option>
        </SelectField>
      </label>}
      <label className="field-label"><span>{isNote ? "Review on" : "Date"}</span>
        {/* Clearing the date clears the repeat with it: a repeat with no anchor cannot be filed. */}
        <TextField onChange={(event) => onChange({ date: event.target.value, ...(event.target.value ? {} : { recurrenceRule: "none" as const }) })} type="date" value={draft.date} />
      </label>
      {!isNote && <label className="field-label"><span>Time (optional)</span>
        <TextField onChange={(event) => onChange({ time: event.target.value })} type="time" value={draft.time} />
      </label>}
      {draft.recordType === "task" && <label className="field-label"><span>Repeats</span>
        <SelectField disabled={!draft.date} onChange={(event) => onChange({ recurrenceRule: event.target.value as DateDraft["recurrenceRule"] })} value={draft.recurrenceRule}>
          <option value="none">Does not repeat</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
        </SelectField>
      </label>}
    </div>
    {resolved.status === "confirmed" && resolved.phrase && <p className="form-help">Read from “{resolved.phrase}” in your capture.</p>}
    {item.datePhrase && resolved.status === "none" && <p className="form-help">No date was filed from “{item.datePhrase}”.</p>}
    {notes.map((note) => <p className="form-help" key={note}>{note}</p>)}
    {!draft.date && options.length > 0 && <div className="mt-3 flex flex-wrap gap-2">
      {options.map((option) => <Button className="button-secondary" key={option} onClick={() => onChange({ date: option })}>Use {formatDateLabel(option, today)}</Button>)}
    </div>}
    {!draft.date && draft.recordType === "task" && <p className="form-help">Filing without a date is fine. It stays in your task list and out of Today.</p>}
  </fieldset>;
}

/* Filing without waiting for the model. Available whenever interpretation has not
   produced something reviewable, so the words are never held hostage by the provider. */
function ManualFile({ capture, catalog, done }: { capture: DashboardData["captures"][number]; catalog: DestinationCatalog; done: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [draft, setDraft] = useState({ recordType: "task" as "task" | "note", title: capture.original_text.slice(0, 120) });
  /* No model ran, so nothing was proposed — the pickers offer existing records only. */
  const resolved = resolveDestination(undefined, catalog);
  const [destination, setDestination] = useState<DestinationDraft>(() => initialDestinationDraft(resolved));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await post(`/api/captures/${capture.id}/file`, {
        recordType: draft.recordType,
        title: draft.title.trim(),
        body: capture.original_text,
        destination: destinationSelection(destination, resolved),
      });
      done();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That did not file.");
      setBusy(false);
    }
  }

  if (!open) return <Button className="button-secondary" onClick={() => setOpen(true)}><Check aria-hidden size={16} />File it myself</Button>;

  return <form className="review-fields w-full" onSubmit={submit}>
    <label className="field-label form-span"><span>Title</span>
      <TextField autoFocus maxLength={280} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required value={draft.title} />
    </label>
    <label className="field-label"><span>File it as</span>
      <SelectField onChange={(event) => setDraft({ ...draft, recordType: event.target.value as "task" | "note" })} value={draft.recordType}>
        <option value="task">Task</option>
        <option value="note">Note</option>
      </SelectField>
    </label>
    <DestinationFields catalog={catalog} draft={destination} onChange={setDestination} resolved={resolved} />
    <div className="form-span flex flex-wrap gap-2">
      <Button className="button-primary" disabled={busy || !draft.title.trim()} type="submit">{busy ? "Filing…" : "File it"}</Button>
      <Button className="button-quiet" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
      <p className="form-help form-span">Your full capture is kept as the record&apos;s body.</p>
    </div>
    {message && <div className="form-span"><StatusMessage tone="error">{message}</StatusMessage></div>}
  </form>;
}

/* A capture whose interpretation never finished. It stays visible and re-runnable
   instead of disappearing between the queued and needs-review states. */
function PendingCapture({ capture, catalog, done }: { capture: DashboardData["captures"][number]; catalog: DestinationCatalog; done: () => void }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const stranded = useSyncExternalStore(noSubscription, () => isStrandedCapture(capture), () => false);

  async function interpret() {
    setBusy(true);
    setMessage("");
    try {
      await post(`/api/captures/${capture.id}/interpret`, {});
      done();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Interpretation could not start.");
      setBusy(false);
    }
  }

  return <article className="review-card">
    <div className="review-head">
      <CaptureOrigin capture={capture} />
      <span className="tag">{stranded ? "Waiting to interpret" : "Interpreting"}</span>
    </div>
    <blockquote className="review-source">{capture.original_text}</blockquote>
    <div className="review-panel">
      <p className="review-reason">
        {stranded
          ? "Your words are stored. Interpretation did not finish, most likely because the tab closed or the connection dropped. Nothing was lost."
          : "Stored. Slipwell is reading it now; refresh in a moment to review it."}
      </p>
    </div>
    <div className="review-actions">
      <Button className="button-primary" disabled={busy} onClick={interpret}><ArrowClockwise aria-hidden size={16} />{busy ? "Interpreting…" : stranded ? "Interpret it now" : "Check again"}</Button>
      <ManualFile capture={capture} catalog={catalog} done={done} />
    </div>
    {message && <div className="px-[1.05rem] pb-[1.05rem]"><StatusMessage tone="error">{message}</StatusMessage></div>}
  </article>;
}

function ProposedItem({
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
  const [destination, setDestination] = useState<DestinationDraft>(() => initialDestinationDraft(resolved));

  async function action(choice: "accept" | "dismiss_item") {
    setBusy(true);
    setMessage("");
    try {
      await post(`/api/proposals/${proposalId}`, choice === "accept"
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
              recurrenceRule: draft.date && draft.recurrenceRule !== "none" ? draft.recurrenceRule : undefined,
              /* A retainer update has no destination columns, and its pickers are hidden.
                 Sending a selection anyway would create a domain or person that nothing
                 ends up pointing at. */
              destination: draft.recordType === "retainer_update" ? undefined : destinationSelection(destination, resolved),
            },
          }
        : { action: choice, proposalIndex: index });
      done();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That action did not go through.");
      setBusy(false);
    }
  }

  const confidenceChip = (label: string, value: number | undefined) =>
    value === undefined ? null : <span className={`tag${Math.round(value * 100) < 70 ? " tag--attention" : ""}`}>{label} {Math.round(value * 100)}% sure</span>;

  return <div className="review-panel">
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
      <label className="field-label form-span"><span>Title</span>
        <TextField maxLength={280} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required value={draft.title} />
      </label>
      <label className="field-label"><span>Record type</span>
        <SelectField onChange={(event) => setDraft({ ...draft, recordType: event.target.value as typeof draft.recordType })} value={draft.recordType}>
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
      {draft.recordType === "retainer_update"
        ? <p className="form-help form-span">A retainer update is still a prototype record. It keeps the name from the capture rather than linking to a domain, project, or person.</p>
        : <DestinationFields catalog={catalog} draft={destination} onChange={setDestination} resolved={resolved} />}
      <div className="form-span flex flex-wrap gap-2">
        <Button className="button-primary" disabled={busy || !draft.title.trim()} onClick={() => action("accept")}><Check aria-hidden size={16} weight="bold" />{busy ? "Filing…" : "Accept and file"}</Button>
        <Button className="button-quiet" disabled={busy} onClick={() => action("dismiss_item")}>Not this one</Button>
      </div>
      {message && <div className="form-span"><StatusMessage tone="error">{message}</StatusMessage></div>}
    </div>
  </div>;
}

function Review({ capture, catalog, today, done }: { capture: DashboardData["captures"][number]; catalog: DestinationCatalog; today: string; done: () => void }) {
  const parsed = capture.proposal ? parseProposalEnvelope(capture.proposal.proposal_json) : null;
  const items = parsed?.proposals ?? [];
  const applications = capture.proposal?.applications ?? [];
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  if (capture.status !== "needs_review") return null;

  async function action(choice: "retry" | "discard") {
    if (!capture.proposal) return;
    setBusy(true);
    setMessage("");
    try {
      await post(`/api/proposals/${capture.proposal.id}`, { action: choice });
      done();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "That action did not go through.");
      setBusy(false);
      setConfirmingDiscard(false);
    }
  }

  const outcomeByIndex = new Map(applications.map((application) => [application.item_index, application]));
  const undecided = items.filter((_, index) => !outcomeByIndex.has(index));

  return <article className={`review-card${items.length > 0 ? "" : " review-card--attention"}`}>
    <div className="review-head">
      <CaptureOrigin capture={capture} />
      {/* A multi-intent capture is not finished when the first record is filed; say how many are left. */}
      <span className="tag tag--attention">{items.length > 1 ? `${undecided.length} of ${items.length} to decide` : "Needs review"}</span>
    </div>

    <blockquote className="review-source">{capture.original_text}</blockquote>

    {items.length > 0 ? items.map((item, index) => {
      const outcome = outcomeByIndex.get(index);
      if (!outcome) return <ProposedItem catalog={catalog} done={done} index={index} item={item} key={index} proposalId={capture.proposal!.id} today={today} total={items.length} />;
      return <div className="review-panel" key={index}>
        <div className="review-panel-head">
          <h4>{items.length > 1 ? `Record ${index + 1} of ${items.length}` : "Decided"}</h4>
          <span className="tag">{outcome.outcome === "filed" ? "Filed" : "Not this one"}</span>
        </div>
        <p className="review-reason">{item.title}</p>
      </div>;
    }) : <div className="review-panel">
      <div className="review-panel-head"><h4><WarningCircle aria-hidden className="mb-0.5 mr-1.5 inline text-[var(--attention)]" size={16} weight="fill" />Not interpreted</h4></div>
      <p className="review-reason">{(capture.failure_code && failureCopy[capture.failure_code]) ?? failureCopy.proposal_provider_error}</p>
    </div>}

    {confirmingDiscard ? <div className="review-confirm" role="group" aria-label="Confirm discard">
      <p>Discard this capture? It leaves your inbox. The original words stay in Capture recovery on Today.</p>
      <Button autoFocus className="button-danger" disabled={busy} onClick={() => action("discard")}>{busy ? "Discarding…" : "Discard it"}</Button>
      <Button className="button-secondary" disabled={busy} onClick={() => setConfirmingDiscard(false)}>Keep it</Button>
    </div> : <div className="review-actions">
      {capture.proposal && <Button className={items.length > 0 ? "button-secondary" : "button-primary"} disabled={busy} onClick={() => action("retry")}><ArrowClockwise aria-hidden size={16} />Interpret again</Button>}
      {items.length === 0 && <ManualFile capture={capture} catalog={catalog} done={done} />}
      {capture.proposal
        ? <Button className="button-danger review-discard" disabled={busy} onClick={() => setConfirmingDiscard(true)}><TrashSimple aria-hidden size={16} />Discard</Button>
        : <p className="form-help">Slipwell has not returned a proposal for this capture yet. Reload in a moment.</p>}
    </div>}

    {message && <div className="px-[1.05rem] pb-[1.05rem]"><StatusMessage tone="error">{message}</StatusMessage></div>}
  </article>;
}

export function Dashboard({ data }: { data: DashboardData }) {
  const [refreshing, setRefreshing] = useState(false);
  const refresh = () => { setRefreshing(true); window.location.reload(); };
  const { open: openCapture } = useCapture();
  async function resolveSignal(id: string, outcome: "marked_attention" | "deferred" | "dismissed") { await post(`/api/slipping/${id}`, { outcome }); refresh(); }
  async function undoRecord(record: DashboardData["records"][number]) { if (!record.proposal_id) return; await post(`/api/proposals/${record.proposal_id}`, { action: "undo", recordId: record.id }); refresh(); }
  const needsReview = data.captures.filter((capture) => capture.status === "needs_review");
  /* Stored but not yet interpreted. These used to be invisible, which made a capture
     look lost whenever interpretation did not finish. */
  const pending = data.captures.filter((capture) => capture.status === "queued" || capture.status === "interpreting");

  return <main className="workspace-page">
    <header className="page-intro">
      <p className="eyebrow">Inbox</p>
      <h1>Capture it now, decide in one pass.</h1>
      <p>Slipwell keeps your original words and proposes where each one belongs. Accept it, edit it, or discard it. Nothing files itself.</p>
    </header>

    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
      <div className="space-y-4">
        <section className="workspace-section mt-0">
          <div className="section-heading">
            <div><h2>What needs a place?</h2><p className="section-note">Press ⌘J anywhere, or start here. Your words are stored before any interpretation runs.</p></div>
          </div>
          <Button className="button-primary" onClick={openCapture}><Plus aria-hidden size={16} weight="bold" />New capture<kbd>⌘J</kbd></Button>
        </section>
        <section className="workspace-section mt-0">
          <div className="section-heading">
            <div><h2>Waiting on you</h2><p className="section-note">{refreshing ? "Refreshing…" : "Originals stay in reach"}</p></div>
            {needsReview.length > 0 && <span className="tag">{needsReview.length} to review</span>}
          </div>
          <div className="space-y-3">
            {pending.map((capture) => <PendingCapture key={capture.id} capture={capture} catalog={data.catalog} done={refresh} />)}
            {needsReview.map((capture) => <Review key={capture.id} capture={capture} catalog={data.catalog} today={data.today} done={refresh} />)}
            {needsReview.length === 0 && pending.length === 0 && <EmptyState>Your inbox is clear. Capture the next thing before it slips.</EmptyState>}
          </div>
        </section>
      </div>

      <aside className="space-y-4">
        <section className="workspace-section mt-0">
          <div className="section-heading"><div><h2>Attention, not shame</h2><p className="section-note">Slipping</p></div></div>
          <div className="space-y-3">
            {data.signals.map((signal) => <article className="record-card flex-col items-stretch" key={signal.id}>
              <div><span className="tag tag--attention">{signal.severity}</span><p className="record-copy">{signal.reason}</p></div>
              <div className="record-actions justify-start">
                <Button className="button-primary" onClick={() => resolveSignal(signal.id, "marked_attention")}>Mark attention</Button>
                <Button className="button-secondary" onClick={() => resolveSignal(signal.id, "deferred")}>Defer</Button>
                <Button className="button-quiet" onClick={() => resolveSignal(signal.id, "dismissed")}>Dismiss</Button>
              </div>
            </article>)}
            {data.signals.length === 0 && <p className="empty-state">No active signals right now.</p>}
          </div>
        </section>

        <section className="workspace-section mt-0">
          <div className="section-heading"><div><h2>Recently filed</h2><p className="section-note">Undo puts a record back in review</p></div></div>
          <div className="space-y-2">
            {data.records.map((record) => <div className="compact-row" key={record.id}>
              <span className="flex-col items-start"><span className="font-medium">{record.title}</span><span className="record-meta">{record.record_type.replace("_", " ")}{record.destination_name ? ` · ${record.destination_name}` : ""}</span></span>
              {record.proposal_id && <Button className="button-quiet" onClick={() => undoRecord(record)}>Undo</Button>}
            </div>)}
            {data.records.length === 0 && <p className="empty-state">Accepted proposals appear here.</p>}
          </div>
        </section>
      </aside>
    </div>
  </main>;
}
