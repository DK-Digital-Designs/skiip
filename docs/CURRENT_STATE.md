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
- order list with active/all filtering
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
- launch RLS access matrix in [`docs/RLS_ACCESS_MATRIX.md`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/RLS_ACCESS_MATRIX.md)

## Current Runtime Truth

These statements reflect the actual current implementation.

- buyer checkout is authenticated only
- order totals are computed on the server
- payment finalization is webhook-driven
- vendor/admin order status changes go through edge functions
- admin vendor/store mutations go through `admin-store`
- protected edge functions intentionally use manual bearer validation for the May 2026 launch posture rather than Supabase gateway JWT enforcement
- checkout currency is GBP
- vendor Stripe Connect onboarding is currently hardcoded to GB Express accounts
- the repo still deploys a separate static marketing site, but it is not part of the order/payment source of truth

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

[`AdminVendors.jsx`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/admin/Vendors.jsx) calls [`admin-store`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/admin-store/index.ts) for:

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
- [`notification-dispatch`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/notification-dispatch/index.ts) must be triggered manually or by an external scheduler if backlog recovery matters

### The static marketing site is not operational lead capture

The `site/` directory is a separate marketing surface.

Current reality:

- waitlist and contact forms open email drafts for launch
- analytics is a stub
- some links and copy are still demo-oriented or stale

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

## Intentional Scope Limits

These areas are still intentionally incomplete:

- full multi-event tenancy
- post-launch reassessment of gateway JWT enforcement versus manual edge-function auth
- automated retry scheduling for notification backlog recovery
- event-management tooling
- production-grade marketing-site lead capture

## What Changed Recently

Recent hardening work introduced:

- production-oriented order/payment flow
- authoritative edge functions for order creation, transitions, onboarding, and refunds
- admin metrics RPC with failed-payment reporting
- audit logging
- Stripe webhook idempotency tracking
- payment failure fields on orders
- queue-backed notification dispatch with richer delivery timestamps
- Resend webhook ingestion
- schema and auth-profile reconciliation migrations

The repo now represents a first operational baseline. It does not yet represent a finished platform or a fully hardened open-launch posture.
