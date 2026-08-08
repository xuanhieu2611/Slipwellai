"use client";

import { type CSSProperties, useState } from "react";
import { activityEventLabel, type WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/primitives";
import { ActionsMenu, type MenuAction } from "@/components/workspace/shared/actions-menu";
import { formValue } from "@/components/workspace/shared/form-utils";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";
import { ProjectEditForm } from "@/components/workspace/work/project-forms";

export function ProjectChecklist({ projectId, data, onCommand }: { projectId: string; data: WorkspaceData; onCommand: WorkspaceCommandFn }) {
  const notify = useToast();
  const instances = data.checklistInstances.filter((instance) => instance.project_id === projectId);
  async function toggle(itemId: string, isOpen: boolean) {
    try { await onCommand({ action: isOpen ? "complete_checklist_item" : "reopen_checklist_item", itemId }); notify(isOpen ? "Checklist item completed." : "Checklist item reopened.", "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not update that checklist item.", "error"); }
  }
  return <div className="project-milestones">{instances.map((instance) => <div className="mt-3" key={instance.id}><p className="record-meta">Template snapshot · version {instance.template_version}</p>{data.checklistItems.filter((item) => item.instance_id === instance.id).map((item) => <div className="compact-row" key={item.id}><span>{item.title}</span><button className="button-base button-quiet" onClick={() => toggle(item.id, item.status === "open")}>{item.status === "open" ? "Complete" : "Reopen"}</button></div>)}</div>)}</div>;
}

export function ProjectActivity({ projectId, data }: { projectId: string; data: WorkspaceData }) {
  const events = data.projectActivity.filter((event) => event.entity_id === projectId);
  if (events.length === 0) return null;
  return <details className="project-activity mt-3"><summary className="record-meta">Activity history ({events.length})</summary><div className="mt-2 space-y-1">{events.map((event) => <div className="compact-row" key={event.id}><span>{activityEventLabel(event.event_type)}</span><span className="tag">{new Date(event.occurred_at).toLocaleString()}</span></div>)}</div></details>;
}

export function ProjectList({ projects, data, onCommand }: { projects: WorkspaceData["projects"]; data: WorkspaceData; onCommand: WorkspaceCommandFn }) {
  const notify = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  async function act(command: Record<string, unknown>, success: string) {
    try { await onCommand(command); notify(success, "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not update that project.", "error"); }
  }
  return <div className="space-y-4">{projects.map((project) => {
    const domain = project.domain_id ? data.domains.find((item) => item.id === project.domain_id) : undefined;
    const person = project.person_id ? data.people.find((item) => item.id === project.person_id) : undefined;
    const milestones = data.milestones.filter((milestone) => milestone.project_id === project.id);
    const completed = milestones.filter((milestone) => milestone.status === "completed").length;
    const editMenuActions: MenuAction[] = [{ label: "Edit", onClick: () => setEditingId(project.id) }, { label: "Delete", onClick: () => act({ action: "delete_project", projectId: project.id }, "Project deleted."), tone: "danger" }];
    const activeMenuActions: MenuAction[] = [{ label: "Edit", onClick: () => setEditingId(project.id) }, { label: "Cancel", onClick: () => act({ action: "cancel_project", projectId: project.id }, "Project canceled.") }, { label: "Delete", onClick: () => act({ action: "delete_project", projectId: project.id }, "Project deleted."), tone: "danger" }];
    return <article className="project-card" key={project.id}><div className={`record-card${domain ? " record-card--domain" : ""}`} style={domain ? ({ "--domain-color": domain.color } as CSSProperties) : undefined}><div><h3>{project.name}</h3>{project.description && <p className="record-copy">{project.description}</p>}<p className="record-meta">{project.target_on ? `Target ${project.target_on}` : "No target date"} · {milestones.length ? `${completed}/${milestones.length} milestones complete` : "No milestones yet"}</p>{(domain || person) && <p className="record-meta flex flex-wrap items-center gap-2">{domain && <span><i className="domain-dot" style={{ background: domain.color }} />{domain.name}</span>}{person && <span>{person.name}</span>}</p>}</div><div className="record-actions"><span className="tag capitalize">{project.status}</span>{project.archived_at ? <button className="button-base button-primary" onClick={() => act({ action: "restore_project", projectId: project.id }, "Project restored.")}>Restore</button> : project.status === "active" ? <><button className="button-base button-secondary" onClick={() => act({ action: "record_project_progress", projectId: project.id }, "Progress recorded.")}>Mark progress</button><button className="button-base button-quiet" onClick={() => act({ action: "pause_project", projectId: project.id }, "Project paused.")}>Pause</button><button className="button-base button-primary" onClick={() => act({ action: "complete_project", projectId: project.id }, "Project completed.")}>Complete project</button><ActionsMenu actions={activeMenuActions} /></> : project.status === "paused" ? <><button className="button-base button-primary" onClick={() => act({ action: "resume_project", projectId: project.id }, "Project resumed.")}>Resume</button><ActionsMenu actions={activeMenuActions} /></> : <ActionsMenu actions={editMenuActions} />}</div></div>{editingId === project.id ? <Dialog open title="Edit project" size="lg" onClose={() => setEditingId(null)}><ProjectEditForm project={project} data={data} onCommand={onCommand} onDone={() => setEditingId(null)} /></Dialog> : null}<div className="project-milestones"><form className="inline-form" onSubmit={(event) => { event.preventDefault(); const form = event.currentTarget; act({ action: "create_milestone", projectId: project.id, title: formValue(form, "title") }, "Milestone added.").then(() => form.reset()); }}><input type="hidden" name="projectId" value={project.id} /><label className="sr-only" htmlFor={`milestone-${project.id}`}>New milestone</label><input className="field-base" id={`milestone-${project.id}`} name="title" required maxLength={280} placeholder="Add a checkpoint" /><button className="button-base button-secondary" type="submit">Add milestone</button></form>{milestones.map((milestone) => <div className="compact-row" key={milestone.id}><span>{milestone.title}</span><span className="compact-row-actions"><button className="button-base button-quiet" onClick={() => act({ action: milestone.status === "open" ? "complete_milestone" : "reopen_milestone", milestoneId: milestone.id }, milestone.status === "open" ? "Milestone completed." : "Milestone reopened.")}>{milestone.status === "open" ? "Complete" : "Reopen"}</button><button className="button-base button-quiet" onClick={() => act({ action: "delete_milestone", milestoneId: milestone.id }, "Milestone deleted.")}>Delete</button></span></div>)}</div><ProjectChecklist projectId={project.id} data={data} onCommand={onCommand} /><ProjectActivity projectId={project.id} data={data} /></article>;
  })}{projects.length === 0 && <p className="empty-state">Projects appear here when an outcome needs more than one action.</p>}</div>;
}
