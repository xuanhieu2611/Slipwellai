import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { isTaskOnDay, localDate } from "@/lib/workspace";

/* Runs against the real hosted pilot Supabase project (see AGENTS.md) rather than a local
   Postgres instance, because this environment has no Docker for `supabase start`. It proves the
   database-level constraints and RLS policies actually hold, not just the application logic that
   assumes they do. Gated on real credentials so `npm test`/CI, which only has placeholder
   Supabase values, never runs it — use `npm run test:integration` with .env.local populated. */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const USER_A = { email: "test@test.com", password: "testtest" };
/* A second, throwaway account exists only to prove cross-user isolation; it owns no data worth
   preserving and every row it touches in these tests is cleaned up below. */
const USER_B = { email: "test2@test.com", password: "testtest2" };

async function signedInClient(credentials: { email: string; password: string }) {
  const client = createClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } });
  const signIn = await client.auth.signInWithPassword(credentials);
  if (signIn.error) {
    const signUp = await client.auth.signUp(credentials);
    if (signUp.error || !signUp.data.session) throw signUp.error ?? new Error(`Could not establish a session for ${credentials.email}.`);
  }
  return client;
}

describe.skipIf(!SUPABASE_URL || !SUPABASE_KEY)("workspace integration (hosted pilot project)", () => {
  let userA: SupabaseClient;
  let userB: SupabaseClient;
  let ownerAId: string;
  let originalTimezone: string | null = null;
  const createdTaskIds: string[] = [];
  const createdProjectIds: string[] = [];
  const createdTemplateIds: string[] = [];

  beforeAll(async () => {
    userA = await signedInClient(USER_A);
    userB = await signedInClient(USER_B);
    const { data: authData } = await userA.auth.getUser();
    ownerAId = authData.user!.id;
    const { data: prefs } = await userA.from("user_preferences").select("timezone").eq("owner_id", ownerAId).maybeSingle();
    originalTimezone = prefs?.timezone ?? null;
  });

  afterAll(async () => {
    if (createdTaskIds.length) await userA.from("tasks").delete().in("id", createdTaskIds);
    /* Deleting the project first cascades away its checklist instances and items (both
       on-delete-cascade), which clears the on-delete-restrict references those rows hold on the
       template and its items, so the template cleanup below no longer conflicts with them. */
    if (createdProjectIds.length) await userA.from("projects").delete().in("id", createdProjectIds);
    if (createdTemplateIds.length) {
      await userA.from("project_checklist_template_items").delete().in("template_id", createdTemplateIds);
      await userA.from("project_checklist_templates").delete().in("id", createdTemplateIds);
    }
    await userA.from("user_preferences").upsert({ owner_id: ownerAId, timezone: originalTimezone }, { onConflict: "owner_id" });
  });

  it("converges a retried create_task double-submit on one row instead of a duplicate", async () => {
    const idempotencyKey = crypto.randomUUID();
    const title = "[integration-test] idempotent capture";
    const first = await userA.from("tasks").insert({ title, idempotency_key: idempotencyKey }).select("id").single();
    expect(first.error).toBeNull();
    createdTaskIds.push(first.data!.id);

    const second = await userA.from("tasks").insert({ title, idempotency_key: idempotencyKey }).select("id").single();
    expect(second.error?.code).toBe("23505");

    const { data: rows } = await userA.from("tasks").select("id").eq("idempotency_key", idempotencyKey);
    expect(rows).toHaveLength(1);
  });

  it("blocks a duplicate generated recurrence occurrence at the recurrence_root_id + recurrence_anchor constraint", async () => {
    const root = await userA.from("tasks").insert({ title: "[integration-test] recurrence root", recurrence_rule: "daily", recurrence_anchor: "2026-09-01" }).select("id").single();
    expect(root.error).toBeNull();
    createdTaskIds.push(root.data!.id);

    const occurrence = await userA.from("tasks").insert({ title: "[integration-test] recurrence occurrence", recurrence_rule: "daily", recurrence_root_id: root.data!.id, recurrence_anchor: "2026-09-02" }).select("id").single();
    expect(occurrence.error).toBeNull();
    createdTaskIds.push(occurrence.data!.id);

    const retry = await userA.from("tasks").insert({ title: "[integration-test] recurrence occurrence retry", recurrence_rule: "daily", recurrence_root_id: root.data!.id, recurrence_anchor: "2026-09-02" }).select("id").single();
    expect(retry.error?.code).toBe("23505");
  });

  it("keeps a second account from reading, updating, or deleting another user's task", async () => {
    const title = "[integration-test] owned by user A";
    const created = await userA.from("tasks").insert({ title }).select("id").single();
    expect(created.error).toBeNull();
    const taskId = created.data!.id;
    createdTaskIds.push(taskId);

    const read = await userB.from("tasks").select("id").eq("id", taskId).maybeSingle();
    expect(read.error).toBeNull();
    expect(read.data).toBeNull();

    const update = await userB.from("tasks").update({ title: "hijacked" }).eq("id", taskId).select();
    expect(update.error).toBeNull();
    expect(update.data).toEqual([]);

    const remove = await userB.from("tasks").delete().eq("id", taskId).select();
    expect(remove.error).toBeNull();
    expect(remove.data).toEqual([]);

    const confirm = await userA.from("tasks").select("title, archived_at").eq("id", taskId).single();
    expect(confirm.data?.title).toBe(title);
    expect(confirm.data?.archived_at).toBeNull();
  });

  it("resolves a task due on the correct local day near a UTC midnight boundary for a real confirmed timezone", async () => {
    await userA.from("user_preferences").upsert({ owner_id: ownerAId, timezone: "America/Vancouver" }, { onConflict: "owner_id" });
    const { data: fetchedPrefs } = await userA.from("user_preferences").select("timezone").eq("owner_id", ownerAId).single();
    expect(fetchedPrefs?.timezone).toBe("America/Vancouver");

    // America/Vancouver is UTC-7 in August (PDT); local midnight on 2026-08-06 is 2026-08-06T07:00:00Z.
    expect(localDate(fetchedPrefs!.timezone, new Date("2026-08-06T06:59:00Z"))).toBe("2026-08-05");
    expect(localDate(fetchedPrefs!.timezone, new Date("2026-08-06T07:01:00Z"))).toBe("2026-08-06");

    const created = await userA.from("tasks").insert({ title: "[integration-test] timezone boundary", due_on: "2026-08-06" }).select("id, due_on, scheduled_for, deferred_until").single();
    expect(created.error).toBeNull();
    createdTaskIds.push(created.data!.id);
    expect(isTaskOnDay(created.data!, "2026-08-06")).toBe(true);
    expect(isTaskOnDay(created.data!, "2026-08-05")).toBe(false);
  });

  it("converges a retried create_project double-submit on one row instead of a duplicate", async () => {
    const idempotencyKey = crypto.randomUUID();
    const name = "[integration-test] idempotent project";
    const first = await userA.from("projects").insert({ name, idempotency_key: idempotencyKey }).select("id").single();
    expect(first.error).toBeNull();
    createdProjectIds.push(first.data!.id);

    const second = await userA.from("projects").insert({ name, idempotency_key: idempotencyKey }).select("id").single();
    expect(second.error?.code).toBe("23505");

    const { data: rows } = await userA.from("projects").select("id").eq("idempotency_key", idempotencyKey);
    expect(rows).toHaveLength(1);
  });

  it("keeps a second account from reading, updating, or deleting another user's project", async () => {
    const name = "[integration-test] owned by user A";
    const created = await userA.from("projects").insert({ name }).select("id").single();
    expect(created.error).toBeNull();
    const projectId = created.data!.id;
    createdProjectIds.push(projectId);

    const read = await userB.from("projects").select("id").eq("id", projectId).maybeSingle();
    expect(read.error).toBeNull();
    expect(read.data).toBeNull();

    const update = await userB.from("projects").update({ name: "hijacked" }).eq("id", projectId).select();
    expect(update.error).toBeNull();
    expect(update.data).toEqual([]);

    const remove = await userB.from("projects").delete().eq("id", projectId).select();
    expect(remove.error).toBeNull();
    expect(remove.data).toEqual([]);

    const confirm = await userA.from("projects").select("name, archived_at").eq("id", projectId).single();
    expect(confirm.data?.name).toBe(name);
    expect(confirm.data?.archived_at).toBeNull();
  });

  it("blocks a hard delete of an applied checklist template item at the on-delete-restrict constraint, and confirms the soft-delete (archived_at) path leaves applied checklists intact", async () => {
    const template = await userA.from("project_checklist_templates").insert({ name: "[integration-test] template" }).select("id, version").single();
    expect(template.error).toBeNull();
    const templateId = template.data!.id;
    createdTemplateIds.push(templateId);

    const item = await userA.from("project_checklist_template_items").insert({ template_id: templateId, title: "Draft the report", position: 1 }).select("id").single();
    expect(item.error).toBeNull();
    const itemId = item.data!.id;

    const project = await userA.from("projects").insert({ name: "[integration-test] project with checklist" }).select("id").single();
    expect(project.error).toBeNull();
    const projectId = project.data!.id;
    createdProjectIds.push(projectId);

    const instance = await userA.from("project_checklist_instances").insert({ project_id: projectId, template_id: templateId, template_version: template.data!.version }).select("id").single();
    expect(instance.error).toBeNull();

    const checklistItem = await userA.from("project_checklist_items").insert({ instance_id: instance.data!.id, source_template_item_id: itemId, title: "Draft the report", position: 1 }).select("id, title").single();
    expect(checklistItem.error).toBeNull();

    // A hard delete is blocked while an applied checklist still references this template item.
    const hardDelete = await userA.from("project_checklist_template_items").delete().eq("id", itemId).select();
    expect(hardDelete.error?.code).toBe("23503");

    // Soft delete (archived_at) is the actual removal path, and it does not touch the already-applied,
    // already-copied checklist item title on the project.
    const softDelete = await userA.from("project_checklist_template_items").update({ archived_at: new Date().toISOString() }).eq("id", itemId).select("archived_at").single();
    expect(softDelete.error).toBeNull();
    expect(softDelete.data?.archived_at).not.toBeNull();

    const confirmChecklistItem = await userA.from("project_checklist_items").select("title").eq("id", checklistItem.data!.id).single();
    expect(confirmChecklistItem.data?.title).toBe("Draft the report");
  });
});
