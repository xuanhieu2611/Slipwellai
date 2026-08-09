"use client";

import { isTaskOnDay, type WorkspaceData } from "@/lib/workspace";
import type { TodayPageData } from "@/lib/workspace-page-data";
import { capturesNeedingAttention } from "@/lib/capture-pipeline";
import { isTodayAllCaughtUp } from "@/lib/today-summary";
import { StatusMessage } from "@/components/ui/primitives";
import { dateInZone } from "@/components/workspace/shared/form-utils";
import { useLocalMidnightRollover } from "@/components/workspace/shared/use-local-midnight-rollover";
import { useWorkspaceCommand } from "@/components/workspace/shared/use-workspace-command";
import { NeedsAttention } from "@/components/workspace/today/needs-attention";
import { NotesToReview } from "@/components/workspace/today/notes-to-review";
import { SlippingSignalCard } from "@/components/workspace/today/slipping-signal-card";
import { TodayBoard } from "@/components/workspace/today/today-board";

export function TodayPage({ data }: { data: TodayPageData }) {
  const { command, safely, refreshAttention, resolveSignal } = useWorkspaceCommand();
  const { isStale, refreshNow } = useLocalMidnightRollover(data.timezone, data);
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
  const unresolvedRoutines = data.routines.filter((routine) => !routineById.has(routine.id));
  const coreSignals = data.signals.filter((signal) => signal.entity_type !== "retainer_cycle_item");
  // Mirrors NotesToReview's own filter (kept there so that component stays self-contained); this
  // copy exists only to decide whether the whole page counts as "all caught up" below.
  const reviewNoteCount = data.notes.filter(
    (note) => note.review_on && note.review_on <= today,
  ).length;
  const attentionCaptureCount = capturesNeedingAttention(data.captureAttention).length;
  const isAllCaughtUp = isTodayAllCaughtUp({
    topThreeCount: topThree.length,
    dueTodayCount: dueToday.length,
    unresolvedRoutineCount: unresolvedRoutines.length,
    reviewNoteCount,
    openSignalCount: coreSignals.length,
    attentionCaptureCount,
  });

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
      {isStale && (
        <div className="flex items-center justify-between gap-3">
          <StatusMessage tone="attention">
            It’s a new day locally and this page hasn’t refreshed yet. It should update on its own
            shortly — refresh it yourself if it doesn’t.
          </StatusMessage>
          <button
            className="button-base button-secondary shrink-0"
            onClick={refreshNow}
            type="button"
          >
            Refresh now
          </button>
        </div>
      )}
      {isAllCaughtUp && (
        <StatusMessage tone="success">
          You’re all caught up. Nothing is due today, no signals are open, and no captures are
          waiting.
        </StatusMessage>
      )}
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
      <NeedsAttention captureAttention={data.captureAttention} />
    </main>
  );
}
