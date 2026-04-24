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
- invite-code-gated vendor signup route
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
- vendor store management

### Backend

- server-authoritative order creation
- Stripe webhook idempotency tracking
- inventory finalization on successful payment
- automatic refund on paid-order inventory failure
- payment failure recording
- refund recording
- audit logging for key order and payment events
- user profile reconciliation trigger/backfill support
- queue-backed notification dispatch with delivery webhooks

## Current Runtime Truth

These statements reflect the actual current implementation.

- buyer checkout is authenticated only
- order totals are computed on the server
- payment finalization is webhook-driven
- vendor/admin order status changes go through edge functions
- protected edge functions currently use manual bearer validation rather than Supabase gateway JWT enforcement
- checkout currency is GBP
- vendor Stripe Connect onboarding is currently hardcoded to GB Express accounts
- the repo still deploys a separate static marketing site, but it is not part of the order/payment source of truth

## Important Clarifications

### Signup behavior is mixed

Current code exposes:

- buyer signup at `/signup`
- vendor signup at `/vendor/signup`

Vendor signup is guarded by `VITE_VENDOR_INVITE_CODE` and creates a pending seller store.

Also note:

- repo auth config keeps email confirmations disabled
- signup UIs still tell users to check their inbox for verification

That means signup copy and auth configuration are not currently aligned.

### Admin operations are not uniformly server-authoritative

The admin dashboard refund flow is edge-function mediated, but vendor management is not.

[`AdminVendors.jsx`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/admin/Vendors.jsx) currently performs direct browser-side writes for:

- creating stores
- upgrading users to `seller`
- activating/suspending stores
- deleting stores

Store status changes are audit logged by database trigger. Store creation and deletion are not handled through a dedicated edge-function boundary.

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

- waitlist and contact forms write only to browser `localStorage`
- analytics is a stub
- some links and copy are still demo-oriented or stale

Do not treat the marketing site as a backend-integrated operational surface.

## Known Weak Spots

These are the main remaining risks in the current baseline.

### 1. Auth posture is pragmatic, not final

`verify_jwt = false` is still used for protected edge functions, with manual auth enforcement in code.

### 2. Environment drift remains easy to introduce

- `VITE_VENDOR_INVITE_CODE` is used by the app but not documented in `app/.env.example`
- `ALLOWED_ORIGINS` has a hardcoded fallback list in code if the env var is missing
- `VITE_STRIPE_PUBLIC_KEY` is still documented in places even though the current redirect-based checkout flow does not read it

### 3. Local reset and schema guidance still have drift

- `supabase/config.toml` points `db reset` at `supabase/seed.sql`, but that file is not committed
- legacy schema snapshots still exist in `supabase/` and can be mistaken for the authoritative schema if someone ignores migrations

### 4. Some schema and UI remnants are legacy

- legacy order statuses such as `processing`, `shipped`, and `delivered` still exist in the schema
- the current UI and edge-function lifecycle do not use them
- `/admin/events` is still a placeholder route, not implemented event management

## Intentional Scope Limits

These areas are still intentionally incomplete:

- full multi-event tenancy
- fully finalized edge-function auth posture
- automated retry scheduling for notification backlog recovery
- event-management tooling beyond the placeholder admin route
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
