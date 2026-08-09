"use client";

import type { WorkspaceData } from "@/lib/workspace";

export function DomainSelect({
  domains,
  name = "domainId",
  defaultValue = "",
}: {
  domains: WorkspaceData["domains"];
  name?: string;
  defaultValue?: string;
}) {
  return (
    <label className="field-label">
      <span>Domain</span>
      <select className="field-base" defaultValue={defaultValue} name={name}>
        <option value="">No domain</option>
        {domains.map((domain) => (
          <option key={domain.id} value={domain.id}>
            {domain.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function PersonSelect({
  people,
  name = "personId",
  defaultValue = "",
}: {
  people: WorkspaceData["people"];
  name?: string;
  defaultValue?: string;
}) {
  return (
    <label className="field-label">
      <span>Person</span>
      <select className="field-base" defaultValue={defaultValue} name={name}>
        <option value="">No person</option>
        {people
          .filter((person) => !person.archived_at)
          .map((person) => (
            <option key={person.id} value={person.id}>
              {person.name}
            </option>
          ))}
      </select>
    </label>
  );
}

/* Soft midtones spaced around the hue wheel (Okabe–Ito-inspired). Pastels looked calm but
   collapsed on tiny domain dots and 20% card tints; these keep a calm look while staying separable. */
export const DOMAIN_COLOR_PALETTE = [
  { name: "Clay", value: "#C47B5B" },
  { name: "Coral", value: "#D4707A" },
  { name: "Amber", value: "#D4A054" },
  { name: "Olive", value: "#8BA86B" },
  { name: "Teal", value: "#4F9E8F" },
  { name: "Sky", value: "#5B9BC6" },
  { name: "Indigo", value: "#6B7EC8" },
  { name: "Violet", value: "#9B75C0" },
  { name: "Plum", value: "#C06B9E" },
  { name: "Stone", value: "#A89080" },
];

export function DomainColorPicker({
  name = "color",
  defaultValue = DOMAIN_COLOR_PALETTE[0].value,
}: {
  name?: string;
  defaultValue?: string;
}) {
  const normalized = defaultValue.toUpperCase();
  const known = DOMAIN_COLOR_PALETTE.some((swatch) => swatch.value.toUpperCase() === normalized);
  /* Keep a legacy/custom color selectable when editing a domain saved before the current palette. */
  const swatches = known
    ? DOMAIN_COLOR_PALETTE
    : [...DOMAIN_COLOR_PALETTE, { name: "Current", value: defaultValue }];
  return (
    <div className="field-label">
      <span>Color</span>
      <div className="color-swatch-grid">
        {swatches.map((swatch) => (
          <label
            className="color-swatch"
            key={swatch.value}
            style={{ background: swatch.value }}
            title={swatch.name}
          >
            <input
              aria-label={swatch.name}
              type="radio"
              name={name}
              value={swatch.value}
              defaultChecked={swatch.value.toUpperCase() === normalized}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
