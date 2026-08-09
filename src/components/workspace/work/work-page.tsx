"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import type { WorkspaceData } from "@/lib/workspace";
import type { WorkPageData } from "@/lib/workspace-page-data";
import { Dialog } from "@/components/ui/primitives";
import { DomainColorPicker } from "@/components/workspace/shared/selects";
import { useWorkspaceCommand } from "@/components/workspace/shared/use-workspace-command";
import {
  defaultProjectFilters,
  filterProjects,
  ProjectFilters,
  type ProjectFilterState,
} from "@/components/workspace/work/project-filters";
import { NewProjectForm } from "@/components/workspace/work/project-forms";
import { ProjectList } from "@/components/workspace/work/project-list";
import { TemplateLibrary } from "@/components/workspace/work/template-library";

type CreateDialog = "domain" | "project" | null;

export function WorkPage({ data }: { data: WorkPageData }) {
  const { command, safely, submit } = useWorkspaceCommand();
  const [createDialog, setCreateDialog] = useState<CreateDialog>(null);
  const [editingDomainId, setEditingDomainId] = useState<string | null>(null);
  const [projectFilters, setProjectFilters] = useState<ProjectFilterState>(defaultProjectFilters);
  const filteredProjects = filterProjects(data.projects, projectFilters);
  const fullData = data as WorkspaceData;
  const editingDomain = editingDomainId
    ? data.domains.find((domain) => domain.id === editingDomainId)
    : undefined;

  return (
    <main className="workspace-page">
      <header className="page-intro page-intro--with-action">
        <div className="page-intro-text">
          <p className="eyebrow">Work</p>
          <h1>Finite projects, durable domains.</h1>
          <p>
            Projects have an ending. Domains provide ongoing context without demanding a complete
            taxonomy.
          </p>
        </div>
        <div className="page-actions">
          <button
            className="button-base button-secondary"
            onClick={() => setCreateDialog("domain")}
          >
            <Plus aria-hidden size={16} weight="bold" />
            New domain
          </button>
          <button className="button-base button-primary" onClick={() => setCreateDialog("project")}>
            <Plus aria-hidden size={16} weight="bold" />
            New project
          </button>
        </div>
      </header>
      <Dialog
        open={createDialog === "domain"}
        title="New domain"
        onClose={() => setCreateDialog(null)}
      >
        {createDialog === "domain" ? (
          <form
            className="form-grid"
            onSubmit={(event) =>
              submit(
                event,
                "create_domain",
                {
                  name: "name",
                  description: "description",
                  color: "color",
                  slippingCadenceDays: "slippingCadenceDays",
                },
                "Domain created.",
                () => setCreateDialog(null),
              )
            }
          >
            <label className="field-label form-span">
              <span>Name</span>
              <input
                className="field-base"
                name="name"
                required
                maxLength={80}
                placeholder="Client work"
              />
            </label>
            <label className="field-label form-span">
              <span>Description</span>
              <input
                className="field-base"
                name="description"
                maxLength={1000}
                placeholder="Optional context"
              />
            </label>
            <DomainColorPicker />
            <label className="field-label">
              <span>Default attention cadence (days)</span>
              <input
                className="field-base"
                type="number"
                name="slippingCadenceDays"
                min={1}
                max={365}
                placeholder="Optional"
              />
              <span className="form-help">
                A reference cadence for work in this domain. It is not yet applied automatically to
                new tasks or projects.
              </span>
            </label>
            <button className="button-base button-primary form-submit">Add domain</button>
          </form>
        ) : null}
      </Dialog>
      <Dialog
        open={Boolean(editingDomain)}
        title="Edit domain"
        onClose={() => setEditingDomainId(null)}
      >
        {editingDomain ? (
          <form
            className="form-grid"
            onSubmit={(event) =>
              submit(
                event,
                "update_domain",
                {
                  domainId: "domainId",
                  name: "name",
                  description: "description",
                  color: "color",
                  slippingCadenceDays: "slippingCadenceDays",
                },
                "Domain updated.",
                () => setEditingDomainId(null),
              )
            }
          >
            <input type="hidden" name="domainId" value={editingDomain.id} />
            <label className="field-label form-span">
              <span>Name</span>
              <input
                className="field-base"
                name="name"
                required
                maxLength={80}
                defaultValue={editingDomain.name}
              />
            </label>
            <label className="field-label form-span">
              <span>Description</span>
              <input
                className="field-base"
                name="description"
                maxLength={1000}
                defaultValue={editingDomain.description ?? ""}
                placeholder="Optional context"
              />
            </label>
            <DomainColorPicker defaultValue={editingDomain.color} />
            <label className="field-label">
              <span>Default attention cadence (days)</span>
              <input
                className="field-base"
                type="number"
                name="slippingCadenceDays"
                min={1}
                max={365}
                placeholder="Optional"
                defaultValue={editingDomain.slipping_cadence_days ?? ""}
              />
              <span className="form-help">
                A reference cadence for work in this domain. It is not yet applied automatically to
                new tasks or projects.
              </span>
            </label>
            <button className="button-base button-primary form-submit">Save changes</button>
          </form>
        ) : null}
      </Dialog>
      <Dialog
        open={createDialog === "project"}
        title="New project"
        size="lg"
        onClose={() => setCreateDialog(null)}
      >
        {createDialog === "project" ? (
          <NewProjectForm
            data={fullData}
            onCommand={command}
            onDone={() => setCreateDialog(null)}
          />
        ) : null}
      </Dialog>
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Domains</h2>
            <p className="section-note">Ongoing areas of responsibility</p>
          </div>
          <span className="tag">{data.domains.length} active</span>
        </div>
        <div className="space-y-2">
          {data.domains.map((domain) => {
            const openTaskCount = data.tasks.filter(
              (task) => task.domain_id === domain.id && task.status === "open" && !task.archived_at,
            ).length;
            const activeProjectCount = data.projects.filter(
              (project) =>
                project.domain_id === domain.id &&
                ["planned", "active", "paused"].includes(project.status),
            ).length;
            return (
              <div className="compact-row" key={domain.id}>
                <span>
                  <i className="domain-dot" style={{ background: domain.color }} />
                  {domain.name}
                </span>
                <span className="compact-row-actions">
                  <span className="tag">
                    {openTaskCount} open, {activeProjectCount} active
                  </span>
                  <button
                    className="button-base button-quiet"
                    type="button"
                    onClick={() => setEditingDomainId(domain.id)}
                  >
                    Edit
                  </button>
                  <button
                    className="button-base button-quiet"
                    type="button"
                    onClick={() =>
                      safely(
                        () => command({ action: "archive_domain", domainId: domain.id }),
                        "Domain archived.",
                      )
                    }
                  >
                    Archive
                  </button>
                </span>
              </div>
            );
          })}
          {data.domains.length === 0 && (
            <p className="empty-state">A few domains are enough. You can also skip them.</p>
          )}
        </div>
      </section>
      <section className="workspace-section">
        <div className="section-heading">
          <div>
            <h2>Project progress</h2>
            <p className="section-note">Inspect the plan, not a cosmetic percentage</p>
          </div>
          <span className="tag">{filteredProjects.length} shown</span>
        </div>
        <ProjectFilters filters={projectFilters} onChange={setProjectFilters} />
        <ProjectList projects={filteredProjects} data={fullData} onCommand={command} />
      </section>
      <TemplateLibrary data={fullData} onCommand={command} />
    </main>
  );
}
