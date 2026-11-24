# YAS Chat Pro — implementation blueprint

Status: planning and integration contract only. This document does not claim that live providers, persistence, calling, or deployment are already implemented.

## Product target

Build a private pre-launch YAS Chat application that combines:
- Community messaging and Q&A from the existing YAS CHAT app.
- Product Discovery with real merchant offers, transparent review evidence, affiliate attribution and budget bands.
- Admin moderation, provider configuration, audit logs and analytics.
- Optional AI-assisted summaries and translation behind server-side provider adapters.

## Repository roles

- `yaschat-product-discovery`: keep the focused React/TypeScript Discovery package, product contract, tests and provider adapters.
- `yas-chat`: integrate the Discovery route and UI into the smaller Node application only after its existing server contract is mapped and regression-tested.
- `yaschat` (Rocket.Chat-derived monorepo): use as a reference/source for selected Community Edition modules only. Do not copy the entire monorepo or its dependency tree into the small app.

## What the current audit confirms

- Discovery UI, typed product model, search API client, product-route helper, unit tests and a GitHub Actions typecheck/test workflow exist.
- The route helper deliberately returns HTTP 503 when no provider function is supplied. It is not a live ClickBank or ShareASale connector.
- The old `/api/discover` endpoint in `yas-chat` is for community cards, not product offers. Keep it separate from `/api/discover/products`.
- The small `yas-chat` server is not a durable production backend; in-memory state must not be treated as persistent storage.
- Rocket.Chat-derived root license marks content outside `apps/meteor/ee/` and `ee/` as MIT, subject to third-party component licences. Enterprise directories have a separate EE licence and must not be copied into this project without the required rights.

## Recommended source selection from Rocket.Chat-derived repository

Use selected Community Edition implementations as references, not blind folder copies:
1. Authentication, account/session and permission patterns.
2. Message model, channel/room membership, threads/replies, reactions and read state.
3. Realtime transport and presence patterns.
4. Upload/media handling with file validation and storage abstraction.
5. Moderation, reporting, blocking and audit patterns.
6. Localization/i18n and accessibility patterns.
7. Existing tests for the exact selected feature.

Before importing any file, record its source path, commit, licence, third-party notices, required dependencies and tests. Exclude `ee/` and `apps/meteor/ee/` unless the applicable licence explicitly permits the intended use. Preserve MIT notices and all third-party licences. Avoid importing the Meteor monorepo's full dependency graph into the lightweight Node app.

## Required implementation phases

### Phase 1 — stable application foundation
- Choose one deployable host architecture and document it. Recommended initial path: modular Node backend plus React UI; keep Rocket.Chat as a separately deployable communications service unless a deliberate full migration is approved.
- Add environment validation, structured logging, request IDs, health/readiness endpoints, centralized errors, CORS policy, secure headers and rate limits.
- Add database migrations and persistent models for users, sessions, products, offers, providers, review sources, clicks, moderation actions and audit events.
- Add automated backup/restore verification and migration rollback guidance.

### Phase 2 — real Product Discovery
- Implement server-only ClickBank and ShareASale adapters using currently approved official API/feed access.
- Keep credentials in server environment variables; never expose them to the browser, Git history, logs or API responses.
- Normalize offers, merchant, currency, price, availability, image, destination URL, network and last-checked timestamp.
- Deduplicate by provider + provider product ID; cache provider responses; apply provider-specific rate limits and retry/backoff.
- Track affiliate disclosure, click attribution and permitted sub-ID/referral rules. Do not promise commission sharing until each network's terms permit it.
- Add currency conversion only from a timestamped exchange-rate source.
- Keep Low/Medium/High as budget bands, not quality scores.
- Show evidence age, source URL, review count and limitations. Never fabricate ratings, reviews, stock or product links.

### Phase 3 — reviews and decision support
- Ingest only from official APIs, licensed feeds or user-submitted links in accordance with each platform's terms.
- Keep source records and timestamps. AI may summarize evidence but must distinguish fact, opinion and missing evidence.
- Produce transparent pros/cons and confidence labels; do not label products safe, best or verified without sufficient evidence.
- Add report/correction flow and moderation review.

### Phase 4 — community and communications
- Add persistent direct/group messaging, replies/threads, reactions, search, read state, presence, notifications, blocking and reporting.
- Use WebSocket/realtime transport with reconnect, delivery acknowledgement and authorization checks.
- Audio/video calling requires WebRTC plus signaling and STUN/TURN infrastructure; test NAT traversal and mobile networks. Do not display a calling feature as working until end-to-end tests pass.
- Add file uploads with MIME/size limits, malware scanning integration, private object storage and signed downloads.

### Phase 5 — admin and monetization
- Role-based admin panel with provider status, moderation queue, user reports, product review, affiliate clicks, revenue reconciliation and audit trail.
- Ads must be clearly labelled and separated from organic ranking. Add frequency caps and consent/privacy controls.
- Affiliate revenue sharing must be configurable and disabled until network terms, tax/payment handling, fraud checks and legal disclosures are verified.

### Phase 6 — release gates (private staging only)
- Unit, integration, API contract, security, accessibility and browser/mobile tests.
- CI must fail on type errors, failing tests, dependency vulnerabilities and secret leaks.
- Verify database persistence across restart, auth/authorization, rate limits, pagination, provider failures, stale prices, invalid URLs, XSS/CSRF/SSRF protections, backups and restore.
- Deploy only to a private staging environment with test accounts and sandbox/approved provider credentials. Do not announce or publicly launch until every release gate is green.

## API and credential requirements

The app can be developed with blank environment placeholders and mocked provider tests. Real product inventory and affiliate attribution require approved network access and credentials. AI summaries, translation, ads, maps, email/SMS and TURN relay may require separate providers or infrastructure; keep each optional and replaceable.

Suggested environment names (values intentionally blank; never commit secrets):
- `CLICKBANK_CLIENT_ID`
- `CLICKBANK_CLIENT_SECRET`
- `SHAREASALE_API_TOKEN`
- `SHAREASALE_AFFILIATE_ID`
- `DATABASE_URL`
- `SESSION_SECRET`
- `OBJECT_STORAGE_ENDPOINT`
- `OBJECT_STORAGE_BUCKET`
- `OBJECT_STORAGE_ACCESS_KEY`
- `OBJECT_STORAGE_SECRET_KEY`
- `AI_PROVIDER_API_KEY`
- `TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`

## Acceptance criteria

The project is not “fully working” until:
1. A clean install and documented local start work from the README.
2. Discovery search returns only provider-backed or explicitly labelled test data.
3. Product details, evidence, prices and outbound affiliate links are traceable to source records.
4. Users, messages, products, clicks and admin actions persist after restart.
5. Authentication, authorization, moderation and abuse controls are integration-tested.
6. CI passes from a clean checkout.
7. Private staging smoke tests pass; no public production deployment is performed as part of this work.

## Current status

This blueprint is a scope and safety contract for implementation. It is not evidence that the above phases have been completed. Update this file as code, tests and staging evidence are added.
