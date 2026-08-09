"use client";

import { useEffect, useMemo, useState } from "react";
import { SearchFilters } from "@/components/workspace/search/search-filters";
import {
  defaultSearchFilters,
  isDefaultSearchFilters,
  searchRecords,
  type SearchFilterState,
  type SearchFullTextMatches,
  type SearchRecordType,
} from "@/lib/search";
import type { SearchPageData } from "@/lib/workspace-page-data";

/* Debounce for the server-side full-text prefilter (src/app/api/search/route.ts), so a request
   fires once typing pauses rather than on every keystroke. */
const FULL_TEXT_DEBOUNCE_MS = 250;

export function SearchPage({
  data,
  resultLimit,
}: {
  data: SearchPageData;
  /** Remotely configurable via app_config ("search.result_limit"); see
   * src/app/(authenticated)/search/page.tsx for where it is read. */
  resultLimit: number;
}) {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilterState>(defaultSearchFilters);
  /* Tagged with the exact query string it answers, not just the latest response received: a
     debounced fetch for an earlier keystroke can resolve after the user has kept typing, and
     using it against the newer query text would silently show wrong matches. `fullTextMatches`
     below only reads this when the tag still matches the live `query`, so a stale or failed
     response is invisible rather than wrong — searchRecords then falls back to its original
     in-memory substring match for that render, exactly as if no server answer had ever arrived. */
  const [fullTextState, setFullTextState] = useState<
    { query: string; matches: SearchFullTextMatches } | undefined
  >(undefined);

  const hasQuery = query.trim().length > 0;
  const filtersActive = !isDefaultSearchFilters(filters);
  const shouldSearch = hasQuery || filtersActive;

  useEffect(() => {
    if (!hasQuery) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error(`Full-text search request failed (${response.status})`);
        const payload = (await response.json()) as Partial<Record<SearchRecordType, string[]>>;
        if (cancelled) return;
        const matches: SearchFullTextMatches = {};
        for (const [type, ids] of Object.entries(payload) as Array<[SearchRecordType, string[]]>) {
          matches[type] = new Set(ids);
        }
        setFullTextState({ query, matches });
      } catch (error) {
        if (cancelled) return;
        // Left unresolved for this query text; searchRecords falls back to substring matching.
        console.error("Full-text search prefilter failed; using local matching instead.", error);
      }
    }, FULL_TEXT_DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, hasQuery]);

  const fullTextMatches = fullTextState?.query === query ? fullTextState.matches : undefined;

  const results = useMemo(
    () => (shouldSearch ? searchRecords(data, query, filters, resultLimit, fullTextMatches) : []),
    [data, query, filters, shouldSearch, resultLimit, fullTextMatches],
  );

  return (
    <main className="workspace-page">
      <header className="page-intro">
        <p className="eyebrow">Search</p>
        <h1>Find the thing you meant to keep.</h1>
        <p>
          This working-prototype search only queries records already authorized for your account.
        </p>
      </header>
      <label className="field-label">
        <span>Search all current records</span>
        <input
          autoFocus
          className="field-base search-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try a client, project, task, or phrase"
        />
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
          {shouldSearch && results.length === 0 && (
            <p className="empty-state">Nothing matched. Search stays inside your own records.</p>
          )}
          {!shouldSearch && (
            <p className="empty-state">
              Start with a word or phrase, or set a filter below to browse without typing.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
