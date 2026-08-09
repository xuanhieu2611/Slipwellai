"use client";

import {
  unmatchedNames,
  type DestinationCatalog,
  type ResolvedDestination,
} from "@/lib/proposals/destinations";
import type { DestinationSelection } from "@/lib/proposals/schema";
import { SelectField } from "@/components/ui/primitives";

/* A name the account does not have is offered as an explicit choice, never preselected.
   Defaulting to it would let a fast Accept create a person or domain the user never had —
   the opposite of a proposal the user stays in control of. */
export const CREATE = "create";

export type DestinationDraft = { domain: string; project: string; person: string };

export function initialDestinationDraft(resolved: ResolvedDestination): DestinationDraft {
  return {
    domain: resolved.domain.status === "matched" ? resolved.domain.id : "",
    project: resolved.project.status === "matched" ? resolved.project.id : "",
    person: resolved.person.status === "matched" ? resolved.person.id : "",
  };
}

export function destinationSelection(
  draft: DestinationDraft,
  resolved: ResolvedDestination,
): DestinationSelection {
  const unmatched = unmatchedNames(resolved);
  return {
    domainId: draft.domain && draft.domain !== CREATE ? draft.domain : null,
    projectId: draft.project || null,
    personId: draft.person && draft.person !== CREATE ? draft.person : null,
    createDomainName: draft.domain === CREATE ? unmatched.domain : null,
    createPersonName: draft.person === CREATE ? unmatched.person : null,
  };
}

/* Everything the match could not settle, said out loud. An unmatched or ambiguous name is
   the reason this capture is in review, so it is never left implied by an empty select. */
export function destinationNotes(
  resolved: ResolvedDestination,
  catalog: DestinationCatalog,
): string[] {
  const notes: string[] = [];
  if (resolved.domainInheritedFrom)
    notes.push(`Domain taken from the ${resolved.domainInheritedFrom} it belongs to.`);
  for (const [label, match] of [
    ["domain", resolved.domain],
    ["project", resolved.project],
    ["person", resolved.person],
  ] as const) {
    if (match.status === "unmatched") {
      notes.push(
        label === "project"
          ? `No project called “${match.name}”. Create it in Work first, or file this without one.`
          : `No ${label} called “${match.name}” yet. Choose “Create ${match.name}” to add it, or leave it out.`,
      );
    }
    if (match.status === "ambiguous")
      notes.push(
        `${match.candidateIds.length} of your ${label}s are called “${match.name}”. Choose which one.`,
      );
  }
  if (
    notes.length === 0 &&
    catalog.domains.length === 0 &&
    catalog.projects.length === 0 &&
    catalog.people.length === 0
  ) {
    notes.push(
      "You have no domains, projects, or people yet. Create some in Work or People and captures will route into them.",
    );
  }
  return notes;
}

export function DestinationFields({
  catalog,
  draft,
  onChange,
  resolved,
}: {
  catalog: DestinationCatalog;
  draft: DestinationDraft;
  onChange: (draft: DestinationDraft) => void;
  resolved: ResolvedDestination;
}) {
  const unmatched = unmatchedNames(resolved);
  return (
    <fieldset className="review-group">
      <legend>Where it belongs</legend>
      <div className="review-group-grid">
        <label className="field-label">
          <span>Domain</span>
          <SelectField
            onChange={(event) => onChange({ ...draft, domain: event.target.value })}
            value={draft.domain}
          >
            <option value="">No domain</option>
            {catalog.domains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.name}
              </option>
            ))}
            {unmatched.domain && <option value={CREATE}>Create “{unmatched.domain}”</option>}
          </SelectField>
        </label>
        <label className="field-label">
          <span>Project</span>
          <SelectField
            onChange={(event) => onChange({ ...draft, project: event.target.value })}
            value={draft.project}
          >
            <option value="">No project</option>
            {catalog.projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </SelectField>
        </label>
        <label className="field-label">
          <span>Person</span>
          <SelectField
            onChange={(event) => onChange({ ...draft, person: event.target.value })}
            value={draft.person}
          >
            <option value="">Nobody in particular</option>
            {catalog.people.map((person) => (
              <option key={person.id} value={person.id}>
                {person.name}
              </option>
            ))}
            {unmatched.person && <option value={CREATE}>Create “{unmatched.person}”</option>}
          </SelectField>
        </label>
      </div>
      {destinationNotes(resolved, catalog).map((note) => (
        <p className="form-help" key={note}>
          {note}
        </p>
      ))}
    </fieldset>
  );
}
