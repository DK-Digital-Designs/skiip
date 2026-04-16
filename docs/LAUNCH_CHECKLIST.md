# Launch Checklist

This is the Priority 1 launch-hardening runbook for SKIIP cutovers, rollback, and incident handling.

## Pre-Launch Gates

Do not treat an environment as launch-ready until all of the following are true:
- auth posture is explicitly signed off
- RLS audit is complete for buyer, seller, admin, and service-role boundaries
- Vercel env vars, Supabase secrets, and Stripe keys all match the same environment pair
- one full buyer -> payment -> vendor -> refund rehearsal has passed
- Playwright smoke checks pass for public routes and any configured role credentials
- logging is sufficient to diagnose webhook, refund, and auth failures
- vendor onboarding has been rehearsed with a real operator flow
- all live schema changes are represented in committed migrations

## Release Sequence

1. Freeze unrelated changes and identify the exact commit being deployed.
2. Confirm the target environment's frontend vars, Supabase secrets, and Stripe webhook config.
3. Confirm migrations are complete and no manual production-only SQL is pending.
4. Deploy database migrations.
5. Deploy Supabase edge functions.
6. Deploy the frontend.
7. Run `npm run test:e2e` against the target with `PLAYWRIGHT_BASE_URL` set.
8. Run one manual operator rehearsal for the highest-risk flow if payments or auth changed.
9. Only then open traffic or announce the release.

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
- if multiple orders are affected, pause new order intake before retrying

### Edge functions return `401`

Check:
- frontend Supabase URL and anon key
- active browser session and bearer forwarding
- `requireUser()` coverage in the target function
- `ALLOWED_ORIGINS` for the active frontend origin

Actions:
- fix environment mismatches first
- redeploy the affected function if the auth guard changed

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
- provider callbacks
- provider credentials and account health

Actions:
- distinguish intentional optional-provider skips from actual failures
- if the provider is critical for launch, switch to the fallback operator process immediately

## Vendor Onboarding Checklist

Before a real vendor can accept orders:
1. Create or verify the vendor account and role mapping.
2. Confirm the vendor has a valid `stores` row.
3. Confirm Stripe onboarding is complete and payout details are submitted.
4. Confirm menu items, pricing, and inventory are visible in the buyer flow.
5. Place one test order and verify it reaches the vendor dashboard.
6. Verify the vendor can move the order through `paid -> preparing -> ready -> collected`.
7. Verify admin refund access for that order path.
8. Share the operator support contact and escalation path with the vendor.

## Schema Verification Rule

Before release:
- compare the intended live schema against committed migrations
- ensure no production-only drift is being relied on
- if an emergency manual fix was applied, capture it as a migration in the same change window
