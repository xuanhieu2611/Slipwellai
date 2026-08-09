import type { DestinationCatalog } from "@/lib/proposals/destinations";

type SupabaseClient = Awaited<
  ReturnType<typeof import("@/lib/supabase/server").createSupabaseServerClient>
>;

/* Bounded so a large account cannot grow the prompt without limit. An account past these
   sizes loses only the routing hint — matching still runs against every owned record, and
   an unrouted proposal is reviewable rather than wrong. */
const CATALOG_LIMITS = { domains: 60, projects: 60, people: 80 } as const;

/* Names only. The prompt needs enough to route a capture into records that already exist;
   it does not need descriptions, notes, or anything else attached to them. */
export async function loadDestinationCatalog(
  supabase: SupabaseClient,
): Promise<DestinationCatalog> {
  const [domains, projects, people] = await Promise.all([
    supabase
      .from("domains")
      .select("id, name")
      .is("archived_at", null)
      .order("name")
      .limit(CATALOG_LIMITS.domains),
    supabase
      .from("projects")
      .select("id, name, domain_id")
      .is("archived_at", null)
      .in("status", ["active", "paused"])
      .order("created_at", { ascending: false })
      .limit(CATALOG_LIMITS.projects),
    supabase
      .from("people")
      .select("id, name, domain_id")
      .is("archived_at", null)
      .order("name")
      .limit(CATALOG_LIMITS.people),
  ]);

  return {
    domains: (domains.data ?? []) as DestinationCatalog["domains"],
    projects: (projects.data ?? []) as DestinationCatalog["projects"],
    people: (people.data ?? []) as DestinationCatalog["people"],
  };
}

/* Verifies that every identifier review sent back belongs to the caller.
 *
 * The foreign keys on `tasks` and `notes` point at `domains`, `projects`, and `people`
 * without checking who owns the row, and RLS on the insert only proves the *task* is the
 * caller's. Without this check a crafted request could attach one account's task to
 * another account's project. Selecting under RLS is the ownership proof.
 */
export async function verifyOwnedDestination(
  supabase: SupabaseClient,
  selection: { domainId?: string | null; projectId?: string | null; personId?: string | null },
): Promise<{ ok: true } | { ok: false; message: string }> {
  const checks: Array<{ table: "domains" | "projects" | "people"; id: string; label: string }> = [];
  if (selection.domainId)
    checks.push({ table: "domains", id: selection.domainId, label: "domain" });
  if (selection.projectId)
    checks.push({ table: "projects", id: selection.projectId, label: "project" });
  if (selection.personId) checks.push({ table: "people", id: selection.personId, label: "person" });

  const results = await Promise.all(
    checks.map(async (check) => {
      const { data } = await supabase
        .from(check.table)
        .select("id")
        .eq("id", check.id)
        .maybeSingle();
      return { label: check.label, found: Boolean(data) };
    }),
  );
  const missing = results.find((result) => !result.found);
  return missing
    ? { ok: false, message: `That ${missing.label} is not one of yours.` }
    : { ok: true };
}

/* Resolves a review selection into identifiers, creating a name-only domain or person when
   the user explicitly asked for one. Creation is deliberately limited to records a name
   fully describes; a project carries dates and an outcome, so it is created in the
   workspace rather than invented from a capture. */
export async function applyDestinationSelection(
  supabase: SupabaseClient,
  selection:
    | {
        domainId?: string | null;
        projectId?: string | null;
        personId?: string | null;
        createDomainName?: string | null;
        createPersonName?: string | null;
      }
    | undefined,
): Promise<
  | {
      ok: true;
      destination: { domainId: string | null; projectId: string | null; personId: string | null };
    }
  | { ok: false; message: string }
> {
  if (!selection)
    return { ok: true, destination: { domainId: null, projectId: null, personId: null } };

  const owned = await verifyOwnedDestination(supabase, selection);
  if (!owned.ok) return owned;

  let domainId = selection.domainId ?? null;
  let personId = selection.personId ?? null;

  if (selection.createDomainName) {
    /* `domains` is unique on (owner_id, name), so a resubmitted accept reuses the domain
       it created the first time instead of failing or duplicating it. */
    const { data: existing } = await supabase
      .from("domains")
      .select("id")
      .ilike("name", selection.createDomainName)
      .maybeSingle();
    if (existing) {
      domainId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("domains")
        .insert({ name: selection.createDomainName })
        .select("id")
        .single();
      if (error || !created) return { ok: false, message: "That domain could not be created." };
      domainId = created.id;
    }
  }

  if (selection.createPersonName) {
    const { data: existing } = await supabase
      .from("people")
      .select("id")
      .ilike("name", selection.createPersonName)
      .is("archived_at", null)
      .limit(1)
      .maybeSingle();
    if (existing) {
      personId = existing.id;
    } else {
      const { data: created, error } = await supabase
        .from("people")
        .insert({ name: selection.createPersonName, domain_id: domainId })
        .select("id")
        .single();
      if (error || !created) return { ok: false, message: "That person could not be created." };
      personId = created.id;
    }
  }

  return { ok: true, destination: { domainId, projectId: selection.projectId ?? null, personId } };
}
