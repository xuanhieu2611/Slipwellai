"use client";

import { useMemo, useState } from "react";
import { SearchFilters } from "@/components/workspace/search/search-filters";
import { defaultSearchFilters, isDefaultSearchFilters, searchRecords, type SearchFilterState } from "@/lib/search";
import type { SearchPageData } from "@/lib/workspace-page-data";

export function SearchPage({ data }: { data: SearchPageData }) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilterState>(defaultSearchFilters);

  const hasQuery = query.trim().length > 0;
  const filtersActive = !isDefaultSearchFilters(filters);
  const shouldSearch = hasQuery || filtersActive;

  const results = useMemo(() => (shouldSearch ? searchRecords(data, query, filters) : []), [data, query, filters, shouldSearch]);

  return (
    <main className="workspace-page">
      <header className="page-intro">
        <p className="eyebrow">Search</p>
        <h1>Find the thing you meant to keep.</h1>
        <p>This working-prototype search only queries records already authorized for your account.</p>
      </header>
      <label className="field-label">
        <span>Search all current records</span>
        <input autoFocus className="field-base search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try a client, project, task, or phrase" />
      </label>
      <SearchFilters data={data} filters={filters} onChange={setFilters} />
      <section className="workspace-section mt-6">
        <div className="section-heading">
          <h2>Results</h2>
          {shouldSearch && <span className="tag">{results.length} found</span>}
        </div>
        <div className="space-y-3">
          {results.map((result) => (
            <article className="record-card" key={`${result.type}-${result.id}`}>
              <div>
                <span className="tag tag--accent capitalize">{result.typeLabel}</span>
                <h3 className="mt-1.5">{result.title}</h3>
                {result.context && <p className="record-copy">{result.context}</p>}
              </div>
            </article>
          ))}
          {shouldSearch && results.length === 0 && <p className="empty-state">Nothing matched. Search stays inside your own records.</p>}
          {!shouldSearch && (
            <p className="empty-state">Start with a word or phrase, or set a filter below to browse without typing. Full-text indexing is the next hardening step; this prototype view demonstrates the unified search experience.</p>
          )}
        </div>
      </section>
    </main>
  );
}
