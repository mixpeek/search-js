import React, { useState, useCallback, useMemo } from "react";
import { SearchResult } from "./types";

interface ResultCardProps {
  result: SearchResult;
  index: number;
  query: string;
  onResultClick?: (result: SearchResult, index: number) => void;
}

function highlightText(text: string, query: string): React.ReactNode {
  if (!query.trim() || !text) return text;

  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

  if (words.length === 0) return text;

  const pattern = new RegExp(`(${words.join("|")})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, i) =>
    pattern.test(part) ? (
      <mark key={i} className="mixpeek-highlight">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function extractDisplayTitle(result: SearchResult): string {
  if (result.title) return result.title;
  if (result.page_url) {
    try {
      const url = new URL(result.page_url);
      return url.pathname === "/" ? url.hostname : url.pathname.split("/").pop() || url.hostname;
    } catch {
      return result.page_url;
    }
  }
  if (result.content) return result.content.slice(0, 80);
  return "Untitled";
}

function extractDisplayContent(result: SearchResult): string {
  if (result.content) return result.content;
  for (const key of ["description", "snippet", "summary", "text", "body"]) {
    if (typeof result[key] === "string" && result[key]) {
      return result[key] as string;
    }
  }
  return "";
}

function formatScore(score: number): string {
  if (score >= 0 && score <= 1) {
    return `${Math.round(score * 100)}%`;
  }
  return score.toFixed(1);
}

function formatMetaValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value === null || value === undefined) return "";
  return JSON.stringify(value);
}

const DISPLAY_FIELDS = new Set([
  "id", "title", "content", "page_url", "image_url", "score",
  "document_id", "collection_id", "namespace_id",
]);

export const ResultCard: React.FC<ResultCardProps> = ({
  result,
  index,
  query,
  onResultClick,
}) => {
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showMeta, setShowMeta] = useState(false);

  const title = extractDisplayTitle(result);
  const content = extractDisplayContent(result);
  const truncatedContent =
    content.length > 200 ? content.slice(0, 200) + "..." : content;

  const reference = (result.document_id as string) || result.id || null;

  const metaEntries = useMemo(() => {
    const entries: [string, string][] = [];
    for (const [key, value] of Object.entries(result)) {
      if (DISPLAY_FIELDS.has(key)) continue;
      if (key.startsWith("_") || key.startsWith("__")) continue;
      if (value === null || value === undefined) continue;
      const formatted = formatMetaValue(value);
      if (formatted) entries.push([key, formatted]);
    }
    return entries;
  }, [result]);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      onResultClick?.(result, index);

      if (result.page_url) {
        if (onResultClick) {
          e.preventDefault();
        }
      }
    },
    [result, index, onResultClick]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onResultClick?.(result, index);
        if (result.page_url && !onResultClick) {
          window.open(result.page_url, "_blank", "noopener,noreferrer");
        }
      }
    },
    [result, index, onResultClick]
  );

  const handleCopySnippet = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const text = `${title}${result.page_url ? "\n" + result.page_url : ""}`;
      navigator.clipboard.writeText(text).then(() => {
        setCopyFeedback(true);
        setTimeout(() => setCopyFeedback(false), 2000);
      }).catch(() => {
        // Clipboard API unavailable
      });
    },
    [title, result.page_url]
  );

  const handleMetaToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setShowMeta((prev) => !prev);
    },
    []
  );

  const Tag = result.page_url ? "a" : "div";
  const linkProps = result.page_url
    ? { href: result.page_url, target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  return (
    <Tag
      className="mixpeek-result-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      {...linkProps}
      role="option"
      aria-selected={false}
      data-index={index}
    >
      {result.image_url && (
        <div className="mixpeek-result-thumbnail">
          <img
            src={result.image_url}
            alt=""
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      )}

      <div className="mixpeek-result-body">
        <div className="mixpeek-result-header">
          <div className="mixpeek-result-title">
            {highlightText(title, query)}
          </div>
          {typeof result.score === "number" && (
            <span className="mixpeek-result-score">
              {formatScore(result.score)}
            </span>
          )}
        </div>

        {result.page_url && (
          <div className="mixpeek-result-url">{result.page_url}</div>
        )}

        {truncatedContent && (
          <div className="mixpeek-result-content">
            {highlightText(truncatedContent, query)}
          </div>
        )}

        <div className="mixpeek-result-footer">
          {reference && (
            <span className="mixpeek-result-ref" title={reference}>
              {reference}
            </span>
          )}
          {metaEntries.length > 0 && (
            <button
              className="mixpeek-meta-toggle"
              onClick={handleMetaToggle}
              type="button"
              aria-expanded={showMeta}
              aria-label={showMeta ? "Hide details" : "Show details"}
            >
              <svg
                className={`mixpeek-meta-chevron ${showMeta ? "mixpeek-meta-chevron-open" : ""}`}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Details
            </button>
          )}
        </div>

        {showMeta && metaEntries.length > 0 && (
          <div className="mixpeek-result-metadata">
            {metaEntries.map(([key, value]) => (
              <div key={key} className="mixpeek-meta-row">
                <span className="mixpeek-meta-key">{key}</span>
                <span className="mixpeek-meta-value">{value}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mixpeek-result-actions">
        <button
          className="mixpeek-result-copy"
          onClick={handleCopySnippet}
          aria-label="Copy link"
          title="Copy link"
          type="button"
        >
          {copyFeedback ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          )}
        </button>
      </div>
    </Tag>
  );
};
