# Launch Checklist

This is the Priority 1 launch-hardening runbook for SKIIP cutovers, rollback, and incident handling.

## Pre-Launch Gates

Do not treat an environment as launch-ready until all of the following are true:

- auth posture is explicitly signed off
- RLS audit is complete for buyer, seller, admin, and service-role boundaries
- Vercel app vars, Supabase secrets, and Stripe keys all match the same environment pair
- `ALLOWED_ORIGINS` is explicitly set for the target environment and hosted traffic is not relying on fallback origins in code
- notification provider accounts, webhook endpoints, and template IDs are configured for the target environment
- one full buyer -> Stripe test-mode payment -> reconciliation -> vendor -> refund rehearsal has passed with a Stripe-onboarded seller account
- Playwright smoke checks pass for public routes and configured role credentials
- logging is sufficient to diagnose webhook, refund, notification, and auth failures
- vendor onboarding has been rehearsed with the actual path you plan to use
- all live schema changes are represented in committed migrations
- notification retry recovery is defined:
  - operator-only manual sweep is accepted
  - or an external scheduler exists for `notification-dispatch`
- if public buyer or vendor signup is in scope, the signup UX matches the actual auth confirmation policy
- if the marketing site is part of the launch surface, its contact/waitlist forms are either replaced with real capture or explicitly treated as non-operational
- `product-images` storage bucket exists with public reads, seller/admin `products/<store_id>/*` uploads, PNG/JPG/WebP MIME limits, and a 5MB size limit

## Release Sequence

1. Freeze unrelated changes and identify the exact commit being deployed.
2. Confirm the target environment's frontend vars, Supabase secrets, Stripe account, and webhook config.
3. Confirm the notification provider setup in [Notifications](../operations/NOTIFICATIONS.md) is complete for the target environment.
4. Confirm `ALLOWED_ORIGINS` is set explicitly for the target environment.
5. Confirm migrations are complete and no manual production-only SQL is pending.
6. Deploy database migrations.
7. Deploy Supabase edge functions.
8. Deploy the frontend.
9. Run `npm run test:e2e` against the target with `PLAYWRIGHT_BASE_URL` set.
10. Run one manual operator rehearsal for the highest-risk flow if payments, auth, onboarding, or notifications changed. Payment rehearsals must use Stripe test mode before the May 2026 launch gate.
11. Only then open traffic or announce the release.

## Rollback Checklist

If a release is unstable:

1. Stop pushing further changes until the failure mode is understood.
2. Roll back the frontend first if the regression is clearly UI-only.
3. Roll back edge functions if auth, checkout, refund, or webhook behavior regressed there.
4. Pause new order intake if payment capture, refunds, or order-state progression are unreliable.
5. Do not blindly roll back the database after live payments. Prefer a forward fix unless a restore plan is explicitly prepared.
6. Re-run smoke checks after the rollback before reopening traffic.

## Incident Response

### Payment captured but order did not move to `paid`

Check:

- Stripe webhook delivery logs
- `stripe_processed_events`
- `orders.payment_status`
- `audit_logs`

Actions:

- verify webhook secret and target endpoint
- confirm the webhook function is deployed to the right project
- inspect `stripe_processed_events.processing_status`, `attempt_count`, and `last_error`
- use the admin `Reconcile Payment` action only after Stripe confirms the payment succeeded
- confirm the environment still has the required inventory/audit SQL objects from current migrations
- if multiple orders are affected, pause new order intake before retrying

### Stripe reconciliation mismatch

Check:

- the Stripe dashboard is in test mode for staging rehearsals
- `orders.checkout_session_id`
- `orders.payment_intent_id`
- `orders.charge_id`
- `orders.platform_fee`
- `orders.stripe_fee`
- `orders.vendor_net`
- admin recent-orders reconciliation display

Actions:

- compare the order against the Stripe test-mode Checkout Session, Payment Intent, Charge, and balance transaction
- verify the latest `stripe-webhook` function is deployed
- confirm the webhook retrieved `latest_charge.balance_transaction` before marking the order reconciled

### Edge functions return `401` or `403`

Check:

- frontend Supabase URL and anon key
- active browser session and bearer forwarding
- `requireUser()` coverage in the target function
- `ALLOWED_ORIGINS` for the active frontend origin
- whether hosted traffic is falling through to the wrong origin list

Actions:

- fix environment mismatches first
- redeploy the affected function if the auth guard changed

Expected launch behavior:

- protected browser-facing functions keep `verify_jwt = false` and validate the forwarded bearer token with `requireUser()`
- missing, invalid, or expired bearer tokens return `401`
- valid users without the required role, store ownership, or readable profile return `403`
- webhook and secret-protected functions remain gateway-unauthenticated and enforce their own signature or bearer-secret checks

### Refunds fail

Check:

- order has a valid Stripe payment object
- Stripe secret key is from the correct account
- `stripe-refund` is deployed and reachable

Actions:

- stop retrying from multiple places
- capture the failing order IDs and reconcile them from one operator path

### Notification failures spike

Check:

- `notification_logs`
- `notification_webhook_events`
- provider callbacks
- provider credentials and account health
- whether `notification-dispatch` is being run when backlog recovery is needed

Actions:

- distinguish intentional optional-provider skips from actual failures
- if the provider is critical for launch, switch to the fallback operator process immediately
- if retries depend on external scheduling, confirm that scheduler is still firing

### Signup confusion or account activation complaints

Check:

- the actual `auth.email.enable_confirmations` setting in the target environment
- current frontend signup messaging
- support instructions for buyer and vendor account creation

Actions:

- align the active support playbook to the actual environment behavior
- treat this as a launch blocker if self-serve signup is customer-facing

## Vendor Onboarding Checklist

Before a real vendor can accept orders:

1. Decide which onboarding path is being used:
   admin-created seller/store for the May 2026 launch.
2. Confirm the vendor has a valid `user_profiles` row with role `seller`.
3. Confirm the vendor has a valid `stores` row.
4. Confirm Stripe onboarding is complete and payout details are submitted.
5. Confirm `stripe_onboarding_complete = true` for the store.
6. Confirm menu items, pricing, and inventory are visible in the buyer flow.
7. Place one test order and verify it reaches the vendor dashboard.
8. Verify the vendor can move the order through `paid -> preparing -> ready -> collected`.
9. Verify admin refund access for that order path.
10. Verify vendor create/status/archive actions are routed through `admin-store` and visible in `audit_logs`.
11. Share the operator support contact and escalation path with the vendor.

## Schema Verification Rule

Before release:

- compare the intended live schema against committed migrations
- ensure no production-only drift is being relied on
- ensure operators are not following legacy schema snapshot files as if they were authoritative
- if an emergency manual fix was applied, capture it as a migration in the same change window