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
});
