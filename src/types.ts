import { ReactNode } from "react";

export type ThemeMode = "light" | "dark" | "auto";
export type Position = "modal" | "inline";

export interface MixpeekSearchProps {
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
  /** Recent search queries */
  recentSearches: string[];
  /** Clear recent searches */
  clearRecentSearches: () => void;
  /** Configuration */
  config: MixpeekSearchConfig;
}

export interface MixpeekSearchConfig {
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
