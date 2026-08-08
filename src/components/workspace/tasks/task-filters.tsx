"use client";

import { ArrowCounterClockwise } from "@phosphor-icons/react";
import type { WorkspaceData } from "@/lib/workspace";
import { FilterSelect } from "@/components/workspace/shared/filter-select";

export type TaskFilterState = {
  status: "open" | "completed" | "canceled" | "deleted" | "any";
  hasDate: "any" | "has" | "none";
  priority: "any" | "1" | "2" | "3";
  domainId: string;
  projectId: string;
  personId: string;
  slipping: "any" | "only";
  sort: "created" | "date" | "priority";
};

export const defaultTaskFilters: TaskFilterState = { status: "open", hasDate: "any", priority: "any", domainId: "", projectId: "", personId: "", slipping: "any", sort: "created" };

export function taskHasDate(task: WorkspaceData["tasks"][number]) {
  return Boolean(task.due_on || task.scheduled_for || task.deferred_until);
}

export function filterAndSortTasks(tasks: WorkspaceData["tasks"], filters: TaskFilterState, slippingTaskIds: Set<string>) {
  const filtered = tasks.filter((task) => {
    if (filters.status === "open" && (task.status !== "open" || task.archived_at)) return false;
    if (filters.status === "completed" && (task.status !== "completed" || task.archived_at)) return false;
    if (filters.status === "canceled" && (task.status !== "canceled" || task.archived_at)) return false;
    if (filters.status === "deleted" && !task.archived_at) return false;
    if (filters.hasDate === "has" && !taskHasDate(task)) return false;
    if (filters.hasDate === "none" && taskHasDate(task)) return false;
    if (filters.priority !== "any" && String(task.priority) !== filters.priority) return false;
    if (filters.domainId && task.domain_id !== filters.domainId) return false;
    if (filters.projectId && task.project_id !== filters.projectId) return false;
    if (filters.personId && task.person_id !== filters.personId) return false;
    if (filters.slipping === "only" && !slippingTaskIds.has(task.id)) return false;
    return true;
  });
  if (filters.sort === "priority") return [...filtered].sort((a, b) => b.priority - a.priority);
  if (filters.sort === "date") return [...filtered].sort((a, b) => {
    const dateA = a.deferred_until ?? a.due_on ?? a.scheduled_for;
    const dateB = b.deferred_until ?? b.due_on ?? b.scheduled_for;
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    return dateA.localeCompare(dateB);
  });
  return filtered; // "created": data.tasks already arrives ordered by created_at desc.
}

export function TaskFilters({ data, filters, onChange }: { data: WorkspaceData; filters: TaskFilterState; onChange: (next: TaskFilterState) => void }) {
  function set<K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]) {
    onChange({ ...filters, [key]: value });
  }
  const isDefault = JSON.stringify(filters) === JSON.stringify(defaultTaskFilters);
  return <div className="task-filter-bar" role="group" aria-label="Filter and sort tasks">
    <FilterSelect label="Status" value={filters.status} active={filters.status !== defaultTaskFilters.status} onChange={(value) => set("status", value as TaskFilterState["status"])}><option value="open">Open</option><option value="completed">Completed</option><option value="canceled">Canceled</option><option value="deleted">Deleted</option><option value="any">Any status</option></FilterSelect>
    <FilterSelect label="Date" value={filters.hasDate} active={filters.hasDate !== defaultTaskFilters.hasDate} onChange={(value) => set("hasDate", value as TaskFilterState["hasDate"])}><option value="any">Any date</option><option value="has">Has a date</option><option value="none">No date</option></FilterSelect>
    <FilterSelect label="Priority" value={filters.priority} active={filters.priority !== defaultTaskFilters.priority} onChange={(value) => set("priority", value as TaskFilterState["priority"])}><option value="any">Any priority</option><option value="1">Low</option><option value="2">Normal</option><option value="3">High</option></FilterSelect>
    <FilterSelect label="Domain" value={filters.domainId} active={filters.domainId !== ""} onChange={(value) => set("domainId", value)}><option value="">Any domain</option>{data.domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}</FilterSelect>
    <FilterSelect label="Project" value={filters.projectId} active={filters.projectId !== ""} onChange={(value) => set("projectId", value)}><option value="">Any project</option>{data.projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</FilterSelect>
    <FilterSelect label="Person" value={filters.personId} active={filters.personId !== ""} onChange={(value) => set("personId", value)}><option value="">Any person</option>{data.people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</FilterSelect>
    <FilterSelect label="Slipping" value={filters.slipping} active={filters.slipping !== defaultTaskFilters.slipping} onChange={(value) => set("slipping", value as TaskFilterState["slipping"])}><option value="any">Any</option><option value="only">Slipping only</option></FilterSelect>
    <span className="task-filter-sort-group"><span className="task-filter-divider" aria-hidden="true" /><FilterSelect label="Sort by" value={filters.sort} active={filters.sort !== defaultTaskFilters.sort} onChange={(value) => set("sort", value as TaskFilterState["sort"])}><option value="created">Newest first</option><option value="date">Due or scheduled date</option><option value="priority">Priority</option></FilterSelect></span>
    {!isDefault && <button className="task-filter-reset" type="button" onClick={() => onChange(defaultTaskFilters)}><ArrowCounterClockwise aria-hidden size={13} weight="bold" />Reset</button>}
  </div>;
}
