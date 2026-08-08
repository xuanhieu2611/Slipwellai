/* Turning a proposed destination *name* into one of the user's records.
 *
 * Two invariants make this safe enough to sit between a language model and canonical
 * records, and both are the reason this matching is deterministic rather than something
 * the model is trusted to do:
 *
 * 1. A name is only ever matched against records the caller already owns. The model never
 *    emits an identifier, so it cannot address a record by guessing one.
 * 2. A name that matches nothing, or matches more than one record, is reported as such.
 *    It never becomes a new record and never picks a winner on the user's behalf — an
 *    unresolved destination is a question for review, which is what keeps Slipwell from
 *    inventing an identity or a relationship.
 *
 * These functions are pure so the review UI and the apply route agree on what a proposed
 * name means without a round trip.
 */

export type CatalogDomain = { id: string; name: string };
export type CatalogProject = { id: string; name: string; domain_id: string | null };
export type CatalogPerson = { id: string; name: string; domain_id: string | null };

export type DestinationCatalog = {
  domains: ReadonlyArray<CatalogDomain>;
  projects: ReadonlyArray<CatalogProject>;
  people: ReadonlyArray<CatalogPerson>;
};

export const emptyCatalog: DestinationCatalog = { domains: [], projects: [], people: [] };

export type DestinationMatch =
  /* The capture named nothing of this kind. */
  | { status: "none" }
  /* Exactly one owned record carries this name. */
  | { status: "matched"; id: string; name: string }
  /* The capture named something the account does not have. */
  | { status: "unmatched"; name: string }
  /* Several owned records share the name; the user has to say which. */
  | { status: "ambiguous"; name: string; candidateIds: string[] };

export type ResolvedDestination = {
  domain: DestinationMatch;
  project: DestinationMatch;
  person: DestinationMatch;
  /* Set when the domain was taken from a matched project or person rather than named by
     the capture. Review states this, because a destination the user did not say out loud
     still has to be visible before it is filed. */
  domainInheritedFrom?: "project" | "person";
};

/* Casefold and collapse whitespace only. Nothing cleverer: a fuzzy match that quietly
   files "Rivera Studio" work under "Rivera Studios" is the kind of confident wrongness
   review exists to prevent. */
export function normalizeDestinationName(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLowerCase();
}

function matchByName<T extends { id: string; name: string }>(
  name: string | undefined,
  records: ReadonlyArray<T>,
): DestinationMatch {
  const wanted = name ? normalizeDestinationName(name) : "";
  if (!wanted) return { status: "none" };
  const hits = records.filter((record) => normalizeDestinationName(record.name) === wanted);
  if (hits.length === 0) return { status: "unmatched", name: name!.trim() };
  if (hits.length > 1) return { status: "ambiguous", name: name!.trim(), candidateIds: hits.map((hit) => hit.id) };
  return { status: "matched", id: hits[0].id, name: hits[0].name };
}

export function resolveDestination(
  proposed: { domainName?: string; projectName?: string; personName?: string } | undefined,
  catalog: DestinationCatalog,
): ResolvedDestination {
  const domain = matchByName(proposed?.domainName, catalog.domains);
  const project = matchByName(proposed?.projectName, catalog.projects);
  const person = matchByName(proposed?.personName, catalog.people);

  /* A project or person already belongs to a domain. Carrying that across is a lookup of
     the user's own data, not a guess, so it beats filing the record with no domain at all.
     It only applies when the capture named no domain: an unmatched or ambiguous domain
     name is a question, and inheriting over it would bury it. */
  if (domain.status === "none") {
    const parent = project.status === "matched"
      ? { source: "project" as const, record: catalog.projects.find((item) => item.id === project.id) }
      : person.status === "matched"
        ? { source: "person" as const, record: catalog.people.find((item) => item.id === person.id) }
        : null;
    const inheritedId = parent?.record?.domain_id ?? null;
    const inherited = inheritedId ? catalog.domains.find((item) => item.id === inheritedId) : undefined;
    if (parent && inherited) {
      return {
        domain: { status: "matched", id: inherited.id, name: inherited.name },
        project,
        person,
        domainInheritedFrom: parent.source,
      };
    }
  }

  return { domain, project, person };
}

/* What review sends back once the user has confirmed or corrected the match. */
export function selectionFromResolved(resolved: ResolvedDestination) {
  return {
    domainId: resolved.domain.status === "matched" ? resolved.domain.id : null,
    projectId: resolved.project.status === "matched" ? resolved.project.id : null,
    personId: resolved.person.status === "matched" ? resolved.person.id : null,
  };
}

/* Names the capture asked for that the account does not have. Review offers to create the
   domain or person; a project needs more than a name, so it is only ever explained. */
export function unmatchedNames(resolved: ResolvedDestination) {
  return {
    domain: resolved.domain.status === "unmatched" ? resolved.domain.name : null,
    project: resolved.project.status === "unmatched" ? resolved.project.name : null,
    person: resolved.person.status === "unmatched" ? resolved.person.name : null,
  };
}

export function describeDestination(resolved: ResolvedDestination, catalog: DestinationCatalog): string {
  const parts: string[] = [];
  if (resolved.domain.status === "matched") {
    parts.push(resolved.domainInheritedFrom ? `${resolved.domain.name} (from its ${resolved.domainInheritedFrom})` : resolved.domain.name);
  }
  if (resolved.project.status === "matched") parts.push(resolved.project.name);
  if (resolved.person.status === "matched") parts.push(resolved.person.name);
  if (parts.length > 0) return parts.join(" · ");
  const unmatched = unmatchedNames(resolved);
  const named = unmatched.project ?? unmatched.person ?? unmatched.domain;
  if (named) return catalog.domains.length + catalog.projects.length + catalog.people.length === 0
    ? `${named}: nothing to file into yet`
    : `${named}: no match in your records`;
  return "Unfiled";
}
