# SKIIP Architecture

## Overview

SKIIP is a monorepo with three distinct surfaces:

- [`app`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app): the product application for buyers, sellers, and admins
- [`supabase`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase): Postgres schema and migrations, RLS, auth integration, and edge functions
- [`site`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/site): a separate static marketing site

Current deployment split:

- the product app is built from `app/` and deployed separately from the site
- the marketing site is published from `site/` to GitHub Pages
- Supabase is the system of record for auth, data, realtime, and server-side business logic

## Frontend

The product app is built with:

- React 19
- Vite 7
- React Router 7 using `HashRouter`
- TanStack Query
- Supabase JS
- Zustand for cart state

Important consequence:

- app URLs use `/#/...` routes, for example `/#/order` and `/#/vendor/dashboard`

Current routed surfaces in [App.jsx](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/App.jsx):

- landing page
- shared buyer/admin/seller login and buyer signup
- invite-code-gated vendor signup at `/vendor/signup`
- buyer ordering flow
- vendor dashboard and product management
- admin dashboard and vendor management
- placeholder admin events page

Legacy files still exist in the repo but are not part of the routed app today, including:

- [`app/src/pages/attendee/BuyerLogin.jsx`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/attendee/BuyerLogin.jsx)
- [`app/src/pages/attendee/BuyerSignup.jsx`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/attendee/BuyerSignup.jsx)
- [`app/src/pages/admin/Dashboard.jsx`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/admin/Dashboard.jsx)

## Auth Model

Auth is handled by Supabase Auth with role data in `public.user_profiles`.

Current roles:

- `buyer`
- `seller`
- `admin`

Current account-entry paths:

- buyer self-signup through `/signup`
- seller self-signup through `/vendor/signup` when `VITE_VENDOR_INVITE_CODE` is configured
- admin-created seller/store setup through the admin vendor management UI

Current backend profile lifecycle:

- [`handle_new_user()`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/migrations/20260415000001_user_profile_reconciliation.sql) creates or reconciles `user_profiles` rows from `auth.users`
- the reconciliation migration also backfills missing historical profiles

Important current mismatch:

- [`supabase/config.toml`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/config.toml) keeps `auth.email.enable_confirmations = false`
- the buyer and vendor signup UIs still show a "check your inbox" confirmation message

Treat the configuration as the source of truth and the signup confirmation copy as current UX drift.

## Function Auth Posture

Protected edge functions currently use this pattern:

- `verify_jwt = false` in [`supabase/config.toml`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/config.toml)
- the browser forwards the Supabase access token explicitly
- the function calls `requireUser()` from [`supabase/functions/_shared/auth.ts`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/_shared/auth.ts)

Protected functions using this model:

- `order-create`
- `stripe-checkout`
- `order-transition`
- `stripe-refund`
- `stripe-onboarding-link`

Functions that must remain unauthenticated at the gateway:

- `stripe-webhook`
- `resend-email-webhook`
- `whatsapp-status-webhook`
- `notification-dispatch` uses its own bearer secret instead of user auth

Browser-facing functions also gate by allowed `Origin`.

Important current behavior:

- if `ALLOWED_ORIGINS` is not set, [`_shared/http.ts`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/_shared/http.ts) falls back to a hardcoded list containing `https://skiip.co.uk`, `https://www.skiip.co.uk`, `https://skiip-4nzf8krt6-dkdigital.vercel.app`, `http://localhost:5173`, and `http://127.0.0.1:5173`
- hosted environments should set `ALLOWED_ORIGINS` explicitly rather than relying on that fallback

## Order and Payment Flow

The buyer checkout flow is server-authoritative.

Sequence:

1. Buyer signs in.
2. Buyer builds a cart in the browser. Cart state is stored locally via Zustand in `localStorage`.
3. [`Checkout.jsx`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/attendee/Checkout.jsx) submits only product IDs, quantities, contact details, optional WhatsApp opt-in, notes, and tip.
4. [`order-create`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/order-create/index.ts) validates the user, loads products, checks inventory, computes subtotal/tip/total on the server, creates the `orders` row, inserts `order_items`, and writes an `order_created` audit event.
5. [`stripe-checkout`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/stripe-checkout/index.ts) reloads the order, confirms ownership and payable state, verifies the store has completed Stripe onboarding, and creates a Stripe Checkout session.
6. Checkout is currently GBP-only, and vendor onboarding creates Stripe Express accounts with `country = GB`.
7. The platform fee is currently computed as `10%` of the order subtotal and passed as `application_fee_amount`.
8. Stripe redirects the buyer back to the hash-routed order tracker.
9. [`stripe-webhook`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/stripe-webhook/index.ts) verifies the signature, deduplicates the event, marks the order paid, records payment IDs and fee ledger fields, finalizes inventory atomically, writes audit rows, and queues notifications.
10. If inventory finalization fails after capture, the webhook auto-refunds and records a refund event.
11. [`payment_intent.payment_failed`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/stripe-webhook/index.ts) updates the order with failure timestamps and failure details.
12. Vendor or admin status changes go through [`order-transition`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/order-transition/index.ts).
13. Admin refunds go through [`stripe-refund`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/stripe-refund/index.ts).

Current operational lifecycle:

- `pending -> paid -> preparing -> ready -> collected`
- `paid|preparing|ready -> cancelled`
- `paid|preparing|ready -> refunded` through the admin refund path

Legacy order statuses still exist in the schema:

- `processing`
- `shipped`
- `delivered`

They are not part of the current UI or edge-function flow.

## Notifications

Current implementation:

- email provider: Resend
- WhatsApp provider: Twilio
- durable outbox and delivery log: `notification_logs`
- webhook receipt log: `notification_webhook_events`

Current runtime flow:

1. Business mutation succeeds first.
2. Shared notification helpers queue rows into `notification_logs`.
3. Background dispatch runs through edge-runtime `waitUntil()` and sends through the configured provider adapter.
4. Provider webhooks update delivery state back onto the same notification rows.

Important current limitations:

- there is no scheduler defined in this repo for delayed retry sweeps
- [`notification-dispatch`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/notification-dispatch/index.ts) exists for manual or external scheduled backlog draining
- [`whatsapp-notify`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/functions/whatsapp-notify/index.ts) is still deployed, but the ordered migration chain removes the database trigger that originally called it; treat it as legacy compatibility code, not the intended primary path
- `sms` exists in shared notification types and database constraints, but there is no live sender path or business flow using SMS today

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
- `is_admin()`
- `finalize_paid_order_inventory()`
- `restock_order_inventory()`
- `decrement_inventory()`
- `claim_notification_logs()`
- `get_admin_dashboard_metrics_v1()`

Authoritative schema source:

- [`supabase/migrations`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/migrations)

Non-authoritative legacy schema files still present in the repo:

- [`supabase/schema.sql`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/schema.sql)
- [`supabase/skiip-schema.sql`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/skiip-schema.sql)
- [`supabase/skiip-schema-full-reset.sql`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/supabase/skiip-schema-full-reset.sql)

Do not use those files as the live-working schema source of truth.

## Admin and Operational Caveats

Not all admin actions are server-authoritative today.

Current direct browser-side admin writes:

- [`AdminVendors.jsx`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/admin/Vendors.jsx) creates stores directly with Supabase JS
- it also upgrades selected users to `seller`
- it can suspend/activate stores directly
- it can hard-delete stores directly

Current audit coverage is uneven:

- store status changes are audit logged by database trigger
- order creation, payment, status transitions, and refunds are audit logged
- store creation and store deletion are not routed through a dedicated edge function

Also note:

- [`AdminEvents.jsx`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/admin/Events.jsx) is still a placeholder and does not implement event management

## Marketing Site

The `site/` directory is not the product app. It is a separate static marketing site.

Current reality for the marketing site:

- it is deployed independently from the product app
- waitlist and contact forms currently write only to browser `localStorage`
- [`analytics.js`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/site/assets/js/analytics.js) is a stub, not a live analytics integration
- several links and claims remain marketing/demo oriented and should not be treated as operational product behavior

That means the marketing site is currently presentation-only, not an operational source of leads, support tickets, or runtime product truth.
