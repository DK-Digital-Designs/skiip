# Current State

## Summary

SKIIP is currently in a workable closed-pilot state.

The core order loop is functioning:

- buyer can sign up and log in
- buyer can create an order
- buyer is redirected to Stripe Checkout
- Stripe webhook marks the order as paid
- vendor sees the paid order and can move it through the lifecycle
- admin can view operational metrics and issue refunds

## What Is Working

### Buyer

- authenticated checkout only
- cart to order creation
- Stripe Checkout redirect
- order tracker with live updates
- success return flow after payment

### Vendor

- seller login
- store lookup from authenticated user
- order list with active/all filtering
- `paid -> preparing -> ready -> collected`
- cancellation path
- Stripe onboarding link generation

### Admin

- admin dashboard metrics
- recent order listing
- vendor performance summary
- notification health summary
- refund actions

### Backend

- server-authoritative order creation
- Stripe webhook idempotency tracking
- inventory finalization on successful payment
- refund recording
- audit logging
- user profile reconciliation trigger/backfill support

## Current Runtime Truth

These statements reflect the actual current implementation:

- guest checkout is no longer a supported buyer path
- order totals are computed on the server
- payment finalization is webhook-driven
- vendor/admin status changes flow through edge functions
- protected edge functions currently use manual bearer validation rather than Supabase gateway JWT enforcement

## Known Weak Spots

These are the main remaining risks, but they do not invalidate the current working baseline.

### 1. Auth posture is pragmatic, not final

`verify_jwt = false` is still used for protected edge functions, with manual auth enforcement in code.

### 2. Documentation was historically inconsistent

This is being corrected now by consolidating docs into the `docs/` directory.

### 3. Marketing site drift

The static marketing site still contains some old wording and links that do not fully match the current product architecture.

### 4. Notifications need operational verification, not a provider decision

The current backend uses Resend for email and Twilio WhatsApp for WhatsApp delivery. The remaining weakness is end-to-end environment verification: template SIDs, callback security, and real-world phone normalization still need disciplined launch checks.

## Intentional Scope Limits

These areas are intentionally not treated as complete yet:

- full multi-event tenancy
- social login as the primary auth path
- polished staging/prod database branching workflow
- final auth-hardening decision on `verify_jwt`

## What Changed Recently

Recent hardening work introduced:

- production-oriented order/payment flow
- authoritative edge functions
- admin metrics RPC
- audit logging
- Stripe webhook idempotency tracking
- reconciliation migrations for live schema and user profile consistency

The current system should be treated as the first stable operational baseline, not the final architecture endpoint.
