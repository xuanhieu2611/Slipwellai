import { NextRequest, NextResponse } from "next/server";
import type { SearchRecordType } from "@/lib/search";
import { serverError, unauthorized } from "@/lib/http";
import { searchFullText } from "@/lib/supabase/search-repository";
import { requireUser } from "@/lib/supabase/server";

/**
 * Server-side full-text prefilter for global search (MVP-BUILD-TRACKER.md Step 9 — Search).
 * Returns matching record IDs per type from a real Postgres `search_vector` (tsvector/GIN) query,
 * scoped to the caller's own rows by RLS. This does not replace src/lib/search.ts's client-side
 * `searchRecords` — the browser already holds the full, already-authorized account dataset
 * (src/lib/workspace-data.ts's `getSearchData`) and still applies type/status/domain/project/
 * person/date-range filtering itself; this route only supplies a Postgres-backed answer to "does
 * this record's text match the query" in place of the in-memory substring check, for records
 * already visible in the browser's copy of the data.
 */
export async function GET(request: NextRequest) {
  const { supabase, user } = await requireUser();
  if (!user) return unauthorized();

  const query = request.nextUrl.searchParams.get("q") ?? "";
  try {
    const matches = await searchFullText(supabase, query);
    const payload: Partial<Record<SearchRecordType, string[]>> = {};
    for (const [type, ids] of Object.entries(matches) as Array<[SearchRecordType, Set<string>]>) {
      payload[type] = [...ids];
    }
    return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return serverError("Full-text search failed. Results may be less complete.");
  }
}
