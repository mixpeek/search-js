import { useState, useCallback, useMemo } from "react";

interface UseFiltersReturn {
  filterInputs: Record<string, unknown>;
  setFilter: (field: string, value: unknown) => void;
  removeFilter: (field: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  getFilter: (field: string) => unknown;
}

export function useFilters(
  defaultFilters?: Record<string, unknown>
): UseFiltersReturn {
  const [filters, setFilters] = useState<Record<string, unknown>>(
    defaultFilters || {}
  );

  const setFilter = useCallback((field: string, value: unknown) => {
    setFilters((prev) => {
      // Remove the filter if value is null, undefined, or empty string/array
      if (
        value === null ||
        value === undefined ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        const next = { ...prev };
        delete next[field];
        return next;
      }
      return { ...prev, [field]: value };
    });
  }, []);

  const removeFilter = useCallback((field: string) => {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useMemo(
    () => Object.keys(filters).length > 0,
    [filters]
  );

  const getFilter = useCallback(
    (field: string) => filters[field],
    [filters]
  );

  return {
    filterInputs: filters,
    setFilter,
    removeFilter,
    clearFilters,
    hasActiveFilters,
    getFilter,
  };
}
