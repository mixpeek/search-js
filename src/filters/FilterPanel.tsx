import React, { useState } from "react";
import type { FilterPanelConfig } from "../types";
import { FacetFilter } from "./FacetFilter";
import { RangeFilter } from "./RangeFilter";
import { SmartFilter } from "./SmartFilter";

interface FilterSectionProps {
  label: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  label,
  defaultOpen = true,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mixpeek-filter-section">
      <button
        className="mixpeek-filter-section__header"
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        aria-expanded={isOpen}
      >
        <span className="mixpeek-filter-section__label">{label}</span>
        <svg
          className={`mixpeek-filter-section__chevron${isOpen ? " mixpeek-filter-section__chevron--open" : ""}`}
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {isOpen && (
        <div className="mixpeek-filter-section__body">{children}</div>
      )}
    </div>
  );
};

interface FilterPanelProps {
  config: FilterPanelConfig;
  filterInputs: Record<string, unknown>;
  onFilterChange: (field: string, value: unknown) => void;
  onClearAll?: () => void;
  hasActiveFilters?: boolean;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  config,
  filterInputs,
  onFilterChange,
  onClearAll,
  hasActiveFilters,
}) => {
  return (
    <div className="mixpeek-filter-panel">
      <div className="mixpeek-filter-panel__header">
        <span className="mixpeek-filter-panel__title">
          {config.title || "Filters"}
        </span>
        {hasActiveFilters && onClearAll && (
          <button
            className="mixpeek-filter-panel__clear"
            onClick={onClearAll}
            type="button"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="mixpeek-filter-panel__body">
        {config.filters.map((filter, index) => {
          switch (filter.type) {
            case "facet":
              return (
                <FilterSection key={filter.field} label={filter.label}>
                  <FacetFilter
                    config={filter}
                    value={filterInputs[filter.field]}
                    onChange={onFilterChange}
                  />
                </FilterSection>
              );
            case "range":
              return (
                <FilterSection key={filter.field} label={filter.label}>
                  <RangeFilter
                    config={filter}
                    minValue={filterInputs[`min_${filter.field}`] as number | undefined}
                    maxValue={filterInputs[`max_${filter.field}`] as number | undefined}
                    onChange={onFilterChange}
                  />
                </FilterSection>
              );
            case "smart":
              return (
                <FilterSection
                  key={`smart-${index}`}
                  label={filter.label || "Smart Filter"}
                >
                  <SmartFilter
                    config={filter}
                    value={filterInputs.smart_filter as string | undefined}
                    onChange={onFilterChange}
                  />
                </FilterSection>
              );
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
};
