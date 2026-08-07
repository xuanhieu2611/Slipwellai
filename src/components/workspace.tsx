"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { isTaskOnDay, recurrenceLabel, taskDateLabel, type WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";

type Surface = "today" | "tasks" | "work" | "people-notes" | "search";

function dateInZone(timezone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

function formValue(form: HTMLFormElement, name: string) {
  const value = new FormData(form).get(name);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function tagsValue(form: HTMLFormElement, name: string) {
  const raw = formValue(form, name);
  if (!raw) return [];
  return raw.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 20);
}

function DomainSelect({ domains, name = "domainId", defaultValue = "" }: { domains: WorkspaceData["domains"]; name?: string; defaultValue?: string }) {
  return <label className="field-label"><span>Domain</span><select className="field-base" defaultValue={defaultValue} name={name}><option value="">No domain</option>{domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}</select></label>;
}

function TaskEditForm({ task, data, onCommand, onDone }: { task: WorkspaceData["tasks"][number]; data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void>; onDone: () => void }) {
  const notify = useToast();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await onCommand({ action: "update_task", taskId: task.id, title: formValue(form, "title"), details: formValue(form, "details"), dueOn: formValue(form, "dueOn"), scheduledFor: formValue(form, "scheduledFor"), priority: formValue(form, "priority"), tags: tagsValue(form, "tags"), domainId: formValue(form, "domainId"), projectId: formValue(form, "projectId"), personId: formValue(form, "personId") });
      notify("Task updated.", "success");
      onDone();
    } catch (error) { notify(error instanceof Error ? error.message : "Could not update that task.", "error"); }
  }
  return <form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Task</span><input className="field-base" name="title" required maxLength={280} defaultValue={task.title} /></label><label className="field-label form-span"><span>Details</span><textarea className="field-base min-h-24" name="details" defaultValue={task.details ?? ""} /></label><label className="field-label"><span>Due date</span><input className="field-base" type="date" name="dueOn" defaultValue={task.due_on ?? ""} /></label><label className="field-label"><span>Schedule for</span><input className="field-base" type="date" name="scheduledFor" defaultValue={task.scheduled_for ?? ""} /></label><label className="field-label"><span>Priority</span><select className="field-base" name="priority" defaultValue={String(task.priority)}><option value="1">Low</option><option value="2">Normal</option><option value="3">High</option></select></label><label className="field-label form-span"><span>Tags</span><input className="field-base" name="tags" placeholder="client, billing" defaultValue={task.tags.join(", ")} /></label><DomainSelect domains={data.domains} defaultValue={task.domain_id ?? ""} /><label className="field-label"><span>Project</span><select className="field-base" name="projectId" defaultValue={task.project_id ?? ""}><option value="">No project</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="field-label"><span>Person</span><select className="field-base" name="personId" defaultValue={task.person_id ?? ""}><option value="">No person</option>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><div className="record-actions form-span"><button className="button-base button-primary" type="submit">Save changes</button><button className="button-base button-quiet" type="button" onClick={onDone}>Cancel</button></div></form>;
}

function NewTaskForm({ data, onCommand }: { data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
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
      await onCommand({ action: "create_task", title: formValue(form, "title"), details: formValue(form, "details"), dueOn: formValue(form, "dueOn"), scheduledFor: formValue(form, "scheduledFor"), priority: formValue(form, "priority"), recurrenceRule: formValue(form, "recurrenceRule"), recurrenceInterval: formValue(form, "recurrenceInterval"), recurrenceUnit: formValue(form, "recurrenceUnit"), tags: tagsValue(form, "tags"), domainId: formValue(form, "domainId"), projectId: formValue(form, "projectId"), personId: formValue(form, "personId"), idempotencyKey: keyRef.current });
      form.reset();
      setRecurrenceRule("none");
      keyRef.current = null;
      notify("Task added.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save that task.", "error");
    } finally {
      setBusy(false);
    }
  }
  return <form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Task</span><input className="field-base" name="title" required maxLength={280} placeholder="Send July analytics to Rivera Studio" /></label><label className="field-label form-span"><span>Details (optional)</span><textarea className="field-base min-h-24" name="details" placeholder="Useful context, not a required planning ritual." /></label><label className="field-label"><span>Due date</span><input className="field-base" type="date" name="dueOn" /></label><label className="field-label"><span>Schedule for</span><input className="field-base" type="date" name="scheduledFor" /></label><label className="field-label"><span>Priority</span><select className="field-base" name="priority" defaultValue="2"><option value="1">Low</option><option value="2">Normal</option><option value="3">High</option></select></label><label className="field-label"><span>Repeat</span><select className="field-base" name="recurrenceRule" value={recurrenceRule} onChange={(event) => setRecurrenceRule(event.target.value)}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="weekdays">Weekdays (Mon-Fri)</option><option value="custom">Custom interval</option></select><span className="form-help">Repeating tasks use the scheduled date as their anchor.</span></label>{recurrenceRule === "custom" && <label className="field-label"><span>Repeat every</span><span className="inline-form"><input className="field-base" type="number" name="recurrenceInterval" min={1} max={30} defaultValue={1} required aria-label="Repeat interval" /><select className="field-base" name="recurrenceUnit" defaultValue="days" aria-label="Repeat unit"><option value="days">Days</option><option value="weeks">Weeks</option></select></span></label>}<label className="field-label form-span"><span>Tags</span><input className="field-base" name="tags" placeholder="client, billing (comma separated)" /></label><DomainSelect domains={data.domains} /><label className="field-label"><span>Project</span><select className="field-base" name="projectId" defaultValue=""><option value="">No project</option>{data.projects.filter((project) => project.status === "active").map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="field-label"><span>Person</span><select className="field-base" name="personId" defaultValue=""><option value="">No person</option>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><button className="button-base button-primary form-submit" type="submit" disabled={busy}>{busy ? "Adding…" : "Add task"}</button></form>;
}

function DeferControl({ task, onCommand, onDone }: { task: WorkspaceData["tasks"][number]; onCommand: (command: Record<string, unknown>) => Promise<void>; onDone: () => void }) {
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

function TaskList({ tasks, onCommand, today, data, showTopThree = true }: { tasks: WorkspaceData["tasks"]; onCommand: (command: Record<string, unknown>) => Promise<void>; today: string; data: WorkspaceData; showTopThree?: boolean }) {
  const notify = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deferringId, setDeferringId] = useState<string | null>(null);
  async function act(command: Record<string, unknown>, success: string) {
    try { await onCommand(command); notify(success, "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not update that task.", "error"); }
  }
  return <div className="space-y-3">{tasks.map((task) => {
    const domain = task.domain_id ? data.domains.find((item) => item.id === task.domain_id) : undefined;
    const project = task.project_id ? data.projects.find((item) => item.id === task.project_id) : undefined;
    const person = task.person_id ? data.people.find((item) => item.id === task.person_id) : undefined;
    const relatedNotes = data.notes.filter((note) => (task.domain_id && note.domain_id === task.domain_id) || (task.project_id && note.project_id === task.project_id) || (task.person_id && note.person_id === task.person_id)).slice(0, 3);
    return <article className="record-card" key={task.id}>{editingId === task.id ? <TaskEditForm task={task} data={data} onCommand={onCommand} onDone={() => setEditingId(null)} /> : <><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3>{task.title}</h3>{task.priority === 3 && <span className="tag tag--attention">High priority</span>}{task.recurrence_rule && <span className="tag">{recurrenceLabel(task)}</span>}{task.status === "canceled" && <span className="tag">Canceled</span>}{task.archived_at && <span className="tag">Deleted</span>}</div>{task.details && <p className="record-copy">{task.details}</p>}<p className="record-meta">{taskDateLabel(task)}</p>{(domain || project || person) && <p className="record-meta flex flex-wrap items-center gap-2">{domain && <span><i className="domain-dot" style={{ background: domain.color }} />{domain.name}</span>}{project && <span>{project.name}</span>}{person && <span>{person.name}</span>}</p>}{task.tags.length > 0 && <div className="flex flex-wrap gap-1">{task.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>}{relatedNotes.length > 0 && <p className="record-meta">Related notes: {relatedNotes.map((note) => note.title).join(", ")}</p>}{deferringId === task.id && <DeferControl task={task} onCommand={onCommand} onDone={() => setDeferringId(null)} />}</div><div className="record-actions">{task.archived_at ? <button className="button-base button-primary" onClick={() => act({ action: "restore_task", taskId: task.id }, "Task restored.")}>Restore</button> : task.status === "open" ? <><button className="button-base button-primary" onClick={() => act({ action: "complete_task", taskId: task.id }, "Task completed.")}>Complete</button><button className="button-base button-secondary" onClick={() => setDeferringId(deferringId === task.id ? null : task.id)}>Defer</button>{showTopThree && (task.top_three_date === today ? <button className="button-base button-quiet" onClick={() => act({ action: "clear_top_three", taskId: task.id }, "Removed from today’s priorities.")}>Remove priority</button> : <button className="button-base button-quiet" onClick={() => act({ action: "set_top_three", taskId: task.id, localDate: today }, "Added to today’s priorities.")}>Make priority</button>)}<button className="button-base button-quiet" onClick={() => act({ action: "cancel_task", taskId: task.id }, "Task canceled.")}>Cancel</button><button className="button-base button-quiet" onClick={() => act({ action: "delete_task", taskId: task.id }, "Task deleted.")}>Delete</button></> : <><button className="button-base button-secondary" onClick={() => act({ action: "reopen_task", taskId: task.id }, "Task reopened.")}>Reopen</button><button className="button-base button-quiet" onClick={() => act({ action: "delete_task", taskId: task.id }, "Task deleted.")}>Delete</button></>}{!task.archived_at && <button className="button-base button-quiet" onClick={() => setEditingId(task.id)}>Edit</button>}</div></>}</article>;
  })}{tasks.length === 0 && <p className="empty-state">No tasks here yet. Capture something, or add the next small action yourself.</p>}</div>;
}

function TemplateLibrary({ data, onCommand }: { data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
  const notify = useToast();
  async function submit(event: FormEvent<HTMLFormElement>, makeCommand: (form: HTMLFormElement) => Record<string, unknown>, success: string) {
    event.preventDefault();
    try { const form = event.currentTarget; await onCommand(makeCommand(form)); form.reset(); notify(success, "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not save that template.", "error"); }
  }
  return <section className="workspace-section"><div className="section-heading"><div><h2>Reusable plans</h2><p className="section-note">Checklist templates</p></div></div><p className="record-copy">Each application captures the current template version, so later edits do not change existing projects.</p><form className="form-grid" onSubmit={(event) => submit(event, (form) => ({ action: "create_checklist_template", name: formValue(form, "name"), description: formValue(form, "description") }), "Checklist template created.")}><label className="field-label"><span>Template name</span><input className="field-base" name="name" required maxLength={160} placeholder="Monthly client report" /></label><label className="field-label"><span>Description</span><input className="field-base" name="description" maxLength={1000} placeholder="Optional context" /></label><button className="button-base button-secondary form-submit">Create template</button></form><div className="mt-5 space-y-4">{data.checklistTemplates.map((template) => { const items = data.checklistTemplateItems.filter((item) => item.template_id === template.id); return <article className="project-card" key={template.id}><div className="record-card"><div><h3>{template.name}</h3>{template.description && <p className="record-copy">{template.description}</p>}<p className="record-meta">Version {template.version} · {items.length} items</p></div></div><div className="project-milestones"><form className="inline-form" onSubmit={(event) => submit(event, (form) => ({ action: "add_checklist_template_item", templateId: formValue(form, "templateId"), title: formValue(form, "title") }), "Step added to the template.")}><input type="hidden" name="templateId" value={template.id} /><label className="sr-only" htmlFor={`template-item-${template.id}`}>New template item</label><input className="field-base" id={`template-item-${template.id}`} name="title" required maxLength={280} placeholder="Add checklist step" /><button className="button-base button-secondary" type="submit">Add step</button></form>{items.map((item) => <div className="compact-row" key={item.id}><span>{item.title}</span></div>)}<form className="inline-form mt-3" onSubmit={(event) => submit(event, (form) => ({ action: "apply_checklist_template", templateId: formValue(form, "templateId"), projectId: formValue(form, "projectId") }), "Checklist applied to the project.")}><input type="hidden" name="templateId" value={template.id} /><label className="sr-only" htmlFor={`apply-${template.id}`}>Apply to project</label><select className="field-base" id={`apply-${template.id}`} name="projectId" defaultValue="" required><option value="" disabled>Apply to a project</option>{data.projects.filter((project) => project.status === "active").map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><button className="button-base button-primary" type="submit">Apply</button></form></div></article>; })}{data.checklistTemplates.length === 0 && <p className="empty-state">Save a reusable plan only when you expect to use it again.</p>}</div></section>;
}

function ProjectChecklist({ projectId, data, onCommand }: { projectId: string; data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
  const notify = useToast();
  const instances = data.checklistInstances.filter((instance) => instance.project_id === projectId);
  async function toggle(itemId: string, isOpen: boolean) {
    try { await onCommand({ action: isOpen ? "complete_checklist_item" : "reopen_checklist_item", itemId }); notify(isOpen ? "Checklist item completed." : "Checklist item reopened.", "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not update that checklist item.", "error"); }
  }
  return <div className="project-milestones">{instances.map((instance) => <div className="mt-3" key={instance.id}><p className="record-meta">Template snapshot · version {instance.template_version}</p>{data.checklistItems.filter((item) => item.instance_id === instance.id).map((item) => <div className="compact-row" key={item.id}><span>{item.title}</span><button className="button-base button-quiet" onClick={() => toggle(item.id, item.status === "open")}>{item.status === "open" ? "Complete" : "Reopen"}</button></div>)}</div>)}</div>;
}

function PersonInteractions({ personId, data, onCommand }: { personId: string; data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
  const notify = useToast();
  const interactions = data.personInteractions.filter((interaction) => interaction.person_id === personId).slice(0, 3);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try { const form = event.currentTarget; await onCommand({ action: "create_person_interaction", personId, summary: formValue(form, "summary"), followUpTitle: formValue(form, "followUpTitle") }); form.reset(); notify("Interaction logged.", "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not log that interaction.", "error"); }
  }
  return <div className="project-milestones"><form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Interaction</span><textarea className="field-base min-h-20" name="summary" required maxLength={4000} placeholder="What happened, or what should you remember?" /></label><label className="field-label"><span>Optional follow-up task</span><input className="field-base" name="followUpTitle" maxLength={280} placeholder="Send the recap" /></label><button className="button-base button-secondary form-submit">Log interaction</button></form><div className="mt-3 space-y-2">{interactions.map((interaction) => <div className="compact-row" key={interaction.id}><span>{interaction.summary}</span><span className="tag">{interaction.follow_up_task_id ? "Follow-up added" : new Date(interaction.occurred_at).toLocaleDateString()}</span></div>)}{interactions.length === 0 && <p className="record-meta">No interactions logged yet.</p>}</div></div>;
}

type TaskFilterState = {
  status: "open" | "completed" | "canceled" | "deleted" | "any";
  hasDate: "any" | "has" | "none";
  priority: "any" | "1" | "2" | "3";
  domainId: string;
  projectId: string;
  personId: string;
  slipping: "any" | "only";
  sort: "created" | "date" | "priority";
};

const defaultTaskFilters: TaskFilterState = { status: "open", hasDate: "any", priority: "any", domainId: "", projectId: "", personId: "", slipping: "any", sort: "created" };

function taskHasDate(task: WorkspaceData["tasks"][number]) {
  return Boolean(task.due_on || task.scheduled_for || task.deferred_until);
}

function filterAndSortTasks(tasks: WorkspaceData["tasks"], filters: TaskFilterState, slippingTaskIds: Set<string>) {
  const filtered = tasks.filter((task) => {
    if (filters.status === "open" && (task.status !== "open" || task.archived_at)) return false;
    if (filters.status === "completed" && (task.status !== "completed" || task.archived_at)) return false;
    if (filters.status === "canceled" && (task.status !== "canceled" || task.archived_at)) return false;
    if (filters.status === "deleted" && !task.archived_at) return false;
    if (filters.hasDate === "has" && !taskHasDate(task)) return false;
    if (filters.hasDate === "none" && taskHasDate(task)) return false;
    if (filters.priority !== "any" && String(task.priority) !== filters.priority) return false;
    if (filters.domainId && task.domain_id !== filters.domainId) return false;
    if (filters.projectId && task.project_id !== filters.projectId) return false;
    if (filters.personId && task.person_id !== filters.personId) return false;
    if (filters.slipping === "only" && !slippingTaskIds.has(task.id)) return false;
    return true;
  });
  if (filters.sort === "priority") return [...filtered].sort((a, b) => b.priority - a.priority);
  if (filters.sort === "date") return [...filtered].sort((a, b) => {
    const dateA = a.deferred_until ?? a.due_on ?? a.scheduled_for;
    const dateB = b.deferred_until ?? b.due_on ?? b.scheduled_for;
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA.localeCompare(dateB);
  });
  return filtered; // "created": data.tasks already arrives ordered by created_at desc.
}

function TaskFilters({ data, filters, onChange }: { data: WorkspaceData; filters: TaskFilterState; onChange: (next: TaskFilterState) => void }) {
  function set<K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]) {
    onChange({ ...filters, [key]: value });
  }
  return <div className="form-grid" role="group" aria-label="Filter and sort tasks">
    <label className="field-label"><span>Status</span><select className="field-base" value={filters.status} onChange={(event) => set("status", event.target.value as TaskFilterState["status"])}><option value="open">Open</option><option value="completed">Completed</option><option value="canceled">Canceled</option><option value="deleted">Deleted</option><option value="any">Any status</option></select></label>
    <label className="field-label"><span>Date</span><select className="field-base" value={filters.hasDate} onChange={(event) => set("hasDate", event.target.value as TaskFilterState["hasDate"])}><option value="any">Any date</option><option value="has">Has a date</option><option value="none">No date</option></select></label>
    <label className="field-label"><span>Priority</span><select className="field-base" value={filters.priority} onChange={(event) => set("priority", event.target.value as TaskFilterState["priority"])}><option value="any">Any priority</option><option value="1">Low</option><option value="2">Normal</option><option value="3">High</option></select></label>
    <label className="field-label"><span>Domain</span><select className="field-base" value={filters.domainId} onChange={(event) => set("domainId", event.target.value)}><option value="">Any domain</option>{data.domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}</select></label>
    <label className="field-label"><span>Project</span><select className="field-base" value={filters.projectId} onChange={(event) => set("projectId", event.target.value)}><option value="">Any project</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
    <label className="field-label"><span>Person</span><select className="field-base" value={filters.personId} onChange={(event) => set("personId", event.target.value)}><option value="">Any person</option>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>
    <label className="field-label"><span>Slipping</span><select className="field-base" value={filters.slipping} onChange={(event) => set("slipping", event.target.value as TaskFilterState["slipping"])}><option value="any">Any</option><option value="only">Slipping only</option></select></label>
    <label className="field-label"><span>Sort by</span><select className="field-base" value={filters.sort} onChange={(event) => set("sort", event.target.value as TaskFilterState["sort"])}><option value="created">Newest first</option><option value="date">Due or scheduled date</option><option value="priority">Priority</option></select></label>
    <button className="button-base button-quiet form-span justify-self-start" type="button" onClick={() => onChange(defaultTaskFilters)}>Reset filters</button>
  </div>;
}

function NotesToReview({ notes, today }: { notes: WorkspaceData["notes"]; today: string }) {
  const reviewNotes = notes.filter((note) => note.review_on && note.review_on <= today);
  return <section className="workspace-section"><div className="section-heading"><div><h2>Notes to review</h2><p className="section-note">Keep a thought within reach</p></div><span className="tag">{reviewNotes.length} due</span></div><div className="space-y-3">{reviewNotes.map((note) => <article className="record-card" key={note.id}><div><h3>{note.title}</h3>{note.body && <p className="record-copy">{note.body}</p>}<p className="record-meta">Review date {note.review_on}</p></div></article>)}{reviewNotes.length === 0 && <p className="empty-state">No notes are due for review today.</p>}</div></section>;
}

export function Workspace({ surface, data }: { surface: Surface; data: WorkspaceData }) {
  const router = useRouter();
  const notify = useToast();
  const today = dateInZone(data.timezone);
  async function command(body: Record<string, unknown>) {
    const response = await fetch("/api/workspace", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const payload: unknown = await response.json();
    if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Could not save that change.");
    router.refresh();
  }
  async function safely(operation: () => Promise<void>, success?: string) {
    try { await operation(); if (success) notify(success, "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not save that change.", "error"); }
  }
  async function refreshAttention() {
    await safely(async () => {
      const response = await fetch("/api/slipping/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope: "core" }) });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Could not refresh attention.");
      router.refresh();
    }, "Attention signals refreshed.");
  }
  async function resolveSignal(signalId: string, outcome: "marked_attention" | "deferred" | "dismissed") {
    await safely(async () => {
      const response = await fetch(`/api/slipping/${signalId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outcome }) });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Could not resolve that signal.");
      router.refresh();
    }, "Signal resolved.");
  }
  async function submit(event: FormEvent<HTMLFormElement>, action: string, fields: Record<string, string>, success: string) {
    event.preventDefault();
    try {
      const form = event.currentTarget;
      const payload: Record<string, unknown> = { action };
      for (const [key, source] of Object.entries(fields)) payload[key] = formValue(form, source);
      await command(payload);
      form.reset();
      notify(success, "success");
    } catch (error) { notify(error instanceof Error ? error.message : "Could not save that change.", "error"); }
  }
  const openTasks = data.tasks.filter((task) => task.status === "open" && !task.archived_at);
  const topThree = openTasks.filter((task) => task.top_three_date === today).sort((a, b) => (a.top_three_order ?? 9) - (b.top_three_order ?? 9));
  const dueToday = openTasks.filter((task) => isTaskOnDay(task, today)).filter((task) => !topThree.some((priority) => priority.id === task.id));
  const routineById = new Map(data.routineCompletions.filter((item) => item.local_date === today).map((item) => [item.routine_id, item]));
  const [taskFilters, setTaskFilters] = useState<TaskFilterState>(defaultTaskFilters);
  const slippingTaskIds = new Set(data.signals.filter((signal) => signal.entity_type === "task").map((signal) => signal.entity_id));
  const filteredTasks = filterAndSortTasks(data.tasks, taskFilters, slippingTaskIds);

  if (surface === "today") return <main className="workspace-page"><header className="page-intro"><p className="eyebrow">Today · {today}</p><h1>Choose what matters, then let the rest wait.</h1><p>Local time: {data.timezone}. Slipwell never quietly carries yesterday’s priorities into today.</p></header><section className="workspace-section"><div className="section-heading"><div><h2>Top Three</h2><p className="section-note">Your selected priorities</p></div><span className="tag">{topThree.length}/3 selected</span></div><TaskList tasks={topThree} onCommand={command} today={today} data={data} /></section><section className="workspace-section"><div className="section-heading"><div><h2>On the day</h2><p className="section-note">Due, scheduled, or intentionally deferred</p></div></div><TaskList tasks={dueToday} onCommand={command} today={today} data={data} /></section><section className="workspace-section"><div className="section-heading"><div><h2>Routines</h2><p className="section-note">Separate from tasks</p></div></div><div className="space-y-3">{data.routines.map((routine) => { const resolved = routineById.get(routine.id); return <article className="record-card" key={routine.id}><div><h3>{routine.name}</h3><p className="record-meta capitalize">{routine.period} · {resolved ? resolved.outcome : "Not yet checked"}</p></div>{!resolved && <div className="record-actions"><button className="button-base button-primary" onClick={() => safely(() => command({ action: "resolve_routine", routineId: routine.id, localDate: today, outcome: "completed" }), "Routine completed.")}>Complete</button><button className="button-base button-secondary" onClick={() => safely(() => command({ action: "resolve_routine", routineId: routine.id, localDate: today, outcome: "skipped" }), "Routine skipped.")}>Skip</button></div>}</article>; })}{data.routines.length === 0 && <p className="empty-state">Add a routine from People & Notes when a repeated behavior belongs here, not in your task list.</p>}</div></section><NotesToReview notes={data.notes} today={today} /><section className="workspace-section"><div className="section-heading"><div><h2>Slipping</h2><p className="section-note">Attention signals</p></div><button className="button-base button-secondary" onClick={refreshAttention}>Refresh attention</button></div><div className="space-y-3">{data.signals.filter((signal) => signal.entity_type !== "retainer").map((signal) => <article className="record-card" key={signal.id}><div><span className="tag tag--attention">{signal.severity}</span><p className="record-copy">{signal.reason}</p></div><div className="record-actions"><button className="button-base button-primary" onClick={() => resolveSignal(signal.id, "marked_attention")}>Mark attention</button><button className="button-base button-secondary" onClick={() => resolveSignal(signal.id, "deferred")}>Defer</button><button className="button-base button-quiet" onClick={() => resolveSignal(signal.id, "dismissed")}>Dismiss</button></div></article>)}{data.signals.filter((signal) => signal.entity_type !== "retainer").length === 0 && <p className="empty-state">No active task or project signals. Refresh attention to check meaningful activity against each cadence.</p>}</div></section><section className="workspace-section"><div className="section-heading"><div><h2>Capture recovery</h2><p className="section-note">Recent captures</p></div></div><div className="space-y-2">{data.captures.map((capture) => <article className="compact-row" key={capture.id}><span>{capture.original_text}</span><span className="tag">{capture.status.replace("_", " ")}</span></article>)}{data.captures.length === 0 && <p className="empty-state">Your captured thoughts will appear here.</p>}</div></section></main>;

  if (surface === "tasks") return <main className="workspace-page"><header className="page-intro"><p className="eyebrow">Tasks</p><h1>Small next actions with real context.</h1><p>Create a task in a few seconds; dates and links remain optional.</p></header><section className="workspace-section"><h2>New task</h2><NewTaskForm data={data} onCommand={command} /></section><section className="workspace-section"><div className="section-heading"><div><h2>Tasks</h2><p className="section-note">Filter and sort</p></div><span className="tag">{filteredTasks.length} shown</span></div><TaskFilters data={data} filters={taskFilters} onChange={setTaskFilters} /><TaskList tasks={filteredTasks} onCommand={command} today={today} data={data} showTopThree={taskFilters.status === "open" || taskFilters.status === "any"} /></section></main>;

  if (surface === "work") return <main className="workspace-page"><header className="page-intro"><p className="eyebrow">Work</p><h1>Finite projects, durable domains.</h1><p>Projects have an ending. Domains provide ongoing context without demanding a complete taxonomy.</p></header><div className="workspace-columns"><section className="workspace-section"><h2>New domain</h2><form className="form-grid" onSubmit={(event) => submit(event, "create_domain", { name: "name", description: "description", color: "color" }, "Domain created.")}><label className="field-label form-span"><span>Name</span><input className="field-base" name="name" required maxLength={80} placeholder="Client work" /></label><label className="field-label form-span"><span>Description</span><input className="field-base" name="description" maxLength={1000} placeholder="Optional context" /></label><label className="field-label"><span>Color</span><input className="field-base h-12" type="color" name="color" defaultValue="#2348c8" /></label><button className="button-base button-primary form-submit">Add domain</button></form><div className="mt-5 space-y-2">{data.domains.map((domain) => { const openTaskCount = data.tasks.filter((task) => task.domain_id === domain.id && task.status === "open" && !task.archived_at).length; const activeProjectCount = data.projects.filter((project) => project.domain_id === domain.id && ["planned", "active", "paused"].includes(project.status)).length; return <div className="compact-row" key={domain.id}><span><i className="domain-dot" style={{ background: domain.color }} />{domain.name}</span><span className="compact-row-actions"><span className="tag">{openTaskCount} open · {activeProjectCount} active</span><button className="button-base button-quiet" onClick={() => safely(() => command({ action: "archive_domain", domainId: domain.id }), "Domain archived.")}>Archive</button></span></div>; })}{data.domains.length === 0 && <p className="empty-state">A few domains are enough. You can also skip them.</p>}</div></section><section className="workspace-section"><h2>New project</h2><form className="form-grid" onSubmit={(event) => submit(event, "create_project", { name: "name", description: "description", domainId: "domainId", targetOn: "targetOn" }, "Project created.")}><label className="field-label form-span"><span>Outcome</span><input className="field-base" name="name" required maxLength={160} placeholder="Launch the September client report" /></label><label className="field-label form-span"><span>Description</span><textarea className="field-base min-h-24" name="description" placeholder="What does complete look like?" /></label><DomainSelect domains={data.domains} /><label className="field-label"><span>Target date</span><input className="field-base" type="date" name="targetOn" /></label><button className="button-base button-primary form-submit">Create project</button></form></section></div><TemplateLibrary data={data} onCommand={command} /><section className="workspace-section"><div className="section-heading"><div><h2>Project progress</h2><p className="section-note">Inspect the plan, not a cosmetic percentage</p></div></div><div className="space-y-4">{data.projects.map((project) => { const milestones = data.milestones.filter((milestone) => milestone.project_id === project.id); const completed = milestones.filter((milestone) => milestone.status === "completed").length; return <article className="project-card" key={project.id}><div className="record-card"><div><h3>{project.name}</h3>{project.description && <p className="record-copy">{project.description}</p>}<p className="record-meta">{project.target_on ? `Target ${project.target_on}` : "No target date"} · {milestones.length ? `${completed}/${milestones.length} milestones complete` : "No milestones yet"}</p></div><div className="record-actions"><span className="tag capitalize">{project.status}</span>{project.status === "active" && <><button className="button-base button-secondary" onClick={() => safely(() => command({ action: "record_project_progress", projectId: project.id }), "Progress recorded.")}>Mark progress</button><button className="button-base button-quiet" onClick={() => safely(() => command({ action: "pause_project", projectId: project.id }), "Project paused.")}>Pause</button><button className="button-base button-primary" onClick={() => safely(() => command({ action: "complete_project", projectId: project.id }), "Project completed.")}>Complete project</button></>}</div></div><div className="project-milestones"><form className="inline-form" onSubmit={(event) => submit(event, "create_milestone", { projectId: "projectId", title: "title" }, "Milestone added.")}><input type="hidden" name="projectId" value={project.id} /><label className="sr-only" htmlFor={`milestone-${project.id}`}>New milestone</label><input className="field-base" id={`milestone-${project.id}`} name="title" required maxLength={280} placeholder="Add a checkpoint" /><button className="button-base button-secondary" type="submit">Add milestone</button></form>{milestones.map((milestone) => <div className="compact-row" key={milestone.id}><span>{milestone.title}</span><button className="button-base button-quiet" onClick={() => safely(() => command({ action: milestone.status === "open" ? "complete_milestone" : "reopen_milestone", milestoneId: milestone.id }), milestone.status === "open" ? "Milestone completed." : "Milestone reopened.")}>{milestone.status === "open" ? "Complete" : "Reopen"}</button></div>)}</div><ProjectChecklist projectId={project.id} data={data} onCommand={command} /></article>; })}{data.projects.length === 0 && <p className="empty-state">Projects appear here when an outcome needs more than one action.</p>}</div></section></main>;

  if (surface === "people-notes") return <main className="workspace-page"><header className="page-intro"><p className="eyebrow">People & Notes</p><h1>Context without turning everything into a task.</h1><p>People and reflective notes remain lightweight, private records.</p></header><div className="workspace-columns"><section className="workspace-section"><h2>New person</h2><form className="form-grid" onSubmit={(event) => submit(event, "create_person", { name: "name", context: "context", domainId: "domainId" }, "Person added.")}><label className="field-label form-span"><span>Name</span><input className="field-base" name="name" required maxLength={160} placeholder="Priya from Rivera Studio" /></label><label className="field-label form-span"><span>Context</span><input className="field-base" name="context" maxLength={1000} placeholder="Client lead, collaborator, or someone important" /></label><DomainSelect domains={data.domains} /><button className="button-base button-primary form-submit">Add person</button></form><div className="mt-5 space-y-3">{data.people.map((person) => <article className="project-card" key={person.id}><div className="record-card"><div><h3>{person.name}</h3>{person.context && <p className="record-copy">{person.context}</p>}</div></div><PersonInteractions personId={person.id} data={data} onCommand={command} /></article>)}{data.people.length === 0 && <p className="empty-state">Add people when context helps, not as a CRM setup exercise.</p>}</div></section><section className="workspace-section"><h2>New note</h2><form className="form-grid" onSubmit={(event) => submit(event, "create_note", { title: "title", body: "body", domainId: "domainId", projectId: "projectId", personId: "personId", reviewOn: "reviewOn" }, "Note saved.")}><label className="field-label form-span"><span>Title</span><input className="field-base" name="title" required maxLength={280} placeholder="Rivera Studio call notes" /></label><label className="field-label form-span"><span>Note</span><textarea className="field-base min-h-32" name="body" maxLength={20000} placeholder="Keep the reflective content intact." /></label><DomainSelect domains={data.domains} /><label className="field-label"><span>Review on</span><input className="field-base" type="date" name="reviewOn" /></label><label className="field-label"><span>Project</span><select className="field-base" name="projectId" defaultValue=""><option value="">No project</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="field-label"><span>Person</span><select className="field-base" name="personId" defaultValue=""><option value="">No person</option>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><button className="button-base button-primary form-submit">Save note</button></form><div className="mt-5 space-y-3">{data.notes.map((note) => <article className="record-card" key={note.id}><div><h3>{note.title}</h3>{note.body && <p className="record-copy whitespace-pre-wrap">{note.body}</p>}<p className="record-meta">{note.review_on ? `Review ${note.review_on}` : "No review date"}</p></div></article>)}{data.notes.length === 0 && <p className="empty-state">Notes preserve thinking even when no action follows.</p>}</div></section></div><section className="workspace-section"><h2>New routine</h2><form className="form-grid" onSubmit={(event) => submit(event, "create_routine", { name: "name", period: "period" }, "Routine added.")}><label className="field-label"><span>Routine</span><input className="field-base" name="name" required maxLength={160} placeholder="Plan the day" /></label><label className="field-label"><span>Time of day</span><select className="field-base" name="period" defaultValue="anytime"><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option><option value="anytime">Anytime</option></select></label><button className="button-base button-secondary form-submit">Add routine</button></form></section></main>;

  return <Search data={data} />;
}

function Search({ data }: { data: WorkspaceData }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const entries = [
      ...data.tasks.map((item) => ({ type: "Task", title: item.title, context: item.details ?? "", id: item.id })),
      ...data.projects.map((item) => ({ type: "Project", title: item.name, context: item.description ?? "", id: item.id })),
      ...data.people.map((item) => ({ type: "Person", title: item.name, context: item.context ?? "", id: item.id })),
      ...data.notes.map((item) => ({ type: "Note", title: item.title, context: item.body ?? "", id: item.id })),
      ...data.domains.map((item) => ({ type: "Domain", title: item.name, context: "", id: item.id })),
      ...data.captures.map((item) => ({ type: "Capture", title: item.original_text, context: item.status, id: item.id })),
    ];
    return entries.filter((item) => `${item.title} ${item.context}`.toLowerCase().includes(q)).slice(0, 30);
  }, [data, query]);
  return <main className="workspace-page"><header className="page-intro"><p className="eyebrow">Search</p><h1>Find the thing you meant to keep.</h1><p>This working-prototype search only queries records already authorized for your account.</p></header><label className="field-label"><span>Search all current records</span><input autoFocus className="field-base search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a client, project, task, or phrase" /></label><section className="workspace-section mt-6"><div className="section-heading"><h2>Results</h2>{query && <span className="tag">{results.length} found</span>}</div><div className="space-y-3">{results.map((result) => <article className="record-card" key={`${result.type}-${result.id}`}><div><span className="tag tag--accent capitalize">{result.type}</span><h3 className="mt-1.5">{result.title}</h3>{result.context && <p className="record-copy">{result.context}</p>}</div></article>)}{query && results.length === 0 && <p className="empty-state">Nothing matched. Search stays inside your own records.</p>}{!query && <p className="empty-state">Start with a word or phrase. Full-text indexing is the next hardening step; this prototype view demonstrates the unified search experience.</p>}</div></section></main>;
}
