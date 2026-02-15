import React, { useState, useEffect, useRef } from "react";
import type { SmartFilterConfig } from "../types";

interface SmartFilterProps {
  config: SmartFilterConfig;
  value?: string;
  onChange: (field: string, value: unknown) => void;
}

export const SmartFilter: React.FC<SmartFilterProps> = ({
  config,
  value,
  onChange,
}) => {
  const [localValue, setLocalValue] = useState(value || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange("smart_filter", val || null);
    }, 500);
  };

  return (
    <div className="mixpeek-smart-filter">
      <div className="mixpeek-smart-filter__header">
        <svg
          className="mixpeek-smart-filter__icon"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 2L9 9l-7 1 5 5-1.5 7L12 18l6.5 4L17 15l5-5-7-1z" />
        </svg>
        <span className="mixpeek-smart-filter__label">AI Filter</span>
      </div>
      <input
        type="text"
        className="mixpeek-smart-filter__input"
        value={localValue}
        onChange={handleChange}
        placeholder={config.placeholder || "Describe what you're looking for..."}
        aria-label="Smart filter"
      />
      <p className="mixpeek-smart-filter__hint">
        AI will interpret your description to filter results
      </p>
    </div>
  );
};
