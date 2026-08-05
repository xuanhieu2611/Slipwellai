import { describe, expect, it } from "vitest";
import { applyDestinationSelection, verifyOwnedDestination } from "./catalog";

const domainId = "11111111-1111-4111-8111-111111111111";
const projectId = "22222222-2222-4222-8222-222222222222";
const personId = "33333333-3333-4333-8333-333333333333";

/* Stands in for PostgREST under row-level security: a select only ever returns rows the
   caller owns, so `owned` is the set of identifiers this account can see. Anything else
   reads as absent, exactly as another account's row would. */
function stubClient({ owned = [] as string[], namedRows = {} as Record<string, { id: string } | null> } = {}) {
  const inserts: Array<{ table: string; value: unknown }> = [];
  let nextId = 0;
  const supabase = {
    from(table: string) {
      return {
        select() {
          const state: { id?: string; name?: string } = {};
          const chain = {
            eq: (_column: string, value: string) => {
              state.id = value;
              return chain;
            },
            ilike: (_column: string, value: string) => {
              state.name = value;
              return chain;
            },
            is: () => chain,
            limit: () => chain,
            maybeSingle: () => {
              if (state.name !== undefined) return { data: namedRows[`${table}:${state.name.toLowerCase()}`] ?? null };
              return { data: state.id && owned.includes(state.id) ? { id: state.id } : null };
            },
          };
          return chain;
        },
        insert(value: unknown) {
          inserts.push({ table, value });
          nextId += 1;
          const created = { id: `created-${table}-${nextId}` };
          return { select: () => ({ single: () => ({ data: created, error: null }) }) };
        },
      };
    },
  };
  return { supabase, inserts };
}

describe("verifyOwnedDestination", () => {
  it("accepts identifiers the caller owns", async () => {
    const { supabase } = stubClient({ owned: [domainId, projectId, personId] });
    await expect(verifyOwnedDestination(supabase as never, { domainId, projectId, personId })).resolves.toEqual({ ok: true });
  });

  /* The foreign keys on tasks and notes do not check who owns the row they point at, and
     RLS on the insert only proves the *task* belongs to the caller. Without this check a
     crafted request could attach one account's task to another account's project. */
  it("refuses an identifier belonging to someone else", async () => {
    const { supabase } = stubClient({ owned: [domainId] });
    const result = await verifyOwnedDestination(supabase as never, { domainId, projectId });
    expect(result).toEqual({ ok: false, message: "That project is not one of yours." });
  });

  it("checks nothing when nothing was chosen", async () => {
    const { supabase } = stubClient();
    await expect(verifyOwnedDestination(supabase as never, {})).resolves.toEqual({ ok: true });
  });
});

describe("applyDestinationSelection", () => {
  it("files without a destination when none was chosen", async () => {
    const { supabase, inserts } = stubClient();
    const result = await applyDestinationSelection(supabase as never, undefined);
    expect(result).toEqual({ ok: true, destination: { domainId: null, projectId: null, personId: null } });
    expect(inserts).toEqual([]);
  });

  it("passes chosen identifiers through once ownership is proved", async () => {
    const { supabase, inserts } = stubClient({ owned: [domainId, projectId, personId] });
    const result = await applyDestinationSelection(supabase as never, { domainId, projectId, personId });
    expect(result).toEqual({ ok: true, destination: { domainId, projectId, personId } });
    expect(inserts).toEqual([]);
  });

  it("stops before creating anything when an identifier is not the caller's", async () => {
    const { supabase, inserts } = stubClient({ owned: [] });
    const result = await applyDestinationSelection(supabase as never, { personId, createDomainName: "Client work" });
    expect(result).toEqual({ ok: false, message: "That person is not one of yours." });
    expect(inserts).toEqual([]);
  });

  it("creates a domain only when the user explicitly asked for one", async () => {
    const { supabase, inserts } = stubClient();
    const result = await applyDestinationSelection(supabase as never, { createDomainName: "Client work" });
    expect(result).toEqual({ ok: true, destination: { domainId: "created-domains-1", projectId: null, personId: null } });
    expect(inserts).toEqual([{ table: "domains", value: { name: "Client work" } }]);
  });

  /* Accept is retried on a flaky connection and opened in two tabs. Reusing the record
     that already carries the name is what keeps a second attempt from duplicating it. */
  it("reuses an existing domain of the same name instead of duplicating it", async () => {
    const { supabase, inserts } = stubClient({ namedRows: { "domains:client work": { id: domainId } } });
    const result = await applyDestinationSelection(supabase as never, { createDomainName: "Client work" });
    expect(result).toEqual({ ok: true, destination: { domainId, projectId: null, personId: null } });
    expect(inserts).toEqual([]);
  });

  it("puts a newly created person in the domain chosen alongside them", async () => {
    const { supabase, inserts } = stubClient({ owned: [domainId] });
    const result = await applyDestinationSelection(supabase as never, { domainId, createPersonName: "Dana Rivera" });
    expect(result).toEqual({ ok: true, destination: { domainId, projectId: null, personId: "created-people-1" } });
    expect(inserts).toEqual([{ table: "people", value: { name: "Dana Rivera", domain_id: domainId } }]);
  });

  it("reuses an existing person of the same name", async () => {
    const { supabase, inserts } = stubClient({ namedRows: { "people:dana rivera": { id: personId } } });
    const result = await applyDestinationSelection(supabase as never, { createPersonName: "Dana Rivera" });
    expect(result.ok && result.destination.personId).toBe(personId);
    expect(inserts).toEqual([]);
  });
});
