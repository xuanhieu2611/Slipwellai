"use client";

import { useState } from "react";
import { Plus } from "@phosphor-icons/react";
import type { WorkspaceData } from "@/lib/workspace";
import type { WorkPageData } from "@/lib/workspace-page-data";
import { Dialog } from "@/components/ui/primitives";
import { DomainColorPicker } from "@/components/workspace/shared/selects";
import { useWorkspaceCommand } from "@/components/workspace/shared/use-workspace-command";
import { defaultProjectFilters, filterProjects, ProjectFilters, type ProjectFilterState } from "@/components/workspace/work/project-filters";
import { NewProjectForm } from "@/components/workspace/work/project-forms";
import { ProjectList } from "@/components/workspace/work/project-list";
import { TemplateLibrary } from "@/components/workspace/work/template-library";

type CreateDialog = "domain" | "project" | null;

export function WorkPage({ data }: { data: WorkPageData }) {
  const { command, safely, submit } = useWorkspaceCommand();
  const [createDialog, setCreateDialog] = useState<CreateDialog>(null);
  const [projectFilters, setProjectFilters] = useState<ProjectFilterState>(defaultProjectFilters);
  const filteredProjects = filterProjects(data.projects, projectFilters);
  const fullData = data as WorkspaceData;

  return (
    <main className="workspace-page">
      <header className="page-intro page-intro--with-action">
        <div className="page-intro-text">
          <p className="eyebrow">Work</p>
          <h1>Finite projects, durable domains.</h1>
          <p>Projects have an ending. Domains provide ongoing context without demanding a complete taxonomy.</p>
        </div>
        <div className="page-actions">
          <button className="button-base button-secondary" onClick={() => setCreateDialog("domain")}>
            <Plus aria-hidden size={16} weight="bold" />
            New domain
          </button>
          <button className="button-base button-primary" onClick={() => setCreateDialog("project")}>
            <Plus aria-hidden size={16} weight="bold" />
            New project
          </button>
        </div>
      </header>
      {createDialog === "domain" && (
        <Dialog title="New domain" onClose={() => setCreateDialog(null)}>
          <form className="form-grid" onSubmit={(event) => submit(event, "create_domain", { name: "name", description: "description", color: "color" }, "Domain created.", () => setCreateDialog(null))}>
            <label className="field-label form-span">
              <span>Name</span>
              <input className="field-base" name="name" required maxLength={80} placeholder="Client work" />
            </label>
            <label className="field-label form-span">
              <span>Description</span>
              <input className="field-base" name="description" maxLength={1000} placeholder="Optional context" />
            </label>
            <DomainColorPicker />
            <button className="button-base button-primary form-submit">Add domain</button>
          </form>
        </Dialog>
      )}
      {createDialog === "project" && (
        <Dialog title="New project" size="lg" onClose={() => setCreateDialog(null)}>
          <NewProjectForm data={fullData} onCommand={command} onDone={() => setCreateDialog(null)} />
        </Dialog>
      )}
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
            const openTaskCount = data.tasks.filter((task) => task.domain_id === domain.id && task.status === "open" && !task.archived_at).length;
            const activeProjectCount = data.projects.filter((project) => project.domain_id === domain.id && ["planned", "active", "paused"].includes(project.status)).length;
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
                  <button className="button-base button-quiet" onClick={() => safely(() => command({ action: "archive_domain", domainId: domain.id }), "Domain archived.")}>
                    Archive
                  </button>
                </span>
              </div>
            );
          })}
          {data.domains.length === 0 && <p className="empty-state">A few domains are enough. You can also skip them.</p>}
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
