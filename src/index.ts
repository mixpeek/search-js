/**
 * @mixpeek/react-searchkit - React component library for multimodal search.
 *
 * Composable search UI with stages streaming, AI answers, filters, and theming.
 *
 * @example React usage:
 * ```tsx
 * import { SearchKit } from "@mixpeek/react-searchkit";
 * import "@mixpeek/react-searchkit/styles.css";
 *
 * function App() {
 *   return <SearchKit projectKey="my-retriever-slug" />;
 * }
 * ```
 *
 * @example CDN usage:
 * ```html
 * <script src="https://cdn.mixpeek.com/searchkit/v1/searchkit.umd.js"></script>
 * <div id="mixpeek-search" data-project-key="my-retriever-slug"></div>
 * ```
 */

import type { FC } from "react";
import { SearchKit as SearchKitComponent } from "./SearchKit";
import type { SearchKitProps } from "./types";

// Main component
export { SearchKit, MixpeekSearch, useSearchKit, useMixpeekSearch } from "./SearchKit";

// Sub-components (for advanced composition)
export { SearchButton } from "./SearchButton";
export { SearchModal } from "./SearchModal";
export { SearchInput } from "./SearchInput";
export { AIAnswer } from "./AIAnswer";
export { SearchResults } from "./SearchResults";
export { ResultCard } from "./ResultCard";
export { PoweredBy } from "./PoweredBy";
export { ShareLink } from "./ShareLink";
export { ZeroResults } from "./ZeroResults";
export { IntentCTA } from "./IntentCTA";

// Filter components
export { FilterPanel, FacetFilter, RangeFilter, SmartFilter } from "./filters";

// Hooks
export { useSearch } from "./hooks/useSearch";
export { useFilters } from "./hooks/useFilters";
export { useKeyboardShortcut } from "./hooks/useKeyboardShortcut";
export { useRecentSearches } from "./hooks/useRecentSearches";

// API client
export { MixpeekClient } from "./api/client";

// Types
export type {
  SearchKitProps,
  SearchKitProps as MixpeekSearchProps,
  SearchResult,
  AIAnswerData,
  AIAnswerCitation,
  SearchResponse,
  SearchResponseMetadata,
  CTAConfig,
  SearchContextValue,
  SearchKitConfig,
  SearchKitConfig as MixpeekSearchConfig,
  ThemeMode,
  Position,
  RecentSearch,
  StageEvent,
  StageStatistics,
  StageGroup,
  FacetOption,
  FacetFilterConfig,
  RangeFilterConfig,
  SmartFilterConfig,
  FilterConfig,
  FilterPanelConfig,
} from "./types";

// ---------- CDN Auto-Init ----------
// When loaded via <script> tag with data-project-key, auto-render the widget.

interface WindowWithReact extends Window {
  React?: {
    createElement: (
      type: FC<SearchKitProps>,
      props: Record<string, unknown>
    ) => unknown;
  };
  ReactDOM?: {
    createRoot?: (container: Element) => { render: (element: unknown) => void };
  };
}

function autoInit(): void {
  if (typeof document === "undefined") return;
  if (typeof window === "undefined") return;

  // Find the script tag that loaded this file
  const scripts = document.querySelectorAll("script[data-project-key]");
  if (scripts.length === 0) return;

  // In UMD builds, React is bundled or available as a global
  const win = window as unknown as WindowWithReact;
  const ReactLib = win.React;
  const ReactDOMLib = win.ReactDOM;

  if (!ReactLib || !ReactDOMLib) {
    console.warn(
      "[@mixpeek/react-searchkit] Auto-init requires React and ReactDOM as globals. " +
        "Include React before the SearchKit script, or use the npm package instead."
    );
    return;
  }

  scripts.forEach((script) => {
    const projectKey = script.getAttribute("data-project-key");
    if (!projectKey) return;

    const theme = (script.getAttribute("data-theme") || "auto") as
      | "light"
      | "dark"
      | "auto";
    const placeholder =
      script.getAttribute("data-placeholder") || undefined;
    const containerId =
      script.getAttribute("data-container") || "mixpeek-search";
    const accentColor =
      script.getAttribute("data-accent-color") || undefined;

    // Find or create the container
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      // Insert before the script tag
      script.parentNode?.insertBefore(container, script);
    }

    const props: Record<string, unknown> = {
      projectKey,
      theme,
    };
    if (placeholder) props.placeholder = placeholder;
    if (accentColor) props.accentColor = accentColor;

    // Use createRoot for React 18+
    if (ReactDOMLib.createRoot) {
      const root = ReactDOMLib.createRoot(container);
      root.render(
        ReactLib.createElement(SearchKitComponent, props)
      );
    }
  });
}

// Run auto-init when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoInit);
  } else {
    // DOM already loaded, try init (use setTimeout to ensure module is fully evaluated)
    setTimeout(autoInit, 0);
  }
}
