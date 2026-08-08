"use client";

import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { FilterSelect } from "@/components/workspace/shared/filter-select";
import type { WorkspaceData } from "@/lib/workspace";

export type ProjectFilterState = { status: "current" | "completed" | "canceled" | "deleted" | "any" };

export const defaultProjectFilters: ProjectFilterState = { status: "current" };

export function filterProjects(projects: WorkspaceData["projects"], filters: ProjectFilterState) {
  return projects.filter((project) => {
    if (filters.status === "current") return !project.archived_at && ["planned", "active", "paused"].includes(project.status);
    if (filters.status === "completed") return !project.archived_at && project.status === "completed";
    if (filters.status === "canceled") return !project.archived_at && project.status === "canceled";
    if (filters.status === "deleted") return Boolean(project.archived_at);
    return true;
  });
}

export function ProjectFilters({ filters, onChange }: { filters: ProjectFilterState; onChange: (next: ProjectFilterState) => void }) {
  const isDefault = filters.status === defaultProjectFilters.status;
  return <div className="task-filter-bar" role="group" aria-label="Filter projects">
    <FilterSelect label="Status" value={filters.status} active={!isDefault} onChange={(value) => onChange({ status: value as ProjectFilterState["status"] })}><option value="current">Current work</option><option value="completed">Completed</option><option value="canceled">Canceled</option><option value="deleted">Deleted</option><option value="any">Any status</option></FilterSelect>
    {!isDefault && <button className="task-filter-reset" type="button" onClick={() => onChange(defaultProjectFilters)}><ArrowCounterClockwise aria-hidden size={13} weight="bold" />Reset</button>}
  </div>;
}
