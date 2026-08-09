import { describe, expect, it } from "vitest";
import { filedDestinationLabel, newestProposalByCapture } from "./dashboard";
import type { DestinationCatalog } from "./proposals/destinations";

describe("newestProposalByCapture", () => {
  it("surfaces the newest retry state when a capture has multiple proposals", () => {
    const latest = newestProposalByCapture([
      { capture_id: "capture-1", id: "failed-retry", status: "failed" },
      { capture_id: "capture-1", id: "superseded-original", status: "superseded" },
    ]);

    expect(latest.get("capture-1")).toEqual({
      capture_id: "capture-1",
      id: "failed-retry",
      status: "failed",
    });
  });
});

describe("filedDestinationLabel", () => {
  const catalog: DestinationCatalog = {
    domains: [{ id: "domain-1", name: "Client work" }],
    projects: [{ id: "project-1", name: "Rivera brand refresh", domain_id: "domain-1" }],
    people: [{ id: "person-1", name: "Dana Rivera", domain_id: "domain-1" }],
  };

  it("names every destination the record actually carries", () => {
    expect(
      filedDestinationLabel(
        { domain_id: "domain-1", project_id: "project-1", person_id: "person-1" },
        catalog,
      ),
    ).toBe("Rivera brand refresh · Dana Rivera · Client work");
  });

  it("says nothing rather than implying a destination the record does not have", () => {
    expect(
      filedDestinationLabel({ domain_id: null, project_id: null, person_id: null }, catalog),
    ).toBeNull();
  });

  /* An archived or deleted destination drops out of the catalog. The label omits it
     instead of showing a stale name. */
  it("omits a destination that is no longer in the catalog", () => {
    expect(
      filedDestinationLabel(
        { domain_id: "domain-1", project_id: "archived-project", person_id: null },
        catalog,
      ),
    ).toBe("Client work");
  });
});
