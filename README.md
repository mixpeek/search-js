# @mixpeek/react-searchkit

**React Components for Multimodal Search**

Composable search UI with stages streaming, AI answers, filters, and theming. Free and open source.

- Composable components — use the full widget or individual pieces
- Stages streaming — watch results flow through search → rerank → enrich in real time
- AI-generated answers with citations
- Cmd+K keyboard shortcut
- Light/dark theme with full customization
- React component + CDN script tag

**[Live demo: mxp.co/searchkit](https://mxp.co/searchkit)**

## Install

```bash
npm install mixpeek @mixpeek/react-searchkit
```

## Quick Start

### React

```tsx
import { SearchKit } from "@mixpeek/react-searchkit";
import "@mixpeek/react-searchkit/styles.css";

export default function App() {
  return <SearchKit projectKey="your-retriever-slug" />;
}
```

### CDN (no build step)

```html
<link rel="stylesheet" href="https://cdn.mixpeek.com/searchkit/v1/searchkit.css" />
<script src="https://cdn.mixpeek.com/searchkit/v1/loader.js"
  data-project-key="your-retriever-slug"
  data-mount="search-container">
</script>
```

## Bootstrap Your Pipeline

Don't have a retriever yet? Set up a complete AI search pipeline for your site using the Mixpeek JS SDK.

### 1. Scrape & Index Your Site

Create a namespace, bucket, and collection with the web scraper extractor.

```javascript
import Mixpeek from "mixpeek";
const mx = new Mixpeek({ apiKey: "YOUR_API_KEY" });

// Create a namespace with web scraper + text search
const namespace = await mx.namespaces.create({
  namespace_name: "my-site",
  feature_extractors: [
    { feature_extractor_name: "web_scraper", version: "v1" },
    { feature_extractor_name: "text_extractor", version: "v1" }
  ]
});

// Create a bucket and upload your URLs
const bucket = await mx.buckets.create({ bucket_name: "pages" });
await mx.buckets.objects.create(bucket.bucket_id, {
  blobs: [{ property: "url", type: "text", data: "https://yoursite.com" }]
});

// Create a collection to process pages
const collection = await mx.collections.create({
  collection_name: "site-pages",
  source: { type: "bucket", bucket_ids: [bucket.bucket_id] },
  feature_extractor: {
    feature_extractor_name: "web_scraper",
    version: "v1",
    input_mappings: { url: "url" }
  }
});

// Trigger processing
await mx.collections.trigger(collection.collection_id);
```

### 2. Create a Retriever with Streaming Stages

Build a multi-stage search pipeline with semantic search and reranking. Each stage streams results to the UI in real time.

```javascript
const retriever = await mx.retrievers.create({
  retriever_name: "site-search",
  collection_identifiers: ["site-pages"],
  stages: [
    {
      stage_name: "search",
      stage_type: "feature_search",
      parameters: {
        feature_uri: "mixpeek://text_extractor@v1/multilingual_e5_large_instruct_v1",
        input_mode: "text",
        limit: 20
      }
    },
    {
      stage_name: "rerank",
      stage_type: "rerank",
      parameters: { model: "mixpeek/reranker", top_k: 10 }
    }
  ]
});

// Publish it so the widget can access it
await mx.retrievers.publish(retriever.retriever_id, {
  slug: "my-site-search"
});
```

### 3. Drop in the Widget

```tsx
import { SearchKit } from "@mixpeek/react-searchkit";
import "@mixpeek/react-searchkit/styles.css";

export default function App() {
  return <SearchKit projectKey="my-site-search" enableAIAnswer />;
}
```

## Composable Components

Use the full `<SearchKit />` widget or import individual pieces and compose your own UI.

### Context Hook

Access search state from any child component:

```tsx
import { useSearchKit } from "@mixpeek/react-searchkit";

function MyResults() {
  const { query, results, isLoading, stages, open, close } = useSearchKit();

  return (
    <div>
      {stages.map((stage) => (
        <div key={stage.name}>
          {stage.name}: {stage.status} ({stage.resultCount} results)
        </div>
      ))}
      {results.map((result, i) => (
        <div key={i}>{result.title}</div>
      ))}
    </div>
  );
}
```

### Custom Result Rendering

```tsx
<SearchKit
  projectKey="my-retriever"
  renderResult={(result, index) => (
    <div className="my-result">
      <h3>{result.title}</h3>
      <p>{result.content}</p>
    </div>
  )}
/>
```

### Field Mapping

Use `transformResults` to map your retriever's fields to the widget format:

```tsx
<SearchKit
  projectKey="my-retriever"
  transformResults={(results) =>
    results.map((r) => ({
      ...r,
      title: r.product_name || r.title,
      content: r.description,
      page_url: `/products/${r.id}`,
    }))
  }
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `projectKey` | `string` | required | Public retriever slug or `ret_sk_` API key |
| `placeholder` | `string` | `"Search..."` | Input placeholder text |
| `maxResults` | `number` | `10` | Maximum results to display |
| `theme` | `"light" \| "dark" \| "auto"` | `"auto"` | Color theme |
| `accentColor` | `string` | `"#6366f1"` | Accent color (hex) |
| `position` | `"modal" \| "inline"` | `"modal"` | Modal overlay or inline embed |
| `keyboardShortcut` | `boolean` | `true` | Enable Cmd+K / Ctrl+K |
| `showPoweredBy` | `boolean` | `true` | Show "Search by Mixpeek" badge |
| `enableAIAnswer` | `boolean` | `false` | Show AI-generated answer panel |
| `enableShareLinks` | `boolean` | `false` | Enable shareable search URLs |
| `onSearch` | `(query: string) => void` | - | Callback when search is performed |
| `onResultClick` | `(result, index) => void` | - | Callback when result is clicked |
| `onZeroResults` | `(query: string) => void` | - | Callback when no results found |
| `transformResults` | `(results) => results` | - | Transform results before rendering |
| `renderResult` | `(result, index) => ReactNode` | - | Custom result renderer |
| `retrieverSlug` | `string` | - | Retriever slug when using `ret_sk_` key |
| `apiBaseUrl` | `string` | `"https://api.mixpeek.com"` | Custom API URL |
| `className` | `string` | - | Additional CSS class |
| `defaultOpen` | `boolean` | `false` | Start with modal open |

## Links

- [Connector page](https://mxp.co/searchkit)
- [GitHub](https://github.com/mixpeek/searchkit)
- [npm](https://www.npmjs.com/package/@mixpeek/react-searchkit)
- [Docs](https://mixpeek.com/docs)

## License

MIT
