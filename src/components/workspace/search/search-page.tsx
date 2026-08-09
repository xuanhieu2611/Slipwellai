"use client";

import { useMemo, useState } from "react";
import type { SearchPageData } from "@/lib/workspace-page-data";

export function SearchPage({ data }: { data: SearchPageData }) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const entries = [
      ...data.tasks.map((item) => ({
        type: "Task",
        title: item.title,
        context: item.details ?? "",
        id: item.id,
      })),
      ...data.projects.map((item) => ({
        type: "Project",
        title: item.name,
        context: item.description ?? "",
        id: item.id,
      })),
      ...data.people.map((item) => ({
        type: "Person",
        title: item.name,
        context: item.context ?? "",
        id: item.id,
      })),
      ...data.notes.map((item) => ({
        type: "Note",
        title: item.title,
        context: item.body ?? "",
        id: item.id,
      })),
      ...data.domains.map((item) => ({
        type: "Domain",
        title: item.name,
        context: "",
        id: item.id,
      })),
      ...data.captures.map((item) => ({
        type: "Capture",
        title: item.original_text,
        context: item.status,
        id: item.id,
      })),
    ];
    return entries
      .filter((item) => `${item.title} ${item.context}`.toLowerCase().includes(q))
      .slice(0, 30);
  }, [data, query]);

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
      <section className="workspace-section mt-6">
        <div className="section-heading">
          <h2>Results</h2>
          {query && <span className="tag">{results.length} found</span>}
        </div>
        <div className="space-y-3">
          {results.map((result) => (
            <article className="record-card" key={`${result.type}-${result.id}`}>
              <div>
                <span className="tag tag--accent capitalize">{result.type}</span>
                <h3 className="mt-1.5">{result.title}</h3>
                {result.context && <p className="record-copy">{result.context}</p>}
              </div>
            </article>
          ))}
          {query && results.length === 0 && (
            <p className="empty-state">Nothing matched. Search stays inside your own records.</p>
          )}
          {!query && (
            <p className="empty-state">
              Start with a word or phrase. Full-text indexing is the next hardening step; this
              prototype view demonstrates the unified search experience.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
