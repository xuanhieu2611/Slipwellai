import type { SearchPageData } from "@/lib/workspace-page-data";

/**
 * Global search filtering (MVP-BUILD-TRACKER.md Step 9 — Search).
 *
 * Search aggregates six record types that do not share a single schema, so this module
 * makes three deliberate scoping decisions instead of forcing a fully unified model:
 *
 * 1. Status: only tasks, projects, and captures have a meaningful status concept. Each is
 *    mapped onto one shared three-bucket vocabulary (open / completed / canceled) so a single
 *    filter control works across them. There is deliberately no "archived"/"deleted" bucket:
 *    `getSearchData` (src/lib/workspace-data.ts) already strips archived_at rows out of tasks,
 *    projects, people, and notes before this module ever sees them, so an archived task/project
 *    can never reach here to populate such a bucket — offering the option in the UI would be a
 *    filter that always returns zero results for those types, which is worse than not offering
 *    it. People, notes, and domains have no status field at all, so when a non-"any" status is
 *    selected they are excluded from results rather than guessed at.
 * 2. Domain/project/person narrowing: applies to any record type that carries the matching
 *    foreign key (tasks, projects, people, notes all carry domain_id; tasks and notes carry
 *    project_id and person_id). A domain/project/person record also matches a filter for its
 *    own id, since selecting "Domain: Acme" should surface the Acme domain record itself
 *    alongside everything linked to it. Captures carry none of these relationships in the
 *    current schema, so they are excluded whenever one of these filters is active.
 * 3. Date range: there is no unified date field, so each type contributes its single most
 *    relevant date — task due/scheduled/deferred date, project target date, note review date,
 *    capture created date (truncated to a UTC calendar day; capture dates are full timestamps
 *    while the others are already plain calendar dates). People and domains have no relevant
 *    date, so they are excluded whenever a date range filter is active.
 */

export const SEARCH_RECORD_TYPES = [
  "task",
  "project",
  "person",
  "note",
  "domain",
  "capture",
] as const;
export type SearchRecordType = (typeof SEARCH_RECORD_TYPES)[number];

export const SEARCH_TYPE_LABELS: Record<SearchRecordType, string> = {
  task: "Task",
  project: "Project",
  person: "Person",
  note: "Note",
  domain: "Domain",
  capture: "Capture",
};

export type SearchStatusFilter = "any" | "open" | "completed" | "canceled";
type SearchStatusBucket = Exclude<SearchStatusFilter, "any">;

export type SearchFilterState = {
  types: SearchRecordType[];
  status: SearchStatusFilter;
  domainId: string;
  projectId: string;
  personId: string;
  dateFrom: string;
  dateTo: string;
};

export const defaultSearchFilters: SearchFilterState = {
  types: [...SEARCH_RECORD_TYPES],
  status: "any",
  domainId: "",
  projectId: "",
  personId: "",
  dateFrom: "",
  dateTo: "",
};

export function isDefaultSearchFilters(filters: SearchFilterState) {
  return (
    filters.types.length === SEARCH_RECORD_TYPES.length &&
    filters.status === "any" &&
    !filters.domainId &&
    !filters.projectId &&
    !filters.personId &&
    !filters.dateFrom &&
    !filters.dateTo
  );
}

export type SearchResult = {
  type: SearchRecordType;
  typeLabel: string;
  id: string;
  title: string;
  context: string;
};

type SearchEntry = SearchResult & {
  domainId: string | null;
  projectId: string | null;
  personId: string | null;
  statusBucket: SearchStatusBucket | null;
  relevantDate: string | null;
};

/** archived_at is already filtered out upstream by the time data reaches this module (see the
 * module doc comment), so this only ever sees the three live statuses in practice; the
 * archived_at check is a defensive no-op kept in case that upstream guarantee ever changes. */
function taskStatusBucket(task: SearchPageData["tasks"][number]): SearchStatusBucket | null {
  if (task.archived_at) return null;
  if (task.status === "open") return "open";
  if (task.status === "completed") return "completed";
  if (task.status === "canceled") return "canceled";
  return null; // the unused "archived" enum value, if it were ever set without archived_at
}

function projectStatusBucket(
  project: SearchPageData["projects"][number],
): SearchStatusBucket | null {
  if (project.archived_at) return null;
  if (project.status === "completed") return "completed";
  if (project.status === "canceled") return "canceled";
  return "open"; // planned, active, paused
}

/** "failed" has no clean home in a 3-bucket scheme; it lands on "canceled" because a failed
 * capture never produced a filed record and needs manual recovery, functionally a dead end
 * like a discarded capture rather than something still open or something that completed. */
function captureStatusBucket(status: string): SearchStatusBucket {
  if (status === "filed") return "completed";
  if (status === "discarded" || status === "failed") return "canceled";
  return "open"; // queued, uploading, transcribing, interpreting, needs_review
}

function buildEntries(data: SearchPageData): SearchEntry[] {
  const tasks: SearchEntry[] = data.tasks.map((item) => ({
    type: "task",
    typeLabel: SEARCH_TYPE_LABELS.task,
    id: item.id,
    title: item.title,
    context: item.details ?? "",
    domainId: item.domain_id,
    projectId: item.project_id,
    personId: item.person_id,
    statusBucket: taskStatusBucket(item),
    relevantDate: item.deferred_until ?? item.due_on ?? item.scheduled_for,
  }));
  const projects: SearchEntry[] = data.projects.map((item) => ({
    type: "project",
    typeLabel: SEARCH_TYPE_LABELS.project,
    id: item.id,
    title: item.name,
    context: item.description ?? "",
    domainId: item.domain_id,
    projectId: item.id,
    personId: item.person_id,
    statusBucket: projectStatusBucket(item),
    relevantDate: item.target_on,
  }));
  const people: SearchEntry[] = data.people.map((item) => ({
    type: "person",
    typeLabel: SEARCH_TYPE_LABELS.person,
    id: item.id,
    title: item.name,
    context: item.context ?? "",
    domainId: item.domain_id,
    projectId: null,
    personId: item.id,
    statusBucket: null,
    relevantDate: null,
  }));
  const notes: SearchEntry[] = data.notes.map((item) => ({
    type: "note",
    typeLabel: SEARCH_TYPE_LABELS.note,
    id: item.id,
    title: item.title,
    context: item.body ?? "",
    domainId: item.domain_id,
    projectId: item.project_id,
    personId: item.person_id,
    statusBucket: null,
    relevantDate: item.review_on,
  }));
  const domains: SearchEntry[] = data.domains.map((item) => ({
    type: "domain",
    typeLabel: SEARCH_TYPE_LABELS.domain,
    id: item.id,
    title: item.name,
    context: item.description ?? "",
    domainId: item.id,
    projectId: null,
    personId: null,
    statusBucket: null,
    relevantDate: null,
  }));
  const captures: SearchEntry[] = data.captures.map((item) => ({
    type: "capture",
    typeLabel: SEARCH_TYPE_LABELS.capture,
    id: item.id,
    title: item.original_text,
    context: item.status,
    domainId: null,
    projectId: null,
    personId: null,
    statusBucket: captureStatusBucket(item.status),
    relevantDate: item.created_at ? item.created_at.slice(0, 10) : null,
  }));
  return [...tasks, ...projects, ...people, ...notes, ...domains, ...captures];
}

const RESULT_LIMIT = 30;

export function searchRecords(
  data: SearchPageData,
  query: string,
  filters: SearchFilterState,
): SearchResult[] {
  const q = query.trim().toLowerCase();
  const entries = buildEntries(data).filter((entry) => {
    if (!filters.types.includes(entry.type)) return false;
    if (filters.status !== "any") {
      if (entry.statusBucket === null || entry.statusBucket !== filters.status) return false;
    }
    if (filters.domainId && entry.domainId !== filters.domainId) return false;
    if (filters.projectId && entry.projectId !== filters.projectId) return false;
    if (filters.personId && entry.personId !== filters.personId) return false;
    if (filters.dateFrom || filters.dateTo) {
      if (!entry.relevantDate) return false;
      if (filters.dateFrom && entry.relevantDate < filters.dateFrom) return false;
      if (filters.dateTo && entry.relevantDate > filters.dateTo) return false;
    }
    if (q && !`${entry.title} ${entry.context}`.toLowerCase().includes(q)) return false;
    return true;
  });
  return entries
    .slice(0, RESULT_LIMIT)
    .map(({ type, typeLabel, id, title, context }) => ({ type, typeLabel, id, title, context }));
}
