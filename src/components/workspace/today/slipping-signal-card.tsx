"use client";

import { type FormEvent, useRef, useState } from "react";
import type { WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { formValue } from "@/components/workspace/shared/form-utils";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";

export function SlippingSignalCard({
  signal,
  data,
  command,
  resolveSignal,
}: {
  signal: WorkspaceData["signals"][number];
  data: WorkspaceData;
  command: WorkspaceCommandFn;
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

  return <article className="record-card slipping-signal-enter"><div><span className="tag tag--attention">{signal.severity}</span><p className="record-copy">{signal.reason}</p></div><div className="record-actions"><button className="button-base button-primary" onClick={() => resolveSignal(signal.id, "marked_attention")}>Mark attention</button><button className="button-base button-secondary" onClick={() => resolveSignal(signal.id, "deferred")}>Defer</button><button className="button-base button-quiet" onClick={() => resolveSignal(signal.id, "dismissed")}>Dismiss</button></div><form className="inline-form" onSubmit={addNextAction}><label className="sr-only" htmlFor={`next-action-${signal.id}`}>Next action</label><input className="field-base" id={`next-action-${signal.id}`} name="title" placeholder="Add the next concrete action" disabled={busy} /><button className="button-base button-secondary" type="submit" disabled={busy}>{busy ? "Adding…" : "Add & mark attention"}</button></form><form className="inline-form" onSubmit={saveCadence}><label className="sr-only" htmlFor={`cadence-${signal.id}`}>Attention cadence (days)</label><input className="field-base" id={`cadence-${signal.id}`} type="number" name="cadenceDays" min={1} max={365} defaultValue={defaultCadence} /><button className="button-base button-secondary" type="submit">Save cadence</button></form>{(signal.entity_type === "task" || signal.entity_type === "project") && <button className="button-base button-quiet" onClick={pauseOrArchive}>{signal.entity_type === "task" ? "Archive" : "Pause"}</button>}</article>;
}
