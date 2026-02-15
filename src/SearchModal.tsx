import React, { useCallback, useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";
import { SearchInput } from "./SearchInput";
import { AIAnswer } from "./AIAnswer";
import { SearchResults } from "./SearchResults";
import { ZeroResults } from "./ZeroResults";
import { PoweredBy } from "./PoweredBy";
import { ShareLink } from "./ShareLink";
import { IntentCTA } from "./IntentCTA";
import { SearchResult, AIAnswerData, SearchResponseMetadata, CTAConfig, StageGroup } from "./types";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onQueryChange: (query: string) => void;
  results: SearchResult[];
  stages: StageGroup[];
  isStreaming: boolean;
  isLoading: boolean;
  error: string | null;
  aiAnswer: AIAnswerData | null;
  metadata: SearchResponseMetadata | null;
  placeholder: string;
  showPoweredBy: boolean;
  enableShareLinks: boolean;
  enableAIAnswer: boolean;
  recentSearches: string[];
  onClearRecent: () => void;
  onResultClick?: (result: SearchResult, index: number) => void;
  renderResult?: (result: SearchResult, index: number) => ReactNode;
  ctaConfig?: CTAConfig;
  theme?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  query,
  onQueryChange,
  results,
  stages,
  isStreaming,
  isLoading,
  error,
  aiAnswer,
  metadata,
  placeholder,
  showPoweredBy,
  enableShareLinks,
  enableAIAnswer,
  recentSearches,
  onClearRecent,
  onResultClick,
  renderResult,
  ctaConfig,
  theme = "light",
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Handle Escape key and focus trap
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap: keep Tab within the modal
      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'input, button, a[href], [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === backdropRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  const handleClear = useCallback(() => {
    onQueryChange("");
  }, [onQueryChange]);

  const handleRecentClick = useCallback(
    (recentQuery: string) => {
      onQueryChange(recentQuery);
    },
    [onQueryChange]
  );

  const handleCitationClick = useCallback(
    (resultIndex: number) => {
      const el = modalRef.current?.querySelector(
        `[data-index="${resultIndex}"]`
      );
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
        el.classList.add("mixpeek-result-highlighted");
        setTimeout(() => {
          el.classList.remove("mixpeek-result-highlighted");
        }, 1500);
      }
    },
    []
  );

  const showRecent = !query && recentSearches.length > 0;
  const showEmpty = !query && recentSearches.length === 0;
  const showZeroResults = query.trim() && !isLoading && !isStreaming && results.length === 0 && !error;
  const showResults = results.length > 0 || stages.length > 0;
  const showAIAnswer = enableAIAnswer && aiAnswer && aiAnswer.answer;
  const effectiveCTA = ctaConfig || metadata?.cta;

  if (!isOpen) return null;

  const modalContent = (
    <div
      ref={backdropRef}
      className={`mixpeek-search mixpeek-theme-${theme} mixpeek-modal-backdrop`}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div ref={modalRef} className="mixpeek-modal">
        <div className="mixpeek-modal-header">
          <SearchInput
            value={query}
            onChange={onQueryChange}
            placeholder={placeholder}
            isLoading={isLoading}
            onClear={handleClear}
          />
        </div>

        <div className="mixpeek-modal-body">
          {error && (
            <div className="mixpeek-error" role="alert">
              <div className="mixpeek-error-icon">
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
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <span>{error}</span>
            </div>
          )}

          {showEmpty && (
            <div className="mixpeek-empty-state">
              <div className="mixpeek-empty-state-icon">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>
              <div className="mixpeek-empty-state-text">
                Type to search or press{" "}
                <kbd className="mixpeek-empty-state-kbd">Esc</kbd> to close
              </div>
            </div>
          )}

          {showRecent && (
            <div className="mixpeek-recent-searches">
              <div className="mixpeek-recent-header">
                <span className="mixpeek-recent-title">Recent searches</span>
                <button
                  className="mixpeek-recent-clear"
                  onClick={onClearRecent}
                  type="button"
                >
                  Clear
                </button>
              </div>
              <div className="mixpeek-recent-list">
                {recentSearches.map((recent, i) => (
                  <button
                    key={i}
                    className="mixpeek-recent-item"
                    onClick={() => handleRecentClick(recent)}
                    type="button"
                  >
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
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{recent}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showAIAnswer && (
            <AIAnswer data={aiAnswer!} onCitationClick={handleCitationClick} />
          )}

          {showResults && (
            <SearchResults
              results={results}
              stages={stages}
              isStreaming={isStreaming}
              query={query}
              isLoading={isLoading}
              onResultClick={onResultClick}
              renderResult={renderResult}
            />
          )}

          {showZeroResults && <ZeroResults query={query} />}

          {effectiveCTA && <IntentCTA config={effectiveCTA} />}
        </div>

        <div className="mixpeek-modal-footer">
          <div className="mixpeek-modal-footer-left">
            {enableShareLinks && <ShareLink query={query} />}
          </div>
          <div className="mixpeek-modal-footer-right">
            <div className="mixpeek-modal-footer-hints">
              <kbd className="mixpeek-kbd-hint">Esc</kbd>
              <span>to close</span>
            </div>
            {showPoweredBy && <PoweredBy />}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
