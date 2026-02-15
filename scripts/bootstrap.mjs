#!/usr/bin/env node

import { parseArgs } from "node:util";

const USAGE = `
mixpeek-bootstrap — Scaffold a production retriever with search, filter & RAG stages.

Usage:
  mixpeek-bootstrap --api-key <KEY> [--namespace <ns>] [--slug <slug>]

Options:
  --api-key      Mixpeek API key (required)
  --namespace    Namespace for the retriever (default: "default")
  --slug         Custom retriever slug (default: "search-widget-<timestamp>")
  --help         Show this help message

Example:
  mixpeek-bootstrap --api-key sk_proj_abc123 --slug my-site-search
`;

let args;
try {
  args = parseArgs({
    options: {
      "api-key": { type: "string" },
      namespace: { type: "string", default: "default" },
      slug: { type: "string" },
      help: { type: "boolean", default: false },
    },
    strict: true,
  });
} catch {
  console.error(USAGE);
  process.exit(1);
}

if (args.values.help) {
  console.log(USAGE);
  process.exit(0);
}

const apiKey = args.values["api-key"];
if (!apiKey) {
  console.error("Error: --api-key is required.\n");
  console.error(USAGE);
  process.exit(1);
}

const namespace = args.values.namespace || "default";
const slug = args.values.slug || `search-widget-${Date.now()}`;

const retrieverPayload = {
  name: slug,
  namespace,
  stages: [
    {
      name: "feature_search",
      type: "search",
      config: {
        query: "{{INPUT.query}}",
        search_type: "semantic",
        top_k: 20,
        filters: {},
      },
    },
    {
      name: "attribute_filter",
      type: "filter",
      config: {
        conditions: [
          {
            field: "domain",
            operator: "eq",
            value: "{{INPUT.domain}}",
            optional: true,
          },
          {
            field: "category",
            operator: "in",
            value: "{{INPUT.category}}",
            optional: true,
          },
          {
            field: "price",
            operator: "gte",
            value: "{{INPUT.min_price}}",
            optional: true,
          },
          {
            field: "price",
            operator: "lte",
            value: "{{INPUT.max_price}}",
            optional: true,
          },
          {
            field: "_llm_filter",
            operator: "llm",
            value: "{{INPUT.smart_filter}}",
            optional: true,
          },
        ],
      },
    },
    {
      name: "rag_prepare",
      type: "transform",
      config: {
        format: "markdown",
        include_citations: true,
        max_tokens: 4000,
      },
    },
  ],
};

const BASE_URL = "https://api.mixpeek.com";

async function createRetriever() {
  console.log(`Creating retriever "${slug}" in namespace "${namespace}"...`);

  const response = await fetch(`${BASE_URL}/v1/retrievers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(retrieverPayload),
  });

  if (!response.ok) {
    const body = await response.text();
    console.error(`Failed to create retriever (${response.status}):`);
    console.error(body);
    process.exit(1);
  }

  const data = await response.json();
  const retrieverSlug = data.slug || data.name || slug;

  console.log("\nRetriever created successfully!");
  console.log(`  Slug: ${retrieverSlug}`);
  console.log(`  Namespace: ${namespace}`);
  console.log(`  Stages: feature_search → attribute_filter → rag_prepare`);
  console.log(`\nUsage with the search widget:\n`);
  console.log(`  <MixpeekSearch projectKey="${retrieverSlug}" />`);
  console.log("");
}

createRetriever();
