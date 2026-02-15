import { ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "auto";
export type Position = "modal" | "inline";

/* ---------- Filter Types ---------- */

export interface FacetOption {
  /** Display label */
  label: string;
  /** Value sent to the API */
  value: string;
  /** Optional count badge */
  count?: number;
}

export interface FacetFilterConfig {
  type: "facet";
  /** Field name used as the input key (e.g. "category") */
  field: string;
  /** Display label */
  label: string;
  /** Available options */
  options: FacetOption[];
  /** Allow multiple selections (default: false) */
  multiple?: boolean;
}

export interface RangeFilterConfig {
  type: "range";
  /** Field name prefix — emits min_<field> and max_<field> */
  field: string;
  /** Display label */
  label: string;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment (default: 1) */
  step?: number;
  /** Unit prefix for display (e.g. "$") */
  unit?: string;
}

export interface SmartFilterConfig {
  type: "smart";
  /** Display label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
}

export type FilterConfig = FacetFilterConfig | RangeFilterConfig | SmartFilterConfig;

export interface FilterPanelConfig {
  /** Panel title */
  title?: string;
  /** Filter definitions */
  filters: FilterConfig[];
}

export interface SearchKitProps {
  /** Project key: either a `ret_sk_` API key or a public retriever slug name */
  projectKey: string;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Maximum number of results to show */
  maxResults?: number;
  /** Color theme */
  theme?: ThemeMode;
  /** Accent color for highlights and interactive elements */
  accentColor?: string;
  /** Whether to display as a modal or inline */
  position?: Position;
  /** Keyboard shortcut to open search. Set false to disable. Default: true (Cmd+K / Ctrl+K) */
  keyboardShortcut?: boolean;
  /** Show "Search by Mixpeek" badge */
  showPoweredBy?: boolean;
  /** Enable shareable search links via query params */
  enableShareLinks?: boolean;
  /** Enable AI answer panel (requires agent_search stage in retriever) */
  enableAIAnswer?: boolean;
  /** Callback when a search is performed */
  onSearch?: (query: string) => void;
  /** Callback when a result is clicked */
  onResultClick?: (result: SearchResult, index: number) => void;
  /** Callback when zero results are returned */
  onZeroResults?: (query: string) => void;
  /** Transform results before rendering */
  transformResults?: (results: SearchResult[]) => SearchResult[];
  /** Custom result renderer */
  renderResult?: (result: SearchResult, index: number) => ReactNode;
  /** When using a ret_sk_ key, the public retriever slug for the endpoint URL */
  retrieverSlug?: string;
  /** Custom API base URL */
  apiBaseUrl?: string;
  /** Additional CSS class name */
  className?: string;
  /** Whether the modal starts open */
  defaultOpen?: boolean;
  /** CTA configuration for enterprise intent capture */
  ctaConfig?: CTAConfig;
  /** Default filter values to apply on mount */
  defaultFilters?: Record<string, unknown>;
  /** Callback when filter inputs change */
  onFilterChange?: (filterInputs: Record<string, unknown>) => void;
}

export interface SearchResult {
  /** Unique identifier for the result */
  id?: string;
  /** Display title */
  title?: string;
  /** URL to navigate to on click */
  page_url?: string;
  /** Content snippet or description */
  content?: string;
  /** Image URL for thumbnail */
  image_url?: string;
  /** Relevance score */
  score?: number;
  /** Any additional fields from the retriever */
  [key: string]: unknown;
}

export interface AIAnswerData {
  /** The AI-generated answer text */
  answer: string;
  /** Citation references to search results */
  citations?: AIAnswerCitation[];
  /** Whether the answer is still streaming */
  isStreaming?: boolean;
}

export interface AIAnswerCitation {
  /** Index of the referenced result in the results array */
  resultIndex: number;
  /** The cited text snippet */
  text: string;
}

export interface SearchResponse {
  /** Array of search results */
  results?: SearchResult[];
  /** Alias for results (some endpoints use this) */
  documents?: SearchResult[];
  /** AI-generated answer data */
  ai_answer?: AIAnswerData;
  /** Response metadata */
  metadata?: SearchResponseMetadata;
}

export interface SearchResponseMetadata {
  /** Total number of results available */
  total?: number;
  /** Time taken for the search in milliseconds */
  took_ms?: number;
  /** CTA configuration from server */
  cta?: CTAConfig;
}

export interface CTAConfig {
  /** CTA message text */
  message: string;
  /** CTA button text */
  buttonText: string;
  /** CTA button link */
  buttonUrl: string;
}

export interface SearchContextValue {
  /** Current search query */
  query: string;
  /** Set the search query */
  setQuery: (query: string) => void;
  /** Search results */
  results: SearchResult[];
  /** Whether a search is in progress */
  isLoading: boolean;
  /** Error message if search failed */
  error: string | null;
  /** AI answer data */
  aiAnswer: AIAnswerData | null;
  /** Response metadata */
  metadata: SearchResponseMetadata | null;
  /** Whether the search modal is open */
  isOpen: boolean;
  /** Open the search modal */
  open: () => void;
  /** Close the search modal */
  close: () => void;
  /** Toggle the search modal */
  toggle: () => void;
  /** Perform a search */
  search: (query: string) => Promise<void>;
  /** Pipeline stages (populated during streaming) */
  stages: StageGroup[];
  /** Whether results are currently streaming */
  isStreaming: boolean;
  /** Recent search queries */
  recentSearches: string[];
  /** Clear recent searches */
  clearRecentSearches: () => void;
  /** Configuration */
  config: SearchKitConfig;
  /** Current filter inputs */
  filterInputs: Record<string, unknown>;
  /** Set a filter value (pass null/undefined to remove) */
  setFilter: (field: string, value: unknown) => void;
  /** Remove a filter by field name */
  removeFilter: (field: string) => void;
  /** Clear all active filters */
  clearFilters: () => void;
  /** Whether any filters are currently active */
  hasActiveFilters: boolean;
}

export interface SearchKitConfig {
  projectKey: string;
  retrieverSlug?: string;
  apiBaseUrl: string;
  maxResults: number;
  theme: ThemeMode;
  accentColor: string;
  placeholder: string;
  showPoweredBy: boolean;
  enableShareLinks: boolean;
  enableAIAnswer: boolean;
  position: Position;
}

export interface RecentSearch {
  query: string;
  timestamp: number;
}

/* ---------- Streaming / Pipeline Types ---------- */

export interface StageEvent {
  event_type:
    | "stage_start"
    | "stage_complete"
    | "stage_error"
    | "execution_complete"
    | "execution_error";
  execution_id: string;
  stage_name?: string;
  stage_index?: number;
  total_stages?: number;
  statistics?: StageStatistics;
  documents?: SearchResult[];
  budget_used?: Record<string, unknown>;
  pagination?: Record<string, unknown>;
  error?: string;
}

export interface StageStatistics {
  input_count?: number;
  output_count?: number;
  duration_ms?: number;
  efficiency?: number;
}

export interface StageGroup {
  name: string;
  index: number;
  status: "pending" | "running" | "complete" | "error";
  documents: SearchResult[];
  statistics?: StageStatistics;
  error?: string;
}
