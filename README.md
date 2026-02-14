# @mixpeek/search-js

Drop-in multimodal search widget for any website. Add AI-powered search in 6 lines of code.

- Semantic search across text, images, video, PDFs
- AI-generated answers with citations
- Cmd+K keyboard shortcut
- Light/dark theme with full customization
- React component + CDN script tag

## Quick Start

### npm (React)

```bash
npm install @mixpeek/search-js
```

```tsx
import { MixpeekSearch } from '@mixpeek/search-js';
import '@mixpeek/search-js/styles.css';

function App() {
  return <MixpeekSearch projectKey="your-retriever-slug" />;
}
```

### CDN (no build step)

```html
<link rel="stylesheet" href="https://cdn.mixpeek.com/search/v1/mixpeek-search.css" />
<script src="https://cdn.mixpeek.com/search/v1/loader.js"
  data-project-key="your-retriever-slug"
  data-mount="search-container">
</script>
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

## Context Hook

Access search state from child components:

```tsx
import { useMixpeekSearch } from '@mixpeek/search-js';

function MyComponent() {
  const { query, results, isLoading, open, close } = useMixpeekSearch();
  // ...
}
```

## Custom Result Rendering

```tsx
<MixpeekSearch
  projectKey="my-retriever"
  renderResult={(result, index) => (
    <div className="my-result">
      <h3>{result.title}</h3>
      <p>{result.content}</p>
    </div>
  )}
/>
```

## Field Mapping

Use `transformResults` to map your retriever's fields to the widget format:

```tsx
<MixpeekSearch
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

## License

MIT
