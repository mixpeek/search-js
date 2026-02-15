import { useState, useCallback, useRef, useEffect } from "react";
import { MixpeekClient } from "../api/client";
import {
  SearchResult,
  AIAnswerData,
  SearchResponseMetadata,
  MixpeekSearchConfig,
  StageGroup,
} from "../types";

interface UseSearchOptions {
  config: MixpeekSearchConfig;
  filterInputs?: Record<string, unknown>;
  onSearch?: (query: string) => void;
  onSearchExecuted?: (query: string) => void;
  onZeroResults?: (query: string) => void;
  transformResults?: (results: SearchResult[]) => SearchResult[];
}

interface UseSearchReturn {
  results: SearchResult[];
  stages: StageGroup[];
  isLoading: boolean;
  isStreaming: boolean;
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

function getCacheKey(projectKey: string, query: string, limit: number, filterInputs?: Record<string, unknown>): string {
  const filterStr = filterInputs && Object.keys(filterInputs).length > 0
    ? `:${JSON.stringify(filterInputs)}`
    : "";
  return `${projectKey}:${query}:${limit}${filterStr}`;
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
  const { config, filterInputs, onSearch, onSearchExecuted, onZeroResults, transformResults } = options;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [stages, setStages] = useState<StageGroup[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
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
        setStages([]);
        setError(null);
        setAiAnswer(null);
        setMetadata(null);
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      // Check cache
      const cacheKey = getCacheKey(config.projectKey, trimmed, config.maxResults, filterInputs);
      cleanCache();
      const cached = resultCache.get(cacheKey);
      if (cached) {
        const transformedResults = transformResults
          ? transformResults(cached.results)
          : cached.results;
        setResults(transformedResults);
        setAiAnswer(cached.aiAnswer);
        setMetadata(cached.metadata);
        setStages([]);
        setError(null);
        setIsLoading(false);
        setIsStreaming(false);
        return;
      }

      setIsLoading(true);
      setIsStreaming(true);
      setError(null);
      setStages([]);
      setResults([]);
      setAiAnswer(null);

      try {
        onSearch?.(trimmed);

        let finalResults: SearchResult[] = [];

        for await (const event of client.searchStream({ query: trimmed, limit: config.maxResults, inputs: filterInputs })) {
          switch (event.event_type) {
            case "stage_start":
              setStages((prev) => {
                const next = [...prev];
                next[event.stage_index!] = {
                  name: event.stage_name || `Stage ${event.stage_index}`,
                  index: event.stage_index!,
                  status: "running",
                  documents: [],
                };
                return next;
              });
              break;

            case "stage_complete":
              setStages((prev) => {
                const next = [...prev];
                const existing = next[event.stage_index!];
                next[event.stage_index!] = {
                  name: existing?.name || event.stage_name || `Stage ${event.stage_index}`,
                  index: event.stage_index!,
                  status: "complete",
                  documents: event.documents || [],
                  statistics: event.statistics,
                };
                return next;
              });
              // Show latest stage results as current results
              if (event.documents) {
                setResults(
                  transformResults ? transformResults(event.documents) : event.documents
                );
              }
              break;

            case "stage_error":
              setStages((prev) => {
                const next = [...prev];
                const existing = next[event.stage_index!];
                next[event.stage_index!] = {
                  name: existing?.name || event.stage_name || `Stage ${event.stage_index}`,
                  index: event.stage_index!,
                  status: "error",
                  documents: existing?.documents || [],
                  error: event.error,
                };
                return next;
              });
              break;

            case "execution_complete":
              finalResults = event.documents || [];
              break;

            case "execution_error":
              setError(event.error || "Execution failed");
              setIsStreaming(false);
              setIsLoading(false);
              return;
          }
        }

        // Stream ended — set final results
        const transformedResults = transformResults
          ? transformResults(finalResults)
          : finalResults;
        setResults(transformedResults);
        setIsStreaming(false);
        setIsLoading(false);
        setError(null);

        // Cache the final results
        resultCache.set(cacheKey, {
          results: finalResults,
          aiAnswer: null,
          metadata: null,
          timestamp: Date.now(),
        });

        onSearchExecuted?.(trimmed);

        if (transformedResults.length === 0) {
          onZeroResults?.(trimmed);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        // Fall back to non-streaming search
        setIsStreaming(false);
        setStages([]);

        try {
          const response = await client.search({
            query: trimmed,
            limit: config.maxResults,
            inputs: filterInputs,
          });

          const rawResults = response.results || [];
          const transformedResults = transformResults
            ? transformResults(rawResults)
            : rawResults;

          setResults(transformedResults);
          setAiAnswer(response.ai_answer || null);
          setMetadata(response.metadata || null);
          setError(null);

          resultCache.set(cacheKey, {
            results: rawResults,
            aiAnswer: response.ai_answer || null,
            metadata: response.metadata || null,
            timestamp: Date.now(),
          });

          onSearchExecuted?.(trimmed);

          if (transformedResults.length === 0) {
            onZeroResults?.(trimmed);
          }
        } catch (fallbackErr: unknown) {
          if (fallbackErr instanceof Error && fallbackErr.name === "AbortError") {
            return;
          }
          const message =
            fallbackErr instanceof Error ? fallbackErr.message : "Search failed";
          setError(message);
          setResults([]);
          setAiAnswer(null);
        }
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [config.projectKey, config.maxResults, config.apiBaseUrl, filterInputs, onSearch, onSearchExecuted, onZeroResults, transformResults]
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

  return { results, stages, isLoading, isStreaming, error, aiAnswer, metadata, search };
}
