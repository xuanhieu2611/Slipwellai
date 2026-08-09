"use client";

import { type FormEvent, useState } from "react";
import { Flame, Plus } from "@phosphor-icons/react";
import {
  routineCurrentStreak,
  routineHeatmapWeeks,
  type RoutineHeatmapWeek,
  type WorkspaceData,
} from "@/lib/workspace";
import type { RoutinesPageData } from "@/lib/workspace-page-data";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/primitives";
import { dateInZone, formValue } from "@/components/workspace/shared/form-utils";
import { useWorkspaceCommand } from "@/components/workspace/shared/use-workspace-command";

const ROUTINE_WEEKDAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", ""];

function RoutineHeatmap({ weeks }: { weeks: RoutineHeatmapWeek[] }) {
  const cells = weeks.flatMap((week) => week.cells);
  return (
    <div className="routine-heatmap">
      <div className="routine-heatmap-scroll">
        <div className="routine-heatmap-layout">
          <span className="routine-heatmap-corner" />
          <div className="routine-heatmap-months">
            {weeks.map((week) => (
              <span key={week.start}>{week.monthLabel ?? ""}</span>
            ))}
          </div>
          <div className="routine-heatmap-weekdays">
            {ROUTINE_WEEKDAY_LABELS.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>
          <div className="routine-heatmap-grid">
            {cells.map((cell) => (
              <span
                className="routine-heatmap-cell"
                data-outcome={cell.isFuture ? "future" : (cell.outcome ?? "none")}
                data-today={cell.isToday ? "true" : undefined}
                key={cell.date}
                title={`${cell.date} · ${cell.outcome ?? (cell.isFuture ? "upcoming" : "no record")}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RoutineCard({
  routine,
  completions,
  today,
  onResolve,
}: {
  routine: WorkspaceData["routines"][number];
  completions: WorkspaceData["routineCompletions"];
  today: string;
  onResolve: (routineId: string, outcome: "completed" | "skipped") => Promise<void>;
}) {
  const resolvedToday = completions.find((completion) => completion.local_date === today);
  const streak = routineCurrentStreak(completions, today);
  const weeks = routineHeatmapWeeks(completions, today);
  return (
    <article className="routine-card">
      <div className="routine-card-head">
        <div>
          <h3>{routine.name}</h3>
          <p className="record-meta capitalize">
            {routine.period} · {resolvedToday ? resolvedToday.outcome : "Not yet checked today"}
          </p>
        </div>
        <div className="routine-card-actions">
          {streak > 0 && (
            <span className="routine-streak">
              <Flame aria-hidden size={14} weight="fill" />
              {streak} day{streak === 1 ? "" : "s"}
            </span>
          )}
          {!resolvedToday && (
            <div className="record-actions">
              <button
                className="button-base button-primary"
                onClick={() => onResolve(routine.id, "completed")}
              >
                Complete
              </button>
              <button
                className="button-base button-secondary"
                onClick={() => onResolve(routine.id, "skipped")}
              >
                Skip
              </button>
            </div>
          )}
        </div>
      </div>
      <RoutineHeatmap weeks={weeks} />
    </article>
  );
}

export function RoutinesPage({ data }: { data: RoutinesPageData }) {
  const { command } = useWorkspaceCommand();
  const notify = useToast();
  const today = dateInZone(data.timezone);
  const [createOpen, setCreateOpen] = useState(false);

  async function submitRoutine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await command({
        action: "create_routine",
        name: formValue(form, "name"),
        period: formValue(form, "period"),
      });
      form.reset();
      notify("Routine added.", "success");
      setCreateOpen(false);
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save that change.", "error");
    }
  }

  async function resolve(routineId: string, outcome: "completed" | "skipped") {
    try {
      await command({ action: "resolve_routine", routineId, localDate: today, outcome });
      notify(outcome === "completed" ? "Routine completed." : "Routine skipped.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not save that change.", "error");
    }
  }

  return (
    <main className="workspace-page">
      <header className="page-intro page-intro--with-action">
        <div className="page-intro-text">
          <p className="eyebrow">Routines</p>
          <h1>Habits worth keeping, tracked like it matters.</h1>
          <p>
            Repeated behaviors stay separate from tasks: mark each one off as you go and watch the
            streak and history build.
          </p>
        </div>
        <button className="button-base button-primary" onClick={() => setCreateOpen(true)}>
          <Plus aria-hidden size={16} weight="bold" />
          New routine
        </button>
      </header>
      <Dialog open={createOpen} title="New routine" onClose={() => setCreateOpen(false)}>
        {createOpen ? (
          <form className="form-grid" onSubmit={submitRoutine}>
            <label className="field-label">
              <span>Routine</span>
              <input
                className="field-base"
                name="name"
                required
                maxLength={160}
                placeholder="Plan the day"
              />
            </label>
            <label className="field-label">
              <span>Time of day</span>
              <select className="field-base" name="period" defaultValue="anytime">
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="anytime">Anytime</option>
              </select>
            </label>
            <button className="button-base button-primary form-submit">Add routine</button>
          </form>
        ) : null}
      </Dialog>
      <div className="space-y-4">
        {data.routines.map((routine) => (
          <RoutineCard
            key={routine.id}
            routine={routine}
            completions={data.routineCompletions.filter(
              (completion) => completion.routine_id === routine.id,
            )}
            today={today}
            onResolve={resolve}
          />
        ))}
        {data.routines.length === 0 && (
          <p className="empty-state">
            Add a routine for a repeated behavior you want to keep an eye on - a workout, drinking
            water, anything that isn’t a one-off task.
          </p>
        )}
      </div>
    </main>
  );
}
