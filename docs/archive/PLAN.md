# SKIIP Launch Scope Plan: Apr 28-May 30, 2026

## Summary
- Treat **May 12, 2026** as the full staging test deadline, **May 30, 2026** as Launch 1, and **June 6, 2026** as Launch 2.
- Focus launch scope on: safe ordering, scheduled orders thin v1, Stripe/payment confidence, vendor/admin readiness, environment parity, and smoke testing.
- Defer full event management, marketing lead capture, rich scheduling/capacity rules, and broad backend hardening unless they block real orders.

## Key Changes
- Add a new P0 issue for **scheduled orders thin v1**:
  - Add `orders.scheduled_collection_at` and `orders.scheduled_collection_timezone`, defaulting to `Europe/London`.
  - Extend checkout and `order-create` to accept optional scheduled collection date/time.
  - Show scheduled collection details in buyer tracker, admin recent orders, notifications, and a vendor **Scheduled Orders** tab/column.
  - Keep normal order lifecycle unchanged: payment still happens up front; scheduled orders still move through `paid -> preparing -> ready -> collected`.
- Fix current launch blockers:
  - #24: make order creation transactional and aggregate duplicate product quantities before validation.
  - #14: keep manual `requireUser()` edge-function auth for launch, document it as the explicit posture, and normalize 401/403 behavior.
  - #15: complete buyer/seller/admin/service-role RLS access matrix and ship any fixes as migrations.
  - #17: lock Vercel, Supabase, Stripe, notification, redirect, and `ALLOWED_ORIGINS` parity before testing.
  - #16: run one full Stripe test-mode flow covering checkout, webhook, payout/accounting fields, refund, and reconciliation.
- Reduce ambiguity before May 12:
  - #22: buyer signup should match disabled email confirmations; vendor self-signup should be hidden because launch vendor onboarding is admin-created.
  - #23: move admin-created vendor/store operations behind audited server-side operations, at minimum create/update/suspend.
  - #25: hide `/admin/events` from normal admin navigation.
  - #26: retire or disable localStorage-only marketing capture for launch.
  - #27: verify `product-images` setup if vendors will upload product images before Launch 1.
  - #28: use only as a follow-up audit unless it reveals a concrete launch blocker.

## Month Execution
- **Apr 28-Apr 30:** freeze launch scope, create scheduled-orders issue, install app dependencies, establish build/lint/test baseline, and start #24.
- **May 1-May 5:** finish #24, scheduled orders DB/API/checkout/vendor display, #14 auth posture, and #22 signup/vendor path cleanup.
- **May 6-May 12:** complete #15, #17, and #19; seed staging accounts; run ~20-person staging test with Stripe test mode.
- **May 13-May 22:** fix test fallout, complete #16 and #18, harden admin vendor onboarding, and verify product images.
- **May 23-May 29:** freeze non-critical changes, run launch rehearsal, verify rollback/runbook, and only accept P0/P1 fixes.
- **May 30-Jun 6:** Launch 1 support window, triage real feedback, patch only high-confidence issues before Launch 2.

## Test Plan
- First implementation step: run `npm ci` in `app/`, then `npm run build`, `npm run lint`, `npm run test`, and `npm run test:e2e`.
- Add focused tests for invalid quantities, duplicate product aggregation, partial order insert failure, and scheduled collection payload validation.
- Expand staging smoke to cover buyer login, checkout validation, scheduled order creation, vendor scheduled-orders view, admin recent order visibility, and auth redirects.
- Manual rehearsal must cover immediate order, scheduled order, Stripe test checkout, webhook payment update, vendor transition, refund, notification delivery/fallback, and reconciliation.

## Assumptions
- Scheduled orders are **thin v1**, not a full calendar/capacity/event-management system.
- Collection times use **Europe/London** for launch.
- Vendor onboarding is **admin-created only** for launch.
- May 12 testing uses **staging with Stripe test mode**, not real customer payments.
- No files were changed while preparing this plan.
