"use client";

import { type CSSProperties, type FormEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowCounterClockwise, CalendarBlank, CaretDown, CaretLeft, CaretRight, DotsThreeVertical, ListBullets, Plus, Tray } from "@phosphor-icons/react";
import { nextCycleMonth } from "@/lib/retainers";
import { activityEventLabel, calendarMonthGrid, isTaskOnDay, recurrenceLabel, retainerActivityEventLabel, shiftCalendarMonth, taskDateLabel, taskPlanningDate, type WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/primitives";

type Surface = "today" | "tasks" | "work" | "retainers" | "people-notes" | "search";

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

function PersonSelect({ people, name = "personId", defaultValue = "" }: { people: WorkspaceData["people"]; name?: string; defaultValue?: string }) {
  return <label className="field-label"><span>Person</span><select className="field-base" defaultValue={defaultValue} name={name}><option value="">No person</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>;
}

const DOMAIN_COLOR_PALETTE = [
  { name: "Tan", value: "#e3c9a6" },
  { name: "Blush", value: "#f4c6c6" },
  { name: "Peach", value: "#f7d9b8" },
  { name: "Butter", value: "#f5e6a3" },
  { name: "Sage", value: "#c8dfc0" },
  { name: "Mint", value: "#bfe8d4" },
  { name: "Sky", value: "#bee0f0" },
  { name: "Periwinkle", value: "#c9cef0" },
  { name: "Lavender", value: "#dcc6ec" },
  { name: "Rose", value: "#f0c9dd" },
  { name: "Terracotta", value: "#e8b9a4" },
  { name: "Seafoam", value: "#b7e4da" },
];

function DomainColorPicker({ name = "color", defaultValue = DOMAIN_COLOR_PALETTE[0].value }: { name?: string; defaultValue?: string }) {
  return <label className="field-label"><span>Color</span><div className="color-swatch-grid">{DOMAIN_COLOR_PALETTE.map((swatch) => <label className="color-swatch" key={swatch.value} style={{ background: swatch.value }} title={swatch.name}><input type="radio" name={name} value={swatch.value} defaultChecked={swatch.value === defaultValue} /></label>)}</div></label>;
}

function TaskEditForm({ task, data, onCommand, onDone }: { task: WorkspaceData["tasks"][number]; data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void>; onDone: () => void }) {
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

function NewTaskForm({ data, onCommand, onCreated }: { data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void>; onCreated?: () => void }) {
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
      onCreated?.();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save that task.", "error");
    } finally {
      setBusy(false);
    }
  }
  return <form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Task</span><input className="field-base" name="title" required maxLength={280} placeholder="Send July analytics to Rivera Studio" /></label><label className="field-label form-span"><span>Details (optional)</span><textarea className="field-base min-h-24" name="details" placeholder="Useful context, not a required planning ritual." /></label><label className="field-label"><span>Due date</span><input className="field-base" type="date" name="dueOn" /></label><label className="field-label"><span>Schedule for</span><input className="field-base" type="date" name="scheduledFor" /></label><label className="field-label"><span>Priority</span><select className="field-base" name="priority" defaultValue="2"><option value="1">Low</option><option value="2">Normal</option><option value="3">High</option></select></label><label className="field-label"><span>Repeat</span><select className="field-base" name="recurrenceRule" value={recurrenceRule} onChange={(event) => setRecurrenceRule(event.target.value)}><option value="none">Does not repeat</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option><option value="weekdays">Weekdays (Mon-Fri)</option><option value="custom">Custom interval</option></select><span className="form-help">Repeating tasks use the scheduled date as their anchor.</span></label>{recurrenceRule === "custom" && <label className="field-label"><span>Repeat every</span><span className="inline-form"><input className="field-base" type="number" name="recurrenceInterval" min={1} max={30} defaultValue={1} required aria-label="Repeat interval" /><select className="field-base" name="recurrenceUnit" defaultValue="days" aria-label="Repeat unit"><option value="days">Days</option><option value="weeks">Weeks</option></select></span></label>}<label className="field-label form-span"><span>Tags</span><input className="field-base" name="tags" placeholder="client, billing (comma separated)" /></label><DomainSelect domains={data.domains} /><label className="field-label"><span>Project</span><select className="field-base" name="projectId" defaultValue=""><option value="">No project</option>{data.projects.filter((project) => project.status === "active" && !project.archived_at).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="field-label"><span>Person</span><select className="field-base" name="personId" defaultValue=""><option value="">No person</option>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><label className="field-label"><span>Attention cadence (days)</span><input className="field-base" type="number" name="slippingCadenceDays" min={1} max={365} placeholder="Default 14" /><span className="form-help">How often this should get attention before Slipping flags it. Leave blank for the default.</span></label><button className="button-base button-primary form-submit" type="submit" disabled={busy}>{busy ? "Adding…" : "Add task"}</button></form>;
}

function ProjectEditForm({ project, data, onCommand, onDone }: { project: WorkspaceData["projects"][number]; data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void>; onDone: () => void }) {
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

function NewProjectForm({ data, onCommand }: { data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
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
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save that project.", "error");
    } finally {
      setBusy(false);
    }
  }
  return <form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Outcome</span><input className="field-base" name="name" required maxLength={160} placeholder="Launch the September client report" /></label><label className="field-label form-span"><span>Description</span><textarea className="field-base min-h-24" name="description" placeholder="What does complete look like?" /></label><DomainSelect domains={data.domains} /><PersonSelect people={data.people} /><label className="field-label"><span>Start date</span><input className="field-base" type="date" name="startOn" /></label><label className="field-label"><span>Target date</span><input className="field-base" type="date" name="targetOn" /></label><label className="field-label"><span>Attention cadence (days)</span><input className="field-base" type="number" name="slippingCadenceDays" min={1} max={365} placeholder="Default 7" /><span className="form-help">How often this should get attention before Slipping flags it. Leave blank for the default.</span></label><button className="button-base button-primary form-submit" type="submit" disabled={busy}>{busy ? "Creating…" : "Create project"}</button></form>;
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

function SlippingSignalCard({
  signal,
  data,
  command,
  resolveSignal,
}: {
  signal: WorkspaceData["signals"][number];
  data: WorkspaceData;
  command: (body: Record<string, unknown>) => Promise<void>;
  resolveSignal: (signalId: string, outcome: "marked_attention" | "deferred" | "dismissed" | "cadence_changed", extra?: Record<string, unknown>, success?: string) => Promise<void>;
}) {
  const notify = useToast();
  const [busy, setBusy] = useState(false);
  const keyRef = useRef<string | null>(null);
  const task = signal.entity_type === "task" ? data.tasks.find((candidate) => candidate.id === signal.entity_id) : undefined;
  const project = signal.entity_type === "project" ? data.projects.find((candidate) => candidate.id === signal.entity_id) : undefined;
  const defaultCadence = signal.entity_type === "project" ? (project?.slipping_cadence_days ?? 7) : (task?.slipping_cadence_days ?? 14);

  async function addNextAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const title = formValue(form, "title");
    if (!title) return;
    keyRef.current ??= crypto.randomUUID();
    setBusy(true);
    try {
      const payload: Record<string, unknown> = { action: "create_task", title, idempotencyKey: keyRef.current };
      if (signal.entity_type === "project") payload.projectId = signal.entity_id;
      else if (task) { payload.domainId = task.domain_id; payload.projectId = task.project_id; payload.personId = task.person_id; }
      await command(payload);
      await resolveSignal(signal.id, "marked_attention", undefined, "Next action created.");
      form.reset();
      keyRef.current = null;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not add that action.", "error");
    } finally {
      setBusy(false);
    }
  }

  async function saveCadence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cadenceDays = formValue(event.currentTarget, "cadenceDays");
    if (!cadenceDays) { notify("Choose a cadence between 1 and 365 days.", "error"); return; }
    await resolveSignal(signal.id, "cadence_changed", { cadenceDays }, "Cadence updated.");
  }

  async function pauseOrArchive() {
    try {
      if (signal.entity_type === "task") await command({ action: "delete_task", taskId: signal.entity_id });
      else await command({ action: "pause_project", projectId: signal.entity_id });
      await resolveSignal(signal.id, "dismissed", undefined, signal.entity_type === "task" ? "Task archived." : "Project paused.");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not do that.", "error");
    }
  }

  return <article className="record-card"><div><span className="tag tag--attention">{signal.severity}</span><p className="record-copy">{signal.reason}</p></div><div className="record-actions"><button className="button-base button-primary" onClick={() => resolveSignal(signal.id, "marked_attention")}>Mark attention</button><button className="button-base button-secondary" onClick={() => resolveSignal(signal.id, "deferred")}>Defer</button><button className="button-base button-quiet" onClick={() => resolveSignal(signal.id, "dismissed")}>Dismiss</button></div><form className="inline-form" onSubmit={addNextAction}><label className="sr-only" htmlFor={`next-action-${signal.id}`}>Next action</label><input className="field-base" id={`next-action-${signal.id}`} name="title" placeholder="Add the next concrete action" disabled={busy} /><button className="button-base button-secondary" type="submit" disabled={busy}>{busy ? "Adding…" : "Add & mark attention"}</button></form><form className="inline-form" onSubmit={saveCadence}><label className="sr-only" htmlFor={`cadence-${signal.id}`}>Attention cadence (days)</label><input className="field-base" id={`cadence-${signal.id}`} type="number" name="cadenceDays" min={1} max={365} defaultValue={defaultCadence} /><button className="button-base button-secondary" type="submit">Save cadence</button></form>{(signal.entity_type === "task" || signal.entity_type === "project") && <button className="button-base button-quiet" onClick={pauseOrArchive}>{signal.entity_type === "task" ? "Archive" : "Pause"}</button>}</article>;
}

type MenuAction = { label: string; onClick: () => void; tone?: "danger" };

function ActionsMenu({ actions }: { actions: MenuAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) { if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false); }
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") setOpen(false); }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, [open]);
  return <div className="task-menu" ref={ref}><button className="button-base button-quiet task-menu-trigger" type="button" aria-label="More actions" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}><DotsThreeVertical aria-hidden size={18} weight="bold" /></button>{open && <div className="task-menu-panel" role="menu">{actions.map((action) => <button className={action.tone === "danger" ? "task-menu-item task-menu-item--danger" : "task-menu-item"} key={action.label} role="menuitem" type="button" onClick={() => { setOpen(false); action.onClick(); }}>{action.label}</button>)}</div>}</div>;
}

function TaskList({ tasks, onCommand, today, data, showTopThree = true, emptyText = "No tasks here yet. Capture something, or add the next small action yourself." }: { tasks: WorkspaceData["tasks"]; onCommand: (command: Record<string, unknown>) => Promise<void>; today: string; data: WorkspaceData; showTopThree?: boolean; emptyText?: string }) {
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
    const openMenuActions: MenuAction[] = [...(showTopThree ? [task.top_three_date === today ? { label: "Remove priority", onClick: () => act({ action: "clear_top_three", taskId: task.id }, "Removed from today’s priorities.") } : { label: "Make priority", onClick: () => act({ action: "set_top_three", taskId: task.id, localDate: today }, "Added to today’s priorities.") }] : []), { label: "Edit", onClick: () => setEditingId(task.id) }, { label: "Cancel", onClick: () => act({ action: "cancel_task", taskId: task.id }, "Task canceled.") }, { label: "Delete", onClick: () => act({ action: "delete_task", taskId: task.id }, "Task deleted."), tone: "danger" }];
    const closedMenuActions: MenuAction[] = [{ label: "Edit", onClick: () => setEditingId(task.id) }, { label: "Delete", onClick: () => act({ action: "delete_task", taskId: task.id }, "Task deleted."), tone: "danger" }];
    return <article className={`record-card${domain ? " record-card--domain" : ""}`} style={domain ? ({ "--domain-color": domain.color } as CSSProperties) : undefined} key={task.id}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3>{task.title}</h3>{task.priority === 3 && <span className="tag tag--attention">High priority</span>}{task.recurrence_rule && <span className="tag">{recurrenceLabel(task)}</span>}{task.status === "canceled" && <span className="tag">Canceled</span>}{task.archived_at && <span className="tag">Deleted</span>}</div>{task.details && <p className="record-copy">{task.details}</p>}<p className="record-meta">{taskDateLabel(task)}</p>{(domain || project || person) && <p className="record-meta flex flex-wrap items-center gap-2">{domain && <span><i className="domain-dot" style={{ background: domain.color }} />{domain.name}</span>}{project && <span>{project.name}</span>}{person && <span>{person.name}</span>}</p>}{task.tags.length > 0 && <div className="flex flex-wrap gap-1">{task.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>}{relatedNotes.length > 0 && <p className="record-meta">Related notes: {relatedNotes.map((note) => note.title).join(", ")}</p>}{deferringId === task.id && <DeferControl task={task} onCommand={onCommand} onDone={() => setDeferringId(null)} />}</div><div className="record-actions">{task.archived_at ? <><button className="button-base button-primary" onClick={() => act({ action: "restore_task", taskId: task.id }, "Task restored.")}>Restore</button><ActionsMenu actions={[{ label: "Delete", onClick: () => act({ action: "delete_task", taskId: task.id }, "Task deleted."), tone: "danger" }]} /></> : task.status === "open" ? <><button className="button-base button-primary" onClick={() => act({ action: "complete_task", taskId: task.id }, "Task completed.")}>Complete</button><button className="button-base button-secondary" onClick={() => setDeferringId(deferringId === task.id ? null : task.id)}>Defer</button><ActionsMenu actions={openMenuActions} /></> : <><button className="button-base button-secondary" onClick={() => act({ action: "reopen_task", taskId: task.id }, "Task reopened.")}>Reopen</button><ActionsMenu actions={closedMenuActions} /></>}</div>{editingId === task.id && <Dialog title="Edit task" size="lg" onClose={() => setEditingId(null)}><TaskEditForm task={task} data={data} onCommand={onCommand} onDone={() => setEditingId(null)} /></Dialog>}</article>;
  })}{tasks.length === 0 && <p className="empty-state">{emptyText}</p>}</div>;
}

function TemplateItemRow({ item, onCommand }: { item: WorkspaceData["checklistTemplateItems"][number]; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await onCommand({ action: "update_checklist_template_item", itemId: item.id, title: formValue(form, "title"), applyToExisting: new FormData(form).get("applyToExisting") === "on" });
      notify("Template step updated.", "success");
      setEditing(false);
    } catch (error) { notify(error instanceof Error ? error.message : "Could not update that step.", "error"); }
  }
  async function remove() {
    try { await onCommand({ action: "delete_checklist_template_item", itemId: item.id }); notify("Template step removed.", "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not remove that step.", "error"); }
  }
  if (editing) return <form className="inline-form" onSubmit={submit}><label className="sr-only" htmlFor={`edit-item-${item.id}`}>Step title</label><input className="field-base" id={`edit-item-${item.id}`} name="title" required maxLength={280} defaultValue={item.title} /><label className="inline-checkbox"><input type="checkbox" name="applyToExisting" />Also update this step on already-applied, still-open checklists</label><button className="button-base button-primary" type="submit">Save</button><button className="button-base button-quiet" type="button" onClick={() => setEditing(false)}>Cancel</button></form>;
  return <div className="compact-row"><span>{item.title}</span><span className="compact-row-actions"><button className="button-base button-quiet" onClick={() => setEditing(true)}>Edit</button><button className="button-base button-quiet" onClick={remove}>Delete</button></span></div>;
}

function TemplateLibrary({ data, onCommand }: { data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
  const notify = useToast();
  async function submit(event: FormEvent<HTMLFormElement>, makeCommand: (form: HTMLFormElement) => Record<string, unknown>, success: string) {
    event.preventDefault();
    try { const form = event.currentTarget; await onCommand(makeCommand(form)); form.reset(); notify(success, "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not save that template.", "error"); }
  }
  async function removeTemplate(templateId: string) {
    try { await onCommand({ action: "delete_checklist_template", templateId }); notify("Template deleted.", "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not delete that template.", "error"); }
  }
  return <section className="workspace-section"><div className="section-heading"><div><h2>Reusable plans</h2><p className="section-note">Checklist templates</p></div></div><p className="record-copy">Each application captures the current template version, so later edits only affect future applications unless you explicitly choose to update existing open checklists too.</p><form className="form-grid" onSubmit={(event) => submit(event, (form) => ({ action: "create_checklist_template", name: formValue(form, "name"), description: formValue(form, "description") }), "Checklist template created.")}><label className="field-label"><span>Template name</span><input className="field-base" name="name" required maxLength={160} placeholder="Monthly client report" /></label><label className="field-label"><span>Description</span><input className="field-base" name="description" maxLength={1000} placeholder="Optional context" /></label><button className="button-base button-secondary form-submit">Create template</button></form><div className="mt-5 space-y-4">{data.checklistTemplates.map((template) => { const items = data.checklistTemplateItems.filter((item) => item.template_id === template.id); return <article className="project-card" key={template.id}><div className="record-card"><div><h3>{template.name}</h3>{template.description && <p className="record-copy">{template.description}</p>}<p className="record-meta">Version {template.version} · {items.length} items</p></div><div className="record-actions"><button className="button-base button-quiet" onClick={() => removeTemplate(template.id)}>Delete template</button></div></div><div className="project-milestones"><form className="inline-form" onSubmit={(event) => submit(event, (form) => ({ action: "add_checklist_template_item", templateId: formValue(form, "templateId"), title: formValue(form, "title") }), "Step added to the template.")}><input type="hidden" name="templateId" value={template.id} /><label className="sr-only" htmlFor={`template-item-${template.id}`}>New template item</label><input className="field-base" id={`template-item-${template.id}`} name="title" required maxLength={280} placeholder="Add checklist step" /><button className="button-base button-secondary" type="submit">Add step</button></form>{items.map((item) => <TemplateItemRow item={item} onCommand={onCommand} key={item.id} />)}<form className="inline-form mt-3" onSubmit={(event) => submit(event, (form) => ({ action: "apply_checklist_template", templateId: formValue(form, "templateId"), projectId: formValue(form, "projectId") }), "Checklist applied to the project.")}><input type="hidden" name="templateId" value={template.id} /><label className="sr-only" htmlFor={`apply-${template.id}`}>Apply to project</label><select className="field-base" id={`apply-${template.id}`} name="projectId" defaultValue="" required><option value="" disabled>Apply to a project</option>{data.projects.filter((project) => project.status === "active" && !project.archived_at).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><button className="button-base button-primary" type="submit">Apply</button></form></div></article>; })}{data.checklistTemplates.length === 0 && <p className="empty-state">Save a reusable plan only when you expect to use it again.</p>}</div></section>;
}

function ProjectChecklist({ projectId, data, onCommand }: { projectId: string; data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
  const notify = useToast();
  const instances = data.checklistInstances.filter((instance) => instance.project_id === projectId);
  async function toggle(itemId: string, isOpen: boolean) {
    try { await onCommand({ action: isOpen ? "complete_checklist_item" : "reopen_checklist_item", itemId }); notify(isOpen ? "Checklist item completed." : "Checklist item reopened.", "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not update that checklist item.", "error"); }
  }
  return <div className="project-milestones">{instances.map((instance) => <div className="mt-3" key={instance.id}><p className="record-meta">Template snapshot · version {instance.template_version}</p>{data.checklistItems.filter((item) => item.instance_id === instance.id).map((item) => <div className="compact-row" key={item.id}><span>{item.title}</span><button className="button-base button-quiet" onClick={() => toggle(item.id, item.status === "open")}>{item.status === "open" ? "Complete" : "Reopen"}</button></div>)}</div>)}</div>;
}

function ProjectActivity({ projectId, data }: { projectId: string; data: WorkspaceData }) {
  const events = data.projectActivity.filter((event) => event.entity_id === projectId);
  if (events.length === 0) return null;
  return <details className="project-activity mt-3"><summary className="record-meta">Activity history ({events.length})</summary><div className="mt-2 space-y-1">{events.map((event) => <div className="compact-row" key={event.id}><span>{activityEventLabel(event.event_type)}</span><span className="tag">{new Date(event.occurred_at).toLocaleString()}</span></div>)}</div></details>;
}

function ProjectList({ projects, data, onCommand }: { projects: WorkspaceData["projects"]; data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
  const notify = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  async function act(command: Record<string, unknown>, success: string) {
    try { await onCommand(command); notify(success, "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not update that project.", "error"); }
  }
  return <div className="space-y-4">{projects.map((project) => {
    const domain = project.domain_id ? data.domains.find((item) => item.id === project.domain_id) : undefined;
    const person = project.person_id ? data.people.find((item) => item.id === project.person_id) : undefined;
    const milestones = data.milestones.filter((milestone) => milestone.project_id === project.id);
    const completed = milestones.filter((milestone) => milestone.status === "completed").length;
    const editMenuActions: MenuAction[] = [{ label: "Edit", onClick: () => setEditingId(project.id) }, { label: "Delete", onClick: () => act({ action: "delete_project", projectId: project.id }, "Project deleted."), tone: "danger" }];
    const activeMenuActions: MenuAction[] = [{ label: "Edit", onClick: () => setEditingId(project.id) }, { label: "Cancel", onClick: () => act({ action: "cancel_project", projectId: project.id }, "Project canceled.") }, { label: "Delete", onClick: () => act({ action: "delete_project", projectId: project.id }, "Project deleted."), tone: "danger" }];
    return <article className="project-card" key={project.id}><div className={`record-card${domain ? " record-card--domain" : ""}`} style={domain ? ({ "--domain-color": domain.color } as CSSProperties) : undefined}><div><h3>{project.name}</h3>{project.description && <p className="record-copy">{project.description}</p>}<p className="record-meta">{project.target_on ? `Target ${project.target_on}` : "No target date"} · {milestones.length ? `${completed}/${milestones.length} milestones complete` : "No milestones yet"}</p>{(domain || person) && <p className="record-meta flex flex-wrap items-center gap-2">{domain && <span><i className="domain-dot" style={{ background: domain.color }} />{domain.name}</span>}{person && <span>{person.name}</span>}</p>}</div><div className="record-actions"><span className="tag capitalize">{project.status}</span>{project.archived_at ? <button className="button-base button-primary" onClick={() => act({ action: "restore_project", projectId: project.id }, "Project restored.")}>Restore</button> : project.status === "active" ? <><button className="button-base button-secondary" onClick={() => act({ action: "record_project_progress", projectId: project.id }, "Progress recorded.")}>Mark progress</button><button className="button-base button-quiet" onClick={() => act({ action: "pause_project", projectId: project.id }, "Project paused.")}>Pause</button><button className="button-base button-primary" onClick={() => act({ action: "complete_project", projectId: project.id }, "Project completed.")}>Complete project</button><ActionsMenu actions={activeMenuActions} /></> : project.status === "paused" ? <><button className="button-base button-primary" onClick={() => act({ action: "resume_project", projectId: project.id }, "Project resumed.")}>Resume</button><ActionsMenu actions={activeMenuActions} /></> : <ActionsMenu actions={editMenuActions} />}</div></div>{editingId === project.id && <Dialog title="Edit project" size="lg" onClose={() => setEditingId(null)}><ProjectEditForm project={project} data={data} onCommand={onCommand} onDone={() => setEditingId(null)} /></Dialog>}<div className="project-milestones"><form className="inline-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; act({ action: "create_milestone", projectId: project.id, title: formValue(form, "title") }, "Milestone added.").then(() => form.reset()); }}><input type="hidden" name="projectId" value={project.id} /><label className="sr-only" htmlFor={`milestone-${project.id}`}>New milestone</label><input className="field-base" id={`milestone-${project.id}`} name="title" required maxLength={280} placeholder="Add a checkpoint" /><button className="button-base button-secondary" type="submit">Add milestone</button></form>{milestones.map((milestone) => <div className="compact-row" key={milestone.id}><span>{milestone.title}</span><span className="compact-row-actions"><button className="button-base button-quiet" onClick={() => act({ action: milestone.status === "open" ? "complete_milestone" : "reopen_milestone", milestoneId: milestone.id }, milestone.status === "open" ? "Milestone completed." : "Milestone reopened.")}>{milestone.status === "open" ? "Complete" : "Reopen"}</button><button className="button-base button-quiet" onClick={() => act({ action: "delete_milestone", milestoneId: milestone.id }, "Milestone deleted.")}>Delete</button></span></div>)}</div><ProjectChecklist projectId={project.id} data={data} onCommand={onCommand} /><ProjectActivity projectId={project.id} data={data} /></article>;
  })}{projects.length === 0 && <p className="empty-state">Projects appear here when an outcome needs more than one action.</p>}</div>;
}

function RetainerEditForm({ retainer, data, onCommand, onDone }: { retainer: WorkspaceData["retainers"][number]; data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void>; onDone: () => void }) {
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

function NewRetainerForm({ data, onCommand }: { data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
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
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save that retainer.", "error");
    } finally {
      setBusy(false);
    }
  }
  return <form className="form-grid" onSubmit={submit}><label className="field-label form-span"><span>Retainer</span><input className="field-base" name="name" required maxLength={160} placeholder="Rivera Studio monthly retainer" /></label><label className="field-label"><span>Timezone</span><input className="field-base" name="timezone" maxLength={100} placeholder={Intl.DateTimeFormat().resolvedOptions().timeZone} /></label><label className="field-label"><span>Cycle day of month</span><input className="field-base" type="number" name="cycleDay" min={1} max={31} required defaultValue={1} /></label><DomainSelect domains={data.domains} /><PersonSelect people={data.people} name="clientPersonId" /><button className="button-base button-primary form-submit" type="submit" disabled={busy}>{busy ? "Creating…" : "Create retainer"}</button></form>;
}

function RetainerTemplateItemRow({ item, onCommand }: { item: WorkspaceData["retainerTemplateItems"][number]; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await onCommand({ action: "update_retainer_template_item", itemId: item.id, title: formValue(form, "title"), expectedDay: formValue(form, "expectedDay"), scope: formValue(form, "scope") });
      notify("Deliverable updated.", "success");
      setEditing(false);
    } catch (error) { notify(error instanceof Error ? error.message : "Could not update that deliverable.", "error"); }
  }
  async function remove() {
    try { await onCommand({ action: "delete_retainer_template_item", itemId: item.id }); notify("Deliverable removed.", "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not remove that deliverable.", "error"); }
  }
  if (editing) return <form className="inline-form" onSubmit={submit}>
    <label className="sr-only" htmlFor={`edit-retainer-item-${item.id}`}>Deliverable title</label>
    <input className="field-base" id={`edit-retainer-item-${item.id}`} name="title" required maxLength={280} defaultValue={item.title} />
    <label className="sr-only" htmlFor={`edit-retainer-item-day-${item.id}`}>Expected day of month</label>
    <input className="field-base" id={`edit-retainer-item-day-${item.id}`} type="number" name="expectedDay" min={1} max={31} required defaultValue={item.expected_day} />
    <select className="field-base" name="scope" defaultValue="future" aria-label="Apply this change to">
      <option value="future">Future cycles only</option>
      <option value="current">Current cycle only</option>
      <option value="both">Current and future cycles</option>
    </select>
    <button className="button-base button-primary" type="submit">Save</button>
    <button className="button-base button-quiet" type="button" onClick={() => setEditing(false)}>Cancel</button>
  </form>;
  return <div className="compact-row"><span>{item.title} <span className="record-meta">· day {item.expected_day} · v{item.version}</span></span><span className="compact-row-actions"><button className="button-base button-quiet" onClick={() => setEditing(true)}>Edit</button><button className="button-base button-quiet" onClick={remove}>Delete</button></span></div>;
}

function RetainerCycleItemRow({ item, sourceCycleStart, onCommand }: { item: WorkspaceData["retainerCycleItems"][number]; sourceCycleStart: string | undefined; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
  const notify = useToast();
  async function act(action: string, success: string) {
    try { await onCommand({ action, itemId: item.id }); notify(success, "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not update that deliverable.", "error"); }
  }
  return <li id={`retainer-cycle-item-${item.id}`} className="flex flex-wrap items-center justify-between gap-2 text-sm">
    <span>{item.title}{item.carried_from_item_id && sourceCycleStart && <a className="ml-2 text-xs font-semibold text-[var(--accent)] underline" href={`#retainer-cycle-item-${item.carried_from_item_id}`}>Carried from {sourceCycleStart}</a>}{item.excluded_from_carry_forward && item.status === "open" && <span className="tag ml-2">Left in this cycle</span>}</span>
    <span className="flex items-center gap-2">
      <span className={`tag${item.status === "open" ? " tag--attention" : ""}`}>{item.status}</span>
      {item.status === "open" && <>
        <button className="button-base button-quiet" onClick={() => act("complete_retainer_cycle_item", "Deliverable completed.")}>Complete</button>
        <button className="button-base button-quiet" onClick={() => act("close_retainer_cycle_item", "Deliverable closed.")}>Close</button>
        {!item.excluded_from_carry_forward && <button className="button-base button-quiet" onClick={() => act("leave_retainer_cycle_item_in_prior_cycle", "Left in its prior cycle.")}>Leave in prior cycle</button>}
      </>}
      {item.status === "completed" && <button className="button-base button-quiet" onClick={() => act("reopen_retainer_cycle_item", "Deliverable reopened.")}>Reopen</button>}
    </span>
  </li>;
}

function RetainerCycles({ retainer, data, onCommand }: { retainer: WorkspaceData["retainers"][number]; data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void> }) {
  const notify = useToast();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [busy, setBusy] = useState(false);
  const cycles = data.retainerCycles.filter((cycle) => cycle.retainer_id === retainer.id);
  const cycleStartById = new Map(cycles.map((cycle) => [cycle.id, cycle.cycle_start]));
  const itemCycleStartByItemId = new Map(data.retainerCycleItems.filter((item) => cycles.some((cycle) => cycle.id === item.cycle_id)).map((item) => [item.id, cycleStartById.get(item.cycle_id)]));
  async function generate(cycleMonth: string) {
    setBusy(true);
    try {
      await onCommand({ action: "generate_retainer_cycle", retainerId: retainer.id, cycleMonth, idempotencyKey: crypto.randomUUID() });
      notify("Cycle generated.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not generate that cycle.", "error");
    } finally {
      setBusy(false);
    }
  }
  return <div className="mt-3">
    <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(0,1fr)_auto_auto]">
      <label className="sr-only" htmlFor={`retainer-cycle-month-${retainer.id}`}>Cycle month</label>
      <input className="field-base min-w-0" id={`retainer-cycle-month-${retainer.id}`} type="month" value={month} onChange={(event) => setMonth(event.target.value)} />
      <button className="button-base button-secondary" disabled={busy || retainer.status !== "active"} onClick={() => generate(month)}>Generate selected</button>
      <button className="button-base button-secondary" disabled={busy || retainer.status !== "active"} onClick={() => generate(nextCycleMonth(month))}>Generate next</button>
    </div>
    {retainer.status !== "active" && <p className="form-help mt-1">Only an active retainer can generate a new cycle.</p>}
    {cycles.length > 0 && <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-3">
      <p className="text-sm font-semibold">Cycle history</p>
      {cycles.map((cycle) => <section id={`retainer-cycle-${cycle.id}`} className="rounded-[var(--r-md)] bg-[var(--surface-sunken)] p-3" key={cycle.id}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">{cycle.cycle_start} to {cycle.cycle_end}</p>
          {cycle.generation_status !== "complete" && <div className="flex items-center gap-2">
            <span className="tag tag--attention">{cycle.generation_status}</span>
            <button className="button-base button-quiet" disabled={busy} onClick={() => generate(cycle.cycle_start.slice(0, 7))}>Retry generation</button>
          </div>}
        </div>
        <ul className="mt-2 space-y-2">{data.retainerCycleItems.filter((item) => item.cycle_id === cycle.id).map((item) => (
          <RetainerCycleItemRow item={item} sourceCycleStart={item.carried_from_item_id ? itemCycleStartByItemId.get(item.carried_from_item_id) : undefined} onCommand={onCommand} key={item.id} />
        ))}</ul>
      </section>)}
    </div>}
    {cycles.length === 0 && <p className="empty-state mt-3">No cycles generated yet.</p>}
  </div>;
}

function RetainerActivity({ retainerId, data }: { retainerId: string; data: WorkspaceData }) {
  const events = data.retainerActivity.filter((event) => event.entity_id === retainerId);
  if (events.length === 0) return null;
  return <details className="project-activity mt-3"><summary className="record-meta">Activity history ({events.length})</summary><div className="mt-2 space-y-1">{events.map((event) => <div className="compact-row" key={event.id}><span>{retainerActivityEventLabel(event.event_type)}</span><span className="tag">{new Date(event.occurred_at).toLocaleString()}</span></div>)}</div></details>;
}

function EndRetainerControl({ retainer, onCommand, onDone }: { retainer: WorkspaceData["retainers"][number]; onCommand: (command: Record<string, unknown>) => Promise<void>; onDone: () => void }) {
  const notify = useToast();
  async function end(openItemResolution: "leave_open" | "close_all") {
    try { await onCommand({ action: "end_retainer", retainerId: retainer.id, openItemResolution }); notify("Retainer ended.", "success"); onDone(); } catch (error) { notify(error instanceof Error ? error.message : "Could not end that retainer.", "error"); }
  }
  return <span className="inline-form"><button className="button-base button-danger" onClick={() => end("leave_open")}>End, leave open work as-is</button><button className="button-base button-danger" onClick={() => end("close_all")}>End, close all open work</button><button className="button-base button-quiet" onClick={onDone}>Cancel</button></span>;
}

function RetainerList({ retainers, data, onCommand, onCheckSlipping }: { retainers: WorkspaceData["retainers"]; data: WorkspaceData; onCommand: (command: Record<string, unknown>) => Promise<void>; onCheckSlipping: (retainerId: string) => Promise<void> }) {
  const notify = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);
  async function act(command: Record<string, unknown>, success: string) {
    try { await onCommand(command); notify(success, "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not update that retainer.", "error"); }
  }
  async function checkSlipping(retainerId: string) {
    try { await onCheckSlipping(retainerId); notify("Slipping checked.", "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not check Slipping.", "error"); }
  }
  return <div className="space-y-4">{retainers.map((retainer) => {
    const domain = retainer.domain_id ? data.domains.find((item) => item.id === retainer.domain_id) : undefined;
    const client = retainer.client_person_id ? data.people.find((item) => item.id === retainer.client_person_id) : undefined;
    const items = data.retainerTemplateItems.filter((item) => item.retainer_id === retainer.id);
    const editMenuActions: MenuAction[] = [{ label: "Edit", onClick: () => setEditingId(retainer.id) }, { label: "Delete", onClick: () => act({ action: "delete_retainer", retainerId: retainer.id }, "Retainer deleted."), tone: "danger" }];
    return <article className="project-card" key={retainer.id}>
      <div className={`record-card${domain ? " record-card--domain" : ""}`} style={domain ? ({ "--domain-color": domain.color } as CSSProperties) : undefined}>
        <div><h3>{retainer.name}</h3><p className="record-meta">Monthly on day {retainer.cycle_day} · {retainer.timezone}</p>{(domain || client) && <p className="record-meta flex flex-wrap items-center gap-2">{domain && <span><i className="domain-dot" style={{ background: domain.color }} />{domain.name}</span>}{client && <span>{client.name}</span>}</p>}</div>
        <div className="record-actions">
          <span className="tag capitalize">{retainer.status}</span>
          {retainer.archived_at ? <button className="button-base button-primary" onClick={() => act({ action: "restore_retainer", retainerId: retainer.id }, "Retainer restored.")}>Restore</button> : retainer.status === "active" ? <><button className="button-base button-secondary" onClick={() => checkSlipping(retainer.id)}>Check Slipping</button><button className="button-base button-quiet" onClick={() => act({ action: "pause_retainer", retainerId: retainer.id }, "Retainer paused.")}>Pause</button><button className="button-base button-secondary" onClick={() => setEndingId(endingId === retainer.id ? null : retainer.id)}>End retainer</button><ActionsMenu actions={editMenuActions} /></> : retainer.status === "paused" ? <><button className="button-base button-primary" onClick={() => act({ action: "resume_retainer", retainerId: retainer.id }, "Retainer resumed.")}>Resume</button><button className="button-base button-secondary" onClick={() => setEndingId(endingId === retainer.id ? null : retainer.id)}>End retainer</button><ActionsMenu actions={editMenuActions} /></> : <ActionsMenu actions={editMenuActions} />}
        </div>
      </div>
      {endingId === retainer.id && <div className="mt-3"><EndRetainerControl retainer={retainer} onCommand={onCommand} onDone={() => setEndingId(null)} /></div>}
      {editingId === retainer.id && <Dialog title="Edit retainer" size="lg" onClose={() => setEditingId(null)}><RetainerEditForm retainer={retainer} data={data} onCommand={onCommand} onDone={() => setEditingId(null)} /></Dialog>}
      <div className="project-milestones">
        <p className="text-sm font-semibold">Deliverables</p>
        <form className="inline-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; act({ action: "create_retainer_template_item", retainerId: retainer.id, title: formValue(form, "title"), expectedDay: formValue(form, "expectedDay") }, "Deliverable added.").then(() => form.reset()); }}>
          <label className="sr-only" htmlFor={`retainer-item-title-${retainer.id}`}>New deliverable</label>
          <input className="field-base" id={`retainer-item-title-${retainer.id}`} name="title" required maxLength={280} placeholder="Monthly analytics" />
          <label className="sr-only" htmlFor={`retainer-item-day-${retainer.id}`}>Expected day of month</label>
          <input className="field-base" id={`retainer-item-day-${retainer.id}`} type="number" name="expectedDay" min={1} max={31} required defaultValue={15} />
          <button className="button-base button-secondary" type="submit">Add deliverable</button>
        </form>
        {items.map((item) => <RetainerTemplateItemRow item={item} onCommand={onCommand} key={item.id} />)}
        {items.length === 0 && <p className="record-meta mt-2">Add at least one deliverable before generating a cycle.</p>}
      </div>
      <RetainerCycles retainer={retainer} data={data} onCommand={onCommand} />
      <RetainerActivity retainerId={retainer.id} data={data} />
    </article>;
  })}{retainers.length === 0 && <p className="empty-state">Retainers appear here for ongoing monthly engagements, distinct from a finite project.</p>}</div>;
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

function FilterSelect({ label, value, onChange, active, children }: { label: string; value: string; onChange: (value: string) => void; active: boolean; children: ReactNode }) {
  return <label className={active ? "filter-select is-active" : "filter-select"}><span className="filter-select-label">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select><CaretDown aria-hidden size={11} weight="bold" /></label>;
}

function TaskFilters({ data, filters, onChange }: { data: WorkspaceData; filters: TaskFilterState; onChange: (next: TaskFilterState) => void }) {
  function set<K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]) {
    onChange({ ...filters, [key]: value });
  }
  const isDefault = JSON.stringify(filters) === JSON.stringify(defaultTaskFilters);
  return <div className="task-filter-bar" role="group" aria-label="Filter and sort tasks">
    <FilterSelect label="Status" value={filters.status} active={filters.status !== defaultTaskFilters.status} onChange={(value) => set("status", value as TaskFilterState["status"])}><option value="open">Open</option><option value="completed">Completed</option><option value="canceled">Canceled</option><option value="deleted">Deleted</option><option value="any">Any status</option></FilterSelect>
    <FilterSelect label="Date" value={filters.hasDate} active={filters.hasDate !== defaultTaskFilters.hasDate} onChange={(value) => set("hasDate", value as TaskFilterState["hasDate"])}><option value="any">Any date</option><option value="has">Has a date</option><option value="none">No date</option></FilterSelect>
    <FilterSelect label="Priority" value={filters.priority} active={filters.priority !== defaultTaskFilters.priority} onChange={(value) => set("priority", value as TaskFilterState["priority"])}><option value="any">Any priority</option><option value="1">Low</option><option value="2">Normal</option><option value="3">High</option></FilterSelect>
    <FilterSelect label="Domain" value={filters.domainId} active={filters.domainId !== ""} onChange={(value) => set("domainId", value)}><option value="">Any domain</option>{data.domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}</FilterSelect>
    <FilterSelect label="Project" value={filters.projectId} active={filters.projectId !== ""} onChange={(value) => set("projectId", value)}><option value="">Any project</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</FilterSelect>
    <FilterSelect label="Person" value={filters.personId} active={filters.personId !== ""} onChange={(value) => set("personId", value)}><option value="">Any person</option>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</FilterSelect>
    <FilterSelect label="Slipping" value={filters.slipping} active={filters.slipping !== defaultTaskFilters.slipping} onChange={(value) => set("slipping", value as TaskFilterState["slipping"])}><option value="any">Any</option><option value="only">Slipping only</option></FilterSelect>
    <span className="task-filter-sort-group"><span className="task-filter-divider" aria-hidden="true" /><FilterSelect label="Sort by" value={filters.sort} active={filters.sort !== defaultTaskFilters.sort} onChange={(value) => set("sort", value as TaskFilterState["sort"])}><option value="created">Newest first</option><option value="date">Due or scheduled date</option><option value="priority">Priority</option></FilterSelect></span>
    {!isDefault && <button className="task-filter-reset" type="button" onClick={() => onChange(defaultTaskFilters)}><ArrowCounterClockwise aria-hidden size={13} weight="bold" />Reset</button>}
  </div>;
}

const TASK_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function calendarLabel(day: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
}

function TaskOverview({ tasks, today }: { tasks: WorkspaceData["tasks"]; today: string }) {
  const dueToday = tasks.filter((task) => isTaskOnDay(task, today)).length;
  const overdue = tasks.filter((task) => {
    const date = taskPlanningDate(task);
    return Boolean(date && date < today);
  }).length;
  const unscheduled = tasks.filter((task) => !taskPlanningDate(task)).length;
  return <dl className="task-overview" aria-label="Open task overview">
    <div><dt>Open</dt><dd>{tasks.length}</dd></div>
    <div><dt>Today</dt><dd>{dueToday}</dd></div>
    <div className={overdue ? "has-attention" : undefined}><dt>Past date</dt><dd>{overdue}</dd></div>
    <div><dt>Unscheduled</dt><dd>{unscheduled}</dd></div>
  </dl>;
}

function TaskPlanner({ tasks, onCommand, today, data, showTopThree }: { tasks: WorkspaceData["tasks"]; onCommand: (command: Record<string, unknown>) => Promise<void>; today: string; data: WorkspaceData; showTopThree: boolean }) {
  const [month, setMonth] = useState(`${today.slice(0, 7)}-01`);
  const [selectedDay, setSelectedDay] = useState(today);
  const days = calendarMonthGrid(month);
  const datedTasks = tasks.filter((task) => taskPlanningDate(task));
  const selectedTasks = datedTasks.filter((task) => taskPlanningDate(task) === selectedDay);
  const unscheduledTasks = tasks.filter((task) => !taskPlanningDate(task));
  const monthName = calendarLabel(month, { month: "long", year: "numeric" });
  const selectedLabel = selectedDay === today ? `Today, ${calendarLabel(selectedDay, { weekday: "long", month: "long", day: "numeric" })}` : calendarLabel(selectedDay, { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  function chooseDay(day: string) {
    setSelectedDay(day);
    if (day.slice(0, 7) !== month.slice(0, 7)) setMonth(`${day.slice(0, 7)}-01`);
  }

  function moveMonth(amount: number) {
    const next = shiftCalendarMonth(month, amount);
    setMonth(next);
    setSelectedDay(next);
  }

  function returnToToday() {
    setMonth(`${today.slice(0, 7)}-01`);
    setSelectedDay(today);
  }

  return <div className="task-planner">
    <section className="task-calendar" aria-label="Task calendar">
      <div className="task-calendar-head">
        <div><h2>{monthName}</h2><p>Choose a day to inspect its work.</p></div>
        <div className="task-calendar-actions">
          {month.slice(0, 7) !== today.slice(0, 7) && <button className="button-base button-quiet" type="button" onClick={returnToToday}>Today</button>}
          <button className="button-base button-quiet task-calendar-arrow" type="button" aria-label="Previous month" onClick={() => moveMonth(-1)}><CaretLeft aria-hidden size={16} weight="bold" /></button>
          <button className="button-base button-quiet task-calendar-arrow" type="button" aria-label="Next month" onClick={() => moveMonth(1)}><CaretRight aria-hidden size={16} weight="bold" /></button>
        </div>
      </div>
      <div className="task-calendar-weekdays" aria-hidden="true">{TASK_WEEKDAYS.map((weekday) => <span key={weekday}>{weekday}</span>)}</div>
      <div className="task-calendar-grid">{days.map((day) => {
        const count = datedTasks.filter((task) => taskPlanningDate(task) === day).length;
        const hasEarlierOpenWork = day < today && tasks.some((task) => task.status === "open" && taskPlanningDate(task) === day);
        const isCurrentMonth = day.slice(0, 7) === month.slice(0, 7);
        const className = ["task-calendar-day", day === selectedDay && "is-selected", day === today && "is-today", !isCurrentMonth && "is-outside", hasEarlierOpenWork && "has-earlier-work"].filter(Boolean).join(" ");
        const dayLabel = calendarLabel(day, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
        return <button className={className} type="button" key={day} aria-label={`${dayLabel}${count ? `, ${count} ${count === 1 ? "task" : "tasks"}` : ", no tasks"}`} aria-pressed={day === selectedDay} onClick={() => chooseDay(day)}><time dateTime={day}>{Number(day.slice(-2))}</time>{count > 0 && <span>{count}</span>}</button>;
      })}</div>
      <p className="task-calendar-note">Counts use a task&apos;s deferred date first, then due date, then scheduled date.</p>
    </section>

    <section className="task-agenda" aria-labelledby="selected-task-day">
      <div className="task-agenda-head"><div><h2 id="selected-task-day">{selectedLabel}</h2><p>{selectedTasks.length ? `${selectedTasks.length} ${selectedTasks.length === 1 ? "task" : "tasks"} on this day` : "No dated work on this day"}</p></div><span className="task-count">{selectedTasks.length}</span></div>
      <TaskList tasks={selectedTasks} onCommand={onCommand} today={today} data={data} showTopThree={showTopThree} emptyText="No tasks on this day. Pick another date or open Unscheduled." />
      <details className="task-unscheduled">
        <summary><span><Tray aria-hidden size={17} />Unscheduled</span><span>{unscheduledTasks.length}</span></summary>
        <p>Tasks without a date stay visible here until you decide when they belong.</p>
        <TaskList tasks={unscheduledTasks} onCommand={onCommand} today={today} data={data} showTopThree={showTopThree} emptyText="Every task in this view has a date." />
      </details>
    </section>
  </div>;
}

type ProjectFilterState = { status: "current" | "completed" | "canceled" | "deleted" | "any" };

const defaultProjectFilters: ProjectFilterState = { status: "current" };

function filterProjects(projects: WorkspaceData["projects"], filters: ProjectFilterState) {
  return projects.filter((project) => {
    if (filters.status === "current") return !project.archived_at && ["planned", "active", "paused"].includes(project.status);
    if (filters.status === "completed") return !project.archived_at && project.status === "completed";
    if (filters.status === "canceled") return !project.archived_at && project.status === "canceled";
    if (filters.status === "deleted") return Boolean(project.archived_at);
    return true;
  });
}

function ProjectFilters({ filters, onChange }: { filters: ProjectFilterState; onChange: (next: ProjectFilterState) => void }) {
  const isDefault = filters.status === defaultProjectFilters.status;
  return <div className="task-filter-bar" role="group" aria-label="Filter projects">
    <FilterSelect label="Status" value={filters.status} active={!isDefault} onChange={(value) => onChange({ status: value as ProjectFilterState["status"] })}><option value="current">Current work</option><option value="completed">Completed</option><option value="canceled">Canceled</option><option value="deleted">Deleted</option><option value="any">Any status</option></FilterSelect>
    {!isDefault && <button className="task-filter-reset" type="button" onClick={() => onChange(defaultProjectFilters)}><ArrowCounterClockwise aria-hidden size={13} weight="bold" />Reset</button>}
  </div>;
}

type RetainerFilterState = { status: "current" | "ended" | "deleted" | "any" };

const defaultRetainerFilters: RetainerFilterState = { status: "current" };

function filterRetainers(retainers: WorkspaceData["retainers"], filters: RetainerFilterState) {
  return retainers.filter((retainer) => {
    if (filters.status === "current") return !retainer.archived_at && (retainer.status === "active" || retainer.status === "paused");
    if (filters.status === "ended") return !retainer.archived_at && retainer.status === "ended";
    if (filters.status === "deleted") return Boolean(retainer.archived_at);
    return true;
  });
}

function RetainerFilters({ filters, onChange }: { filters: RetainerFilterState; onChange: (next: RetainerFilterState) => void }) {
  const isDefault = filters.status === defaultRetainerFilters.status;
  return <div className="task-filter-bar" role="group" aria-label="Filter retainers">
    <FilterSelect label="Status" value={filters.status} active={!isDefault} onChange={(value) => onChange({ status: value as RetainerFilterState["status"] })}><option value="current">Current (active or paused)</option><option value="ended">Ended</option><option value="deleted">Deleted</option><option value="any">Any status</option></FilterSelect>
    {!isDefault && <button className="task-filter-reset" type="button" onClick={() => onChange(defaultRetainerFilters)}><ArrowCounterClockwise aria-hidden size={13} weight="bold" />Reset</button>}
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
  async function resolveSignal(signalId: string, outcome: "marked_attention" | "deferred" | "dismissed" | "cadence_changed", extra?: Record<string, unknown>, success = "Signal resolved.") {
    await safely(async () => {
      const response = await fetch(`/api/slipping/${signalId}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ outcome, ...extra }) });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Could not resolve that signal.");
      router.refresh();
    }, success);
  }
  async function checkRetainerSlipping(retainerId: string) {
    const response = await fetch("/api/slipping/evaluate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ retainerId }) });
    const payload: unknown = await response.json();
    if (!response.ok) throw new Error(typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Could not check Slipping.");
    router.refresh();
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
  const [taskView, setTaskView] = useState<"planner" | "list">("planner");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const [projectFilters, setProjectFilters] = useState<ProjectFilterState>(defaultProjectFilters);
  const [retainerFilters, setRetainerFilters] = useState<RetainerFilterState>(defaultRetainerFilters);
  const slippingTaskIds = new Set(data.signals.filter((signal) => signal.entity_type === "task").map((signal) => signal.entity_id));
  const filteredTasks = filterAndSortTasks(data.tasks, taskFilters, slippingTaskIds);
  const filteredProjects = filterProjects(data.projects, projectFilters);
  const filteredRetainers = filterRetainers(data.retainers, retainerFilters);

  if (surface === "today") return <main className="workspace-page"><header className="page-intro"><p className="eyebrow">Today · {today}</p><h1>Choose what matters, then let the rest wait.</h1><p>Local time: {data.timezone}. Slipwell never quietly carries yesterday’s priorities into today.</p></header><section className="workspace-section"><div className="section-heading"><div><h2>Top Three</h2><p className="section-note">Your selected priorities</p></div><span className="tag">{topThree.length}/3 selected</span></div><TaskList tasks={topThree} onCommand={command} today={today} data={data} /></section><section className="workspace-section"><div className="section-heading"><div><h2>On the day</h2><p className="section-note">Due, scheduled, or intentionally deferred</p></div></div><TaskList tasks={dueToday} onCommand={command} today={today} data={data} /></section><section className="workspace-section"><div className="section-heading"><div><h2>Routines</h2><p className="section-note">Separate from tasks</p></div></div><div className="space-y-3">{data.routines.map((routine) => { const resolved = routineById.get(routine.id); return <article className="record-card" key={routine.id}><div><h3>{routine.name}</h3><p className="record-meta capitalize">{routine.period} · {resolved ? resolved.outcome : "Not yet checked"}</p></div>{!resolved && <div className="record-actions"><button className="button-base button-primary" onClick={() => safely(() => command({ action: "resolve_routine", routineId: routine.id, localDate: today, outcome: "completed" }), "Routine completed.")}>Complete</button><button className="button-base button-secondary" onClick={() => safely(() => command({ action: "resolve_routine", routineId: routine.id, localDate: today, outcome: "skipped" }), "Routine skipped.")}>Skip</button></div>}</article>; })}{data.routines.length === 0 && <p className="empty-state">Add a routine from People & Notes when a repeated behavior belongs here, not in your task list.</p>}</div></section><NotesToReview notes={data.notes} today={today} /><section className="workspace-section"><div className="section-heading"><div><h2>Slipping</h2><p className="section-note">Attention signals</p></div><button className="button-base button-secondary" onClick={refreshAttention}>Refresh attention</button></div><div className="space-y-3">{data.signals.filter((signal) => signal.entity_type !== "retainer_cycle_item").map((signal) => <SlippingSignalCard key={signal.id} signal={signal} data={data} command={command} resolveSignal={resolveSignal} />)}{data.signals.filter((signal) => signal.entity_type !== "retainer_cycle_item").length === 0 && <p className="empty-state">No active task or project signals. Refresh attention to check meaningful activity against each cadence.</p>}</div></section><section className="workspace-section"><div className="section-heading"><div><h2>Capture recovery</h2><p className="section-note">Recent captures</p></div></div><div className="space-y-2">{data.captures.map((capture) => <article className="compact-row" key={capture.id}><span>{capture.original_text}</span><span className="tag">{capture.status.replace("_", " ")}</span></article>)}{data.captures.length === 0 && <p className="empty-state">Your captured thoughts will appear here.</p>}</div></section></main>;

  if (surface === "tasks") return <main className="workspace-page tasks-page">
    <header className="page-intro tasks-page-intro"><h1>Tasks</h1><p>See every commitment across time, then narrow the view when the list gets busy.</p></header>
    {newTaskOpen && <Dialog title="New task" size="lg" onClose={() => setNewTaskOpen(false)}><NewTaskForm data={data} onCommand={command} onCreated={() => setNewTaskOpen(false)} /></Dialog>}
    <section className="workspace-section tasks-workspace">
      <div className="tasks-toolbar">
        <div className="task-view-switch" role="group" aria-label="Task view">
          <button className={taskView === "planner" ? "is-active" : undefined} type="button" aria-pressed={taskView === "planner"} onClick={() => setTaskView("planner")}><CalendarBlank aria-hidden size={17} weight="bold" />Planner</button>
          <button className={taskView === "list" ? "is-active" : undefined} type="button" aria-pressed={taskView === "list"} onClick={() => setTaskView("list")}><ListBullets aria-hidden size={17} weight="bold" />List</button>
        </div>
        <button className="button-base button-primary tasks-new-task" type="button" onClick={() => setNewTaskOpen(true)}><Plus aria-hidden size={17} weight="bold" />New task</button>
      </div>
      <TaskOverview tasks={openTasks} today={today} />
      <div className="task-browse-head"><div><h2>{taskView === "planner" ? "Plan by date" : "All tasks"}</h2><p>{taskView === "planner" ? "Calendar counts reflect the active filters below." : "Filter and sort the complete task list."}</p></div><span>{filteredTasks.length} shown</span></div>
      <TaskFilters data={data} filters={taskFilters} onChange={setTaskFilters} />
      {taskView === "planner" ? <TaskPlanner tasks={filteredTasks} onCommand={command} today={today} data={data} showTopThree={taskFilters.status === "open" || taskFilters.status === "any"} /> : <div className="task-list-view"><TaskList tasks={filteredTasks} onCommand={command} today={today} data={data} showTopThree={taskFilters.status === "open" || taskFilters.status === "any"} /></div>}
    </section>
  </main>;

  if (surface === "work") return <main className="workspace-page"><header className="page-intro"><p className="eyebrow">Work</p><h1>Finite projects, durable domains.</h1><p>Projects have an ending. Domains provide ongoing context without demanding a complete taxonomy.</p></header><div className="workspace-columns"><section className="workspace-section"><h2>New domain</h2><form className="form-grid" onSubmit={(event) => submit(event, "create_domain", { name: "name", description: "description", color: "color" }, "Domain created.")}><label className="field-label form-span"><span>Name</span><input className="field-base" name="name" required maxLength={80} placeholder="Client work" /></label><label className="field-label form-span"><span>Description</span><input className="field-base" name="description" maxLength={1000} placeholder="Optional context" /></label><DomainColorPicker /><button className="button-base button-primary form-submit">Add domain</button></form><div className="mt-5 space-y-2">{data.domains.map((domain) => { const openTaskCount = data.tasks.filter((task) => task.domain_id === domain.id && task.status === "open" && !task.archived_at).length; const activeProjectCount = data.projects.filter((project) => project.domain_id === domain.id && ["planned", "active", "paused"].includes(project.status)).length; return <div className="compact-row" key={domain.id}><span><i className="domain-dot" style={{ background: domain.color }} />{domain.name}</span><span className="compact-row-actions"><span className="tag">{openTaskCount} open · {activeProjectCount} active</span><button className="button-base button-quiet" onClick={() => safely(() => command({ action: "archive_domain", domainId: domain.id }), "Domain archived.")}>Archive</button></span></div>; })}{data.domains.length === 0 && <p className="empty-state">A few domains are enough. You can also skip them.</p>}</div></section><section className="workspace-section"><h2>New project</h2><NewProjectForm data={data} onCommand={command} /></section></div><TemplateLibrary data={data} onCommand={command} /><section className="workspace-section"><div className="section-heading"><div><h2>Project progress</h2><p className="section-note">Inspect the plan, not a cosmetic percentage</p></div><span className="tag">{filteredProjects.length} shown</span></div><ProjectFilters filters={projectFilters} onChange={setProjectFilters} /><ProjectList projects={filteredProjects} data={data} onCommand={command} /></section></main>;

  if (surface === "retainers") return <main className="workspace-page"><header className="page-intro"><p className="eyebrow">Retainers</p><h1>Ongoing engagements, not projects with a finish line.</h1><p>Each cycle is a versioned, inspectable record. Incomplete work never silently disappears at rollover.</p></header><section className="workspace-section"><h2>New retainer</h2><NewRetainerForm data={data} onCommand={command} /></section><section className="workspace-section"><div className="section-heading"><div><h2>Retainers</h2><p className="section-note">Deliverables, cycles, and history</p></div><span className="tag">{filteredRetainers.length} shown</span></div><RetainerFilters filters={retainerFilters} onChange={setRetainerFilters} /><RetainerList retainers={filteredRetainers} data={data} onCommand={command} onCheckSlipping={checkRetainerSlipping} /></section></main>;

  if (surface === "people-notes") return <main className="workspace-page"><header className="page-intro"><p className="eyebrow">People & Notes</p><h1>Context without turning everything into a task.</h1><p>People and reflective notes remain lightweight, private records.</p></header><div className="workspace-columns"><section className="workspace-section"><h2>New person</h2><form className="form-grid" onSubmit={(event) => submit(event, "create_person", { name: "name", context: "context", domainId: "domainId" }, "Person added.")}><label className="field-label form-span"><span>Name</span><input className="field-base" name="name" required maxLength={160} placeholder="Priya from Rivera Studio" /></label><label className="field-label form-span"><span>Context</span><input className="field-base" name="context" maxLength={1000} placeholder="Client lead, collaborator, or someone important" /></label><DomainSelect domains={data.domains} /><button className="button-base button-primary form-submit">Add person</button></form><div className="mt-5 space-y-3">{data.people.map((person) => <article className="project-card" key={person.id}><div className="record-card"><div><h3>{person.name}</h3>{person.context && <p className="record-copy">{person.context}</p>}</div></div><PersonInteractions personId={person.id} data={data} onCommand={command} /></article>)}{data.people.length === 0 && <p className="empty-state">Add people when context helps, not as a CRM setup exercise.</p>}</div></section><section className="workspace-section"><h2>New note</h2><form className="form-grid" onSubmit={(event) => submit(event, "create_note", { title: "title", body: "body", domainId: "domainId", projectId: "projectId", personId: "personId", reviewOn: "reviewOn" }, "Note saved.")}><label className="field-label form-span"><span>Title</span><input className="field-base" name="title" required maxLength={280} placeholder="Rivera Studio call notes" /></label><label className="field-label form-span"><span>Note</span><textarea className="field-base min-h-32" name="body" maxLength={20000} placeholder="Keep the reflective content intact." /></label><DomainSelect domains={data.domains} /><label className="field-label"><span>Review on</span><input className="field-base" type="date" name="reviewOn" /></label><label className="field-label"><span>Project</span><select className="field-base" name="projectId" defaultValue=""><option value="">No project</option>{data.projects.filter((project) => !project.archived_at).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label><label className="field-label"><span>Person</span><select className="field-base" name="personId" defaultValue=""><option value="">No person</option>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label><button className="button-base button-primary form-submit">Save note</button></form><div className="mt-5 space-y-3">{data.notes.map((note) => <article className="record-card" key={note.id}><div><h3>{note.title}</h3>{note.body && <p className="record-copy whitespace-pre-wrap">{note.body}</p>}<p className="record-meta">{note.review_on ? `Review ${note.review_on}` : "No review date"}</p></div></article>)}{data.notes.length === 0 && <p className="empty-state">Notes preserve thinking even when no action follows.</p>}</div></section></div><section className="workspace-section"><h2>New routine</h2><form className="form-grid" onSubmit={(event) => submit(event, "create_routine", { name: "name", period: "period" }, "Routine added.")}><label className="field-label"><span>Routine</span><input className="field-base" name="name" required maxLength={160} placeholder="Plan the day" /></label><label className="field-label"><span>Time of day</span><select className="field-base" name="period" defaultValue="anytime"><option value="morning">Morning</option><option value="afternoon">Afternoon</option><option value="evening">Evening</option><option value="anytime">Anytime</option></select></label><button className="button-base button-secondary form-submit">Add routine</button></form></section></main>;

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
