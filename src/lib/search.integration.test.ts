import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { searchFullText } from "@/lib/supabase/search-repository";

/* Runs against the real hosted pilot Supabase project, same pattern as
   src/lib/workspace.integration.test.ts (see that file's comment for why: no local Docker
   Postgres in this environment, so this is what proves the search_vector generated columns and
   GIN indexes from supabase/migrations/20260809160000_search_full_text.sql actually work and
   stay RLS-scoped, not just that the application code assumes they do). Gated on real
   credentials so `npm test`/CI never runs it; use `npm run test:integration`. */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const USER_A = { email: "test@test.com", password: "testtest" };
const USER_B = { email: "test2@test.com", password: "testtest2" };

async function signedInClient(credentials: { email: string; password: string }) {
  const client = createClient(SUPABASE_URL!, SUPABASE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signIn = await client.auth.signInWithPassword(credentials);
  if (signIn.error) {
    const signUp = await client.auth.signUp(credentials);
    if (signUp.error || !signUp.data.session)
      throw signUp.error ?? new Error(`Could not establish a session for ${credentials.email}.`);
  }
  return client;
}

/* A short, otherwise-meaningless alphanumeric token so `to_tsvector`/`websearch_to_tsquery`
   index and match it as a single lexeme, and so it can never collide with a real word already
   present in the account's data. */
function marker() {
  return `zzsearchmarker${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

describe.skipIf(!SUPABASE_URL || !SUPABASE_KEY)(
  "search full-text prefilter (hosted pilot project)",
  () => {
    let userA: SupabaseClient;
    let userB: SupabaseClient;
    const createdTaskIds: string[] = [];
    const createdProjectIds: string[] = [];
    const createdPersonIds: string[] = [];
    const createdNoteIds: string[] = [];
    const createdDomainIds: string[] = [];
    const createdCaptureIds: string[] = [];
    const createdTaskIdsB: string[] = [];

    beforeAll(async () => {
      userA = await signedInClient(USER_A);
      userB = await signedInClient(USER_B);
    });

    afterAll(async () => {
      if (createdTaskIds.length) await userA.from("tasks").delete().in("id", createdTaskIds);
      if (createdNoteIds.length) await userA.from("notes").delete().in("id", createdNoteIds);
      if (createdPersonIds.length) await userA.from("people").delete().in("id", createdPersonIds);
      if (createdProjectIds.length)
        await userA.from("projects").delete().in("id", createdProjectIds);
      if (createdDomainIds.length) await userA.from("domains").delete().in("id", createdDomainIds);
      if (createdCaptureIds.length)
        await userA.from("captures").delete().in("id", createdCaptureIds);
      if (createdTaskIdsB.length) await userB.from("tasks").delete().in("id", createdTaskIdsB);
    });

    it("matches a task by a word only present in its details field, via the generated search_vector column", async () => {
      const word = marker();
      const task = await userA
        .from("tasks")
        .insert({
          title: "[integration-test] full-text target",
          details: `Notes mention ${word} here`,
        })
        .select("id")
        .single();
      expect(task.error).toBeNull();
      createdTaskIds.push(task.data!.id);

      const matches = await searchFullText(userA, word);
      expect(matches.task?.has(task.data!.id)).toBe(true);
      // Nothing else in the account should coincidentally contain this random token.
      expect(matches.project?.size ?? 0).toBe(0);
    });

    it("matches across project, person, note, and domain search_vector columns from a single query", async () => {
      const word = marker();
      const [project, person, note, domain] = await Promise.all([
        userA
          .from("projects")
          .insert({ name: "[integration-test] project", description: word })
          .select("id")
          .single(),
        userA
          .from("people")
          .insert({ name: "[integration-test] person", context: word })
          .select("id")
          .single(),
        userA
          .from("notes")
          .insert({ title: "[integration-test] note", body: word })
          .select("id")
          .single(),
        userA
          .from("domains")
          // Space-separated, not concatenated: to_tsvector tokenizes "prefix word" as two
          // lexemes, so searching for `word` alone still matches; a concatenated string like
          // `prefix${word}` would index as one different token and never match `word` alone.
          .insert({ name: `[integration-test] ${word}` })
          .select("id")
          .single(),
      ]);
      expect(project.error).toBeNull();
      expect(person.error).toBeNull();
      expect(note.error).toBeNull();
      expect(domain.error).toBeNull();
      createdProjectIds.push(project.data!.id);
      createdPersonIds.push(person.data!.id);
      createdNoteIds.push(note.data!.id);
      createdDomainIds.push(domain.data!.id);

      const matches = await searchFullText(userA, word);
      expect(matches.project?.has(project.data!.id)).toBe(true);
      expect(matches.person?.has(person.data!.id)).toBe(true);
      expect(matches.note?.has(note.data!.id)).toBe(true);
      expect(matches.domain?.has(domain.data!.id)).toBe(true);
    });

    it("matches a capture by its original_text", async () => {
      const word = marker();
      const capture = await userA
        .from("captures")
        .insert({
          original_text: `A quick capture about ${word}`,
          idempotency_key: crypto.randomUUID(),
        })
        .select("id")
        .single();
      expect(capture.error).toBeNull();
      createdCaptureIds.push(capture.data!.id);

      const matches = await searchFullText(userA, word);
      expect(matches.capture?.has(capture.data!.id)).toBe(true);
    });

    it("returns no matches for a query that matches nothing", async () => {
      const matches = await searchFullText(userA, "phraseNoRecordWillEverContain12345");
      expect(matches.task?.size ?? 0).toBe(0);
      expect(matches.project?.size ?? 0).toBe(0);
      expect(matches.person?.size ?? 0).toBe(0);
      expect(matches.note?.size ?? 0).toBe(0);
      expect(matches.domain?.size ?? 0).toBe(0);
      expect(matches.capture?.size ?? 0).toBe(0);
    });

    it("returns {} for an empty/whitespace query without erroring", async () => {
      expect(await searchFullText(userA, "")).toEqual({});
      expect(await searchFullText(userA, "   ")).toEqual({});
    });

    it("does not raise a syntax error for unbalanced-quote input (websearch_to_tsquery tolerates it)", async () => {
      await expect(searchFullText(userA, '"unterminated quote')).resolves.toBeDefined();
    });

    it("keeps full-text results scoped per-owner: user B's matching task is invisible to user A's search", async () => {
      const word = marker();
      const taskB = await userB
        .from("tasks")
        .insert({ title: "[integration-test] cross-user target", details: word })
        .select("id")
        .single();
      expect(taskB.error).toBeNull();
      createdTaskIdsB.push(taskB.data!.id);

      const matchesAsA = await searchFullText(userA, word);
      expect(matchesAsA.task?.has(taskB.data!.id) ?? false).toBe(false);

      const matchesAsB = await searchFullText(userB, word);
      expect(matchesAsB.task?.has(taskB.data!.id)).toBe(true);
    });
  },
);
