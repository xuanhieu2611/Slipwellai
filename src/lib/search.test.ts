import { describe, expect, it } from "vitest";
import { defaultSearchFilters, isDefaultSearchFilters, searchRecords, type SearchFilterState } from "@/lib/search";
import type { SearchPageData } from "@/lib/workspace-page-data";

function baseData(): SearchPageData {
  return {
    domains: [
      { id: "domain-work", name: "Full-time job", description: null, color: "#2348c8", archived_at: null },
      { id: "domain-ads", name: "Ad retainer", description: null, color: "#8a5200", archived_at: null },
    ],
    tasks: [
      {
        id: "task-open",
        title: "Send July analytics",
        details: "Rivera Studio monthly report",
        status: "open",
        priority: 2,
        due_on: "2026-08-10",
        scheduled_for: null,
        deferred_until: null,
        recurrence_rule: null,
        recurrence_interval: null,
        recurrence_unit: null,
        tags: [],
        domain_id: "domain-ads",
        project_id: "project-1",
        person_id: "person-1",
        retainer_id: null,
        top_three_date: null,
        top_three_order: null,
        slipping_cadence_days: null,
        completed_at: null,
        archived_at: null,
        created_at: "2026-08-01T00:00:00Z",
      },
      {
        id: "task-completed",
        title: "File Q2 taxes",
        details: null,
        status: "completed",
        priority: 1,
        due_on: "2026-06-01",
        scheduled_for: null,
        deferred_until: null,
        recurrence_rule: null,
        recurrence_interval: null,
        recurrence_unit: null,
        tags: [],
        domain_id: "domain-work",
        project_id: null,
        person_id: null,
        retainer_id: null,
        top_three_date: null,
        top_three_order: null,
        slipping_cadence_days: null,
        completed_at: "2026-06-01T00:00:00Z",
        archived_at: null,
        created_at: "2026-05-01T00:00:00Z",
      },
    ],
    projects: [
      {
        id: "project-1",
        name: "Website redesign",
        description: "Refresh the Rivera Studio site",
        status: "active",
        domain_id: "domain-ads",
        person_id: "person-1",
        start_on: "2026-07-01",
        target_on: "2026-09-01",
        slipping_cadence_days: null,
        archived_at: null,
        created_at: "2026-07-01T00:00:00Z",
      },
    ],
    people: [{ id: "person-1", name: "Rivera Studio", context: "Ad retainer client", domain_id: "domain-ads", archived_at: null, created_at: "2026-01-01T00:00:00Z" }],
    notes: [
      {
        id: "note-1",
        title: "Client call notes",
        body: "Discussed the September campaign",
        domain_id: "domain-ads",
        project_id: "project-1",
        person_id: "person-1",
        review_on: "2026-08-15",
        archived_at: null,
        created_at: "2026-08-01T00:00:00Z",
      },
    ],
    captures: [
      { id: "capture-filed", original_text: "Rivera Studio wants a new services page", status: "filed", created_at: "2026-08-05T12:00:00Z" },
      { id: "capture-failed", original_text: "Untranscribed voice memo", status: "failed", created_at: "2026-08-06T12:00:00Z" },
    ],
  };
}

describe("searchRecords", () => {
  it("matches on title and context across all record types by default", () => {
    const results = searchRecords(baseData(), "rivera", defaultSearchFilters);
    const ids = results.map((r) => r.id).sort();
    expect(ids).toEqual(["capture-filed", "person-1", "project-1", "task-open"]);
  });

  it("returns nothing for a query that matches no record", () => {
    expect(searchRecords(baseData(), "no such phrase anywhere", defaultSearchFilters)).toEqual([]);
  });

  it("lets filters alone drive results with an empty query", () => {
    const filters: SearchFilterState = { ...defaultSearchFilters, types: ["person"] };
    const results = searchRecords(baseData(), "", filters);
    expect(results).toEqual([{ type: "person", typeLabel: "Person", id: "person-1", title: "Rivera Studio", context: "Ad retainer client" }]);
  });

  it("narrows by record type", () => {
    const filters: SearchFilterState = { ...defaultSearchFilters, types: ["task"] };
    const results = searchRecords(baseData(), "", filters);
    expect(results.every((r) => r.type === "task")).toBe(true);
    expect(results.map((r) => r.id).sort()).toEqual(["task-completed", "task-open"]);
  });

  it("maps task/project/capture status onto shared open/completed/canceled buckets", () => {
    const completed = searchRecords(baseData(), "", { ...defaultSearchFilters, status: "completed" });
    expect(completed.map((r) => r.id).sort()).toEqual(["capture-filed", "task-completed"]);

    // A failed capture never produced a filed record, so it buckets under "canceled" rather than
    // getting an unreachable "archived" bucket of its own (archived rows never reach this module).
    const canceled = searchRecords(baseData(), "", { ...defaultSearchFilters, status: "canceled" });
    expect(canceled.map((r) => r.id)).toEqual(["capture-failed"]);
  });

  it("excludes types without a meaningful status once a status filter is active", () => {
    const results = searchRecords(baseData(), "", { ...defaultSearchFilters, status: "open" });
    expect(results.some((r) => r.type === "person" || r.type === "domain" || r.type === "note")).toBe(false);
  });

  it("narrows by domain, including the domain record's own self-match", () => {
    const results = searchRecords(baseData(), "", { ...defaultSearchFilters, domainId: "domain-ads" });
    const ids = results.map((r) => r.id).sort();
    expect(ids).toEqual(["domain-ads", "note-1", "person-1", "project-1", "task-open"]);
  });

  it("narrows by project and by person", () => {
    const byProject = searchRecords(baseData(), "", { ...defaultSearchFilters, projectId: "project-1" });
    expect(byProject.map((r) => r.id).sort()).toEqual(["note-1", "project-1", "task-open"]);

    const byPerson = searchRecords(baseData(), "", { ...defaultSearchFilters, personId: "person-1" });
    expect(byPerson.map((r) => r.id).sort()).toEqual(["note-1", "person-1", "project-1", "task-open"]);
  });

  it("filters by each type's most relevant date and excludes types without one", () => {
    const results = searchRecords(baseData(), "", { ...defaultSearchFilters, dateFrom: "2026-08-01", dateTo: "2026-08-31" });
    const ids = results.map((r) => r.id).sort();
    // task-open due 08-10, note-1 review 08-15, both captures created in August; project target is 09-01 (excluded),
    // task-completed due 06-01 (excluded), people/domains have no date (excluded).
    expect(ids).toEqual(["capture-failed", "capture-filed", "note-1", "task-open"]);
  });

  it("combines a text query with active filters", () => {
    const results = searchRecords(baseData(), "campaign", { ...defaultSearchFilters, types: ["note"] });
    expect(results).toEqual([{ type: "note", typeLabel: "Note", id: "note-1", title: "Client call notes", context: "Discussed the September campaign" }]);
  });
});

describe("isDefaultSearchFilters", () => {
  it("is true only for the untouched default state", () => {
    expect(isDefaultSearchFilters(defaultSearchFilters)).toBe(true);
    expect(isDefaultSearchFilters({ ...defaultSearchFilters, status: "open" })).toBe(false);
    expect(isDefaultSearchFilters({ ...defaultSearchFilters, types: ["task"] })).toBe(false);
    expect(isDefaultSearchFilters({ ...defaultSearchFilters, dateFrom: "2026-08-01" })).toBe(false);
  });
});
