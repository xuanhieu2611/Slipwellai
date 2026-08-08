"use client";

import { useState } from "react";
import { CaretLeft, CaretRight, Tray } from "@phosphor-icons/react";
import { calendarMonthGrid, shiftCalendarMonth, taskPlanningDate, type WorkspaceData } from "@/lib/workspace";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";
import { TaskList } from "@/components/workspace/tasks/task-card";

export const TASK_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function calendarLabel(day: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(`${day}T00:00:00Z`));
}

export function TaskPlanner({ tasks, onCommand, today, data, showTopThree }: { tasks: WorkspaceData["tasks"]; onCommand: WorkspaceCommandFn; today: string; data: WorkspaceData; showTopThree: boolean }) {
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
