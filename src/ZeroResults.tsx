import React from "react";

interface ZeroResultsProps {
  query: string;
}

export const ZeroResults: React.FC<ZeroResultsProps> = ({ query }) => {
  return (
    <div className="mixpeek-zero-results" role="status">
      <div className="mixpeek-zero-results-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>
      <div className="mixpeek-zero-results-title">No results found</div>
      <div className="mixpeek-zero-results-text">
        No results for &ldquo;<strong>{query}</strong>&rdquo;. Try different
        keywords or check for typos.
      </div>
    </div>
  );
};
