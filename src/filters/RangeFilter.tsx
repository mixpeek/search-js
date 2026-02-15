import React, { useState, useEffect, useRef, useCallback } from "react";
import type { RangeFilterConfig } from "../types";

interface RangeFilterProps {
  config: RangeFilterConfig;
  minValue?: number;
  maxValue?: number;
  onChange: (field: string, value: unknown) => void;
}

export const RangeFilter: React.FC<RangeFilterProps> = ({
  config,
  minValue,
  maxValue,
  onChange,
}) => {
  const { field, min, max, step = 1, unit = "" } = config;

  const [localMin, setLocalMin] = useState(minValue ?? min);
  const [localMax, setLocalMax] = useState(maxValue ?? max);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from props
  useEffect(() => {
    setLocalMin(minValue ?? min);
  }, [minValue, min]);

  useEffect(() => {
    setLocalMax(maxValue ?? max);
  }, [maxValue, max]);

  const emitChange = useCallback(
    (newMin: number, newMax: number) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        // Only emit if values differ from the full range
        onChange(`min_${field}`, newMin > min ? newMin : null);
        onChange(`max_${field}`, newMax < max ? newMax : null);
      }, 300);
    },
    [field, min, max, onChange]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const clamped = Math.min(val, localMax - step);
    setLocalMin(clamped);
    emitChange(clamped, localMax);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    const clamped = Math.max(val, localMin + step);
    setLocalMax(clamped);
    emitChange(localMin, clamped);
  };

  const formatValue = (val: number) => `${unit}${val}`;

  // Calculate percentage for track fill
  const minPercent = ((localMin - min) / (max - min)) * 100;
  const maxPercent = ((localMax - min) / (max - min)) * 100;

  return (
    <div className="mixpeek-range-filter">
      <div className="mixpeek-range-filter__values">
        <span className="mixpeek-range-filter__value">{formatValue(localMin)}</span>
        <span className="mixpeek-range-filter__separator">&ndash;</span>
        <span className="mixpeek-range-filter__value">{formatValue(localMax)}</span>
      </div>
      <div className="mixpeek-range-filter__track">
        <div
          className="mixpeek-range-filter__fill"
          style={{ left: `${minPercent}%`, width: `${maxPercent - minPercent}%` }}
        />
        <input
          type="range"
          className="mixpeek-range-filter__input mixpeek-range-filter__input--min"
          min={min}
          max={max}
          step={step}
          value={localMin}
          onChange={handleMinChange}
          aria-label={`Minimum ${config.label}`}
        />
        <input
          type="range"
          className="mixpeek-range-filter__input mixpeek-range-filter__input--max"
          min={min}
          max={max}
          step={step}
          value={localMax}
          onChange={handleMaxChange}
          aria-label={`Maximum ${config.label}`}
        />
      </div>
    </div>
  );
};
