"use client";

import { type CSSProperties, useState } from "react";
import { ArrowCounterClockwise, CaretLeft, CaretRight, Check } from "@phosphor-icons/react";
import {
  centeredWeekDays,
  shiftCalendarWeek,
  taskPlanningDate,
  type WorkspaceData,
} from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/primitives";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";
import { TaskEditForm } from "@/components/workspace/tasks/task-forms";
import { calendarLabel } from "@/components/workspace/tasks/task-planner";

export function TaskWeekRow({
  task,
  data,
  onCommand,
  onEdit,
}: {
  task: WorkspaceData["tasks"][number];
  data: WorkspaceData;
  onCommand: WorkspaceCommandFn;
  onEdit: () => void;
}) {
  const notify = useToast();
  const [confirming, setConfirming] = useState(false);
  const domain = task.domain_id
    ? data.domains.find((item) => item.id === task.domain_id)
    : undefined;
  const isOpen = task.status === "open" && !task.archived_at;
  async function toggle() {
    if (confirming) return;
    if (isOpen) setConfirming(true);
    try {
      await onCommand({ action: isOpen ? "complete_task" : "reopen_task", taskId: task.id });
      notify(isOpen ? "Task completed." : "Task reopened.", "success");
    } catch (error) {
      setConfirming(false);
      notify(error instanceof Error ? error.message : "Could not update that task.", "error");
    }
  }
  const isHighPriority = task.priority === 3 && isOpen;
  const hint =
    [isHighPriority ? "High priority" : null, domain?.name].filter(Boolean).join(" · ") ||
    undefined;
  return (
    <div
      className={`task-week-task${domain ? " task-week-task--domain" : ""}${!isOpen || confirming ? " is-done" : ""}${isHighPriority ? " is-high" : ""}${confirming ? " is-confirming" : ""}`}
      style={domain ? ({ "--domain-color": domain.color } as CSSProperties) : undefined}
      title={hint}
    >
      <button
        className={`task-week-task-toggle${confirming ? " is-confirming" : ""}`}
        type="button"
        aria-label={isOpen ? `Complete ${task.title}` : `Reopen ${task.title}`}
        onClick={toggle}
      >
        {confirming ? (
          <Check aria-hidden className="task-complete-check" size={11} weight="bold" />
        ) : isOpen ? (
          <span className="task-week-task-dot" />
        ) : (
          <ArrowCounterClockwise aria-hidden size={11} weight="bold" />
        )}
      </button>
      <button className="task-week-task-title" type="button" onClick={onEdit}>
        {task.title}
      </button>
    </div>
  );
}

/** A seven-day agenda centered on today so upcoming work stays in view, not a Mon–Sun calendar week. */
export function TaskWeekView({
  tasks,
  onCommand,
  today,
  data,
}: {
  tasks: WorkspaceData["tasks"];
  onCommand: WorkspaceCommandFn;
  today: string;
  data: WorkspaceData;
}) {
  const [anchor, setAnchor] = useState(today);
  const [editingId, setEditingId] = useState<string | null>(null);
  const days = centeredWeekDays(anchor);
  const datedTasks = tasks.filter((task) => taskPlanningDate(task));
  const rangeLabel = `${calendarLabel(days[0], { month: "short", day: "numeric" })} – ${calendarLabel(days[6], { month: "short", day: "numeric", year: "numeric" })}`;
  const editingTask = editingId ? tasks.find((task) => task.id === editingId) : undefined;

  function moveWeek(amount: number) {
    setAnchor(shiftCalendarWeek(anchor, amount));
  }

  return (
    <section className="task-week" aria-label="Task week view">
      <div className="task-week-head">
        <div>
          <h2>{rangeLabel}</h2>
          <p>Today in the middle so you can see what is coming.</p>
        </div>
        <div className="task-calendar-actions">
          {anchor !== today && (
            <button
              className="button-base button-quiet"
              type="button"
              onClick={() => setAnchor(today)}
            >
              Today
            </button>
          )}
          <button
            className="button-base button-quiet task-calendar-arrow"
            type="button"
            aria-label="Previous week"
            onClick={() => moveWeek(-1)}
          >
            <CaretLeft aria-hidden size={16} weight="bold" />
          </button>
          <button
            className="button-base button-quiet task-calendar-arrow"
            type="button"
            aria-label="Next week"
            onClick={() => moveWeek(1)}
          >
            <CaretRight aria-hidden size={16} weight="bold" />
          </button>
        </div>
      </div>
      <div className="task-week-grid">
        {days.map((day) => {
          const dayTasks = datedTasks
            .filter((task) => taskPlanningDate(task) === day)
            .sort(
              (a, b) => (b.priority ?? 0) - (a.priority ?? 0) || a.title.localeCompare(b.title),
            );
          const weekday = calendarLabel(day, { weekday: "short" });
          const dayNumber = Number(day.slice(-2));
          const isToday = day === today;
          const isPast = day < today;
          const isEmpty = dayTasks.length === 0;
          return (
            <div
              className={`task-week-day${isToday ? " is-today" : ""}${isPast ? " is-past" : ""}${isEmpty ? " is-empty" : ""}`}
              key={day}
            >
              <div className="task-week-day-head">
                <div className="task-week-day-label">
                  <span className="task-week-weekday">{weekday}</span>
                  <span className="task-week-day-number">{dayNumber}</span>
                  {isToday ? <span className="task-week-today-mark">Today</span> : null}
                </div>
                {isEmpty ? null : <span className="task-count">{dayTasks.length}</span>}
              </div>
              <div className="task-week-day-list">
                {dayTasks.map((task) => (
                  <TaskWeekRow
                    task={task}
                    data={data}
                    onCommand={onCommand}
                    onEdit={() => setEditingId(task.id)}
                    key={task.id}
                  />
                ))}
                {isEmpty ? (
                  <p className="task-week-day-empty">
                    <span className="sr-only">No tasks</span>
                  </p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      {editingTask ? (
        <Dialog open title="Edit task" size="lg" onClose={() => setEditingId(null)}>
          <TaskEditForm
            task={editingTask}
            data={data}
            onCommand={onCommand}
            onDone={() => setEditingId(null)}
          />
        </Dialog>
      ) : null}
    </section>
  );
}
