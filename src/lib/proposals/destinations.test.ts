import { describe, expect, it } from "vitest";
import { describeDestination, normalizeDestinationName, resolveDestination, type DestinationCatalog } from "./destinations";

const clientWork = { id: "11111111-1111-4111-8111-111111111111", name: "Client work" };
const personal = { id: "22222222-2222-4222-8222-222222222222", name: "Personal" };

const catalog: DestinationCatalog = {
  domains: [clientWork, personal],
  projects: [
    { id: "33333333-3333-4333-8333-333333333333", name: "Rivera brand refresh", domain_id: clientWork.id },
    { id: "44444444-4444-4444-8444-444444444444", name: "Kitchen renovation", domain_id: null },
  ],
  people: [
    { id: "55555555-5555-4555-8555-555555555555", name: "Dana Rivera", domain_id: clientWork.id },
    { id: "66666666-6666-4666-8666-666666666666", name: "Sam Okafor", domain_id: null },
  ],
};

describe("normalizeDestinationName", () => {
  it("ignores case and surrounding or repeated whitespace", () => {
    expect(normalizeDestinationName("  Rivera   Brand Refresh ")).toBe("rivera brand refresh");
  });
});

describe("resolveDestination", () => {
  it("reports nothing when the capture named no destination", () => {
    const resolved = resolveDestination(undefined, catalog);
    expect(resolved.domain).toEqual({ status: "none" });
    expect(resolved.project).toEqual({ status: "none" });
    expect(resolved.person).toEqual({ status: "none" });
  });

  it("matches an owned record regardless of case and spacing", () => {
    const resolved = resolveDestination({ personName: "dana  rivera" }, catalog);
    expect(resolved.person).toEqual({ status: "matched", id: catalog.people[0].id, name: "Dana Rivera" });
  });

  /* The whole point of matching server-side: a name nobody owns must not become a record. */
  it("reports a name the account does not have rather than creating it", () => {
    const resolved = resolveDestination({ projectName: "Rivera Studios rebrand" }, catalog);
    expect(resolved.project).toEqual({ status: "unmatched", name: "Rivera Studios rebrand" });
  });

  it("does not settle an ambiguous name on the user's behalf", () => {
    const twoDanas: DestinationCatalog = {
      ...catalog,
      people: [...catalog.people, { id: "77777777-7777-4777-8777-777777777777", name: "dana rivera", domain_id: null }],
    };
    const resolved = resolveDestination({ personName: "Dana Rivera" }, twoDanas);
    expect(resolved.person.status).toBe("ambiguous");
    expect(resolved.person.status === "ambiguous" && resolved.person.candidateIds).toHaveLength(2);
  });

  it("takes the domain from a matched project when the capture named none", () => {
    const resolved = resolveDestination({ projectName: "Rivera brand refresh" }, catalog);
    expect(resolved.domain).toEqual({ status: "matched", id: clientWork.id, name: "Client work" });
    expect(resolved.domainInheritedFrom).toBe("project");
  });

  it("takes the domain from a matched person when no project matched", () => {
    const resolved = resolveDestination({ personName: "Dana Rivera" }, catalog);
    expect(resolved.domain).toEqual({ status: "matched", id: clientWork.id, name: "Client work" });
    expect(resolved.domainInheritedFrom).toBe("person");
  });

  it("prefers the project's domain over the person's", () => {
    const crossDomain: DestinationCatalog = {
      ...catalog,
      people: [{ id: catalog.people[0].id, name: "Dana Rivera", domain_id: personal.id }],
    };
    const resolved = resolveDestination({ projectName: "Rivera brand refresh", personName: "Dana Rivera" }, crossDomain);
    expect(resolved.domain).toEqual({ status: "matched", id: clientWork.id, name: "Client work" });
    expect(resolved.domainInheritedFrom).toBe("project");
  });

  /* An unmatched domain name is a question. Filling it in from the project would hide the
     fact that the capture asked for a domain the account does not have. */
  it("does not inherit over a domain name that matched nothing", () => {
    const resolved = resolveDestination({ domainName: "Studio", projectName: "Rivera brand refresh" }, catalog);
    expect(resolved.domain).toEqual({ status: "unmatched", name: "Studio" });
    expect(resolved.domainInheritedFrom).toBeUndefined();
  });

  it("leaves the domain unset when the matched project has none", () => {
    const resolved = resolveDestination({ projectName: "Kitchen renovation" }, catalog);
    expect(resolved.domain).toEqual({ status: "none" });
    expect(resolved.domainInheritedFrom).toBeUndefined();
  });

  it("keeps an explicit domain name that does match", () => {
    const resolved = resolveDestination({ domainName: "personal", projectName: "Rivera brand refresh" }, catalog);
    expect(resolved.domain).toEqual({ status: "matched", id: personal.id, name: "Personal" });
    expect(resolved.domainInheritedFrom).toBeUndefined();
  });

  it("treats an empty or whitespace-only name as no destination", () => {
    expect(resolveDestination({ personName: "   " }, catalog).person).toEqual({ status: "none" });
  });
});

describe("describeDestination", () => {
  it("names where the record is going", () => {
    expect(describeDestination(resolveDestination({ projectName: "Rivera brand refresh" }, catalog), catalog)).toBe(
      "Client work (from its project) · Rivera brand refresh",
    );
  });

  it("says a name matched nothing instead of implying it was filed", () => {
    expect(describeDestination(resolveDestination({ personName: "Nobody" }, catalog), catalog)).toBe("Nobody: no match in your records");
  });

  it("explains an empty account differently from a miss", () => {
    const empty: DestinationCatalog = { domains: [], projects: [], people: [] };
    expect(describeDestination(resolveDestination({ personName: "Dana" }, empty), empty)).toBe("Dana: nothing to file into yet");
  });

  it("calls an unrouted record unfiled", () => {
    expect(describeDestination(resolveDestination(undefined, catalog), catalog)).toBe("Unfiled");
  });
});
