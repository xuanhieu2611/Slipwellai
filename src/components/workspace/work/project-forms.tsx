"use client";

import { type FormEvent, useRef, useState } from "react";
import type { WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { DomainSelect, PersonSelect } from "@/components/workspace/shared/selects";
import { formValue } from "@/components/workspace/shared/form-utils";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";

export function ProjectEditForm({ project, data, onCommand, onDone }: { project: WorkspaceData["projects"][number]; data: WorkspaceData; onCommand: WorkspaceCommandFn; onDone: () => void }) {
  const notify = useToast();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await onCommand({ action: "update_project", projectId: project.id, name: formValue(form, "name"), description: formValue(form, "description"), domainId: formValue(form, "domainId"), personId: formValue(form, "personId"), startOn: formValue(form, "startOn"), targetOn: formValue(form, "targetOn"), slippingCadenceDays: formValue(form, "slippingCadenceDays") });
      notify("Project updated.", "success");
      onDone();
    } catch (error) { notify(error instanceof Error ? error.message : "Could not update that project.", "error"); }
  }
  return <form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Outcome</span><input className="field-base" name="name" required maxLength={160} defaultValue={project.name} /></label><label className="field-label form-span"><span>Description</span><textarea className="field-base min-h-24" name="description" defaultValue={project.description ?? ""} /></label><DomainSelect domains={data.domains} defaultValue={project.domain_id ?? ""} /><PersonSelect people={data.people} defaultValue={project.person_id ?? ""} /><label className="field-label"><span>Start date</span><input className="field-base" type="date" name="startOn" defaultValue={project.start_on ?? ""} /></label><label className="field-label"><span>Target date</span><input className="field-base" type="date" name="targetOn" defaultValue={project.target_on ?? ""} /></label><label className="field-label"><span>Attention cadence (days)</span><input className="field-base" type="number" name="slippingCadenceDays" min={1} max={365} placeholder="Default 7" defaultValue={project.slipping_cadence_days ?? ""} /><span className="form-help">How often this should get attention before Slipping flags it. Leave blank for the default.</span></label><div className="record-actions form-span"><button className="button-base button-primary" type="submit">Save changes</button><button className="button-base button-quiet" type="button" onClick={onDone}>Cancel</button></div></form>;
}

export function NewProjectForm({ data, onCommand, onDone }: { data: WorkspaceData; onCommand: WorkspaceCommandFn; onDone?: () => void }) {
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
      await onCommand({ action: "create_project", name: formValue(form, "name"), description: formValue(form, "description"), domainId: formValue(form, "domainId"), personId: formValue(form, "personId"), startOn: formValue(form, "startOn"), targetOn: formValue(form, "targetOn"), slippingCadenceDays: formValue(form, "slippingCadenceDays"), idempotencyKey: keyRef.current });
      form.reset();
      keyRef.current = null;
      notify("Project created.", "success");
      onDone?.();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save that project.", "error");
    } finally {
      setBusy(false);
    }
  }
  return <form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Outcome</span><input className="field-base" name="name" required maxLength={160} placeholder="Launch the September client report" /></label><label className="field-label form-span"><span>Description</span><textarea className="field-base min-h-24" name="description" placeholder="What does complete look like?" /></label><DomainSelect domains={data.domains} /><PersonSelect people={data.people} /><label className="field-label"><span>Start date</span><input className="field-base" type="date" name="startOn" /></label><label className="field-label"><span>Target date</span><input className="field-base" type="date" name="targetOn" /></label><label className="field-label"><span>Attention cadence (days)</span><input className="field-base" type="number" name="slippingCadenceDays" min={1} max={365} placeholder="Default 7" /><span className="form-help">How often this should get attention before Slipping flags it. Leave blank for the default.</span></label><button className="button-base button-primary form-submit" type="submit" disabled={busy}>{busy ? "Creating…" : "Create project"}</button></form>;
}
