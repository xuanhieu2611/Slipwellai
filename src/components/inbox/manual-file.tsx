"use client";

import { type FormEvent, useState } from "react";
import { Check } from "@phosphor-icons/react";
import { resolveDestination, type DestinationCatalog } from "@/lib/proposals/destinations";
import type { DashboardData } from "@/lib/dashboard";
import { Button, SelectField, StatusMessage, TextField } from "@/components/ui/primitives";
import { post } from "@/components/inbox/api";
import { DestinationFields, destinationSelection, initialDestinationDraft, type DestinationDraft } from "@/components/inbox/destination";

/* Filing without waiting for the model. Available whenever interpretation has not
   produced something reviewable, so the words are never held hostage by the provider. */
export function ManualFile({ capture, catalog, done }: { capture: DashboardData["captures"][number]; catalog: DestinationCatalog; done: () => void }) {
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

