"use client";

import { ArrowCounterClockwise } from "@phosphor-icons/react";
import type { WorkspaceData } from "@/lib/workspace";
import { FilterSelect } from "@/components/workspace/shared/filter-select";

export type RetainerFilterState = { status: "current" | "ended" | "deleted" | "any" };

export const defaultRetainerFilters: RetainerFilterState = { status: "current" };

export function filterRetainers(retainers: WorkspaceData["retainers"], filters: RetainerFilterState) {
  return retainers.filter((retainer) => {
    if (filters.status === "current") return !retainer.archived_at && (retainer.status === "active" || retainer.status === "paused");
    if (filters.status === "ended") return !retainer.archived_at && retainer.status === "ended";
    if (filters.status === "deleted") return Boolean(retainer.archived_at);
    return true;
  });
}

export function RetainerFilters({ filters, onChange }: { filters: RetainerFilterState; onChange: (next: RetainerFilterState) => void }) {
  const isDefault = filters.status === defaultRetainerFilters.status;
  return <div className="task-filter-bar" role="group" aria-label="Filter retainers">
    <FilterSelect label="Status" value={filters.status} active={!isDefault} onChange={(value) => onChange({ status: value as RetainerFilterState["status"] })}><option value="current">Current (active or paused)</option><option value="ended">Ended</option><option value="deleted">Deleted</option><option value="any">Any status</option></FilterSelect>
    {!isDefault && <button className="task-filter-reset" type="button" onClick={() => onChange(defaultRetainerFilters)}><ArrowCounterClockwise aria-hidden size={13} weight="bold" />Reset</button>}
  </div>;
}
