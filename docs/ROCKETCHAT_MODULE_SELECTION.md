# Rocket.Chat module selection for YAS Chat Pro

This is a selective integration decision record for the private pre-launch build. It is not a claim that source files have already been copied or integrated.

## Decision: reuse behaviour and narrowly port code, not the whole monorepo

The YAS Chat application is currently a small Node.js HTTP server with a large embedded HTML payload. The Discovery package is a separate React/TypeScript package with its own API contract and tests. Importing the Rocket.Chat monorepo wholesale would introduce its workspace toolchain, Meteor application assumptions, MongoDB models, dependency graph and deployment requirements. Do not transplant those wholesale into the small Node app.

Keep YAS Discovery as a bounded module and integrate it through a versioned backend contract. Keep the community/chat backend and product discovery routes separate.

## Candidate source modules verified in the Rocket.Chat-derived repository

Source repository: `aasandasmahant/yaschat`, branch `develop`.

| Source path | Decision | YAS Chat use | Porting constraint |
|---|---|---|---|
| `packages/authorization` | Study and selectively adapt | RBAC concepts and permission checks | Package depends on Rocket.Chat core-services, core-typings, models and MongoDB; do not import package as-is |
| `packages/models` | Study schemas and indexes; reimplement domain models | Persistent users, rooms, messages, products and audit records | Existing models are coupled to Rocket.Chat/MongoDB conventions; define YAS-owned schemas/migrations |
| `packages/core-typings` | Selectively adapt type concepts | Shared typed contracts | Avoid importing workspace package wholesale |
| `packages/api-client` | Reuse API design patterns | Typed API client, errors and request handling | Keep YAS route names and contracts; do not create duplicate client stacks |
| `packages/message-parser` | Candidate for narrow reuse | Safe message formatting / parsing | Review parser dependencies, sanitization and licence before copying |
| `packages/media-signaling` | Study protocol and state machine | WebRTC call signaling | Signaling alone is not media transport; requires authenticated signaling, STUN/TURN and end-to-end device tests |
| `packages/i18n` | Reuse localization patterns | Locale selection, translation keys and fallback | Do not claim 200+ complete translations without translated and reviewed catalogues |
| `packages/core-services` | Architecture reference only initially | Service boundaries, events and tracing patterns | Package is deeply workspace-coupled; do not copy whole package into small Node server |

## Do not import wholesale

- Entire `apps/meteor` application or its full workspace dependency graph.
- Any `ee/` or `apps/meteor/ee/` code without an explicit applicable commercial licence.
- Presence, calls, upload, search or admin features merely because a package name exists. First inspect exact implementation, dependencies, licence and tests.
- Unneeded UI kits, icons, build tooling, telemetry or enterprise integrations.

## YAS-owned modules to build around the existing app

- `src/auth/`: sessions, password reset, MFA-ready design, RBAC and account security.
- `src/community/`: rooms, messages, replies, reactions, read receipts, blocks and reports.
- `src/discovery/`: product provider adapters, normalization, filters, evidence and pagination.
- `src/affiliate/`: outbound click attribution, network policy, reconciliation and fraud controls.
- `src/reviews/`: source links, timestamped evidence, moderation and transparent summaries.
- `src/calls/`: signaling API and call lifecycle; WebRTC client plus TURN deployment config separately.
- `src/admin/`: roles, moderation, provider health, audit and reporting.
- `src/platform/`: database migrations, logging, rate limiting, validation, storage and health checks.

These are target boundaries, not existing folders. Create them only with working code, tests, documentation and explicit wiring into the running application.

## Mandatory import checklist for every copied source file

1. Confirm source path and exact upstream commit.
2. Confirm applicable licence and preserve copyright/NOTICE files.
3. Inspect transitive imports and package scripts.
4. Identify Meteor, MongoDB, workspace aliases, environment and runtime assumptions.
5. Port to YAS interfaces; do not leave broken aliases or dead imports.
6. Add unit tests and integration tests covering the adapted behaviour.
7. Run lint, typecheck, tests and a clean install.
8. Record source attribution and any modifications.

## Immediate verified gaps in current YAS repositories

- Product discovery handler returns 503 unless a provider function is injected; it is not a live ClickBank/ShareASale adapter.
- Discovery npm package declares React as a peer dependency and TypeScript/Vitest development dependencies, but no complete host app/build/start script.
- The YAS CHAT package currently exposes only `node server.js` as its script; its server contains a large base64-encoded HTML document and no demonstrated durable database integration.
- The existing community `/api/discover` and product `/api/discover/products` endpoints must remain distinct.
- CI in Discovery runs npm install, typecheck and tests; add lockfile, clean-install reproducibility, lint, security and integration jobs before release.

## Private acceptance gates

Do not deploy publicly. A private staging build is acceptable only after:
- clean clone/install/start is documented and reproducible;
- persistent data survives process restart;
- authentication and authorization tests pass;
- provider adapters fail safely with no fake product results;
- community messages and discovery results have API contract tests;
- calling passes real mobile network tests with TURN;
- security, dependency and secret scanning pass;
- backup and restore have been tested;
- all known disabled features are clearly labelled, not presented as working.

No API keys, passwords, signing secrets or provider tokens may be committed to Git.
