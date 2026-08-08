"use client";

import NumberFlow from "@number-flow/react";
import { isTaskOnDay, taskPlanningDate, type WorkspaceData } from "@/lib/workspace";

export function TaskOverview({ tasks, today }: { tasks: WorkspaceData["tasks"]; today: string }) {
  const dueToday = tasks.filter((task) => isTaskOnDay(task, today)).length;
  const overdue = tasks.filter((task) => {
    const date = taskPlanningDate(task);
    return Boolean(date && date < today);
  }).length;
  const unscheduled = tasks.filter((task) => !taskPlanningDate(task)).length;
  return (
    <dl className="task-overview" aria-label="Open task overview">
      <div>
        <dt>Open</dt>
        <dd>
          <NumberFlow value={tasks.length} />
        </dd>
      </div>
      <div>
        <dt>Today</dt>
        <dd>
          <NumberFlow value={dueToday} />
        </dd>
      </div>
      <div className={overdue ? "has-attention" : undefined}>
        <dt>Past date</dt>
        <dd>
          <NumberFlow value={overdue} />
        </dd>
      </div>
      <div>
        <dt>Unscheduled</dt>
        <dd>
          <NumberFlow value={unscheduled} />
        </dd>
      </div>
    </dl>
  );
}
