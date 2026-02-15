import React, { ReactNode, useCallback, useRef } from "react";
import { SearchResult, StageGroup } from "./types";
import { ResultCard } from "./ResultCard";

interface SearchResultsProps {
  results: SearchResult[];
  stages: StageGroup[];
  isStreaming: boolean;
  query: string;
  isLoading: boolean;
  onResultClick?: (result: SearchResult, index: number) => void;
  renderResult?: (result: SearchResult, index: number) => ReactNode;
}

const STAGE_LABELS: Record<string, string> = {
  feature_search: "Search",
  attribute_filter: "Filter",
  sort_attribute: "Sort",
  llm_filter: "LLM Filter",
  rerank: "Rerank",
  llm_enrich: "Enrich",
  mmr: "Diversify",
  group_by: "Group",
  limit: "Limit",
  json_transform: "Transform",
  agent_search: "Agent",
  rag_prepare: "RAG",
  reduce: "Reduce",
};

function humanizeStageName(name: string): string {
  return STAGE_LABELS[name] || name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const PipelineTracker: React.FC<{ stages: StageGroup[]; isStreaming: boolean }> = ({
  stages,
  isStreaming,
}) => {
  if (stages.length === 0) return null;

  return (
    <div className="mixpeek-pipeline" role="status" aria-label="Pipeline progress">
      {stages.map((stage, i) => (
        <React.Fragment key={stage.index}>
          {i > 0 && <div className="mixpeek-pipeline-connector" />}
          <div
            className="mixpeek-pipeline-stage"
            data-status={stage.status}
            title={
              stage.statistics?.duration_ms
                ? `${humanizeStageName(stage.name)}: ${stage.documents.length} results in ${formatDuration(stage.statistics.duration_ms)}`
                : humanizeStageName(stage.name)
            }
          >
            <div className="mixpeek-pipeline-dot">
              {stage.status === "complete" && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
              {stage.status === "error" && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              )}
            </div>
            <span className="mixpeek-pipeline-label">
              {humanizeStageName(stage.name)}
            </span>
            {stage.status === "complete" && (
              <span className="mixpeek-pipeline-count">{stage.documents.length}</span>
            )}
          </div>
        </React.Fragment>
      ))}
      {isStreaming && (
        <div className="mixpeek-pipeline-connector mixpeek-pipeline-connector-active" />
      )}
    </div>
  );
};

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  stages,
  isStreaming,
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

  const showPipeline = stages.length > 0;

  if (isLoading && results.length === 0 && stages.length === 0) {
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

  if (results.length === 0 && !showPipeline) {
    return null;
  }

  return (
    <div ref={listRef}>
      {showPipeline && (
        <PipelineTracker stages={stages} isStreaming={isStreaming} />
      )}

      {results.length > 0 && (
        <div
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
      )}

      {/* Show skeleton during streaming when waiting for next stage */}
      {isStreaming && results.length === 0 && (
        <div className="mixpeek-results-loading">
          <div className="mixpeek-results-skeleton">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="mixpeek-skeleton-card">
                <div className="mixpeek-skeleton-line mixpeek-skeleton-title" />
                <div className="mixpeek-skeleton-line mixpeek-skeleton-content" />
                <div className="mixpeek-skeleton-line mixpeek-skeleton-content-short" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
