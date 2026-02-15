import React from "react";
import type { FacetFilterConfig } from "../types";

interface FacetFilterProps {
  config: FacetFilterConfig;
  value: unknown;
  onChange: (field: string, value: unknown) => void;
}

export const FacetFilter: React.FC<FacetFilterProps> = ({
  config,
  value,
  onChange,
}) => {
  const { field, options, multiple } = config;

  const isChecked = (optionValue: string): boolean => {
    if (multiple && Array.isArray(value)) {
      return value.includes(optionValue);
    }
    return value === optionValue;
  };

  const handleToggle = (optionValue: string) => {
    if (multiple) {
      const current = Array.isArray(value) ? (value as string[]) : [];
      if (current.includes(optionValue)) {
        onChange(field, current.filter((v) => v !== optionValue));
      } else {
        onChange(field, [...current, optionValue]);
      }
    } else {
      // Single select: toggle off if already selected
      onChange(field, value === optionValue ? null : optionValue);
    }
  };

  return (
    <div className="mixpeek-facet-filter">
      {options.map((option) => (
        <label
          key={option.value}
          className={`mixpeek-facet-filter__option${isChecked(option.value) ? " mixpeek-facet-filter__option--active" : ""}`}
        >
          <input
            type="checkbox"
            className="mixpeek-facet-filter__checkbox"
            checked={isChecked(option.value)}
            onChange={() => handleToggle(option.value)}
          />
          <span className="mixpeek-facet-filter__label">{option.label}</span>
          {option.count !== undefined && (
            <span className="mixpeek-facet-filter__count">{option.count}</span>
          )}
        </label>
      ))}
    </div>
  );
};
