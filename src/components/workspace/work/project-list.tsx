"use client";

import { type CSSProperties, type FormEvent, useState } from "react";
import { Check, Trash } from "@phosphor-icons/react";
import { activityEventLabel, type WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/primitives";
import { ActionsMenu, type MenuAction } from "@/components/workspace/shared/actions-menu";
import { formValue } from "@/components/workspace/shared/form-utils";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";
import { ProjectEditForm } from "@/components/workspace/work/project-forms";

type Milestone = WorkspaceData["milestones"][number];
type ChecklistItem = WorkspaceData["checklistItems"][number];

function ProjectCheckRow({
  title,
  done,
  onToggle,
  onDelete,
  busy,
}: {
  title: string;
  done: boolean;
  onToggle: () => void;
  onDelete?: () => void;
  busy?: boolean;
}) {
  return (
    <div className={`project-check-row${done ? " is-done" : ""}`}>
      <button
        className={`project-check-toggle${done ? " is-done" : ""}`}
        type="button"
        aria-pressed={done}
        aria-label={done ? `Reopen ${title}` : `Complete ${title}`}
        disabled={busy}
        onClick={onToggle}
      >
        {done ? <Check aria-hidden className="task-complete-check" size={12} weight="bold" /> : <span className="project-check-dot" aria-hidden />}
      </button>
      <span className="project-check-title">{title}</span>
      {onDelete ? (
        <button className="project-check-delete" type="button" aria-label={`Delete ${title}`} disabled={busy} onClick={onDelete}>
          <Trash aria-hidden size={14} weight="bold" />
        </button>
      ) : null}
    </div>
  );
}

export function ProjectChecklist({ projectId, data, onCommand }: { projectId: string; data: WorkspaceData; onCommand: WorkspaceCommandFn }) {
  const notify = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const instances = data.checklistInstances.filter((instance) => instance.project_id === projectId);
  if (instances.length === 0) return null;

  async function toggle(item: ChecklistItem) {
    if (busyId) return;
    setBusyId(item.id);
    const isOpen = item.status === "open";
    try {
      await onCommand({ action: isOpen ? "complete_checklist_item" : "reopen_checklist_item", itemId: item.id });
      notify(isOpen ? "Checklist item completed." : "Checklist item reopened.", "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update that checklist item.", "error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      {instances.map((instance) => {
        const items = data.checklistItems.filter((item) => item.instance_id === instance.id);
        const completed = items.filter((item) => item.status === "completed").length;
        return (
          <section className="project-panel" key={instance.id}>
            <div className="project-panel-head">
              <h4>Checklist</h4>
              <span className="tag">
                {completed}/{items.length} · v{instance.template_version}
              </span>
            </div>
            {items.length > 0 ? (
              <div className="project-check-list">
                {items.map((item) => (
                  <ProjectCheckRow
                    key={item.id}
                    title={item.title}
                    done={item.status === "completed"}
                    busy={busyId === item.id}
                    onToggle={() => toggle(item)}
                  />
                ))}
              </div>
            ) : (
              <p className="project-panel-empty">This checklist snapshot has no steps.</p>
            )}
          </section>
        );
      })}
    </>
  );
}

export function ProjectActivity({ projectId, data }: { projectId: string; data: WorkspaceData }) {
  const events = data.projectActivity.filter((event) => event.entity_id === projectId);
  if (events.length === 0) return null;
  return (
    <details className="project-activity">
      <summary>Activity history ({events.length})</summary>
      <div className="project-activity-list">
        {events.map((event) => (
          <div className="project-activity-row" key={event.id}>
            <span>{activityEventLabel(event.event_type)}</span>
            <time dateTime={event.occurred_at}>{new Date(event.occurred_at).toLocaleString()}</time>
          </div>
        ))}
      </div>
    </details>
  );
}

function MilestonePanel({
  projectId,
  milestones,
  onCommand,
}: {
  projectId: string;
  milestones: Milestone[];
  onCommand: WorkspaceCommandFn;
}) {
  const notify = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const completed = milestones.filter((milestone) => milestone.status === "completed").length;

  async function act(command: Record<string, unknown>, success: string) {
    try {
      await onCommand(command);
      notify(success, "success");
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update that milestone.", "error");
      return false;
    }
  }

  async function toggle(milestone: Milestone) {
    if (busyId) return;
    setBusyId(milestone.id);
    const isOpen = milestone.status === "open";
    await act(
      { action: isOpen ? "complete_milestone" : "reopen_milestone", milestoneId: milestone.id },
      isOpen ? "Milestone completed." : "Milestone reopened.",
    );
    setBusyId(null);
  }

  async function remove(milestone: Milestone) {
    if (busyId) return;
    setBusyId(milestone.id);
    await act({ action: "delete_milestone", milestoneId: milestone.id }, "Milestone deleted.");
    setBusyId(null);
  }

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const ok = await act({ action: "create_milestone", projectId, title: formValue(form, "title") }, "Milestone added.");
    if (ok) form.reset();
  }

  return (
    <section className="project-panel">
      <div className="project-panel-head">
        <h4>Milestones</h4>
        <span className="tag">{milestones.length ? `${completed}/${milestones.length}` : "None yet"}</span>
      </div>
      {milestones.length > 0 ? (
        <div className="project-check-list">
          {milestones.map((milestone) => (
            <ProjectCheckRow
              key={milestone.id}
              title={milestone.title}
              done={milestone.status === "completed"}
              busy={busyId === milestone.id}
              onToggle={() => toggle(milestone)}
              onDelete={() => remove(milestone)}
            />
          ))}
        </div>
      ) : (
        <p className="project-panel-empty">Add checkpoints when the outcome needs more than one step.</p>
      )}
      <form className="inline-form project-add-row" onSubmit={add}>
        <label className="sr-only" htmlFor={`milestone-${projectId}`}>
          New milestone
        </label>
        <input className="field-base" id={`milestone-${projectId}`} name="title" required maxLength={280} placeholder="Add a checkpoint" />
        <button className="button-base button-secondary" type="submit">
          Add
        </button>
      </form>
    </section>
  );
}

export function ProjectList({ projects, data, onCommand }: { projects: WorkspaceData["projects"]; data: WorkspaceData; onCommand: WorkspaceCommandFn }) {
  const notify = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  async function act(command: Record<string, unknown>, success: string) {
    try {
      await onCommand(command);
      notify(success, "success");
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not update that project.", "error");
    }
  }

  return (
    <div className="space-y-4">
      {projects.map((project) => {
        const domain = project.domain_id ? data.domains.find((item) => item.id === project.domain_id) : undefined;
        const person = project.person_id ? data.people.find((item) => item.id === project.person_id) : undefined;
        const milestones = data.milestones.filter((milestone) => milestone.project_id === project.id);
        const completedMilestones = milestones.filter((milestone) => milestone.status === "completed").length;
        const checklistItemCount = data.checklistInstances
          .filter((instance) => instance.project_id === project.id)
          .reduce((count, instance) => count + data.checklistItems.filter((item) => item.instance_id === instance.id).length, 0);

        const editMenuActions: MenuAction[] = [
          { label: "Edit", onClick: () => setEditingId(project.id) },
          { label: "Delete", onClick: () => act({ action: "delete_project", projectId: project.id }, "Project deleted."), tone: "danger" },
        ];
        const activeMenuActions: MenuAction[] = [
          { label: "Edit", onClick: () => setEditingId(project.id) },
          ...(project.status === "active"
            ? [{ label: "Pause", onClick: () => act({ action: "pause_project", projectId: project.id }, "Project paused.") }]
            : []),
          { label: "Cancel", onClick: () => act({ action: "cancel_project", projectId: project.id }, "Project canceled.") },
          { label: "Delete", onClick: () => act({ action: "delete_project", projectId: project.id }, "Project deleted."), tone: "danger" },
        ];

        const planMeta = milestones.length
          ? `${completedMilestones}/${milestones.length} milestones`
          : checklistItemCount
            ? `${checklistItemCount} checklist steps`
            : "No milestones yet";

        return (
          <article className="project-card" key={project.id}>
            <div
              className={`record-card${domain ? " record-card--domain" : ""}`}
              style={domain ? ({ "--domain-color": domain.color } as CSSProperties) : undefined}
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3>{project.name}</h3>
                  <span className="tag capitalize">{project.status}</span>
                </div>
                {project.description ? <p className="record-copy">{project.description}</p> : null}
                <p className="record-meta">
                  {project.target_on ? `Target ${project.target_on}` : "No target date"} · {planMeta}
                </p>
                {(domain || person) && (
                  <p className="record-meta flex flex-wrap items-center gap-2">
                    {domain && (
                      <span>
                        <i className="domain-dot" style={{ background: domain.color }} />
                        {domain.name}
                      </span>
                    )}
                    {person && <span>{person.name}</span>}
                  </p>
                )}
              </div>
              <div className="record-actions">
                {project.archived_at ? (
                  <button className="button-base button-primary" onClick={() => act({ action: "restore_project", projectId: project.id }, "Project restored.")}>
                    Restore
                  </button>
                ) : project.status === "active" ? (
                  <>
                    <button
                      className="button-base button-secondary"
                      onClick={() => act({ action: "record_project_progress", projectId: project.id }, "Progress recorded.")}
                    >
                      Mark progress
                    </button>
                    <button
                      className="button-base button-primary"
                      onClick={() => act({ action: "complete_project", projectId: project.id }, "Project completed.")}
                    >
                      Complete
                    </button>
                    <ActionsMenu actions={activeMenuActions} />
                  </>
                ) : project.status === "paused" ? (
                  <>
                    <button className="button-base button-primary" onClick={() => act({ action: "resume_project", projectId: project.id }, "Project resumed.")}>
                      Resume
                    </button>
                    <ActionsMenu actions={activeMenuActions} />
                  </>
                ) : (
                  <ActionsMenu actions={editMenuActions} />
                )}
              </div>
            </div>

            {editingId === project.id ? (
              <Dialog open title="Edit project" size="lg" onClose={() => setEditingId(null)}>
                <ProjectEditForm project={project} data={data} onCommand={onCommand} onDone={() => setEditingId(null)} />
              </Dialog>
            ) : null}

            <div className="project-body">
              <MilestonePanel projectId={project.id} milestones={milestones} onCommand={onCommand} />
              <ProjectChecklist projectId={project.id} data={data} onCommand={onCommand} />
              <ProjectActivity projectId={project.id} data={data} />
            </div>
          </article>
        );
      })}
      {projects.length === 0 && <p className="empty-state">Projects appear here when an outcome needs more than one action.</p>}
    </div>
  );
}
