import { useState, useCallback, useEffect } from "react";
import { RecentSearch } from "../types";

const STORAGE_KEY = "mixpeek_recent_searches";
const MAX_RECENT = 10;

function loadFromStorage(): RecentSearch[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item: unknown): item is RecentSearch =>
        typeof item === "object" &&
        item !== null &&
        "query" in item &&
        "timestamp" in item &&
        typeof (item as RecentSearch).query === "string" &&
        typeof (item as RecentSearch).timestamp === "number"
    );
  } catch {
    return [];
  }
}

function saveToStorage(searches: RecentSearch[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
  } catch {
    // localStorage may be unavailable (e.g., private browsing)
  }
}

interface UseRecentSearchesReturn {
  recentSearches: string[];
  addSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export function useRecentSearches(): UseRecentSearchesReturn {
  const [searches, setSearches] = useState<RecentSearch[]>([]);

  useEffect(() => {
    setSearches(loadFromStorage());
  }, []);

  const addSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setSearches((prev) => {
      // Remove existing entry for this query
      const filtered = prev.filter(
        (s) => s.query.toLowerCase() !== trimmed.toLowerCase()
      );

      // Add at the beginning
      const updated = [
        { query: trimmed, timestamp: Date.now() },
        ...filtered,
      ].slice(0, MAX_RECENT);

      saveToStorage(updated);
      return updated;
    });
  }, []);

  const clearRecentSearches = useCallback(() => {
    setSearches([]);
    saveToStorage([]);
  }, []);

  return {
    recentSearches: searches.map((s) => s.query),
    addSearch,
    clearRecentSearches,
  };
}
