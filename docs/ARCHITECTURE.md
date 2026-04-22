# SKIIP Architecture

## Overview

SKIIP is a monorepo with a frontend app, a Supabase backend, and a separate static marketing site.

Primary runtime components:
- [`app`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app): buyer, vendor, and admin product UI
- [`supabase`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase): Postgres schema, migrations, row-level security, edge functions
- [`site`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/site): marketing pages, separate from the product app

## Frontend

The product app is built with:
- React 19
- Vite 7
- React Router 7
- TanStack Query
- Supabase JS

Important frontend routes live in [App.jsx](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/App.jsx).

Current user-facing surfaces:
- buyer ordering flow
- vendor dashboard and product management
- admin dashboard and vendor/admin tools
- shared login/signup

The app still contains some legacy route redirects such as `/vendor/login` and `/admin/login`, but they redirect into the unified auth flow.

## Backend

Supabase is the system of record for:
- authentication
- relational data
- realtime updates
- edge-function write boundaries

Key backend layers:
- Postgres tables and RLS policies
- SQL functions for inventory and analytics
- edge functions for checkout, transitions, refunds, onboarding, and notifications

## Auth Model

Auth is handled by Supabase Auth.

Current buyer path:
- email/password signup/login
- email confirmation currently disabled in the hosted project for pilot usability
- Google and Apple SSO are planned, not yet the main path

Current role model:
- `buyer`
- `seller`
- `admin`

Role data is stored in `public.user_profiles`, keyed to `auth.users`.

The `handle_new_user()` trigger creates or reconciles user profiles on auth user creation. The repo now includes reconciliation logic for missing historical profiles in [20260415000001_user_profile_reconciliation.sql](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/migrations/20260415000001_user_profile_reconciliation.sql).

## Function Auth Posture

Protected edge functions currently use this pattern:
- `verify_jwt = false` in [`supabase/config.toml`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/config.toml)
- the client sends the Supabase bearer token explicitly
- each protected function calls `requireUser()` from [`_shared/auth.ts`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/_shared/auth.ts)

This is the current working posture because it avoids opaque Supabase gateway failures and keeps auth decisions inside application code. It is acceptable for the current pilot, but it should be treated as an intentional design choice, not an accident.

Protected functions using this model:
- `order-create`
- `stripe-checkout`
- `order-transition`
- `stripe-refund`
- `stripe-onboarding-link`

Unprotected by necessity:
- `stripe-webhook`
- notification webhooks

## Order and Payment Flow

The buyer checkout flow is server-authoritative.

Sequence:
1. Buyer signs in.
2. Buyer builds a cart in the frontend.
3. [`Checkout.jsx`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/attendee/Checkout.jsx) submits product IDs, quantities, email, optional WhatsApp details, notes, and tip.
4. [`order-create`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/order-create/index.ts) validates the user, looks up products, computes totals, and writes `orders` plus `order_items`.
5. [`stripe-checkout`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/stripe-checkout/index.ts) creates a Stripe Checkout session using authoritative order data.
6. Stripe redirects the buyer back to the order tracker.
7. [`stripe-webhook`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/stripe-webhook/index.ts) verifies the signature, marks the order paid, records fees, finalizes inventory, writes audit logs, and queues notifications.
8. Vendor updates the order via [`order-transition`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/order-transition/index.ts).
9. Admin refunds are handled through [`stripe-refund`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/stripe-refund/index.ts).

Notification delivery now uses a small outbox pattern:
- business flows write durable notification rows into `notification_logs`
- the shared notification service resolves the provider per channel
- edge runtime background work drains queued notifications after the mutation response path
- provider webhooks update delivery state back onto the same log rows

## Realtime

Realtime is used for:
- buyer order tracking
- vendor order dashboard refreshes

Relevant frontend surfaces:
- [OrderTracker.jsx](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/attendee/OrderTracker.jsx)
- [Dashboard.jsx](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/vendor/Dashboard.jsx)

Realtime is a UX enhancement, not the source of truth. The database remains authoritative.

## Core Data Model

Important tables:
- `user_profiles`
- `stores`
- `products`
- `orders`
- `order_items`
- `notification_logs`
- `notification_webhook_events`
- `audit_logs`
- `stripe_processed_events`

Important SQL functions:
- `handle_new_user()`
- `finalize_paid_order_inventory()`
- `restock_order_inventory()`
- `decrement_inventory()`
- `get_admin_dashboard_metrics_v1()`

Important migrations:
- [20260414000000_production_readiness.sql](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/migrations/20260414000000_production_readiness.sql)
- [20260415000000_reconcile_live_schema.sql](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/migrations/20260415000000_reconcile_live_schema.sql)
- [20260415000001_user_profile_reconciliation.sql](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/migrations/20260415000001_user_profile_reconciliation.sql)

## Marketing Site

The `site/` directory is not the product app. It is a separate static marketing site.

That separation is important:
- product logic belongs in `app/` and `supabase/`
- marketing content belongs in `site/`

The marketing site still needs cleanup and link hygiene, but it is not part of the critical payment/order loop.
