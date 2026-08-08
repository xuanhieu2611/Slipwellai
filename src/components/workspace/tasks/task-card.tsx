"use client";

import { type CSSProperties, type ReactNode, useState } from "react";
import { Check } from "@phosphor-icons/react";
import { recurrenceLabel, taskDateLabel, type WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/primitives";
import { ActionsMenu, type MenuAction } from "@/components/workspace/shared/actions-menu";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";
import { DeferControl, TaskEditForm } from "@/components/workspace/tasks/task-forms";

export function TaskCard({
  task,
  onCommand,
  today,
  data,
  showTopThree = true,
  dragHandle,
}: {
  task: WorkspaceData["tasks"][number];
  onCommand: WorkspaceCommandFn;
  today: string;
  data: WorkspaceData;
  showTopThree?: boolean;
  dragHandle?: ReactNode;
}) {
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  const [deferring, setDeferring] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function act(command: Record<string, unknown>, success: string) {
    try {
      await onCommand(command);
      notify(success, "success");
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update that task.", "error");
      return false;
    }
  }

  async function completeTask() {
    if (confirming) return;
    setConfirming(true);
    const ok = await act({ action: "complete_task", taskId: task.id }, "Task completed.");
    if (!ok) setConfirming(false);
  }

  const domain = task.domain_id ? data.domains.find((item) => item.id === task.domain_id) : undefined;
  const project = task.project_id ? data.projects.find((item) => item.id === task.project_id) : undefined;
  const person = task.person_id ? data.people.find((item) => item.id === task.person_id) : undefined;
  const relatedNotes = data.notes
    .filter(
      (note) =>
        (task.domain_id && note.domain_id === task.domain_id) ||
        (task.project_id && note.project_id === task.project_id) ||
        (task.person_id && note.person_id === task.person_id),
    )
    .slice(0, 3);
  const openMenuActions: MenuAction[] = [
    ...(showTopThree
      ? [
          task.top_three_date === today
            ? { label: "Remove priority", onClick: () => act({ action: "clear_top_three", taskId: task.id }, "Removed from today’s priorities.") }
            : { label: "Make priority", onClick: () => act({ action: "set_top_three", taskId: task.id, localDate: today }, "Added to today’s priorities.") },
        ]
      : []),
    { label: "Edit", onClick: () => setEditing(true) },
    { label: "Cancel", onClick: () => act({ action: "cancel_task", taskId: task.id }, "Task canceled.") },
    { label: "Delete", onClick: () => act({ action: "delete_task", taskId: task.id }, "Task deleted."), tone: "danger" },
  ];
  const closedMenuActions: MenuAction[] = [
    { label: "Edit", onClick: () => setEditing(true) },
    { label: "Delete", onClick: () => act({ action: "delete_task", taskId: task.id }, "Task deleted."), tone: "danger" },
  ];

  return (
    <article
      className={`record-card${domain ? " record-card--domain" : ""}${confirming ? " is-completing" : ""}`}
      style={domain ? ({ "--domain-color": domain.color } as CSSProperties) : undefined}
    >
      {dragHandle}
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3>{task.title}</h3>
          {task.priority === 3 && <span className="tag tag--attention">High priority</span>}
          {task.recurrence_rule && <span className="tag">{recurrenceLabel(task)}</span>}
          {task.status === "canceled" && <span className="tag">Canceled</span>}
          {task.archived_at && <span className="tag">Deleted</span>}
        </div>
        {task.details && <p className="record-copy">{task.details}</p>}
        <p className="record-meta">{taskDateLabel(task)}</p>
        {(domain || project || person) && (
          <p className="record-meta flex flex-wrap items-center gap-2">
            {domain && (
              <span>
                <i className="domain-dot" style={{ background: domain.color }} />
                {domain.name}
              </span>
            )}
            {project && <span>{project.name}</span>}
            {person && <span>{person.name}</span>}
          </p>
        )}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map((tag) => (
              <span className="tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
        {relatedNotes.length > 0 && <p className="record-meta">Related notes: {relatedNotes.map((note) => note.title).join(", ")}</p>}
        {deferring && <DeferControl task={task} onCommand={onCommand} onDone={() => setDeferring(false)} />}
      </div>
      <div className="record-actions">
        {task.archived_at ? (
          <>
            <button className="button-base button-primary" onClick={() => act({ action: "restore_task", taskId: task.id }, "Task restored.")}>
              Restore
            </button>
            <ActionsMenu actions={[{ label: "Delete", onClick: () => act({ action: "delete_task", taskId: task.id }, "Task deleted."), tone: "danger" }]} />
          </>
        ) : task.status === "open" ? (
          <>
            <button className={`button-base button-primary${confirming ? " is-task-confirming" : ""}`} disabled={confirming} onClick={completeTask}>
              {confirming ? (
                <>
                  <Check aria-hidden className="task-complete-check" size={16} weight="bold" />
                  Done
                </>
              ) : (
                "Complete"
              )}
            </button>
            <button className="button-base button-secondary" onClick={() => setDeferring((value) => !value)}>
              Defer
            </button>
            <ActionsMenu actions={openMenuActions} />
          </>
        ) : (
          <>
            <button className="button-base button-secondary" onClick={() => act({ action: "reopen_task", taskId: task.id }, "Task reopened.")}>
              Reopen
            </button>
            <ActionsMenu actions={closedMenuActions} />
          </>
        )}
      </div>
      <Dialog open={editing} title="Edit task" size="lg" onClose={() => setEditing(false)}>
        <TaskEditForm task={task} data={data} onCommand={onCommand} onDone={() => setEditing(false)} />
      </Dialog>
    </article>
  );
}

export function TaskList({
  tasks,
  onCommand,
  today,
  data,
  showTopThree = true,
  emptyText = "No tasks here yet. Capture something, or add the next small action yourself.",
}: {
  tasks: WorkspaceData["tasks"];
  onCommand: WorkspaceCommandFn;
  today: string;
  data: WorkspaceData;
  showTopThree?: boolean;
  emptyText?: string;
}) {
  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <TaskCard key={task.id} task={task} onCommand={onCommand} today={today} data={data} showTopThree={showTopThree} />
      ))}
      {tasks.length === 0 && <p className="empty-state">{emptyText}</p>}
    </div>
  );
}
