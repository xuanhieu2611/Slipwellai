import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { cycleBounds, expectedDate } from "@/lib/retainers";
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
  const createdRetainerIds: string[] = [];
  const createdSignalIds: string[] = [];

  beforeAll(async () => {
    userA = await signedInClient(USER_A);
    userB = await signedInClient(USER_B);
    const { data: authData } = await userA.auth.getUser();
    ownerAId = authData.user!.id;
    const { data: prefs } = await userA.from("user_preferences").select("timezone").eq("owner_id", ownerAId).maybeSingle();
    originalTimezone = prefs?.timezone ?? null;
  });

  afterAll(async () => {
    if (createdSignalIds.length) await userA.from("slipping_signals").delete().in("id", createdSignalIds);
    if (createdTaskIds.length) await userA.from("tasks").delete().in("id", createdTaskIds);
    /* Deleting the project first cascades away its checklist instances and items (both
       on-delete-cascade), which clears the on-delete-restrict references those rows hold on the
       template and its items, so the template cleanup below no longer conflicts with them. */
    if (createdProjectIds.length) await userA.from("projects").delete().in("id", createdProjectIds);
    if (createdTemplateIds.length) {
      await userA.from("project_checklist_template_items").delete().in("template_id", createdTemplateIds);
      await userA.from("project_checklist_templates").delete().in("id", createdTemplateIds);
    }
    if (createdRetainerIds.length) {
      /* Deleting cycles first cascades away their items, clearing the on-delete-restrict
         references those items hold on the deliverable templates, the same reasoning as the
         checklist template cleanup above. Deleting the retainer then cascades away the templates. */
      await userA.from("retainer_cycles").delete().in("retainer_id", createdRetainerIds);
      await userA.from("retainers").delete().in("id", createdRetainerIds);
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

  it("blocks a duplicate open Slipping signal at the (owner_id, entity_type, entity_id) partial unique index", async () => {
    const task = await userA.from("tasks").insert({ title: "[integration-test] slipping dedup target" }).select("id").single();
    expect(task.error).toBeNull();
    createdTaskIds.push(task.data!.id);

    const first = await userA.from("slipping_signals").insert({ entity_type: "task", entity_id: task.data!.id, reason: "[integration-test] no meaningful attention", severity: "attention" }).select("id").single();
    expect(first.error).toBeNull();
    createdSignalIds.push(first.data!.id);

    const second = await userA.from("slipping_signals").insert({ entity_type: "task", entity_id: task.data!.id, reason: "[integration-test] no meaningful attention", severity: "attention" });
    expect(second.error?.code).toBe("23505");
  });

  it("accepts the cadence_changed outcome on a slipping_signals row (proves the enum value is live, not just Zod-valid)", async () => {
    const task = await userA.from("tasks").insert({ title: "[integration-test] cadence_changed enum target" }).select("id").single();
    expect(task.error).toBeNull();
    createdTaskIds.push(task.data!.id);

    const signal = await userA.from("slipping_signals").insert({ entity_type: "task", entity_id: task.data!.id, reason: "[integration-test] cadence_changed enum check", severity: "attention" }).select("id").single();
    expect(signal.error).toBeNull();
    createdSignalIds.push(signal.data!.id);

    const updated = await userA.from("slipping_signals").update({ outcome: "cadence_changed" }).eq("id", signal.data!.id).select("outcome").single();
    expect(updated.error).toBeNull();
    expect(updated.data?.outcome).toBe("cadence_changed");
  });

  it("does not create an activity_events row for a cosmetic task edit that bypasses update_task", async () => {
    const task = await userA.from("tasks").insert({ title: "[integration-test] cosmetic edit target" }).select("id").single();
    expect(task.error).toBeNull();
    const taskId = task.data!.id;
    createdTaskIds.push(taskId);

    const update = await userA.from("tasks").update({ title: "[integration-test] cosmetic edit target renamed" }).eq("id", taskId);
    expect(update.error).toBeNull();

    const { data: events } = await userA.from("activity_events").select("id").eq("entity_type", "task").eq("entity_id", taskId);
    expect(events).toEqual([]);
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

  it("converges a retried retainer cycle generation double-submit on one cycle and one set of items, then carries a still-open item forward into the next cycle", async () => {
    const retainer = await userA.from("retainers").insert({ name: "[integration-test] retainer", cycle_day: 1 }).select("id").single();
    expect(retainer.error).toBeNull();
    const retainerId = retainer.data!.id;
    createdRetainerIds.push(retainerId);

    const templateItem = await userA.from("retainer_deliverable_templates").insert({ retainer_id: retainerId, title: "Monthly report", expected_day: 1 }).select("id, version").single();
    expect(templateItem.error).toBeNull();
    const templateItemId = templateItem.data!.id;

    const septemberBounds = cycleBounds("2026-09", 1);
    const septemberItems = [{ sourceTemplateItemId: templateItemId, sourceTemplateVersion: templateItem.data!.version, title: "Monthly report", expectedOn: expectedDate("2026-09", 1) }];
    const idempotencyKey = crypto.randomUUID();

    const first = await userA.rpc("generate_retainer_cycle", { p_retainer_id: retainerId, p_cycle_start: septemberBounds.start, p_cycle_end: septemberBounds.end, p_idempotency_key: idempotencyKey, p_new_items: septemberItems, p_carry_forward_items: [] });
    expect(first.error).toBeNull();

    const retried = await userA.rpc("generate_retainer_cycle", { p_retainer_id: retainerId, p_cycle_start: septemberBounds.start, p_cycle_end: septemberBounds.end, p_idempotency_key: idempotencyKey, p_new_items: septemberItems, p_carry_forward_items: [] });
    expect(retried.error).toBeNull();

    const septemberCycles = await userA.from("retainer_cycles").select("id, generation_status").eq("retainer_id", retainerId).eq("cycle_start", septemberBounds.start);
    expect(septemberCycles.data).toHaveLength(1);
    const septemberCycleId = septemberCycles.data![0].id;
    expect(septemberCycles.data![0].generation_status).toBe("complete");

    const septemberCycleItems = await userA.from("retainer_cycle_items").select("id, status").eq("cycle_id", septemberCycleId);
    expect(septemberCycleItems.data).toHaveLength(1);
    const septemberItemId = septemberCycleItems.data![0].id;

    // The September item is still open, so generating October should carry it forward.
    const octoberBounds = cycleBounds("2026-10", 1);
    const octoberNewItems = [{ sourceTemplateItemId: templateItemId, sourceTemplateVersion: templateItem.data!.version, title: "Monthly report", expectedOn: expectedDate("2026-10", 1) }];
    const octoberCarryForward = [{ sourceTemplateItemId: templateItemId, sourceTemplateVersion: templateItem.data!.version, carriedFromItemId: septemberItemId, title: "Monthly report (carried forward)", expectedOn: octoberBounds.start }];
    const october = await userA.rpc("generate_retainer_cycle", { p_retainer_id: retainerId, p_cycle_start: octoberBounds.start, p_cycle_end: octoberBounds.end, p_idempotency_key: crypto.randomUUID(), p_new_items: octoberNewItems, p_carry_forward_items: octoberCarryForward });
    expect(october.error).toBeNull();

    const octoberCycles = await userA.from("retainer_cycles").select("id").eq("retainer_id", retainerId).eq("cycle_start", octoberBounds.start).single();
    const octoberCycleItems = await userA.from("retainer_cycle_items").select("carried_from_item_id, title").eq("cycle_id", octoberCycles.data!.id);
    expect(octoberCycleItems.data).toHaveLength(2);
    expect(octoberCycleItems.data).toContainEqual({ carried_from_item_id: septemberItemId, title: "Monthly report (carried forward)" });

    const confirmSeptemberItem = await userA.from("retainer_cycle_items").select("status").eq("id", septemberItemId).single();
    expect(confirmSeptemberItem.data?.status).toBe("carried_forward");
  });

  it("resumes a partially populated cycle instead of duplicating or erroring on retry", async () => {
    const retainer = await userA.from("retainers").insert({ name: "[integration-test] resumable retainer", cycle_day: 1 }).select("id").single();
    expect(retainer.error).toBeNull();
    const retainerId = retainer.data!.id;
    createdRetainerIds.push(retainerId);

    const items = await userA.from("retainer_deliverable_templates").insert([
      { retainer_id: retainerId, title: "First deliverable", expected_day: 1, position: 1 },
      { retainer_id: retainerId, title: "Second deliverable", expected_day: 15, position: 2 },
    ]).select("id, version, title");
    expect(items.error).toBeNull();
    const [itemA, itemB] = items.data!;

    const bounds = cycleBounds("2026-11", 1);
    const idempotencyKey = crypto.randomUUID();

    // Simulate a prior attempt that only got as far as inserting the cycle row and the first item.
    const partialCycle = await userA.from("retainer_cycles").insert({ retainer_id: retainerId, cycle_start: bounds.start, cycle_end: bounds.end, idempotency_key: idempotencyKey, generation_status: "pending" }).select("id").single();
    expect(partialCycle.error).toBeNull();
    const partialItem = await userA.from("retainer_cycle_items").insert({ cycle_id: partialCycle.data!.id, source_template_item_id: itemA.id, source_template_version: itemA.version, title: itemA.title, expected_on: expectedDate("2026-11", 1) }).select("id").single();
    expect(partialItem.error).toBeNull();

    const newItems = [
      { sourceTemplateItemId: itemA.id, sourceTemplateVersion: itemA.version, title: itemA.title, expectedOn: expectedDate("2026-11", 1) },
      { sourceTemplateItemId: itemB.id, sourceTemplateVersion: itemB.version, title: itemB.title, expectedOn: expectedDate("2026-11", 15) },
    ];
    const resumed = await userA.rpc("generate_retainer_cycle", { p_retainer_id: retainerId, p_cycle_start: bounds.start, p_cycle_end: bounds.end, p_idempotency_key: idempotencyKey, p_new_items: newItems, p_carry_forward_items: [] });
    expect(resumed.error).toBeNull();

    const cycle = await userA.from("retainer_cycles").select("id, generation_status").eq("retainer_id", retainerId).eq("cycle_start", bounds.start).single();
    expect(cycle.data?.generation_status).toBe("complete");
    const cycleItems = await userA.from("retainer_cycle_items").select("id, source_template_item_id").eq("cycle_id", cycle.data!.id);
    // Exactly two items: the pre-existing one (not duplicated) plus the one the resumed run filled in.
    expect(cycleItems.data).toHaveLength(2);
    expect(cycleItems.data!.find((row) => row.source_template_item_id === itemA.id)?.id).toBe(partialItem.data!.id);
  });

  it("keeps a second account from reading, updating, or deleting another user's retainer", async () => {
    const name = "[integration-test] owned by user A";
    const created = await userA.from("retainers").insert({ name, cycle_day: 1 }).select("id").single();
    expect(created.error).toBeNull();
    const retainerId = created.data!.id;
    createdRetainerIds.push(retainerId);

    const read = await userB.from("retainers").select("id").eq("id", retainerId).maybeSingle();
    expect(read.error).toBeNull();
    expect(read.data).toBeNull();

    const update = await userB.from("retainers").update({ name: "hijacked" }).eq("id", retainerId).select();
    expect(update.error).toBeNull();
    expect(update.data).toEqual([]);

    const remove = await userB.from("retainers").delete().eq("id", retainerId).select();
    expect(remove.error).toBeNull();
    expect(remove.data).toEqual([]);

    const confirm = await userA.from("retainers").select("name, archived_at").eq("id", retainerId).single();
    expect(confirm.data?.name).toBe(name);
    expect(confirm.data?.archived_at).toBeNull();
  });

  it("blocks a hard delete of a retainer deliverable template item that has already produced cycle work, and confirms the soft-delete (archived_at) path leaves that work intact", async () => {
    const retainer = await userA.from("retainers").insert({ name: "[integration-test] template restrict retainer", cycle_day: 1 }).select("id").single();
    expect(retainer.error).toBeNull();
    const retainerId = retainer.data!.id;
    createdRetainerIds.push(retainerId);

    const templateItem = await userA.from("retainer_deliverable_templates").insert({ retainer_id: retainerId, title: "Monthly report", expected_day: 1 }).select("id, version").single();
    expect(templateItem.error).toBeNull();
    const templateItemId = templateItem.data!.id;

    const bounds = cycleBounds("2026-12", 1);
    const cycle = await userA.from("retainer_cycles").insert({ retainer_id: retainerId, cycle_start: bounds.start, cycle_end: bounds.end }).select("id").single();
    expect(cycle.error).toBeNull();
    const cycleItem = await userA.from("retainer_cycle_items").insert({ cycle_id: cycle.data!.id, source_template_item_id: templateItemId, source_template_version: templateItem.data!.version, title: "Monthly report", expected_on: expectedDate("2026-12", 1) }).select("id, title").single();
    expect(cycleItem.error).toBeNull();

    const hardDelete = await userA.from("retainer_deliverable_templates").delete().eq("id", templateItemId).select();
    expect(hardDelete.error?.code).toBe("23503");

    const softDelete = await userA.from("retainer_deliverable_templates").update({ archived_at: new Date().toISOString() }).eq("id", templateItemId).select("archived_at").single();
    expect(softDelete.error).toBeNull();
    expect(softDelete.data?.archived_at).not.toBeNull();

    const confirmCycleItem = await userA.from("retainer_cycle_items").select("title").eq("id", cycleItem.data!.id).single();
    expect(confirmCycleItem.data?.title).toBe("Monthly report");
  });

  it("keeps a carried-forward-from chain linked correctly three cycles deep instead of resetting or breaking after one hop", async () => {
    const retainer = await userA.from("retainers").insert({ name: "[integration-test] chain retainer", cycle_day: 1 }).select("id").single();
    expect(retainer.error).toBeNull();
    const retainerId = retainer.data!.id;
    createdRetainerIds.push(retainerId);

    const templateItem = await userA.from("retainer_deliverable_templates").insert({ retainer_id: retainerId, title: "Quarterly audit", expected_day: 1 }).select("id, version").single();
    const templateItemId = templateItem.data!.id;

    async function generate(month: string, priorItemId: string | null) {
      const bounds = cycleBounds(month, 1);
      const newItems = priorItemId ? [] : [{ sourceTemplateItemId: templateItemId, sourceTemplateVersion: templateItem.data!.version, title: "Quarterly audit", expectedOn: expectedDate(month, 1) }];
      const carryForwardItems = priorItemId ? [{ sourceTemplateItemId: templateItemId, sourceTemplateVersion: templateItem.data!.version, carriedFromItemId: priorItemId, title: "Quarterly audit (carried forward)", expectedOn: bounds.start }] : [];
      const result = await userA.rpc("generate_retainer_cycle", { p_retainer_id: retainerId, p_cycle_start: bounds.start, p_cycle_end: bounds.end, p_idempotency_key: crypto.randomUUID(), p_new_items: newItems, p_carry_forward_items: carryForwardItems });
      expect(result.error).toBeNull();
      const cycleItems = await userA.from("retainer_cycle_items").select("id, carried_from_item_id").eq("cycle_id", result.data![0].out_cycle_id);
      return cycleItems.data![0];
    }

    // Never completed or closed across three consecutive cycles, so it carries forward every time.
    const january = await generate("2027-01", null);
    const february = await generate("2027-02", january.id);
    const march = await generate("2027-03", february.id);

    expect(march.carried_from_item_id).toBe(february.id);
    expect(february.carried_from_item_id).toBe(january.id);
    expect(january.carried_from_item_id).toBeNull();

    // March's origin is only reachable by walking the chain back two hops, and it must resolve to
    // the very first generated item, not reset or dangle partway through.
    const walkedBackToFebruary = await userA.from("retainer_cycle_items").select("carried_from_item_id").eq("id", march.carried_from_item_id).single();
    expect(walkedBackToFebruary.data?.carried_from_item_id).toBe(january.id);
  });

  it("excludes an item explicitly left in its prior cycle from the carry-forward candidate set, while a sibling open item remains eligible", async () => {
    const retainer = await userA.from("retainers").insert({ name: "[integration-test] leave-in-prior retainer", cycle_day: 1 }).select("id").single();
    expect(retainer.error).toBeNull();
    const retainerId = retainer.data!.id;
    createdRetainerIds.push(retainerId);

    const bounds = cycleBounds("2027-04", 1);
    const cycle = await userA.from("retainer_cycles").insert({ retainer_id: retainerId, cycle_start: bounds.start, cycle_end: bounds.end }).select("id").single();
    const cycleId = cycle.data!.id;

    const template = await userA.from("retainer_deliverable_templates").insert([
      { retainer_id: retainerId, title: "Left behind on purpose", expected_day: 1 },
      { retainer_id: retainerId, title: "Still eligible", expected_day: 1 },
    ]).select("id, version, title");
    const [leftBehindTemplate, eligibleTemplate] = template.data!;

    const leftBehindItem = await userA.from("retainer_cycle_items").insert({ cycle_id: cycleId, source_template_item_id: leftBehindTemplate.id, source_template_version: leftBehindTemplate.version, title: leftBehindTemplate.title, expected_on: bounds.start }).select("id").single();
    const eligibleItem = await userA.from("retainer_cycle_items").insert({ cycle_id: cycleId, source_template_item_id: eligibleTemplate.id, source_template_version: eligibleTemplate.version, title: eligibleTemplate.title, expected_on: bounds.start }).select("id").single();

    // Mirrors what leave_retainer_cycle_item_in_prior_cycle does: stays open, just excluded.
    const excluded = await userA.from("retainer_cycle_items").update({ excluded_from_carry_forward: true }).eq("id", leftBehindItem.data!.id).select("status, excluded_from_carry_forward").single();
    expect(excluded.data).toMatchObject({ status: "open", excluded_from_carry_forward: true });

    // The exact query src/app/api/retainers/[retainerId]/cycles/route.ts uses to select
    // carry-forward candidates for the next generation.
    const candidates = await userA.from("retainer_cycle_items").select("id").eq("cycle_id", cycleId).eq("status", "open").eq("excluded_from_carry_forward", false);
    expect(candidates.data).toEqual([{ id: eligibleItem.data!.id }]);

    // "closed" is a valid terminal status distinct from open/carried_forward for the other outcome.
    const closed = await userA.from("retainer_cycle_items").update({ status: "closed" }).eq("id", eligibleItem.data!.id).select("status").single();
    expect(closed.error).toBeNull();
    expect(closed.data?.status).toBe("closed");
  });

  it("transitions a retainer through active to paused and back to active", async () => {
    const retainer = await userA.from("retainers").insert({ name: "[integration-test] pause/resume retainer", cycle_day: 1 }).select("id, status").single();
    expect(retainer.error).toBeNull();
    const retainerId = retainer.data!.id;
    createdRetainerIds.push(retainerId);
    expect(retainer.data?.status).toBe("active");

    const paused = await userA.from("retainers").update({ status: "paused" }).eq("id", retainerId).select("status").single();
    expect(paused.data?.status).toBe("paused");

    const resumed = await userA.from("retainers").update({ status: "active" }).eq("id", retainerId).select("status").single();
    expect(resumed.data?.status).toBe("active");
  });

  it("closes every still-open cycle item across every cycle when a retainer ends with the close_all resolution", async () => {
    const retainer = await userA.from("retainers").insert({ name: "[integration-test] end-retainer close-all", cycle_day: 1 }).select("id").single();
    expect(retainer.error).toBeNull();
    const retainerId = retainer.data!.id;
    createdRetainerIds.push(retainerId);

    const juneBounds = cycleBounds("2027-06", 1);
    const julyBounds = cycleBounds("2027-07", 1);
    const juneCycle = await userA.from("retainer_cycles").insert({ retainer_id: retainerId, cycle_start: juneBounds.start, cycle_end: juneBounds.end }).select("id").single();
    const julyCycle = await userA.from("retainer_cycles").insert({ retainer_id: retainerId, cycle_start: julyBounds.start, cycle_end: julyBounds.end }).select("id").single();

    const template = await userA.from("retainer_deliverable_templates").insert({ retainer_id: retainerId, title: "Recurring deliverable", expected_day: 1 }).select("id, version").single();
    const juneItem = await userA.from("retainer_cycle_items").insert({ cycle_id: juneCycle.data!.id, source_template_item_id: template.data!.id, source_template_version: template.data!.version, title: "Recurring deliverable", expected_on: juneBounds.start }).select("id").single();
    const julyItem = await userA.from("retainer_cycle_items").insert({ cycle_id: julyCycle.data!.id, source_template_item_id: template.data!.id, source_template_version: template.data!.version, title: "Recurring deliverable", expected_on: julyBounds.start }).select("id").single();

    // Mirrors what end_retainer with openItemResolution: "close_all" does: gather every cycle for
    // the retainer, then bulk-close whatever is still open across all of them in one statement.
    const cycleIds = [juneCycle.data!.id, julyCycle.data!.id];
    const closeAll = await userA.from("retainer_cycle_items").update({ status: "closed" }).in("cycle_id", cycleIds).eq("status", "open").select("id");
    expect(closeAll.error).toBeNull();
    expect(closeAll.data).toHaveLength(2);

    const confirmJune = await userA.from("retainer_cycle_items").select("status").eq("id", juneItem.data!.id).single();
    const confirmJuly = await userA.from("retainer_cycle_items").select("status").eq("id", julyItem.data!.id).single();
    expect(confirmJune.data?.status).toBe("closed");
    expect(confirmJuly.data?.status).toBe("closed");

    const ended = await userA.from("retainers").update({ status: "ended" }).eq("id", retainerId).select("status").single();
    expect(ended.data?.status).toBe("ended");
  });

  it("converges a retried create_retainer double-submit on one row instead of a duplicate, and links a task to it via retainer_id", async () => {
    const idempotencyKey = crypto.randomUUID();
    const name = "[integration-test] idempotent retainer";
    const first = await userA.from("retainers").insert({ name, cycle_day: 1, idempotency_key: idempotencyKey }).select("id").single();
    expect(first.error).toBeNull();
    const retainerId = first.data!.id;
    createdRetainerIds.push(retainerId);

    const second = await userA.from("retainers").insert({ name, cycle_day: 1, idempotency_key: idempotencyKey }).select("id").single();
    expect(second.error?.code).toBe("23505");

    const rows = await userA.from("retainers").select("id").eq("idempotency_key", idempotencyKey);
    expect(rows.data).toHaveLength(1);

    const task = await userA.from("tasks").insert({ title: "[integration-test] retainer-linked task", retainer_id: retainerId }).select("id, retainer_id").single();
    expect(task.error).toBeNull();
    createdTaskIds.push(task.data!.id);
    expect(task.data?.retainer_id).toBe(retainerId);
  });
});
