# Operations

Detailed cutover, rollback, and launch-gate steps live in [Launch Checklist](C:/Users/deang/OneDrive/Documents/GitHub/skiip/docs/LAUNCH_CHECKLIST.md). This file stays focused on day-to-day operational flow and troubleshooting.

## Order Lifecycle

Current intended order state flow:
- `pending`
- `paid`
- `preparing`
- `ready`
- `collected`

Allowed operational side paths:
- `pending|paid|preparing|ready -> cancelled`
- `paid|preparing|ready -> refunded` through admin refund flow

`pending` is used as the pre-payment state in the current system and is displayed in the vendor UI as waiting for payment.

## Launch Rehearsal

Before a real launch or high-confidence release:
1. create or confirm one buyer, one seller, and one admin account
2. verify seller Stripe onboarding is complete
3. place a Stripe test-mode order
4. verify webhook changes the order to `paid`
5. verify vendor can move to `preparing`, `ready`, and `collected`
6. verify admin can refund a paid order
7. verify audit and notification records are written

## Daily Operational Checks

Review:
- recent orders
- failed notifications
- webhook processing errors
- unexpected inventory changes
- refund activity

Weekday staging smoke:
- review the latest staging smoke run for public-route and sign-in regressions
- if it fails, treat it as a deployment/auth/config warning first, not as proof of a payment-path incident

Useful tables:
- `orders`
- `order_items`
- `notification_logs`
- `audit_logs`
- `stripe_processed_events`

## Incident Handling

### Payment captured but order did not flip to paid
Check:
- Stripe webhook delivery result
- `stripe_processed_events`
- `orders.payment_status`
- `audit_logs`

Likely causes:
- bad webhook secret
- missing schema objects required by the webhook
- webhook endpoint targeting the wrong environment

If this affects more than one order, pause new order intake before retrying payment-side operations.

### Buyer gets 401 on protected edge function
Check:
- frontend is pointing at the correct Supabase project
- session exists in the browser
- auth header is being forwarded by the client
- function still calls `requireUser()`
- `ALLOWED_ORIGINS` still includes the active frontend origin
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
- failed payments now leave the order in the pending order flow with `payment_status = failed`
- the buyer can retry checkout on the same order after the next checkout session is created

### Vendor cannot change order status
Check:
- seller has a matching `user_profiles` row
- store belongs to the signed-in seller
- `order-transition` is deployed
- current order state allows the requested transition

### Refund fails
Check:
- order has a Stripe payment intent / charge
- `stripe-refund` is deployed
- Stripe secret key is valid for the same environment

### Notifications fail
Check:
- `notification_logs`
- provider secrets
- webhook callbacks for the selected provider
- whether the provider is intentionally optional in the current environment

## Refund Handling

Current refund path:
- initiated by admin UI
- sent through `stripe-refund`
- written back to `orders`
- tracked in `audit_logs`

Refunds should be treated as financial operations, not simple UI status changes.

## Vendor Onboarding

Before a vendor can accept orders:
1. vendor account must exist
2. vendor must have a `stores` row
3. Stripe onboarding must be completed
4. `stripe_onboarding_complete` must be true for the store

If vendor onboarding is incomplete, checkout should fail before creating a payment session.
