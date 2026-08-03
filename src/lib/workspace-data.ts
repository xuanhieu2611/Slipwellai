import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { WorkspaceData } from "@/lib/workspace";

export async function getWorkspaceData(): Promise<WorkspaceData> {
  const supabase = await createSupabaseServerClient();
  const [preferences, domains, tasks, projects, people, notes, routines, routineCompletions, captures] = await Promise.all([
    supabase.from("user_preferences").select("timezone").maybeSingle(),
    supabase.from("domains").select("id, name, color, archived_at").is("archived_at", null).order("name"),
    supabase.from("tasks").select("id, title, details, status, priority, due_on, scheduled_for, deferred_until, domain_id, project_id, person_id, top_three_date, top_three_order, created_at").is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name, description, status, domain_id, target_on, created_at").is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("people").select("id, name, context, domain_id, created_at").is("archived_at", null).order("name"),
    supabase.from("notes").select("id, title, body, domain_id, project_id, person_id, review_on, created_at").is("archived_at", null).order("created_at", { ascending: false }),
    supabase.from("routines").select("id, name, period").is("archived_at", null).order("period").order("name"),
    supabase.from("routine_completions").select("routine_id, local_date, outcome").order("local_date", { ascending: false }).limit(100),
    supabase.from("captures").select("id, original_text, status, created_at").order("created_at", { ascending: false }).limit(8),
  ]);
  return {
    timezone: preferences.data?.timezone ?? "America/Vancouver",
    domains: (domains.data ?? []) as WorkspaceData["domains"],
    tasks: (tasks.data ?? []) as WorkspaceData["tasks"],
    projects: (projects.data ?? []) as WorkspaceData["projects"],
    people: (people.data ?? []) as WorkspaceData["people"],
    notes: (notes.data ?? []) as WorkspaceData["notes"],
    routines: (routines.data ?? []) as WorkspaceData["routines"],
    routineCompletions: (routineCompletions.data ?? []) as WorkspaceData["routineCompletions"],
    captures: (captures.data ?? []) as WorkspaceData["captures"],
  };
}
