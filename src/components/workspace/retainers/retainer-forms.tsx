"use client";

import { type FormEvent, useRef, useState } from "react";
import type { WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { DomainSelect, PersonSelect } from "@/components/workspace/shared/selects";
import { formValue } from "@/components/workspace/shared/form-utils";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";

export function RetainerEditForm({ retainer, data, onCommand, onDone }: { retainer: WorkspaceData["retainers"][number]; data: WorkspaceData; onCommand: WorkspaceCommandFn; onDone: () => void }) {
  const notify = useToast();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await onCommand({ action: "update_retainer", retainerId: retainer.id, name: formValue(form, "name"), timezone: formValue(form, "timezone"), cycleDay: formValue(form, "cycleDay"), clientPersonId: formValue(form, "clientPersonId"), domainId: formValue(form, "domainId") });
      notify("Retainer updated.", "success");
      onDone();
    } catch (error) { notify(error instanceof Error ? error.message : "Could not update that retainer.", "error"); }
  }
  return <form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Retainer</span><input className="field-base" name="name" required maxLength={160} defaultValue={retainer.name} /></label><label className="field-label"><span>Timezone</span><input className="field-base" name="timezone" required maxLength={100} defaultValue={retainer.timezone} /></label><label className="field-label"><span>Cycle day of month</span><input className="field-base" type="number" name="cycleDay" min={1} max={31} required defaultValue={retainer.cycle_day} /></label><DomainSelect domains={data.domains} defaultValue={retainer.domain_id ?? ""} /><PersonSelect people={data.people} name="clientPersonId" defaultValue={retainer.client_person_id ?? ""} /><div className="record-actions form-span"><button className="button-base button-primary" type="submit">Save changes</button><button className="button-base button-quiet" type="button" onClick={onDone}>Cancel</button></div></form>;
}

export function NewRetainerForm({ data, onCommand, onDone }: { data: WorkspaceData; onCommand: WorkspaceCommandFn; onDone?: () => void }) {
  const notify = useToast();
  const [busy, setBusy] = useState(false);
  const keyRef = useRef<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    keyRef.current ??= crypto.randomUUID();
    setBusy(true);
    try {
      await onCommand({ action: "create_retainer", name: formValue(form, "name"), timezone: formValue(form, "timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone, cycleDay: formValue(form, "cycleDay"), clientPersonId: formValue(form, "clientPersonId"), domainId: formValue(form, "domainId"), idempotencyKey: keyRef.current });
      form.reset();
      keyRef.current = null;
      notify("Retainer created.", "success");
      onDone?.();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save that retainer.", "error");
    } finally {
      setBusy(false);
    }
  }
  return <form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Retainer</span><input className="field-base" name="name" required maxLength={160} placeholder="Rivera Studio monthly retainer" /></label><label className="field-label"><span>Timezone</span><input className="field-base" name="timezone" maxLength={100} placeholder={Intl.DateTimeFormat().resolvedOptions().timeZone} /></label><label className="field-label"><span>Cycle day of month</span><input className="field-base" type="number" name="cycleDay" min={1} max={31} required defaultValue={1} /></label><DomainSelect domains={data.domains} /><PersonSelect people={data.people} name="clientPersonId" /><button className="button-base button-primary form-submit" type="submit" disabled={busy}>{busy ? "Creating…" : "Create retainer"}</button></form>;
}
