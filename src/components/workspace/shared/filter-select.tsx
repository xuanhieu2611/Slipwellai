"use client";

import { type ReactNode } from "react";
import { CaretDown } from "@phosphor-icons/react";

export function FilterSelect({ label, value, onChange, active, children }: { label: string; value: string; onChange: (value: string) => void; active: boolean; children: ReactNode }) {
  return <label className={active ? "filter-select is-active" : "filter-select"}><span className="filter-select-label">{label}</span><select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>{children}</select><CaretDown aria-hidden size={11} weight="bold" /></label>;
}
