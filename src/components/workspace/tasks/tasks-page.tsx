"use client";

import { useState } from "react";
import { CalendarBlank, ListBullets, Plus, Rows } from "@phosphor-icons/react";
import type { WorkspaceData } from "@/lib/workspace";
import type { TasksPageData } from "@/lib/workspace-page-data";
import { Dialog } from "@/components/ui/primitives";
import { dateInZone } from "@/components/workspace/shared/form-utils";
import { useWorkspaceCommand } from "@/components/workspace/shared/use-workspace-command";
import { TaskList } from "@/components/workspace/tasks/task-card";
import { defaultTaskFilters, filterAndSortTasks, TaskFilters, type TaskFilterState } from "@/components/workspace/tasks/task-filters";
import { NewTaskForm } from "@/components/workspace/tasks/task-forms";
import { TaskOverview } from "@/components/workspace/tasks/task-overview";
import { TaskPlanner } from "@/components/workspace/tasks/task-planner";
import { TaskWeekView } from "@/components/workspace/tasks/task-week-view";

type TaskView = "week" | "planner" | "list";

export function TasksPage({ data }: { data: TasksPageData }) {
  const { command } = useWorkspaceCommand();
  const today = dateInZone(data.timezone);
  const openTasks = data.tasks.filter((task) => task.status === "open" && !task.archived_at);
  const [taskFilters, setTaskFilters] = useState<TaskFilterState>(defaultTaskFilters);
  const [taskView, setTaskView] = useState<TaskView>("week");
  const [newTaskOpen, setNewTaskOpen] = useState(false);
  const slippingTaskIds = new Set(data.signals.filter((signal) => signal.entity_type === "task").map((signal) => signal.entity_id));
  const filteredTasks = filterAndSortTasks(data.tasks, taskFilters, slippingTaskIds);
  const showTopThree = taskFilters.status === "open" || taskFilters.status === "any";
  const fullData = data as WorkspaceData;
  const calendarTasks = openTasks;

  return (
    <main className="workspace-page tasks-page">
      <header className="page-intro tasks-page-intro">
        <h1>Tasks</h1>
        <p>Scan the week by day, then open the full list when you need to filter.</p>
      </header>
      <Dialog open={newTaskOpen} title="New task" size="lg" onClose={() => setNewTaskOpen(false)}>
        {newTaskOpen ? <NewTaskForm data={fullData} onCommand={command} onDone={() => setNewTaskOpen(false)} /> : null}
      </Dialog>
      <section className="workspace-section tasks-workspace">
        <div className="tasks-toolbar">
          <div className="task-view-switch" data-active={taskView} role="group" aria-label="Task view">
            <span className="task-view-switch-pill" aria-hidden />
            <button className={taskView === "week" ? "is-active" : undefined} type="button" aria-pressed={taskView === "week"} onClick={() => setTaskView("week")}>
              <Rows aria-hidden size={17} weight="bold" />
              Week
            </button>
            <button className={taskView === "planner" ? "is-active" : undefined} type="button" aria-pressed={taskView === "planner"} onClick={() => setTaskView("planner")}>
              <CalendarBlank aria-hidden size={17} weight="bold" />
              Planner
            </button>
            <button className={taskView === "list" ? "is-active" : undefined} type="button" aria-pressed={taskView === "list"} onClick={() => setTaskView("list")}>
              <ListBullets aria-hidden size={17} weight="bold" />
              List
            </button>
          </div>
          <button className="button-base button-primary tasks-new-task" type="button" onClick={() => setNewTaskOpen(true)}>
            <Plus aria-hidden size={17} weight="bold" />
            New task
          </button>
        </div>
        <TaskOverview tasks={openTasks} today={today} />
        {taskView === "list" ? (
          <>
            <div className="task-browse-head">
              <div>
                <h2>All tasks</h2>
                <p>Filter and sort every commitment in one place.</p>
              </div>
              <span>{filteredTasks.length} shown</span>
            </div>
            <TaskFilters data={fullData} filters={taskFilters} onChange={setTaskFilters} />
            <div className="task-list-view">
              <TaskList tasks={filteredTasks} onCommand={command} today={today} data={fullData} showTopThree={showTopThree} />
            </div>
          </>
        ) : null}
        {taskView === "week" ? <TaskWeekView tasks={calendarTasks} onCommand={command} today={today} data={fullData} /> : null}
        {taskView === "planner" ? (
          <TaskPlanner tasks={calendarTasks} onCommand={command} today={today} data={fullData} showTopThree />
        ) : null}
      </section>
    </main>
  );
}
