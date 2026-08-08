"use client";

import { type FormEvent, useState } from "react";
import { Plus } from "@phosphor-icons/react";
import type { WorkspaceData } from "@/lib/workspace";
import { useToast } from "@/components/ui/toast";
import { Dialog } from "@/components/ui/primitives";
import { formValue } from "@/components/workspace/shared/form-utils";
import type { WorkspaceCommandFn } from "@/components/workspace/shared/use-workspace-command";

export function TemplateItemRow({ item, onCommand }: { item: WorkspaceData["checklistTemplateItems"][number]; onCommand: WorkspaceCommandFn }) {
  const notify = useToast();
  const [editing, setEditing] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    try {
      await onCommand({ action: "update_checklist_template_item", itemId: item.id, title: formValue(form, "title"), applyToExisting: new FormData(form).get("applyToExisting") === "on" });
      notify("Template step updated.", "success");
      setEditing(false);
    } catch (error) { notify(error instanceof Error ? error.message : "Could not update that step.", "error"); }
  }
  async function remove() {
    try { await onCommand({ action: "delete_checklist_template_item", itemId: item.id }); notify("Template step removed.", "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not remove that step.", "error"); }
  }
  if (editing) return <form className="inline-form" onSubmit={submit}><label className="sr-only" htmlFor={`edit-item-${item.id}`}>Step title</label><input className="field-base" id={`edit-item-${item.id}`} name="title" required maxLength={280} defaultValue={item.title} /><label className="inline-checkbox"><input type="checkbox" name="applyToExisting" />Also update this step on already-applied, still-open checklists</label><button className="button-base button-primary" type="submit">Save</button><button className="button-base button-quiet" type="button" onClick={() => setEditing(false)}>Cancel</button></form>;
  return <div className="compact-row"><span>{item.title}</span><span className="compact-row-actions"><button className="button-base button-quiet" onClick={() => setEditing(true)}>Edit</button><button className="button-base button-quiet" onClick={remove}>Delete</button></span></div>;
}

export function TemplateLibrary({ data, onCommand }: { data: WorkspaceData; onCommand: WorkspaceCommandFn }) {
  const notify = useToast();
  const [creating, setCreating] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>, makeCommand: (form: HTMLFormElement) => Record<string, unknown>, success: string, onSuccess?: () => void) {
    event.preventDefault();
    try { const form = event.currentTarget; await onCommand(makeCommand(form)); form.reset(); notify(success, "success"); onSuccess?.(); } catch (error) { notify(error instanceof Error ? error.message : "Could not save that template.", "error"); }
  }
  async function removeTemplate(templateId: string) {
    try { await onCommand({ action: "delete_checklist_template", templateId }); notify("Template deleted.", "success"); } catch (error) { notify(error instanceof Error ? error.message : "Could not delete that template.", "error"); }
  }
  return <section className="workspace-section"><div className="section-heading"><div><h2>Reusable plans</h2><p className="section-note">Checklist templates</p></div><button className="button-base button-secondary" onClick={() => setCreating(true)}><Plus aria-hidden size={16} weight="bold" />New template</button></div><Dialog open={creating} title="New checklist template" onClose={() => setCreating(false)}>{creating ? <form className="form-grid" onSubmit={(event) => submit(event, (form) => ({ action: "create_checklist_template", name: formValue(form, "name"), description: formValue(form, "description") }), "Checklist template created.", () => setCreating(false))}><label className="field-label form-span"><span>Template name</span><input className="field-base" name="name" required maxLength={160} placeholder="Monthly client report" /></label><label className="field-label form-span"><span>Description</span><input className="field-base" name="description" maxLength={1000} placeholder="Optional context" /></label><button className="button-base button-primary form-submit">Create template</button></form> : null}</Dialog><p className="record-copy">Each application captures the current template version, so later edits only affect future applications unless you explicitly choose to update existing open checklists too.</p><div className="mt-5 space-y-4">{data.checklistTemplates.map((template) => { const items = data.checklistTemplateItems.filter((item) => item.template_id === template.id); return <article className="project-card" key={template.id}><div className="record-card"><div><h3>{template.name}</h3>{template.description && <p className="record-copy">{template.description}</p>}<p className="record-meta">Version {template.version}, {items.length} items</p></div><div className="record-actions"><button className="button-base button-quiet" onClick={() => removeTemplate(template.id)}>Delete template</button></div></div><div className="project-milestones"><form className="inline-form" onSubmit={(event) => submit(event, (form) => ({ action: "add_checklist_template_item", templateId: formValue(form, "templateId"), title: formValue(form, "title") }), "Step added to the template.")}><input type="hidden" name="templateId" value={template.id} /><label className="sr-only" htmlFor={`template-item-${template.id}`}>New template item</label><input className="field-base" id={`template-item-${template.id}`} name="title" required maxLength={280} placeholder="Add checklist step" /><button className="button-base button-secondary" type="submit">Add step</button></form>{items.map((item) => <TemplateItemRow item={item} onCommand={onCommand} key={item.id} />)}<form className="inline-form mt-3" onSubmit={(event) => submit(event, (form) => ({ action: "apply_checklist_template", templateId: formValue(form, "templateId"), projectId: formValue(form, "projectId") }), "Checklist applied to the project.")}><input type="hidden" name="templateId" value={template.id} /><label className="sr-only" htmlFor={`apply-${template.id}`}>Apply to project</label><select className="field-base" id={`apply-${template.id}`} name="projectId" defaultValue="" required><option value="" disabled>Apply to a project</option>{data.projects.filter((project) => project.status === "active" && !project.archived_at).map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><button className="button-base button-primary" type="submit">Apply</button></form></div></article>; })}{data.checklistTemplates.length === 0 && <p className="empty-state">Save a reusable plan only when you expect to use it again.</p>}</div></section>;
}
