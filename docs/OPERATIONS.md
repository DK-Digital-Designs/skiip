# Operations

Detailed cutover, rollback, and launch-gate steps live in [Launch Checklist](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/LAUNCH_CHECKLIST.md). This file stays focused on day-to-day operational flow and troubleshooting.

## Order Lifecycle

Current intended operational flow:

- `pending`
- `paid`
- `preparing`
- `ready`
- `collected`

Allowed side paths:

- `paid -> cancelled`
- `preparing -> cancelled`
- `ready -> cancelled`
- `paid -> refunded`
- `preparing -> refunded`
- `ready -> refunded`
- `collected -> refunded`

Important current meanings:

- `pending` is the pre-payment state and is shown in the vendor UI as waiting for payment
- `refunded` is an admin/system financial outcome, not a normal vendor status transition

Legacy schema statuses still exist but are not part of the current UI flow:

- `processing`
- `shipped`
- `delivered`

## Launch Rehearsal

Before a real launch or high-confidence release:

1. create or confirm one buyer, one seller, and one admin account
2. verify the seller has completed Stripe onboarding
3. place a Stripe test-mode order
4. verify the webhook changes the order to `paid`
5. verify the vendor can move to `preparing`, `ready`, and `collected`
6. verify admin can refund a paid order
7. verify audit and notification records are written
8. if notification retry recovery matters, verify who or what will invoke `notification-dispatch`

## Daily Operational Checks

Review:

- recent orders
- failed payments
- failed notifications
- webhook processing errors
- unexpected inventory changes
- refund activity
- whether any notification backlog is accumulating without a retry sweep

Useful tables:

- `orders`
- `order_items`
- `notification_logs`
- `notification_webhook_events`
- `audit_logs`
- `stripe_processed_events`

Weekday staging smoke:

- review the latest staging smoke run for public-route and sign-in regressions
- if it fails, treat it as a deployment/auth/config warning first, not as proof of a payment-path incident

## Incident Handling

### Payment captured but order did not flip to paid

Check:

- Stripe webhook delivery result
- `stripe_processed_events`
- `orders.payment_status`
- `audit_logs`

Likely causes:

- bad webhook secret
- webhook endpoint targeting the wrong environment
- schema drift in the target Supabase project

If this affects more than one order, pause new order intake before retrying payment-side operations.

### Buyer gets `401` or `403` on a protected edge function

Check:

- frontend is pointing at the correct Supabase project
- session exists in the browser
- auth header is being forwarded by the client
- function still calls `requireUser()`
- `ALLOWED_ORIGINS` includes the active frontend origin
- hosted traffic is not relying on the wrong fallback origin set
- staging smoke results for buyer, seller, and admin sign-in

### Buyer reports payment failure at checkout

Check:

- Stripe event delivery for `payment_intent.payment_failed`
- `orders.payment_status`
- `orders.payment_failed_at`
- `orders.payment_failure_code`
- `orders.payment_failure_message`
- `audit_logs` entries for `payment_failed`

Operational note:

- failed payments currently leave the order in the pending flow with `payment_status = failed`
- the buyer can retry checkout on the same order once a new checkout session is created

### Vendor cannot change order status

Check:

- seller has a matching `user_profiles` row
- store belongs to the signed-in seller
- `order-transition` is deployed
- current order state allows the requested transition

### Refund fails

Check:

- order has a Stripe payment intent or charge
- `stripe-refund` is deployed
- Stripe secret key is valid for the same environment

### Notifications fail

Check:

- `notification_logs`
- `notification_webhook_events`
- provider secrets
- provider webhook callbacks
- whether immediate background dispatch ran
- whether `notification-dispatch` has been triggered when backlog recovery is needed

Operational note:

- immediate sends are usually handled by background dispatch after the business mutation completes
- delayed retries or backlog sweeps require `notification-dispatch`
- no scheduler for that endpoint is defined in this repository

## Refund Handling

Current refund path:

- initiated by admin UI
- sent through `stripe-refund`
- written back to `orders`
- inventory is restocked when appropriate
- tracked in `audit_logs`
- followed by transactional notification queuing

Refunds should be treated as financial operations, not simple UI status changes.

## Admin Operations Caveat

Not all admin operations currently go through server-authoritative endpoints.

Current direct browser-side admin writes in [`AdminVendors.jsx`](C:/Users/deang/OneDrive/Documents/GitHub/skiip/app/src/pages/admin/Vendors.jsx):

- create store
- promote user to `seller`
- activate/suspend store
- delete store

Operational consequence:

- store status changes are audit logged by database trigger
- store creation and store deletion are not protected by a dedicated edge-function boundary
- store deletion is currently a hard delete

## Vendor Onboarding

Before a vendor can accept orders:

1. decide whether the vendor is being created through admin tooling or invite-code self-signup
2. confirm the vendor account exists
3. confirm the vendor has a `stores` row
4. confirm Stripe onboarding is completed
5. confirm `stripe_onboarding_complete` is true

Important test-fixture note:

- the repo seeding scripts create seller accounts and stores
- they do not complete Stripe onboarding

## Marketing Site Operational Note

The static marketing site is not part of day-to-day order operations.

Current reality:

- contact and waitlist capture is still localStorage-only
- do not rely on it for operational lead intake or support workflow
