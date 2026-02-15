import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  createContext,
  useContext,
} from "react";
import {
  MixpeekSearchProps,
  SearchContextValue,
  MixpeekSearchConfig,
} from "./types";
import { SearchButton } from "./SearchButton";
import { SearchModal } from "./SearchModal";
import { useSearch } from "./hooks/useSearch";
import { useFilters } from "./hooks/useFilters";
import { useKeyboardShortcut } from "./hooks/useKeyboardShortcut";
import { useRecentSearches } from "./hooks/useRecentSearches";
import "./styles/search.css";

const SearchContext = createContext<SearchContextValue | null>(null);

/**
 * Hook to access the MixpeekSearch context from child components.
 */
export function useMixpeekSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error(
      "useMixpeekSearch must be used within a MixpeekSearch component"
    );
  }
  return ctx;
}

/**
 * MixpeekSearch - Main search widget component.
 *
 * Renders a search button that opens a search modal when clicked.
 * Supports keyboard shortcuts (Cmd+K / Ctrl+K), deep linking via query params,
 * AI answers, recent searches, and theming.
 *
 * @example
 * ```tsx
 * <MixpeekSearch projectKey="my-retriever-slug" />
 * ```
 *
 * @example
 * ```tsx
 * <MixpeekSearch
 *   projectKey="ret_sk_abc123"
 *   theme="dark"
 *   placeholder="Search documentation..."
 *   maxResults={20}
 *   onResultClick={(result) => window.location.href = result.page_url}
 * />
 * ```
 */
export const MixpeekSearch: React.FC<MixpeekSearchProps> = ({
  projectKey,
  placeholder = "Search...",
  maxResults = 10,
  theme = "auto",
  accentColor = "#6366f1",
  position = "modal",
  keyboardShortcut = true,
  showPoweredBy = true,
  enableShareLinks = false,
  enableAIAnswer = false,
  onSearch,
  onResultClick,
  onZeroResults,
  transformResults,
  renderResult,
  retrieverSlug,
  apiBaseUrl = "https://api.mixpeek.com",
  className,
  defaultOpen = false,
  ctaConfig,
  defaultFilters,
  onFilterChange,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");

  const config: MixpeekSearchConfig = useMemo(
    () => ({
      projectKey,
      retrieverSlug,
      apiBaseUrl,
      maxResults,
      theme,
      accentColor,
      placeholder,
      showPoweredBy,
      enableShareLinks,
      enableAIAnswer,
      position,
    }),
    [
      projectKey,
      retrieverSlug,
      apiBaseUrl,
      maxResults,
      theme,
      accentColor,
      placeholder,
      showPoweredBy,
      enableShareLinks,
      enableAIAnswer,
      position,
    ]
  );

  const { recentSearches, addSearch, clearRecentSearches } =
    useRecentSearches();

  const { filterInputs, setFilter, removeFilter, clearFilters, hasActiveFilters } =
    useFilters(defaultFilters);

  const { results, stages, isLoading, isStreaming, error, aiAnswer, metadata, search } = useSearch({
    config,
    filterInputs,
    onSearch,
    onSearchExecuted: addSearch,
    onZeroResults,
    transformResults,
  });

  // Re-trigger search when filters change
  useEffect(() => {
    if (query.trim()) {
      search(query);
    }
  }, [filterInputs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange?.(filterInputs);
  }, [filterInputs]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open/close handlers
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Keyboard shortcut
  useKeyboardShortcut({
    enabled: keyboardShortcut,
    onTrigger: toggle,
  });

  // Handle query changes with search
  const handleQueryChange = useCallback(
    (newQuery: string) => {
      setQuery(newQuery);
      if (newQuery.trim()) {
        search(newQuery);
      }
    },
    [search]
  );

  // Read query param on mount for deep links
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const deepLinkQuery = params.get("mixpeek_q");
    if (deepLinkQuery) {
      setQuery(deepLinkQuery);
      setIsOpen(true);
      search(deepLinkQuery);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Apply theme CSS custom properties
  const resolvedTheme = useMemo(() => {
    if (theme === "auto") {
      if (typeof window === "undefined") return "light";
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return theme;
  }, [theme]);

  const rootStyle = useMemo(
    () =>
      ({
        "--mixpeek-accent": accentColor,
        "--mixpeek-accent-rgb": hexToRgb(accentColor),
      }) as React.CSSProperties,
    [accentColor]
  );

  // Context value
  const contextValue: SearchContextValue = useMemo(
    () => ({
      query,
      setQuery: handleQueryChange,
      results,
      stages,
      isLoading,
      isStreaming,
      error,
      aiAnswer,
      metadata,
      isOpen,
      open,
      close,
      toggle,
      search,
      recentSearches,
      clearRecentSearches,
      config,
      filterInputs,
      setFilter,
      removeFilter,
      clearFilters,
      hasActiveFilters,
    }),
    [
      query,
      handleQueryChange,
      results,
      stages,
      isLoading,
      isStreaming,
      error,
      aiAnswer,
      metadata,
      isOpen,
      open,
      close,
      toggle,
      search,
      recentSearches,
      clearRecentSearches,
      config,
      filterInputs,
      setFilter,
      removeFilter,
      clearFilters,
      hasActiveFilters,
    ]
  );

  if (position === "inline") {
    return (
      <SearchContext.Provider value={contextValue}>
        <div
          className={`mixpeek-search mixpeek-theme-${resolvedTheme} mixpeek-inline ${className || ""}`}
          style={rootStyle}
          data-theme={resolvedTheme}
        >
          <div className="mixpeek-inline-container">
            <div className="mixpeek-modal-header">
              <div className="mixpeek-search-input-wrapper">
                <div className="mixpeek-search-input-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <input
                  type="text"
                  className="mixpeek-search-input"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder={placeholder}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  aria-label="Search"
                />
                {query && (
                  <button
                    className="mixpeek-search-clear"
                    onClick={() => handleQueryChange("")}
                    aria-label="Clear search"
                    type="button"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <div className="mixpeek-modal-body">
              {error && (
                <div className="mixpeek-error" role="alert">
                  {error}
                </div>
              )}

              {enableAIAnswer && aiAnswer && aiAnswer.answer && (
                <div className="mixpeek-ai-answer">
                  <div className="mixpeek-ai-answer-text">{aiAnswer.answer}</div>
                </div>
              )}

              {results.length > 0 && (
                <div className="mixpeek-results-list" role="listbox">
                  {results.map((result, index) =>
                    renderResult ? (
                      <div key={result.id || index} role="option">
                        {renderResult(result, index)}
                      </div>
                    ) : (
                      <div key={result.id || index}>
                        {/* Use ResultCard inline */}
                        <a
                          className="mixpeek-result-card"
                          href={result.page_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onResultClick?.(result, index)}
                          role="option"
                        >
                          <div className="mixpeek-result-body">
                            <div className="mixpeek-result-title">
                              {result.title || "Untitled"}
                            </div>
                            {result.content && (
                              <div className="mixpeek-result-content">
                                {result.content.slice(0, 200)}
                              </div>
                            )}
                          </div>
                        </a>
                      </div>
                    )
                  )}
                </div>
              )}

              {query.trim() && !isLoading && results.length === 0 && !error && (
                <div className="mixpeek-zero-results">
                  <div className="mixpeek-zero-results-title">
                    No results found
                  </div>
                  <div className="mixpeek-zero-results-text">
                    No results for &ldquo;{query}&rdquo;
                  </div>
                </div>
              )}
            </div>

            {showPoweredBy && (
              <div className="mixpeek-modal-footer">
                <div className="mixpeek-modal-footer-left" />
                <div className="mixpeek-modal-footer-right">
                  <a
                    className="mixpeek-powered-by"
                    href="https://mixpeek.com/search"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="mixpeek-powered-by-text">Search by</span>
                    <strong>Mixpeek</strong>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </SearchContext.Provider>
    );
  }

  // Modal position (default)
  return (
    <SearchContext.Provider value={contextValue}>
      <div
        className={`mixpeek-search mixpeek-theme-${resolvedTheme} ${className || ""}`}
        style={rootStyle}
        data-theme={resolvedTheme}
      >
        <SearchButton
          onClick={open}
          placeholder={placeholder}
          keyboardShortcut={keyboardShortcut}
        />

        <SearchModal
          isOpen={isOpen}
          onClose={close}
          query={query}
          onQueryChange={handleQueryChange}
          results={results}
          stages={stages}
          isStreaming={isStreaming}
          isLoading={isLoading}
          error={error}
          aiAnswer={aiAnswer}
          metadata={metadata}
          placeholder={placeholder}
          showPoweredBy={showPoweredBy}
          enableShareLinks={enableShareLinks}
          enableAIAnswer={enableAIAnswer}
          recentSearches={recentSearches}
          onClearRecent={clearRecentSearches}
          onResultClick={onResultClick}
          renderResult={renderResult}
          ctaConfig={ctaConfig}
        />
      </div>
    </SearchContext.Provider>
  );
};

/**
 * Convert a hex color to an RGB string for use in rgba().
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "99, 102, 241";
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`;
}

export default MixpeekSearch;
