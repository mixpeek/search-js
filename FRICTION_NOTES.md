# SearchKit Integration — Friction & Pain Points

Documented during E2E onboarding of `peptideevidence.com`. Issues ordered by severity.

---

## 🔴 BLOCKER — Public endpoint CORS blocks all third-party embeds ✅ FIXED

**What broke:** The SearchKit widget shows "Failed to fetch" on every production site.

**Root cause:** `api/main.py` CORS allowlist is hardcoded to Mixpeek-owned domains.
`/v1/public/*` endpoints exist specifically for customer embedding on external sites,
but the CORS headers block any non-Mixpeek origin. `allow_origins=["*"]` + `allow_credentials=True`
is illegal per the CORS spec, so a blanket wildcard isn't possible on the existing middleware.

**Fix applied:** Added `public_cors_middleware` in `api/main.py` that:
- Handles OPTIONS preflight for `/v1/public/*` with `Access-Control-Allow-Origin: *`
- Appends `Access-Control-Allow-Origin: *` to actual responses on those routes
- Falls through to the existing `CORSMiddleware` for all other paths

**Impact:** Every SearchKit customer will hit this until deployed. Zero workaround on a static site.

---

## 🔴 BLOCKER — UMD build requires `jsxRuntime` global that CDN React doesn't expose ✅ FIXED

**What broke:** `TypeError: Cannot read properties of undefined (reading 'jsx')` in browser console.

**Root cause:** Vite's default `@vitejs/plugin-react` uses the "automatic" JSX transform,
which compiles JSX to `import { jsx } from 'react/jsx-runtime'`. In UMD builds this
becomes a reference to a `jsxRuntime` global — but React's CDN UMD bundle (`react.production.min.js`)
only exposes `window.React`, not `window.jsxRuntime`.

**Fix applied:** Changed vite.config to `react({ jsxRuntime: "classic" })` and removed
`react/jsx-runtime` from externals. The UMD now uses `React.createElement` directly.

**Impact:** The UMD CDN embedding pattern doesn't work out of the box. Any customer who
follows the docs snippet will silently fail unless this config is already in place.

---

## 🟠 HIGH — `bearerToken` mode silently drops `X-Namespace` header ✅ FIXED

**What broke:** When using `bearerToken` + retriever ID in SearchKit, the API call
succeeds auth but returns 0 results or a 400 because no namespace is scoped.

**Root cause:** `api/client.ts` sets `Authorization: Bearer` when `bearerToken` is provided,
but never sets `X-Namespace`. The retrieve endpoint requires the namespace header for
multi-tenant routing.

**Workaround:** Use the public slug (`projectKey: 'my-slug'`) without `bearerToken`.
Public endpoints are namespace-aware via the retriever's stored namespace.

**Proper fix needed:** Either add `namespaceId` prop to SearchKitProps and pass it
as `X-Namespace` in client.ts, or document clearly that `bearerToken` mode won't work
without a namespace-scoped retriever.

---

## 🟠 HIGH — No "quick test" API key concept; must set up full namespace + retriever first

**What broke:** The onboarding story says "2-3 lines of code" but in practice a user
must first:
1. Create a namespace
2. Create a bucket + upload URLs
3. Create a collection + trigger
4. Wait for batch processing (minutes to hours depending on content)
5. Create a retriever with the right `feature_uri`
6. Publish the retriever to get a public slug

Only then can they paste the 2-line embed. This is a 30-60 minute process for a new user.

**Suggestion:** Provide a `demo` retriever slug (`mixpeek://demo/peptides` or similar)
that new users can test immediately before setting up their own. Or auto-create a
namespace + retriever from the Studio UI with a one-click "Set up search for my website."

---

## 🟠 HIGH — `feature_uri` is opaque and error-prone ✅ ALREADY EXISTS

**What broke:** When writing `setup_mixpeek.py` the correct feature URI
(`mixpeek://web_scraper@v1/intfloat__multilingual_e5_large_instruct`) was discovered
only by inspecting an existing working retriever. There is no API endpoint to list
valid feature URIs for a given extractor.

**Fix needed:** Add `GET /v1/feature-extractors` or `GET /v1/collections/{id}/features`
endpoint that returns the valid feature URIs for a collection. The Studio retriever
builder should auto-populate these from the collection's actual feature index.

---

## 🟡 MEDIUM — Retriever publish API rejects human-readable `public_name` ✅ FIXED

**What broke:**
```json
{ "public_name": "Peptide Evidence Search" }
→ "String should match pattern '^[a-z0-9][a-z0-9-]*[a-z0-9]$'"
```

The `public_name` and `slug` fields appear to be the same field but are documented
as separate. In practice both must be lowercase-dash format. The error message doesn't
say "use lowercase-dash" — it shows a regex.

**Fix needed:** Either rename `public_name` to `slug` (they serve the same purpose),
or add a separate `display_name` field that accepts free-form text, and auto-slug the slug.

---

## 🟡 MEDIUM — No feedback when re-publishing an already-published retriever ✅ ALREADY EXISTS

**What broke:**
```json
"Retriever ret_80358ca1d2eeae is already published. Unpublish it first to publish again."
```

There's no `PUT /v1/retrievers/{id}/publish` to update the slug/description.
To change a slug you must unpublish + re-publish, which briefly breaks any live embeds.

**Fix needed:** Allow `PATCH /v1/retrievers/{id}/publish` to update published metadata
without downtime.

---

## 🟡 MEDIUM — SearchKit `position: 'inline'` renders too narrow on light theme ✅ FIXED

**What noticed:** The inline widget on a light-background Astro page shows a thin
input bar with no visual container. The dark theme demo looks great; light mode
needs the container border to be more visible.

**Fix:** Add a subtle border/shadow to `.mixpeek-inline-container` in light mode.

---

## 🟡 MEDIUM — No `namespaceId` in SearchKit CDN auto-init ✅ FIXED

**What noticed:** The `<script data-project-key="...">` CDN auto-init pattern doesn't
support passing `namespaceId` or `bearerToken`. All CDN users must use public slugs.
This is fine but it's undocumented — the docs show both private and public patterns
but don't clarify which CDN supports.

---

## 🟢 LOW — `demo/index.html` hardcoded to localhost with an expired API key ✅ FIXED

The demo page shipped with `apiBase: "http://localhost:8000"` and an expired API key.
New contributors cloning the repo see "Search error" immediately. Should default to
`https://api.mixpeek.com` with a read-only demo key.

---

## 🟢 LOW — `npm run preview` fails for Cloudflare adapter ✅ FIXED

The peptides site uses `@astrojs/cloudflare` so `astro preview` fails with
"adapter does not support the preview command." You have to run `python3 -m http.server`
on the `dist/` folder instead. Should document this or add a `scripts.serve` entry.

---

## Summary table

| # | Severity | Category | One-line |
|---|----------|----------|---------|
| 1 | 🔴 BLOCKER | Server | Public endpoints blocked by CORS |
| 2 | 🔴 BLOCKER | SDK Build | UMD needs classic JSX runtime |
| 3 | 🟠 HIGH | SDK Client | bearerToken drops X-Namespace |
| 4 | 🟠 HIGH | Onboarding | No quick demo; full setup required |
| 5 | 🟠 HIGH | API | No endpoint to list valid feature_uris |
| 6 | 🟡 MEDIUM | API | public_name regex error is confusing |
| 7 | 🟡 MEDIUM | API | Can't update published retriever metadata |
| 8 | 🟡 MEDIUM | UI | Inline light mode looks bare |
| 9 | 🟡 MEDIUM | Docs | CDN auto-init namespace support undocumented |
| 10 | 🟢 LOW | Demo | Hardcoded localhost + expired key |
| 11 | 🟢 LOW | Docs | Cloudflare adapter preview workaround |
