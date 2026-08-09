"use client";

import { isTaskOnDay, type WorkspaceData } from "@/lib/workspace";
import type { TodayPageData } from "@/lib/workspace-page-data";
import { dateInZone } from "@/components/workspace/shared/form-utils";
import { useWorkspaceCommand } from "@/components/workspace/shared/use-workspace-command";
import { NotesToReview } from "@/components/workspace/today/notes-to-review";
import { SlippingSignalCard } from "@/components/workspace/today/slipping-signal-card";
import { TodayBoard } from "@/components/workspace/today/today-board";

export function TodayPage({ data }: { data: TodayPageData }) {
  const { command, safely, refreshAttention, resolveSignal } = useWorkspaceCommand();
  const today = dateInZone(data.timezone);
  const openTasks = data.tasks.filter((task) => task.status === "open" && !task.archived_at);
  const topThree = openTasks
    .filter((task) => task.top_three_date === today)
    .sort((a, b) => (a.top_three_order ?? 9) - (b.top_three_order ?? 9));
  const dueToday = openTasks
    .filter((task) => isTaskOnDay(task, today))
    .filter((task) => !topThree.some((priority) => priority.id === task.id));
  const routineById = new Map(
    data.routineCompletions
      .filter((item) => item.local_date === today)
      .map((item) => [item.routine_id, item]),
  );
  const coreSignals = data.signals.filter((signal) => signal.entity_type !== "retainer_cycle_item");

  return (
    <main className="workspace-page">
      <header className="page-intro">
        <p className="eyebrow">Today · {today}</p>
        <h1>Choose what matters, then let the rest wait.</h1>
        <p>
          Local time: {data.timezone}. Drag a task onto Top Three, or drag one back out. Slipwell
          never quietly carries yesterday’s priorities into today.
        </p>
      </header>
      <TodayBoard
        data={data as WorkspaceData}
        dueToday={dueToday}
        onCommand={command}
        today={today}
        topThree={topThree}
      />
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Routines</h2>
            <p className="section-note">Separate from tasks</p>
          </div>
        </div>
        <div className="space-y-3">
          {data.routines.map((routine) => {
            const resolved = routineById.get(routine.id);
            return (
              <article className="record-card" key={routine.id}>
                <div>
                  <h3>{routine.name}</h3>
                  <p className="record-meta capitalize">
                    {routine.period} · {resolved ? resolved.outcome : "Not yet checked"}
                  </p>
                </div>
                {!resolved && (
                  <div className="record-actions">
                    <button
                      className="button-base button-primary"
                      onClick={() =>
                        safely(
                          () =>
                            command({
                              action: "resolve_routine",
                              routineId: routine.id,
                              localDate: today,
                              outcome: "completed",
                            }),
                          "Routine completed.",
                        )
                      }
                    >
                      Complete
                    </button>
                    <button
                      className="button-base button-secondary"
                      onClick={() =>
                        safely(
                          () =>
                            command({
                              action: "resolve_routine",
                              routineId: routine.id,
                              localDate: today,
                              outcome: "skipped",
                            }),
                          "Routine skipped.",
                        )
                      }
                    >
                      Skip
                    </button>
                  </div>
                )}
              </article>
            );
          })}
          {data.routines.length === 0 && (
            <p className="empty-state">
              Add a routine from People & Notes when a repeated behavior belongs here, not in your
              task list.
            </p>
          )}
        </div>
      </section>
      <NotesToReview notes={data.notes} today={today} />
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Slipping</h2>
            <p className="section-note">Attention signals</p>
          </div>
          <button className="button-base button-secondary" onClick={refreshAttention}>
            Refresh attention
          </button>
        </div>
        <div className="space-y-3">
          {coreSignals.map((signal) => (
            <SlippingSignalCard
              key={signal.id}
              signal={signal}
              data={data as WorkspaceData}
              command={command}
              resolveSignal={resolveSignal}
            />
          ))}
          {coreSignals.length === 0 && (
            <p className="empty-state">
              No active task or project signals. Refresh attention to check meaningful activity
              against each cadence.
            </p>
          )}
        </div>
      </section>
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Capture recovery</h2>
            <p className="section-note">Recent captures</p>
          </div>
        </div>
        <div className="space-y-2">
          {data.captures.map((capture) => (
            <article className="compact-row" key={capture.id}>
              <span>{capture.original_text}</span>
              <span className="tag">{capture.status.replace("_", " ")}</span>
            </article>
          ))}
          {data.captures.length === 0 && (
            <p className="empty-state">Your captured thoughts will appear here.</p>
          )}
        </div>
      </section>
    </main>
  );
}
