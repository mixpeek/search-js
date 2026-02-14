import { SearchResponse, SearchResult } from "../types";

const DEFAULT_BASE_URL = "https://api.mixpeek.com";

interface MixpeekClientConfig {
  projectKey: string;
  baseUrl?: string;
  /** When using a ret_sk_ key, specify the public retriever slug for the endpoint URL */
  retrieverSlug?: string;
}

interface SearchParams {
  query: string;
  limit?: number;
  stream?: boolean;
}

export class MixpeekClient {
  private projectKey: string;
  private baseUrl: string;
  private retrieverSlug: string | undefined;
  private abortController: AbortController | null = null;

  constructor(config: MixpeekClientConfig) {
    this.projectKey = config.projectKey;
    this.baseUrl = (config.baseUrl || DEFAULT_BASE_URL).replace(/\/+$/, "");
    this.retrieverSlug = config.retrieverSlug;
  }

  private isApiKey(): boolean {
    return this.projectKey.startsWith("ret_sk_");
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.isApiKey()) {
      headers["X-Public-API-Key"] = this.projectKey;
    }
    return headers;
  }

  private getEndpoint(): string {
    if (this.isApiKey()) {
      // When using a ret_sk_ key with a known slug, use the named endpoint
      if (this.retrieverSlug) {
        return `${this.baseUrl}/v1/public/retrievers/${encodeURIComponent(this.retrieverSlug)}/execute`;
      }
      return `${this.baseUrl}/v1/public/retrievers/execute`;
    }
    return `${this.baseUrl}/v1/public/retrievers/${encodeURIComponent(this.projectKey)}/execute`;
  }

  /**
   * Cancel any in-flight search request.
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Execute a search query against the configured retriever.
   */
  async search(params: SearchParams): Promise<SearchResponse> {
    this.cancel();
    this.abortController = new AbortController();

    const body: Record<string, unknown> = {
      inputs: { query: params.query },
      settings: { limit: params.limit || 10 },
    };

    if (params.stream) {
      body.stream = true;
    }

    const response = await fetch(this.getEndpoint(), {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      let message = `Search request failed (${response.status})`;
      try {
        const parsed = JSON.parse(errorBody);
        if (parsed.detail) {
          message = typeof parsed.detail === "string" ? parsed.detail : JSON.stringify(parsed.detail);
        }
      } catch {
        // Use default message
      }
      throw new Error(message);
    }

    const data = await response.json();

    // Normalize response: API can return either `results` or `documents`
    const results: SearchResult[] = data.results || data.documents || [];

    return {
      results,
      ai_answer: data.ai_answer || null,
      metadata: data.metadata || null,
    };
  }

  /**
   * Execute a streaming search query. Yields partial AI answer chunks.
   */
  async *searchStream(params: SearchParams): AsyncGenerator<{
    type: "answer_chunk" | "results" | "done";
    data: unknown;
  }> {
    this.cancel();
    this.abortController = new AbortController();

    const body: Record<string, unknown> = {
      inputs: { query: params.query },
      settings: { limit: params.limit || 10 },
      stream: true,
    };

    const response = await fetch(this.getEndpoint(), {
      method: "POST",
      headers: {
        ...this.getHeaders(),
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`Search request failed (${response.status})`);
    }

    if (!response.body) {
      throw new Error("Streaming not supported");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const payload = trimmed.slice(6);
          if (payload === "[DONE]") {
            yield { type: "done", data: null };
            return;
          }

          try {
            const parsed = JSON.parse(payload);
            if (parsed.answer_chunk) {
              yield { type: "answer_chunk", data: parsed.answer_chunk };
            } else if (parsed.results || parsed.documents) {
              yield {
                type: "results",
                data: parsed.results || parsed.documents,
              };
            }
          } catch {
            // Skip unparseable SSE lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
