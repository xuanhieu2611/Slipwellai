import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SearchRecordType } from "@/lib/search";

/** IDs of matching rows per record type, from a real Postgres full-text query (see
 * supabase/migrations/20260809160000_search_full_text.sql for the generated `search_vector`
 * tsvector columns and GIN indexes this queries against). `searchFullText` always populates every
 * `SearchRecordType` key with a Set (empty when that type had no match), so the `Partial` here
 * only accounts for the empty-query short-circuit below, which returns `{}` with no keys at all. */
export type FullTextMatches = Partial<Record<SearchRecordType, Set<string>>>;

/* One entry per record type search.ts already treats as searchable. captures only contributes
   original_text (see the migration), matching what search.ts already searches for that type. */
const FULL_TEXT_TABLES: Record<SearchRecordType, string> = {
  task: "tasks",
  project: "projects",
  person: "people",
  note: "notes",
  domain: "domains",
  capture: "captures",
};

/**
 * Runs a real Postgres full-text query (`websearch_to_tsquery`, via the GIN-indexed
 * `search_vector` generated column) across every searchable record type, scoped to the caller's
 * own rows by RLS on `supabase` — this must be called with a client carrying the requesting
 * user's session (e.g. `createSupabaseServerClient()`), never the service-role client, or the
 * tenant-isolation guarantee search.ts's callers rely on would be lost.
 *
 * `websearch_to_tsquery` (rather than `to_tsquery`/`plainto_tsquery`) is deliberate: it accepts
 * arbitrary user-typed text — including bare punctuation or an unmatched quote — without raising
 * a syntax error, degrading to fewer or no matches instead of a failed request.
 *
 * An empty/whitespace-only query returns `{}` without touching the database, matching
 * searchRecords' existing "no query, filters alone drive results" behavior in src/lib/search.ts.
 */
export async function searchFullText(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  query: string,
): Promise<FullTextMatches> {
  const trimmed = query.trim();
  if (!trimmed) return {};

  const entries = await Promise.all(
    (Object.entries(FULL_TEXT_TABLES) as Array<[SearchRecordType, string]>).map(
      async ([type, table]) => {
        const { data, error } = await supabase
          .from(table)
          .select("id")
          .textSearch("search_vector", trimmed, { type: "websearch", config: "english" });
        if (error) throw new Error(`Full-text search failed for ${table}: ${error.message}`);
        return [type, new Set((data ?? []).map((row) => (row as { id: string }).id))] as const;
      },
    ),
  );
  return Object.fromEntries(entries) as FullTextMatches;
}
