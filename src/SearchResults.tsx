import React, { ReactNode, useCallback, useRef } from "react";
import { SearchResult } from "./types";
import { ResultCard } from "./ResultCard";

interface SearchResultsProps {
  results: SearchResult[];
  query: string;
  isLoading: boolean;
  onResultClick?: (result: SearchResult, index: number) => void;
  renderResult?: (result: SearchResult, index: number) => ReactNode;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  query,
  isLoading,
  onResultClick,
  renderResult,
}) => {
  const listRef = useRef<HTMLDivElement>(null);

  const scrollToResult = useCallback((index: number) => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll(".mixpeek-result-card");
    if (cards[index]) {
      cards[index].scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  // Expose scrollToResult for citation clicks
  React.useImperativeHandle(
    React.createRef(),
    () => ({ scrollToResult }),
    [scrollToResult]
  );

  if (isLoading && results.length === 0) {
    return (
      <div className="mixpeek-results-loading">
        <div className="mixpeek-results-skeleton">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mixpeek-skeleton-card">
              <div className="mixpeek-skeleton-line mixpeek-skeleton-title" />
              <div className="mixpeek-skeleton-line mixpeek-skeleton-url" />
              <div className="mixpeek-skeleton-line mixpeek-skeleton-content" />
              <div className="mixpeek-skeleton-line mixpeek-skeleton-content-short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return null;
  }

  return (
    <div
      ref={listRef}
      className="mixpeek-results-list"
      role="listbox"
      aria-label="Search results"
    >
      {results.map((result, index) => {
        if (renderResult) {
          return (
            <div key={result.id || index} className="mixpeek-result-custom" role="option">
              {renderResult(result, index)}
            </div>
          );
        }

        return (
          <ResultCard
            key={result.id || index}
            result={result}
            index={index}
            query={query}
            onResultClick={onResultClick}
          />
        );
      })}
    </div>
  );
};
