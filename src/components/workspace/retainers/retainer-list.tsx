"use client";

import { type FormEvent, useState } from "react";
import type { CSSProperties } from "react";
import { nextCycleMonth } from "@/lib/retainers";
import { retainerActivityEventLabel, type WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/primitives";
import { ActionsMenu, type MenuAction } from "@/components/workspace/shared/actions-menu";
import { formValue } from "@/components/workspace/shared/form-utils";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";
import { RetainerEditForm } from "@/components/workspace/retainers/retainer-forms";

export function RetainerTemplateItemRow({
  item,
  onCommand,
}: {
  item: WorkspaceData["retainerTemplateItems"][number];
  onCommand: WorkspaceCommandFn;
}) {
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await onCommand({
        action: "update_retainer_template_item",
        itemId: item.id,
        title: formValue(form, "title"),
        expectedDay: formValue(form, "expectedDay"),
        scope: formValue(form, "scope"),
      });
      notify("Deliverable updated.", "success");
      setEditing(false);
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not update that deliverable.",
        "error",
      );
    }
  }
  async function remove() {
    try {
      await onCommand({ action: "delete_retainer_template_item", itemId: item.id });
      notify("Deliverable removed.", "success");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not remove that deliverable.",
        "error",
      );
    }
  }
  if (editing)
    return (
      <form className="inline-form" onSubmit={submit}>
        <label className="sr-only" htmlFor={`edit-retainer-item-${item.id}`}>
          Deliverable title
        </label>
        <input
          className="field-base"
          id={`edit-retainer-item-${item.id}`}
          name="title"
          required
          maxLength={280}
          defaultValue={item.title}
        />
        <label className="sr-only" htmlFor={`edit-retainer-item-day-${item.id}`}>
          Expected day of month
        </label>
        <input
          className="field-base"
          id={`edit-retainer-item-day-${item.id}`}
          type="number"
          name="expectedDay"
          min={1}
          max={31}
          required
          defaultValue={item.expected_day}
        />
        <select
          className="field-base"
          name="scope"
          defaultValue="future"
          aria-label="Apply this change to"
        >
          <option value="future">Future cycles only</option>
          <option value="current">Current cycle only</option>
          <option value="both">Current and future cycles</option>
        </select>
        <button className="button-base button-primary" type="submit">
          Save
        </button>
        <button
          className="button-base button-quiet"
          type="button"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </form>
    );
  return (
    <div className="compact-row">
      <span>
        {item.title}{" "}
        <span className="record-meta">
          · day {item.expected_day} · v{item.version}
        </span>
      </span>
      <span className="compact-row-actions">
        <button className="button-base button-quiet" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button className="button-base button-quiet" onClick={remove}>
          Delete
        </button>
      </span>
    </div>
  );
}

export function RetainerCycleItemRow({
  item,
  sourceCycleStart,
  onCommand,
}: {
  item: WorkspaceData["retainerCycleItems"][number];
  sourceCycleStart: string | undefined;
  onCommand: WorkspaceCommandFn;
}) {
  const notify = useToast();
  async function act(action: string, success: string) {
    try {
      await onCommand({ action, itemId: item.id });
      notify(success, "success");
    } catch (error) {
      notify(
        error instanceof Error ? error.message : "Could not update that deliverable.",
        "error",
      );
    }
  }
  return (
    <li
      id={`retainer-cycle-item-${item.id}`}
      className="flex flex-wrap items-center justify-between gap-2 text-sm"
    >
      <span>
        {item.title}
        {item.carried_from_item_id && sourceCycleStart && (
          <a
            className="ml-2 text-xs font-semibold text-[var(--accent)] underline"
            href={`#retainer-cycle-item-${item.carried_from_item_id}`}
          >
            Carried from {sourceCycleStart}
          </a>
        )}
        {item.excluded_from_carry_forward && item.status === "open" && (
          <span className="tag ml-2">Left in this cycle</span>
        )}
      </span>
      <span className="flex items-center gap-2">
        <span className={`tag${item.status === "open" ? " tag--attention" : ""}`}>
          {item.status}
        </span>
        {item.status === "open" && (
          <>
            <button
              className="button-base button-quiet"
              onClick={() => act("complete_retainer_cycle_item", "Deliverable completed.")}
            >
              Complete
            </button>
            <button
              className="button-base button-quiet"
              onClick={() => act("close_retainer_cycle_item", "Deliverable closed.")}
            >
              Close
            </button>
            {!item.excluded_from_carry_forward && (
              <button
                className="button-base button-quiet"
                onClick={() =>
                  act("leave_retainer_cycle_item_in_prior_cycle", "Left in its prior cycle.")
                }
              >
                Leave in prior cycle
              </button>
            )}
          </>
        )}
        {item.status === "completed" && (
          <button
            className="button-base button-quiet"
            onClick={() => act("reopen_retainer_cycle_item", "Deliverable reopened.")}
          >
            Reopen
          </button>
        )}
      </span>
    </li>
  );
}

export function RetainerCycles({
  retainer,
  data,
  onCommand,
}: {
  retainer: WorkspaceData["retainers"][number];
  data: WorkspaceData;
  onCommand: WorkspaceCommandFn;
}) {
  const notify = useToast();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [busy, setBusy] = useState(false);
  const cycles = data.retainerCycles.filter((cycle) => cycle.retainer_id === retainer.id);
  const cycleStartById = new Map(cycles.map((cycle) => [cycle.id, cycle.cycle_start]));
  const itemCycleStartByItemId = new Map(
    data.retainerCycleItems
      .filter((item) => cycles.some((cycle) => cycle.id === item.cycle_id))
      .map((item) => [item.id, cycleStartById.get(item.cycle_id)]),
  );
  async function generate(cycleMonth: string) {
    setBusy(true);
    try {
      await onCommand({
        action: "generate_retainer_cycle",
        retainerId: retainer.id,
        cycleMonth,
        idempotencyKey: crypto.randomUUID(),
      });
      notify("Cycle generated.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not generate that cycle.", "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-3">
      <div className="grid w-full gap-2 sm:w-auto sm:grid-cols-[minmax(0,1fr)_auto_auto]">
        <label className="sr-only" htmlFor={`retainer-cycle-month-${retainer.id}`}>
          Cycle month
        </label>
        <input
          className="field-base min-w-0"
          id={`retainer-cycle-month-${retainer.id}`}
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        />
        <button
          className="button-base button-secondary"
          disabled={busy || retainer.status !== "active"}
          onClick={() => generate(month)}
        >
          Generate selected
        </button>
        <button
          className="button-base button-secondary"
          disabled={busy || retainer.status !== "active"}
          onClick={() => generate(nextCycleMonth(month))}
        >
          Generate next
        </button>
      </div>
      {retainer.status !== "active" && (
        <p className="form-help mt-1">Only an active retainer can generate a new cycle.</p>
      )}
      {cycles.length > 0 && (
        <div className="mt-4 space-y-3 border-t border-[var(--line)] pt-3">
          <p className="text-sm font-semibold">Cycle history</p>
          {cycles.map((cycle) => (
            <section
              id={`retainer-cycle-${cycle.id}`}
              className="rounded-[var(--r-md)] bg-[var(--surface-sunken)] p-3"
              key={cycle.id}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium">
                  {cycle.cycle_start} to {cycle.cycle_end}
                </p>
                {cycle.generation_status !== "complete" && (
                  <div className="flex items-center gap-2">
                    <span className="tag tag--attention">{cycle.generation_status}</span>
                    <button
                      className="button-base button-quiet"
                      disabled={busy}
                      onClick={() => generate(cycle.cycle_start.slice(0, 7))}
                    >
                      Retry generation
                    </button>
                  </div>
                )}
              </div>
              <ul className="mt-2 space-y-2">
                {data.retainerCycleItems
                  .filter((item) => item.cycle_id === cycle.id)
                  .map((item) => (
                    <RetainerCycleItemRow
                      item={item}
                      sourceCycleStart={
                        item.carried_from_item_id
                          ? itemCycleStartByItemId.get(item.carried_from_item_id)
                          : undefined
                      }
                      onCommand={onCommand}
                      key={item.id}
                    />
                  ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {cycles.length === 0 && <p className="empty-state mt-3">No cycles generated yet.</p>}
    </div>
  );
}

export function RetainerActivity({
  retainerId,
  data,
}: {
  retainerId: string;
  data: WorkspaceData;
}) {
  const events = data.retainerActivity.filter((event) => event.entity_id === retainerId);
  if (events.length === 0) return null;
  return (
    <details className="project-activity mt-3">
      <summary className="record-meta">Activity history ({events.length})</summary>
      <div className="mt-2 space-y-1">
        {events.map((event) => (
          <div className="compact-row" key={event.id}>
            <span>{retainerActivityEventLabel(event.event_type)}</span>
            <span className="tag">{new Date(event.occurred_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </details>
  );
}

export function EndRetainerControl({
  retainer,
  onCommand,
  onDone,
}: {
  retainer: WorkspaceData["retainers"][number];
  onCommand: WorkspaceCommandFn;
  onDone: () => void;
}) {
  const notify = useToast();
  async function end(openItemResolution: "leave_open" | "close_all") {
    try {
      await onCommand({ action: "end_retainer", retainerId: retainer.id, openItemResolution });
      notify("Retainer ended.", "success");
      onDone();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not end that retainer.", "error");
    }
  }
  return (
    <span className="inline-form">
      <button className="button-base button-danger" onClick={() => end("leave_open")}>
        End, leave open work as-is
      </button>
      <button className="button-base button-danger" onClick={() => end("close_all")}>
        End, close all open work
      </button>
      <button className="button-base button-quiet" onClick={onDone}>
        Cancel
      </button>
    </span>
  );
}

export function RetainerList({
  retainers,
  data,
  onCommand,
  onCheckSlipping,
}: {
  retainers: WorkspaceData["retainers"];
  data: WorkspaceData;
  onCommand: WorkspaceCommandFn;
  onCheckSlipping: (retainerId: string) => Promise<void>;
}) {
  const notify = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);
  async function act(command: Record<string, unknown>, success: string) {
    try {
      await onCommand(command);
      notify(success, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update that retainer.", "error");
    }
  }
  async function checkSlipping(retainerId: string) {
    try {
      await onCheckSlipping(retainerId);
      notify("Slipping checked.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not check Slipping.", "error");
    }
  }
  return (
    <div className="space-y-4">
      {retainers.map((retainer) => {
        const domain = retainer.domain_id
          ? data.domains.find((item) => item.id === retainer.domain_id)
          : undefined;
        const client = retainer.client_person_id
          ? data.people.find((item) => item.id === retainer.client_person_id)
          : undefined;
        const items = data.retainerTemplateItems.filter((item) => item.retainer_id === retainer.id);
        const editMenuActions: MenuAction[] = [
          { label: "Edit", onClick: () => setEditingId(retainer.id) },
          {
            label: "Delete",
            onClick: () =>
              act({ action: "delete_retainer", retainerId: retainer.id }, "Retainer deleted."),
            tone: "danger",
          },
        ];
        return (
          <article className="project-card" key={retainer.id}>
            <div
              className={`record-card${domain ? " record-card--domain" : ""}`}
              style={domain ? ({ "--domain-color": domain.color } as CSSProperties) : undefined}
            >
              <div>
                <h3>{retainer.name}</h3>
                <p className="record-meta">
                  Monthly on day {retainer.cycle_day} · {retainer.timezone}
                </p>
                {(domain || client) && (
                  <p className="record-meta flex flex-wrap items-center gap-2">
                    {domain && (
                      <span>
                        <i className="domain-dot" style={{ background: domain.color }} />
                        {domain.name}
                      </span>
                    )}
                    {client && <span>{client.name}</span>}
                  </p>
                )}
              </div>
              <div className="record-actions">
                <span className="tag capitalize">{retainer.status}</span>
                {retainer.archived_at ? (
                  <button
                    className="button-base button-primary"
                    onClick={() =>
                      act(
                        { action: "restore_retainer", retainerId: retainer.id },
                        "Retainer restored.",
                      )
                    }
                  >
                    Restore
                  </button>
                ) : retainer.status === "active" ? (
                  <>
                    <button
                      className="button-base button-secondary"
                      onClick={() => checkSlipping(retainer.id)}
                    >
                      Check Slipping
                    </button>
                    <button
                      className="button-base button-quiet"
                      onClick={() =>
                        act(
                          { action: "pause_retainer", retainerId: retainer.id },
                          "Retainer paused.",
                        )
                      }
                    >
                      Pause
                    </button>
                    <button
                      className="button-base button-secondary"
                      onClick={() => setEndingId(endingId === retainer.id ? null : retainer.id)}
                    >
                      End retainer
                    </button>
                    <ActionsMenu actions={editMenuActions} />
                  </>
                ) : retainer.status === "paused" ? (
                  <>
                    <button
                      className="button-base button-primary"
                      onClick={() =>
                        act(
                          { action: "resume_retainer", retainerId: retainer.id },
                          "Retainer resumed.",
                        )
                      }
                    >
                      Resume
                    </button>
                    <button
                      className="button-base button-secondary"
                      onClick={() => setEndingId(endingId === retainer.id ? null : retainer.id)}
                    >
                      End retainer
                    </button>
                    <ActionsMenu actions={editMenuActions} />
                  </>
                ) : (
                  <ActionsMenu actions={editMenuActions} />
                )}
              </div>
            </div>
            {endingId === retainer.id && (
              <div className="mt-3">
                <EndRetainerControl
                  retainer={retainer}
                  onCommand={onCommand}
                  onDone={() => setEndingId(null)}
                />
              </div>
            )}
            {editingId === retainer.id ? (
              <Dialog open title="Edit retainer" size="lg" onClose={() => setEditingId(null)}>
                <RetainerEditForm
                  retainer={retainer}
                  data={data}
                  onCommand={onCommand}
                  onDone={() => setEditingId(null)}
                />
              </Dialog>
            ) : null}
            <div className="project-milestones">
              <p className="text-sm font-semibold">Deliverables</p>
              <form
                className="inline-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  const form = event.currentTarget;
                  act(
                    {
                      action: "create_retainer_template_item",
                      retainerId: retainer.id,
                      title: formValue(form, "title"),
                      expectedDay: formValue(form, "expectedDay"),
                    },
                    "Deliverable added.",
                  ).then(() => form.reset());
                }}
              >
                <label className="sr-only" htmlFor={`retainer-item-title-${retainer.id}`}>
                  New deliverable
                </label>
                <input
                  className="field-base"
                  id={`retainer-item-title-${retainer.id}`}
                  name="title"
                  required
                  maxLength={280}
                  placeholder="Monthly analytics"
                />
                <label className="sr-only" htmlFor={`retainer-item-day-${retainer.id}`}>
                  Expected day of month
                </label>
                <input
                  className="field-base"
                  id={`retainer-item-day-${retainer.id}`}
                  type="number"
                  name="expectedDay"
                  min={1}
                  max={31}
                  required
                  defaultValue={15}
                />
                <button className="button-base button-secondary" type="submit">
                  Add deliverable
                </button>
              </form>
              {items.map((item) => (
                <RetainerTemplateItemRow item={item} onCommand={onCommand} key={item.id} />
              ))}
              {items.length === 0 && (
                <p className="record-meta mt-2">
                  Add at least one deliverable before generating a cycle.
                </p>
              )}
            </div>
            <RetainerCycles retainer={retainer} data={data} onCommand={onCommand} />
            <RetainerActivity retainerId={retainer.id} data={data} />
          </article>
        );
      })}
      {retainers.length === 0 && (
        <p className="empty-state">
          Retainers appear here for ongoing monthly engagements, distinct from a finite project.
        </p>
      )}
    </div>
  );
}
