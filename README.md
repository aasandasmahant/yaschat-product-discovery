# YAS Chat Product Discovery

A standalone React/TypeScript product-discovery module for YAS Chat. It is intentionally separated from the Rocket.Chat-based messaging core.

## Included

- Accessible responsive search and category/price-tier filters.
- Low / Medium / High classification relative to the user's entered budget.
- Transparent evidence status based on supplied review-source records.
- Product validation and safe external-link checks.
- API client for a dedicated product endpoint.
- Adapter for the existing YAS CHAT community discovery endpoint.

## Important API distinction

The older `yas-chat` server provides `GET/POST /api/discover` for community discovery cards. Those cards are not verified products and do not contain affiliate purchase URLs, live prices, or product reviews.

This module therefore expects a separate host route:

`GET /api/discover/products?q=&category=&tier=&budget=&currency=&sort=&page=&pageSize=`

Expected response:

```json
{
  "items": [
    {
      "id": "provider-product-id",
      "title": "Real product title",
      "category": "Electronics",
      "price": 4999,
      "currency": "INR",
      "buyUrl": "https://merchant.example/product",
      "reviewSources": [
        {
          "platform": "Store",
          "url": "https://merchant.example/reviews",
          "rating": 4.2,
          "reviewCount": 120,
          "verified": true
        }
      ]
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 30
}
```

The example URL above is a schema illustration only. The module rejects `example.com` as a usable purchase link. Never publish placeholder URLs, fabricated ratings, or invented review counts.

## Usage

```tsx
import { YasChatProductDiscoveryView } from "@yaschat/product-discovery";

export function DiscoverPage() {
  return <YasChatProductDiscoveryView apiBaseUrl={import.meta.env.VITE_YASCHAT_API_URL} />;
}
```

If `apiBaseUrl` is omitted, requests use the same origin. The host backend must implement the product endpoint; this UI does not pretend that a missing API is live.

## Provider integration still required

- ClickBank and ShareASale credentials/approved feeds.
- Product deduplication, currency conversion and price freshness timestamps.
- YouTube/Reddit/Google review ingestion subject to their official APIs and terms.
- Backend authentication, rate limiting, moderation, affiliate disclosure and audit logs.
- Real tests against the host API and a production build.

## Data and recommendation integrity

Low/Medium/High are budget bands, not product-quality ratings. Evidence labels are computed from supplied review-source metadata. The component does not claim that a product is "good" or "bad" when the backend has not supplied sufficient evidence. Affiliate links are optional and rendered only when they are valid HTTP(S) URLs and not obvious placeholders.
