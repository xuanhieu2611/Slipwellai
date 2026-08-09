import type { WorkspaceData } from "@/lib/workspace";

export type TodayPageData = Pick<
  WorkspaceData,
  | "timezone"
  | "domains"
  | "tasks"
  | "projects"
  | "people"
  | "notes"
  | "routines"
  | "routineCompletions"
  | "signals"
  | "captures"
>;

export type TasksPageData = Pick<
  WorkspaceData,
  "timezone" | "domains" | "tasks" | "projects" | "people" | "notes" | "signals"
>;

export type WorkPageData = Pick<
  WorkspaceData,
  | "timezone"
  | "domains"
  | "tasks"
  | "projects"
  | "milestones"
  | "checklistTemplates"
  | "checklistTemplateItems"
  | "checklistInstances"
  | "checklistItems"
  | "people"
  | "projectActivity"
>;

export type RetainersPageData = Pick<
  WorkspaceData,
  | "timezone"
  | "domains"
  | "people"
  | "retainers"
  | "retainerTemplateItems"
  | "retainerCycles"
  | "retainerCycleItems"
  | "retainerActivity"
>;

export type PeopleNotesPageData = Pick<
  WorkspaceData,
  "timezone" | "domains" | "projects" | "people" | "personInteractions" | "notes"
>;

export type RoutinesPageData = Pick<WorkspaceData, "timezone" | "routines" | "routineCompletions">;

export type SearchPageData = Pick<
  WorkspaceData,
  "tasks" | "projects" | "people" | "notes" | "domains" | "captures"
>;
