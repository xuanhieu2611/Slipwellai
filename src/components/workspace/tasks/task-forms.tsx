"use client";

import { type FormEvent, useRef, useState } from "react";
import type { WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { DomainSelect } from "@/components/workspace/shared/selects";
import { formValue, tagsValue } from "@/components/workspace/shared/form-utils";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";

export function TaskEditForm({ task, data, onCommand, onDone }: { task: WorkspaceData["tasks"][number]; data: WorkspaceData; onCommand: WorkspaceCommandFn; onDone: () => void }) {
  const notify = useToast();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await onCommand({ action: "update_task", taskId: task.id, title: formValue(form, "title"), details: formValue(form, "details"), dueOn: formValue(form, "dueOn"), scheduledFor: formValue(form, "scheduledFor"), priority: formValue(form, "priority"), tags: tagsValue(form, "tags"), domainId: formValue(form, "domainId"), projectId: formValue(form, "projectId"), personId: formValue(form, "personId"), slippingCadenceDays: formValue(form, "slippingCadenceDays") });
      notify("Task updated.", "success");
      onDone();
    } catch (error) { notify(error instanceof Error ? error.message : "Could not update that task.", "error"); }
  }
  return <form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Task</span><input className="field-base" name="title" required maxLength={280} defaultValue={task.title} /></label><label className="field-label form-span"><span>Details</span><textarea className="field-base min-h-24" name="details" defaultValue={task.details ?? ""} /></label><label className="field-label"><span>Due date</span><input className="field-base" type="date" name="dueOn" defaultValue={task.due_on ?? ""} /></label><label className="field-label"><span>Schedule for</span><input className="field-base" type="date" name="scheduledFor" defaultValue={task.scheduled_for ?? ""} /></label><label className="field-label"><span>Priority</span><select className="field-base" name="priority" defaultValue={String(task.priority)}><option value="1">Low</option><option value="2">Normal</option><option value="3">High</option></select></label><label className="field-label form-span"><span>Tags</span><input className="field-base" name="tags" placeholder="client, billing" defaultValue={task.tags.join(", ")} /></label><DomainSelect domains={data.domains} defaultValue={task.domain_id ?? ""} /><label className="field-label"><span>Project</span><select className="field-base" name="projectId" defaultValue={task.project_id ?? ""}><option value="">No project</option>{data.projects.filter((project) => !project.archived_at).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="field-label"><span>Person</span><select className="field-base" name="personId" defaultValue={task.person_id ?? ""}><option value="">No person</option>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label className="field-label"><span>Attention cadence (days)</span><input className="field-base" type="number" name="slippingCadenceDays" min={1} max={365} placeholder="Default 14" defaultValue={task.slipping_cadence_days ?? ""} /><span className="form-help">How often this should get attention before Slipping flags it. Leave blank for the default.</span></label><div className="record-actions form-span"><button className="button-base button-primary" type="submit">Save changes</button><button className="button-base button-quiet" type="button" onClick={onDone}>Cancel</button></div></form>;
}

export function NewTaskForm({ data, onCommand, onDone }: { data: WorkspaceData; onCommand: WorkspaceCommandFn; onDone?: () => void }) {
  const notify = useToast();
  const [busy, setBusy] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("none");
  const keyRef = useRef<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    keyRef.current ??= crypto.randomUUID();
    setBusy(true);
    try {
      await onCommand({ action: "create_task", title: formValue(form, "title"), details: formValue(form, "details"), dueOn: formValue(form, "dueOn"), scheduledFor: formValue(form, "scheduledFor"), priority: formValue(form, "priority"), recurrenceRule: formValue(form, "recurrenceRule"), recurrenceInterval: formValue(form, "recurrenceInterval"), recurrenceUnit: formValue(form, "recurrenceUnit"), tags: tagsValue(form, "tags"), domainId: formValue(form, "domainId"), projectId: formValue(form, "projectId"), personId: formValue(form, "personId"), slippingCadenceDays: formValue(form, "slippingCadenceDays"), idempotencyKey: keyRef.current });
      form.reset();
      setRecurrenceRule("none");
      keyRef.current = null;
      notify("Task added.", "success");
      onDone?.();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save that task.", "error");
    } finally {
      setBusy(false);
    }
  }
  return <form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Task</span><input className="field-base" name="title" required maxLength={280} placeholder="Send July analytics to Rivera Studio" /></label><label className="field-label form-span"><span>Details (optional)</span><textarea className="field-base min-h-24" name="details" placeholder="Useful context, not a required planning ritual." /></label><label className="field-label"><span>Due date</span><input className="field-base" type="date" name="dueOn" /></label><label className="field-label"><span>Schedule for</span><input className="field-base" type="date" name="scheduledFor" /></label><label className="field-label"><span>Priority</span><select className="field-base" name="priority" defaultValue="2"><option value="1">Low</option><option value="2">Normal</option><option value="3">High</option></select></label><label className="field-label"><span>Repeat</span><select className="field-base" name="recurrenceRule" value={recurrenceRule} onChange={(event) => setRecurrenceRule(event.target.value)}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="weekdays">Weekdays (Mon-Fri)</option><option value="custom">Custom interval</option></select><span className="form-help">Repeating tasks use the scheduled date as their anchor.</span></label>{recurrenceRule === "custom" && <label className="field-label"><span>Repeat every</span><span className="inline-form"><input className="field-base" type="number" name="recurrenceInterval" min={1} max={30} defaultValue={1} required aria-label="Repeat interval" /><select className="field-base" name="recurrenceUnit" defaultValue="days" aria-label="Repeat unit"><option value="days">Days</option><option value="weeks">Weeks</option></select></span></label>}<label className="field-label form-span"><span>Tags</span><input className="field-base" name="tags" placeholder="client, billing (comma separated)" /></label><DomainSelect domains={data.domains} /><label className="field-label"><span>Project</span><select className="field-base" name="projectId" defaultValue=""><option value="">No project</option>{data.projects.filter((project) => project.status === "active" && !project.archived_at).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="field-label"><span>Person</span><select className="field-base" name="personId" defaultValue=""><option value="">No person</option>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label className="field-label"><span>Attention cadence (days)</span><input className="field-base" type="number" name="slippingCadenceDays" min={1} max={365} placeholder="Default 14" /><span className="form-help">How often this should get attention before Slipping flags it. Leave blank for the default.</span></label><button className="button-base button-primary form-submit" type="submit" disabled={busy}>{busy ? "Adding…" : "Add task"}</button></form>;
}

export function DeferControl({ task, onCommand, onDone }: { task: WorkspaceData["tasks"][number]; onCommand: WorkspaceCommandFn; onDone: () => void }) {
  const notify = useToast();
  async function submitDate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const until = formValue(event.currentTarget, "until");
    if (!until) { notify("Choose a date, or use “Defer without a date” instead.", "error"); return; }
    try { await onCommand({ action: "defer_task", taskId: task.id, until }); notify("Task deferred.", "success"); onDone(); } catch (error) { notify(error instanceof Error ? error.message : "Could not defer that task.", "error"); }
  }
  async function deferWithoutDate() {
    try { await onCommand({ action: "defer_task", taskId: task.id, until: null }); notify("Task deferred without a date.", "success"); onDone(); } catch (error) { notify(error instanceof Error ? error.message : "Could not defer that task.", "error"); }
  }
  return <form className="inline-form" onSubmit={submitDate}><label className="sr-only" htmlFor={`defer-${task.id}`}>Defer until</label><input className="field-base" id={`defer-${task.id}`} type="date" name="until" defaultValue={task.deferred_until ?? ""} /><button className="button-base button-primary" type="submit">Defer to date</button><button className="button-base button-quiet" type="button" onClick={deferWithoutDate}>Defer without a date</button><button className="button-base button-quiet" type="button" onClick={onDone}>Cancel</button></form>;
}
