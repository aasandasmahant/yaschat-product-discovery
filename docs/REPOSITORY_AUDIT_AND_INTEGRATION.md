# Repository audit and integration notes

This document records the repository-to-repository review performed before the Product Discovery module was rebuilt.

## Repositories visible in the linked GitHub account

| Repository | Branch | Observed contents | How it is used here |
|---|---|---|---|
| `yaschat-product-discovery` | `main` | Earlier single TSX prototype with malformed JSX/DOM selectors and placeholder product links | Replaced the broken root entrypoint; new typed UI, API adapter, backend route helper, tests and CI live here |
| `yas-chat` | `main` | Small Node HTTP app; in-memory rooms/Q&A/discover cards; `GET/POST /api/discover`, `/api/qa`, `/api/messages`, `/api/call` | Reused the existing `/api/discover` contract as a separate community-card adapter. It is not a product catalogue API |
| `yaschat` | `develop` | Large Rocket.Chat-derived communications monorepo (repository tree is very large); messaging, rooms, media/VoIP UI and infrastructure | Kept as the communications base. No large source subtree was copied into this focused module because it would bring a large dependency graph and requires path-by-path license review |
| `super-studio-app` | `main` | Empty Git repository at audit time | No code was available to reuse |

## What was actually carried into this repository

1. A separate adapter for the legacy `GET /api/discover` community cards.
2. A clean Product Discovery contract at `GET /api/discover/products` (documented and supplied as a backend handler helper).
3. Typed product/review-source records, price-band rules, source-evidence labels and URL validation.
4. A React screen with search, category, budget, Low/Medium/High price bands, sorting, loading/error/empty states and affiliate disclosure.
5. Unit tests and a GitHub Actions typecheck/test workflow.

## Important boundary: community discovery is not shopping search

The `yas-chat` server's current `store.discover` is a small in-memory list of community cards. It does not provide verified product offers, real merchant prices, review evidence or affiliate tracking. The adapter deliberately keeps those records separate from products. It would be misleading to convert community cards into purchasable products.

## Wiring the product route into the existing Node backend

In the `yas-chat` repository, after copying or importing this module's `server/productDiscoveryRoute.js`, the host server must create a provider function backed by approved affiliate feeds and add a route before its final HTML fallback:

```js
const { handleProductDiscoveryRequest } = require("./server/productDiscoveryRoute");

// Implement this using approved ClickBank / ShareASale APIs or feeds.
// Keep API credentials in server-side environment variables only.
async function searchApprovedProductProviders(params) {
  // Return { items: [...real provider records...], total: number }.
  // Return an empty list when no provider has matching results.
  throw new Error("Configure approved product providers before enabling this route");
}

// Inside the existing HTTP request handler:
if (pathname === "/api/discover/products") {
  return handleProductDiscoveryRequest(req, res, searchApprovedProductProviders);
}
```

Do not deploy the illustrative throwing provider above as a working integration. Replace it with a real server-side provider implementation first. The helper returns HTTP 503 when no provider function is configured.

## Remaining work before production

- Implement provider adapters using current official ClickBank / ShareASale documentation and approved account access.
- Confirm product feed rights, affiliate program terms, attribution, sub-ID/referral support and commission rules.
- Add backend authentication for admin operations, provider-specific rate limits, caching, audit logs and abuse protection.
- Persist product catalogue and search history in a real database; the small `yas-chat` backend currently stores its demo data in process memory.
- Implement currency conversion from a timestamped exchange-rate source, never by hardcoded estimates.
- Ingest review summaries only through permitted APIs/feeds; preserve source URLs and dates.
- Test the integrated endpoint against real provider sandbox/approved data and deploy CI checks.

## License note for the communications monorepo

The inspected `yaschat` repository's root license states that content outside its Enterprise Edition directories is under MIT, while `apps/meteor/ee/` and `ee/` follow their own license file. Third-party components retain their original licenses. This focused Product Discovery module contains newly authored code and does not copy Enterprise Edition source. Re-check the exact license for any future file selected from that monorepo.
