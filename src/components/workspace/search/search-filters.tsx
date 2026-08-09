"use client";

import { ArrowCounterClockwise } from "@phosphor-icons/react";
import { FilterSelect } from "@/components/workspace/shared/filter-select";
import {
  defaultSearchFilters,
  isDefaultSearchFilters,
  SEARCH_RECORD_TYPES,
  SEARCH_TYPE_LABELS,
  type SearchFilterState,
  type SearchRecordType,
} from "@/lib/search";
import type { SearchPageData } from "@/lib/workspace-page-data";

export function SearchFilters({
  data,
  filters,
  onChange,
}: {
  data: SearchPageData;
  filters: SearchFilterState;
  onChange: (next: SearchFilterState) => void;
}) {
  function set<K extends keyof SearchFilterState>(key: K, value: SearchFilterState[K]) {
    onChange({ ...filters, [key]: value });
  }
  function toggleType(type: SearchRecordType) {
    const next = filters.types.includes(type)
      ? filters.types.filter((item) => item !== type)
      : [...filters.types, type];
    set("types", next);
  }
  const isDefault = isDefaultSearchFilters(filters);
  const dateActive = Boolean(filters.dateFrom || filters.dateTo);

  return (
    <div className="task-filter-bar" role="group" aria-label="Filter search results">
      <div className="search-type-filter" role="group" aria-label="Record types">
        <span className="filter-select-label">Types</span>
        {SEARCH_RECORD_TYPES.map((type) => (
          <label className="inline-checkbox" key={type}>
            <input
              type="checkbox"
              checked={filters.types.includes(type)}
              onChange={() => toggleType(type)}
            />
            {SEARCH_TYPE_LABELS[type]}
          </label>
        ))}
      </div>
      <FilterSelect
        label="Status"
        value={filters.status}
        active={filters.status !== defaultSearchFilters.status}
        onChange={(value) => set("status", value as SearchFilterState["status"])}
        options={[
          { value: "any", label: "Any status" },
          { value: "open", label: "Open" },
          { value: "completed", label: "Completed" },
          { value: "canceled", label: "Canceled" },
        ]}
      />
      <FilterSelect
        label="Domain"
        value={filters.domainId}
        active={filters.domainId !== ""}
        onChange={(value) => set("domainId", value)}
        options={[
          { value: "", label: "Any domain" },
          ...data.domains.map((domain) => ({ value: domain.id, label: domain.name })),
        ]}
      />
      <FilterSelect
        label="Project"
        value={filters.projectId}
        active={filters.projectId !== ""}
        onChange={(value) => set("projectId", value)}
        options={[
          { value: "", label: "Any project" },
          ...data.projects.map((project) => ({ value: project.id, label: project.name })),
        ]}
      />
      <FilterSelect
        label="Person"
        value={filters.personId}
        active={filters.personId !== ""}
        onChange={(value) => set("personId", value)}
        options={[
          { value: "", label: "Any person" },
          ...data.people.map((person) => ({ value: person.id, label: person.name })),
        ]}
      />
      <div className={`search-date-filter${dateActive ? " is-active" : ""}`}>
        <span className="filter-select-label">Date</span>
        <label className="sr-only" htmlFor="search-date-from">
          From date
        </label>
        <input
          className="field-base"
          id="search-date-from"
          type="date"
          value={filters.dateFrom}
          max={filters.dateTo || undefined}
          onChange={(event) => set("dateFrom", event.target.value)}
        />
        <span className="search-date-filter-sep" aria-hidden="true">
          &ndash;
        </span>
        <label className="sr-only" htmlFor="search-date-to">
          To date
        </label>
        <input
          className="field-base"
          id="search-date-to"
          type="date"
          value={filters.dateTo}
          min={filters.dateFrom || undefined}
          onChange={(event) => set("dateTo", event.target.value)}
        />
      </div>
      {!isDefault && (
        <button
          className="task-filter-reset"
          type="button"
          onClick={() => onChange(defaultSearchFilters)}
        >
          <ArrowCounterClockwise aria-hidden size={13} weight="bold" />
          Reset
        </button>
      )}
    </div>
  );
}
