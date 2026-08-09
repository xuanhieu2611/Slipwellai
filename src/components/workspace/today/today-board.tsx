"use client";

import { type CSSProperties, useState } from "react";
import { DotsSixVertical, Star } from "@phosphor-icons/react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";
import { TaskCard } from "@/components/workspace/tasks/task-card";

export type DragOrigin = "list" | "priority";
export type TodayTask = WorkspaceData["tasks"][number];

export function DraggableTaskCard({
  task,
  onCommand,
  today,
  data,
}: {
  task: TodayTask;
  onCommand: WorkspaceCommandFn;
  today: string;
  data: WorkspaceData;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { origin: "list" satisfies DragOrigin, task },
  });
  const style: CSSProperties = {
    position: "relative",
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.4 : undefined,
    zIndex: isDragging ? 5 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        onCommand={onCommand}
        today={today}
        data={data}
        dragHandle={
          <button
            aria-label={`Drag “${task.title}” to Top Three`}
            className="today-drag-handle"
            type="button"
            {...attributes}
            {...listeners}
          >
            <DotsSixVertical aria-hidden size={16} weight="bold" />
          </button>
        }
      />
    </div>
  );
}

/* On-screen sibling morph uses ease-in-out (--ease-in-out), not ease-out. */
const PRIORITY_SETTLE = { duration: 200, easing: "cubic-bezier(0.77, 0, 0.175, 1)" } as const;

export function SortablePriorityCard({
  task,
  onCommand,
  today,
  data,
}: {
  task: TodayTask;
  onCommand: WorkspaceCommandFn;
  today: string;
  data: WorkspaceData;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { origin: "priority" satisfies DragOrigin, task },
    transition: PRIORITY_SETTLE,
  });
  const style: CSSProperties = {
    position: "relative",
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : undefined,
    zIndex: isDragging ? 5 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        onCommand={onCommand}
        today={today}
        data={data}
        dragHandle={
          <button
            aria-label={`Reorder “${task.title}”`}
            className="today-drag-handle"
            type="button"
            {...attributes}
            {...listeners}
          >
            <DotsSixVertical aria-hidden size={16} weight="bold" />
          </button>
        }
      />
    </div>
  );
}

export function TodayListZone({
  tasks,
  onCommand,
  today,
  data,
  emptyText,
}: {
  tasks: TodayTask[];
  onCommand: WorkspaceCommandFn;
  today: string;
  data: WorkspaceData;
  emptyText: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "today-list-zone" });
  return (
    <div className={`space-y-3 today-drop-zone${isOver ? " is-drop-target" : ""}`} ref={setNodeRef}>
      {tasks.map((task) => (
        <DraggableTaskCard
          data={data}
          key={task.id}
          onCommand={onCommand}
          task={task}
          today={today}
        />
      ))}
      {tasks.length === 0 && <p className="empty-state">{emptyText}</p>}
    </div>
  );
}

export function PriorityDropZone({
  tasks,
  onCommand,
  today,
  data,
}: {
  tasks: TodayTask[];
  onCommand: WorkspaceCommandFn;
  today: string;
  data: WorkspaceData;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: "priority-zone" });
  const remaining = 3 - tasks.length;
  return (
    <div
      className={`today-drop-zone today-priority-zone${isOver ? " is-drop-target" : ""}`}
      ref={setNodeRef}
    >
      <SortableContext items={tasks.map((task) => task.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {tasks.map((task) => (
            <SortablePriorityCard
              data={data}
              key={task.id}
              onCommand={onCommand}
              task={task}
              today={today}
            />
          ))}
        </div>
      </SortableContext>
      {remaining > 0 && (
        <div className="today-priority-placeholder">
          <Star aria-hidden size={18} weight="regular" />
          <span>
            {tasks.length === 0
              ? "Drag a task here to make it today’s first priority."
              : `Room for ${remaining} more.`}
          </span>
        </div>
      )}
    </div>
  );
}

export function DragPreviewCard({ task, data }: { task: TodayTask; data: WorkspaceData }) {
  const domain = task.domain_id
    ? data.domains.find((item) => item.id === task.domain_id)
    : undefined;
  return (
    <div
      className={`record-card today-drag-overlay${domain ? " record-card--domain" : ""}`}
      style={domain ? ({ "--domain-color": domain.color } as CSSProperties) : undefined}
    >
      <DotsSixVertical
        aria-hidden
        className="today-drag-handle today-drag-handle--static"
        size={16}
        weight="bold"
      />
      <div className="min-w-0">
        <h3>{task.title}</h3>
      </div>
    </div>
  );
}

export function TodayBoard({
  topThree,
  dueToday,
  onCommand,
  today,
  data,
}: {
  topThree: TodayTask[];
  dueToday: TodayTask[];
  onCommand: WorkspaceCommandFn;
  today: string;
  data: WorkspaceData;
}) {
  const notify = useToast();
  // Re-synced from the server-derived lists only when the underlying `data` actually changes (a
  // successful drag ends with router.refresh() producing a new `data`), not on every unrelated
  // re-render of the parent, which would otherwise wipe an in-flight optimistic move. Adjusting
  // state during render (rather than in an effect) avoids the extra commit-then-fix-up render.
  const [prevData, setPrevData] = useState(data);
  const [localTopThree, setLocalTopThree] = useState(topThree);
  const [localDueToday, setLocalDueToday] = useState(dueToday);
  if (data !== prevData) {
    setPrevData(data);
    setLocalTopThree(topThree);
    setLocalDueToday(dueToday);
  }
  const [activeTask, setActiveTask] = useState<TodayTask | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  function resolveTarget(overId: string): DragOrigin | null {
    if (overId === "priority-zone") return "priority";
    if (overId === "today-list-zone") return "list";
    if (localTopThree.some((task) => task.id === overId)) return "priority";
    if (localDueToday.some((task) => task.id === overId)) return "list";
    return null;
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveTask((event.active.data.current?.task as TodayTask | undefined) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;
    const activeId = String(active.id);
    const origin = active.data.current?.origin as DragOrigin | undefined;
    const target = resolveTarget(String(over.id));
    if (!origin || !target || (origin === "list" && target === "list")) return;

    if (origin === "list" && target === "priority") {
      if (localTopThree.length >= 3) {
        notify("Today already has three priorities. Remove one first.", "error");
        return;
      }
      const task = localDueToday.find((item) => item.id === activeId);
      if (!task) return;
      const previousList = localDueToday;
      const previousPriority = localTopThree;
      setLocalDueToday((current) => current.filter((item) => item.id !== activeId));
      setLocalTopThree((current) => [...current, task]);
      try {
        await onCommand({ action: "set_top_three", taskId: activeId, localDate: today });
        notify("Added to today’s priorities.", "success");
      } catch (error) {
        setLocalDueToday(previousList);
        setLocalTopThree(previousPriority);
        notify(error instanceof Error ? error.message : "Could not save that change.", "error");
      }
      return;
    }

    if (origin === "priority" && target === "priority") {
      const oldIndex = localTopThree.findIndex((item) => item.id === activeId);
      const newIndex = localTopThree.findIndex((item) => item.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const previousPriority = localTopThree;
      const reordered = arrayMove(localTopThree, oldIndex, newIndex);
      setLocalTopThree(reordered);
      try {
        await onCommand({
          action: "reorder_top_three",
          localDate: today,
          taskIds: reordered.map((item) => item.id),
        });
      } catch (error) {
        setLocalTopThree(previousPriority);
        notify(error instanceof Error ? error.message : "Could not save that change.", "error");
      }
      return;
    }

    if (origin === "priority" && target === "list") {
      const task = localTopThree.find((item) => item.id === activeId);
      if (!task) return;
      const previousList = localDueToday;
      const previousPriority = localTopThree;
      setLocalTopThree((current) => current.filter((item) => item.id !== activeId));
      setLocalDueToday((current) => [task, ...current]);
      try {
        await onCommand({ action: "clear_top_three", taskId: activeId });
        notify("Removed from today’s priorities.", "success");
      } catch (error) {
        setLocalDueToday(previousList);
        setLocalTopThree(previousPriority);
        notify(error instanceof Error ? error.message : "Could not save that change.", "error");
      }
    }
  }

  return (
    <DndContext onDragEnd={handleDragEnd} onDragStart={handleDragStart} sensors={sensors}>
      <div className="today-grid">
        <section className="workspace-section today-all-tasks">
          <div className="section-heading">
            <div>
              <h2>Today</h2>
              <p className="section-note">
                Due, scheduled, or intentionally deferred here — drag one onto Top Three
              </p>
            </div>
            <span className="tag">{localDueToday.length} to review</span>
          </div>
          <TodayListZone
            data={data}
            emptyText="Nothing left to review today. Capture something, or check Tasks for what’s ahead."
            onCommand={onCommand}
            tasks={localDueToday}
            today={today}
          />
        </section>
        <aside className="workspace-section today-priority-panel">
          <div className="section-heading">
            <div>
              <h2>Top Three</h2>
              <p className="section-note">Drag to reorder, or drag one back out</p>
            </div>
            <span className="tag">{localTopThree.length}/3 selected</span>
          </div>
          <PriorityDropZone data={data} onCommand={onCommand} tasks={localTopThree} today={today} />
        </aside>
      </div>
      <DragOverlay>{activeTask && <DragPreviewCard data={data} task={activeTask} />}</DragOverlay>
    </DndContext>
  );
}
