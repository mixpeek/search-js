import { useState, useCallback, useRef, useEffect } from "react";
import { MixpeekClient } from "../api/client";
import {
  SearchResult,
  AIAnswerData,
  SearchResponseMetadata,
  MixpeekSearchConfig,
} from "../types";

interface UseSearchOptions {
  config: MixpeekSearchConfig;
  onSearch?: (query: string) => void;
  onSearchExecuted?: (query: string) => void;
  onZeroResults?: (query: string) => void;
  transformResults?: (results: SearchResult[]) => SearchResult[];
}

interface UseSearchReturn {
  results: SearchResult[];
  isLoading: boolean;
  error: string | null;
  aiAnswer: AIAnswerData | null;
  metadata: SearchResponseMetadata | null;
  search: (query: string) => Promise<void>;
}

const resultCache = new Map<string, {
  results: SearchResult[];
  aiAnswer: AIAnswerData | null;
  metadata: SearchResponseMetadata | null;
  timestamp: number;
}>();

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(projectKey: string, query: string, limit: number): string {
  return `${projectKey}:${query}:${limit}`;
}

function cleanCache(): void {
  const now = Date.now();
  for (const [key, entry] of resultCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      resultCache.delete(key);
    }
  }
}

export function useSearch(options: UseSearchOptions): UseSearchReturn {
  const { config, onSearch, onSearchExecuted, onZeroResults, transformResults } = options;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiAnswer, setAiAnswer] = useState<AIAnswerData | null>(null);
  const [metadata, setMetadata] = useState<SearchResponseMetadata | null>(null);

  const clientRef = useRef<MixpeekClient | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    clientRef.current = new MixpeekClient({
      projectKey: config.projectKey,
      baseUrl: config.apiBaseUrl,
      retrieverSlug: config.retrieverSlug,
    });

    return () => {
      clientRef.current?.cancel();
    };
  }, [config.projectKey, config.apiBaseUrl, config.retrieverSlug]);

  const executeSearch = useCallback(
    async (query: string) => {
      const client = clientRef.current;
      if (!client) return;

      const trimmed = query.trim();

      if (!trimmed) {
        setResults([]);
        setError(null);
        setAiAnswer(null);
        setMetadata(null);
        setIsLoading(false);
        return;
      }

      // Check cache
      const cacheKey = getCacheKey(config.projectKey, trimmed, config.maxResults);
      cleanCache();
      const cached = resultCache.get(cacheKey);
      if (cached) {
        const transformedResults = transformResults
          ? transformResults(cached.results)
          : cached.results;
        setResults(transformedResults);
        setAiAnswer(cached.aiAnswer);
        setMetadata(cached.metadata);
        setError(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        onSearch?.(trimmed);

        const response = await client.search({
          query: trimmed,
          limit: config.maxResults,
        });

        const rawResults = response.results || [];
        const transformedResults = transformResults
          ? transformResults(rawResults)
          : rawResults;

        // Cache the results
        resultCache.set(cacheKey, {
          results: rawResults,
          aiAnswer: response.ai_answer || null,
          metadata: response.metadata || null,
          timestamp: Date.now(),
        });

        setResults(transformedResults);
        setAiAnswer(response.ai_answer || null);
        setMetadata(response.metadata || null);
        setError(null);

        // Notify that search executed (for recent searches tracking)
        onSearchExecuted?.(trimmed);

        if (transformedResults.length === 0) {
          onZeroResults?.(trimmed);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          // Request was cancelled, ignore
          return;
        }
        const message = err instanceof Error ? err.message : "Search failed";
        setError(message);
        setResults([]);
        setAiAnswer(null);
      } finally {
        setIsLoading(false);
      }
    },
    [config.projectKey, config.maxResults, config.apiBaseUrl, onSearch, onSearchExecuted, onZeroResults, transformResults]
  );

  const search = useCallback(
    async (query: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      clientRef.current?.cancel();

      return new Promise<void>((resolve) => {
        debounceTimerRef.current = setTimeout(async () => {
          await executeSearch(query);
          resolve();
        }, 300);
      });
    },
    [executeSearch]
  );

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return { results, isLoading, error, aiAnswer, metadata, search };
}
