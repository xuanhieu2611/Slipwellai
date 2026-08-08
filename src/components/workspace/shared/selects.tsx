"use client";

import type { WorkspaceData } from "@/lib/workspace";

export function DomainSelect({ domains, name = "domainId", defaultValue = "" }: { domains: WorkspaceData["domains"]; name?: string; defaultValue?: string }) {
  return <label className="field-label"><span>Domain</span><select className="field-base" defaultValue={defaultValue} name={name}><option value="">No domain</option>{domains.map((domain) => <option key={domain.id} value={domain.id}>{domain.name}</option>)}</select></label>;
}

export function PersonSelect({ people, name = "personId", defaultValue = "" }: { people: WorkspaceData["people"]; name?: string; defaultValue?: string }) {
  return <label className="field-label"><span>Person</span><select className="field-base" defaultValue={defaultValue} name={name}><option value="">No person</option>{people.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>;
}

export const DOMAIN_COLOR_PALETTE = [
  { name: "Tan", value: "#e3c9a6" },
  { name: "Blush", value: "#f4c6c6" },
  { name: "Peach", value: "#f7d9b8" },
  { name: "Butter", value: "#f5e6a3" },
  { name: "Sage", value: "#c8dfc0" },
  { name: "Mint", value: "#bfe8d4" },
  { name: "Sky", value: "#bee0f0" },
  { name: "Periwinkle", value: "#c9cef0" },
  { name: "Lavender", value: "#dcc6ec" },
  { name: "Rose", value: "#f0c9dd" },
  { name: "Terracotta", value: "#e8b9a4" },
  { name: "Seafoam", value: "#b7e4da" },
];

export function DomainColorPicker({ name = "color", defaultValue = DOMAIN_COLOR_PALETTE[0].value }: { name?: string; defaultValue?: string }) {
  return <div className="field-label"><span>Color</span><div className="color-swatch-grid">{DOMAIN_COLOR_PALETTE.map((swatch) => <label className="color-swatch" key={swatch.value} style={{ background: swatch.value }} title={swatch.name}><input aria-label={swatch.name} type="radio" name={name} value={swatch.value} defaultChecked={swatch.value === defaultValue} /></label>)}</div></div>;
}
