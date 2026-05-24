# Current State

## Summary

SKIIP is currently in a workable closed-pilot state for the core buyer -> payment -> vendor -> admin loop.

The production-critical path that exists in code today is:

- buyer signs in
- buyer creates an order through a server-authoritative edge function
- buyer is redirected to Stripe Checkout
- Stripe webhook marks the order as paid and finalizes inventory
- vendor sees the paid order and moves it through the active lifecycle
- admin can view operational metrics and issue refunds

## What Is Working

### Buyer

- shared email/password login
- buyer signup route
- authenticated checkout only
- cart to order creation
- Stripe Checkout redirect
- order tracker with live updates
- buyer order history view

### Vendor

- seller login
- admin-created vendor onboarding for launch
- store lookup from authenticated seller
- product management
- kanban-style order queue with active, scheduled, and all-order filtering
- `paid -> preparing -> ready -> collected`
- cancellation path
- Stripe onboarding link generation

### Admin

- admin dashboard metrics RPC
- recent order listing
- vendor performance summary
- notification health summary
- refund actions
- edge-function mediated vendor store management

### Backend

- server-authoritative order creation
- Stripe webhook idempotency tracking
- inventory finalization on successful payment
- automatic refund on paid-order inventory failure
- payment failure recording
- payment reconciliation fields exposed in the admin recent-orders view
- refund recording
- audit logging for key order and payment events
- user profile reconciliation trigger/backfill support
- queue-backed notification dispatch with delivery webhooks
- launch RLS access matrix in [RLS Access Matrix](reference/RLS_ACCESS_MATRIX.md)

### Analytics and search

- production SEO metadata, favicon/app icons, Open Graph/Twitter tags, canonical URL, app manifest, JSON-LD, robots file, and sitemap in the product app
- Vercel Web Analytics and Speed Insights mounted in the React app
- UTM campaign attribution stored in browser session storage for the current visit
- custom buyer-funnel events for landing intent, vendor selection, menu engagement, checkout, Stripe return, cancellation, retry, and buyer signup
- analytics event helpers covered by Vitest
- operations guidance in [Analytics And Search Reporting](operations/ANALYTICS.md)

## Current Runtime Truth

These statements reflect the actual current implementation.

- buyer checkout is authenticated only
- order totals are computed on the server
- payment finalization is webhook-driven
- vendor/admin order status changes go through edge functions
- vendor order queue lanes are frontend grouping only; `order-transition` remains the source of truth for status changes
- admin vendor/store mutations go through `admin-store`
- protected edge functions intentionally use manual bearer validation for the May 2026 launch posture rather than Supabase gateway JWT enforcement
- checkout currency is GBP
- vendor Stripe Connect onboarding is currently hardcoded to GB Express accounts
- vendor Stripe Connect readiness is canonicalized in `stores.stripe_connect_status`
- the marketing site now lives outside this repo in [DK-Digital-Designs/skiip-marketing](https://github.com/DK-Digital-Designs/skiip-marketing) and is not part of the order/payment source of truth
- Vercel analytics data is directional client-side telemetry; Supabase, Stripe, and the admin dashboard remain authoritative for orders, payments, refunds, and revenue

## Important Clarifications

### Signup behavior is launch-aligned

Current code exposes:

- buyer signup at `/signup`

Vendor signup is not exposed in the app router for launch. Admins create seller/store records from the admin vendor management path.

Also note:

- repo auth config keeps email confirmations disabled
- buyer signup copy assumes immediate account availability

That means buyer signup copy and auth configuration are aligned for the launch path.

### Admin vendor operations are edge-function mediated

The admin dashboard refund flow and vendor management flow are edge-function mediated for launch.

[`AdminVendors.jsx`](../app/src/pages/admin/Vendors.jsx) calls [`admin-store`](../supabase/functions/admin-store/index.ts) for:

- creating stores
- upgrading users to `seller`
- activating/suspending stores
- archiving stores

Store creation, status changes, and archival are audited. Direct seller store insert/update is disabled for launch, and archived stores use `deleted_at` rather than hard delete.

### Notifications are durable, but retries are not scheduled in-repo

Current notification behavior:

- business flows queue rows into `notification_logs`
- edge-runtime background work attempts immediate dispatch
- provider webhooks update delivery state

Important operational limit:

- there is no scheduler defined in this repository for delayed retry sweeps
- [`notification-dispatch`](../supabase/functions/notification-dispatch/index.ts) must be triggered manually or by an external scheduler if backlog recovery matters

### The marketing site is not operational lead capture

The marketing surface is maintained outside this repository.

Current reality:

- do not assume marketing-site forms are backend-integrated
- marketing analytics and lead capture are owned by the external marketing repo
- the product app in this repo remains the operational ordering surface and now has its own launch-level analytics/search measurement

Do not treat the marketing site as a backend-integrated operational surface.

## Known Weak Spots

These are the main remaining risks in the current baseline.

### 1. Auth posture is launch-explicit but should be revisited after launch

`verify_jwt = false` is still used for protected browser-facing edge functions, with manual auth enforcement in code through `requireUser()`. For the May 2026 launch this is explicit: missing, invalid, and expired bearer tokens should return `401`; authenticated users without a readable profile or required authorization should return `403`.

### 2. Environment drift remains easy to introduce

- `VITE_VENDOR_INVITE_CODE` is no longer part of the launch app route, but stale references may remain in legacy docs or unmounted code
- `ALLOWED_ORIGINS` has a hardcoded fallback list in code if the env var is missing
- `VITE_STRIPE_PUBLIC_KEY` is still documented in places even though the current redirect-based checkout flow does not read it

### 3. Local reset and schema guidance still have drift

- `supabase/config.toml` points `db reset` at `supabase/seed.sql`, but that file is not committed
- legacy schema snapshots still exist in `supabase/` and can be mistaken for the authoritative schema if someone ignores migrations

### 4. Some schema and UI remnants are legacy

- legacy order statuses such as `processing`, `shipped`, and `delivered` still exist in the schema
- the current UI and edge-function lifecycle do not use them
- event management remains deferred and `/admin/events` is not exposed in normal admin navigation/routing

### 5. Analytics provider activation is external

- the repo mounts Vercel Web Analytics and Speed Insights, but the hosted Vercel project still needs those features enabled and verified
- Google Search Console verification, sitemap submission, URL Inspection, and reporting access are external account tasks
- Search Console and Speed Insights reporting can lag until Google recrawls the site and real traffic reaches the production deployment

### 6. External database observability is documented but not configured

- the repo now documents Supabase Metrics API setup for Prometheus-compatible collectors
- no Prometheus, Grafana, Datadog, or hosted collector config is committed in this repository
- if launch monitoring requires external database-health alerts, that setup remains a provider-side operations task

## Intentional Scope Limits

These areas are still intentionally incomplete:

- full multi-event tenancy
- post-launch reassessment of gateway JWT enforcement versus manual edge-function auth
- automated retry scheduling for notification backlog recovery
- event-management tooling
- production-grade marketing-site lead capture in the external marketing repo
- advanced BI, cohort analytics, and multi-event reporting beyond the current launch-level Vercel/UTM instrumentation

## What Changed Recently

Recent hardening work introduced:

- production-oriented order/payment flow
- vendor kanban order queue for active kitchen operations
- authoritative edge functions for order creation, transitions, onboarding, and refunds
- admin metrics RPC with failed-payment reporting
- audit logging
- Stripe webhook idempotency tracking
- payment failure fields on orders
- queue-backed notification dispatch with richer delivery timestamps
- Resend webhook ingestion
- SEO/search assets, Vercel Analytics, Speed Insights, and privacy-conscious buyer-funnel event tracking
- schema and auth-profile reconciliation migrations

The repo now represents a first operational baseline. It does not yet represent a finished platform or a fully hardened open-launch posture.

---

## May 2026 Project Assessment

*Recorded 2026-05-04. Based on a full codebase review at v0.21.0.*

### What Is Strong

- **Server-authoritative order flow.** No client-trusted pricing or order creation. All critical mutations go through edge functions. The April 2026 refactor was the right architectural decision.
- **Edge function coverage is comprehensive.** 14 functions cover the full order, payment, notification, and reconciliation lifecycle, including recovery paths (`stripe-reconcile-order`, `notification-dispatch`) that most projects omit.
- **Notification outbox pattern is durable.** Business mutations and notifications are decoupled. A failed notification cannot fail an order.
- **Migration history is clean.** 24 timestamped, sequential migrations tell the full database history. No schema drift.
- **Payment resilience is layered.** Stripe webhook idempotency, auto-refund on inventory failure, multiple webhook secrets, and admin-level payment state recovery.
- **Audit logging covers the money path.** `audit_logs` captures order creation, payment, transitions, refunds, and admin vendor mutations.
- **Documentation is honest and maintained.** `ARCHITECTURE.md`, `CURRENT_STATE.md`, `ROADMAP.md`, and `LAUNCH_CHECKLIST.md` are current and reflect actual implementation, not historical intent.

### Additional Pre-Launch Risk Items

These extend the [Known Weak Spots](#known-weak-spots) section above with items identified in the May 2026 review.

#### Test coverage is the single largest launch risk

Current automated coverage: 35 unit tests, 3 public e2e smoke tests, 3 skipped auth tests.

The following paths have no automated test coverage:

- inventory finalization (`finalize_paid_order_inventory`)
- automatic refund on inventory failure after capture
- Stripe webhook idempotency and retry behavior
- order status transition guards
- notification dispatch failure behavior

If something breaks in the payment finalization path, there is no automated signal. The existing Vitest and Playwright infrastructure is in place to extend coverage.

#### Notification retry has no automatic trigger

The outbox is durable and `notification-dispatch` can drain the backlog, but nothing calls it automatically. A failed background dispatch in `waitUntil()` leaves notifications stuck in `notification_logs` until a manual trigger. A `pg_cron` job or external scheduler calling `notification-dispatch` on a fixed interval would close this gap.

#### `seed.sql` is missing

`supabase/config.toml` references `supabase/seed.sql` for `db reset`, but that file is not committed. Local reset is currently broken for any fresh environment. A minimal seed with test roles, a store, and a few products is sufficient.

#### `ALLOWED_ORIGINS` hardcoded fallback is unresolved

The `_shared/http.ts` fallback list contains specific production and preview URLs baked into code. This is already noted under environment drift above. Resolving it before go-live means setting `ALLOWED_ORIGINS` explicitly in every hosted environment and making the in-code fallback localhost-only.

### Technical Debt — Not Launch Blocking

These items do not block a safe first launch but carry ongoing maintenance cost.

#### Legacy files still present in the repo

The following files are not part of the active routed application:

- `app/src/pages/attendee/BuyerLogin.jsx`
- `app/src/pages/attendee/BuyerSignup.jsx`
- `app/src/pages/admin/Dashboard.jsx` — superseded by `DashboardV2.jsx`
- `app/src/pages/vendor/Signup.jsx` — unexposed stub
- `supabase/schema.sql`, `supabase/skiip-schema.sql`, `supabase/skiip-schema-full-reset.sql` — non-authoritative legacy snapshots

`ARCHITECTURE.md` flags the legacy schema files correctly. The page files are not flagged and can cause confusion on returning to the codebase.

#### Large monolithic page components

| File | Approximate size |
| :--- | :--- |
| `app/src/pages/attendee/Checkout.jsx` | 17 KB |
| `app/src/pages/vendor/Dashboard.jsx` | 16 KB |
| `app/src/pages/admin/DashboardV2.jsx` | 16 KB |
| `app/src/pages/attendee/OrderTracker.jsx` | 13 KB |
| `app/src/pages/admin/Vendors.jsx` | 13 KB |
| `app/src/components/shared/GlobalHeader.jsx` | 10 KB |

`Checkout.jsx` is the highest-risk surface to have in a single large file. Decomposing it into step components would improve debuggability under launch pressure.

#### `whatsapp-notify` is still deployed as legacy code

The migration chain removed the database trigger that originally called `whatsapp-notify`. The function is effectively dead but still deployed on every `supabase functions deploy`. It should be retired when confirmed clean across all environments.

#### Sentry integration is unverified in production

`@sentry/browser` and `@sentry/react` are runtime dependencies. Whether a live DSN is configured in the production Vercel environment and whether payment-path errors are reaching the Sentry dashboard has not been confirmed.

### Improvement Candidates for After Launch

- **Notification retry scheduler.** See pre-launch risk item above. If deferred past launch, ensure the manual operator sweep process is documented and understood.
- **Mobile-first buyer flow polish.** Event-day buyers are on phones. The current roadmap places this at Priority 3, but the use case warrants moving it earlier post-launch.
- **Admin investigation tooling.** `audit_logs` and `notification_logs` have the data. Surfacing failed payments, notification failures, and per-vendor payout context in the admin UI reduces dependency on direct database access during incidents.
- **Marketing site operational integration.** If the external marketing repo needs real lead capture, connect it to a supported backend path instead of treating it as a static brochure surface.
- **Buyer profile defaults for checkout.** Storing country and phone on the buyer profile would reduce checkout friction, particularly at an event where users are on mobile under time pressure.
