"use client";

import { type CSSProperties, useState } from "react";
import { ArrowCounterClockwise, CaretLeft, CaretRight } from "@phosphor-icons/react";
import { calendarWeekDays, calendarWeekStart, shiftCalendarWeek, taskPlanningDate, type WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/primitives";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";
import { TaskEditForm } from "@/components/workspace/tasks/task-forms";
import { calendarLabel } from "@/components/workspace/tasks/task-planner";

export function TaskWeekRow({ task, data, onCommand, onEdit }: { task: WorkspaceData["tasks"][number]; data: WorkspaceData; onCommand: WorkspaceCommandFn; onEdit: () => void }) {
  const notify = useToast();
  const domain = task.domain_id ? data.domains.find((item) => item.id === task.domain_id) : undefined;
  const isOpen = task.status === "open" && !task.archived_at;
  async function toggle() {
    try {
      await onCommand({ action: isOpen ? "complete_task" : "reopen_task", taskId: task.id });
      notify(isOpen ? "Task completed." : "Task reopened.", "success");
    } catch (error) { notify(error instanceof Error ? error.message : "Could not update that task.", "error"); }
  }
  const isHighPriority = task.priority === 3 && isOpen;
  return <div className={`task-week-task${domain ? " task-week-task--domain" : ""}${!isOpen ? " is-done" : ""}${isHighPriority ? " is-high" : ""}`} style={domain ? ({ "--domain-color": domain.color } as CSSProperties) : undefined} title={isHighPriority ? "High priority" : undefined}>
    <button className="task-week-task-toggle" type="button" aria-label={isOpen ? `Complete ${task.title}` : `Reopen ${task.title}`} onClick={toggle}>{isOpen ? <span className="task-week-task-dot" /> : <ArrowCounterClockwise aria-hidden size={11} weight="bold" />}</button>
    <button className="task-week-task-title" type="button" onClick={onEdit}>{task.title}</button>
  </div>;
}

/** A seven-day agenda so a full week's dated work is visible at a glance, instead of one day at a time. */
export function TaskWeekView({ tasks, onCommand, today, data }: { tasks: WorkspaceData["tasks"]; onCommand: WorkspaceCommandFn; today: string; data: WorkspaceData }) {
  const [anchor, setAnchor] = useState(today);
  const [editingId, setEditingId] = useState<string | null>(null);
  const days = calendarWeekDays(anchor);
  const datedTasks = tasks.filter((task) => taskPlanningDate(task));
  const rangeLabel = `${calendarLabel(days[0], { month: "short", day: "numeric" })} – ${calendarLabel(days[6], { month: "short", day: "numeric", year: "numeric" })}`;
  const editingTask = editingId ? tasks.find((task) => task.id === editingId) : undefined;

  function moveWeek(amount: number) {
    setAnchor(shiftCalendarWeek(anchor, amount));
  }

  return <section className="task-week" aria-label="Task week view">
    <div className="task-week-head">
      <div><h2>Week of {rangeLabel}</h2><p>All dated work across the seven days.</p></div>
      <div className="task-calendar-actions">
        {calendarWeekStart(anchor) !== calendarWeekStart(today) && <button className="button-base button-quiet" type="button" onClick={() => setAnchor(today)}>Today</button>}
        <button className="button-base button-quiet task-calendar-arrow" type="button" aria-label="Previous week" onClick={() => moveWeek(-1)}><CaretLeft aria-hidden size={16} weight="bold" /></button>
        <button className="button-base button-quiet task-calendar-arrow" type="button" aria-label="Next week" onClick={() => moveWeek(1)}><CaretRight aria-hidden size={16} weight="bold" /></button>
      </div>
    </div>
    <div className="task-week-grid">{days.map((day) => {
      const dayTasks = datedTasks.filter((task) => taskPlanningDate(task) === day);
      const dayLabel = calendarLabel(day, { weekday: "short", month: "short", day: "numeric" });
      return <div className={`task-week-day${day === today ? " is-today" : ""}`} key={day}>
        <div className="task-week-day-head"><span>{dayLabel}</span><span className="task-count">{dayTasks.length}</span></div>
        <div className="task-week-day-list">
          {dayTasks.map((task) => <TaskWeekRow task={task} data={data} onCommand={onCommand} onEdit={() => setEditingId(task.id)} key={task.id} />)}
          {dayTasks.length === 0 && <p className="task-week-day-empty">Nothing dated</p>}
        </div>
      </div>;
    })}</div>
    {editingTask ? (
      <Dialog open title="Edit task" size="lg" onClose={() => setEditingId(null)}>
        <TaskEditForm task={editingTask} data={data} onCommand={onCommand} onDone={() => setEditingId(null)} />
      </Dialog>
    ) : null}
  </section>;
}
