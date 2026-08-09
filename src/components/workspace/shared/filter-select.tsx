"use client";

import { Select } from "@base-ui/react/select";
import { CaretDown, Check } from "@phosphor-icons/react";
import clsx from "clsx";

export type FilterOption = { value: string; label: string };

export function FilterSelect({
  label,
  value,
  onChange,
  active,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  active: boolean;
  options: FilterOption[];
}) {
  return (
    <Select.Root
      items={options}
      value={value}
      onValueChange={(next) => {
        if (next != null) onChange(next);
      }}
    >
      <Select.Trigger aria-label={label} className={clsx("filter-select", active && "is-active")}>
        <span className="filter-select-label">{label}</span>
        <Select.Value className="filter-select-value" />
        <Select.Icon className="filter-select-icon">
          <CaretDown aria-hidden size={11} weight="bold" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner align="start" className="filter-select-positioner" sideOffset={6}>
          <Select.Popup className="filter-select-popup">
            <Select.List className="filter-select-list">
              {options.map((option) => (
                <Select.Item className="filter-select-item" key={option.value} value={option.value}>
                  <Select.ItemIndicator className="filter-select-item-indicator">
                    <Check aria-hidden size={12} weight="bold" />
                  </Select.ItemIndicator>
                  <Select.ItemText className="filter-select-item-text">
                    {option.label}
                  </Select.ItemText>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
