# Operations

Detailed cutover, rollback, and launch-gate steps live in [Launch Checklist](../launch/LAUNCH_CHECKLIST.md). This file stays focused on day-to-day operational flow and troubleshooting.

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
5. verify the admin recent-orders view shows the Stripe payment intent, charge, platform fee, Stripe fee, and vendor net
6. verify the vendor can move to `preparing`, `ready`, and `collected`
7. verify admin can refund a paid order
8. verify audit and notification records are written
9. if notification retry recovery matters, verify who or what will invoke `notification-dispatch`

## Daily Operational Checks

Review:

- recent orders
- failed payments
- failed notifications
- webhook processing errors
- unexpected inventory changes
- refund activity
- Stripe reconciliation fields on paid/refunded orders
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
- Stripe event processing failed and is retryable (`processing_status = failed`)

If Stripe confirms payment but the order remains pending after webhook retries, use the admin `Reconcile Payment` action for that order. If this affects more than one order, pause new order intake before retrying payment-side operations.

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

### Stripe reconciliation check

For each staging payment rehearsal, compare:

- Stripe test-mode Checkout Session ID
- Stripe test-mode Payment Intent ID
- Stripe test-mode Charge ID
- `orders.platform_fee`
- `orders.stripe_fee`
- `orders.vendor_net`
- the values shown in the admin recent-orders reconciliation line

Operational notes:

- May 12 testing must remain in Stripe test mode
- `vendor_net` is calculated from order total minus platform fee and Stripe fee after the webhook retrieves the expanded balance transaction
- older orders may show missing fee values if they were paid before reconciliation fields were populated

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

## Admin Vendor Operations

Launch vendor/store mutations go through `admin-store`, an admin-only Edge Function that calls service-role RPCs and writes audit records.

Current admin vendor operations:

- create a vendor store and promote the selected owner to `seller`
- activate or suspend a store
- archive a store by setting `deleted_at` and suspending it

Operational consequence:

- store creation, status changes, and archival are actor-audited
- browser-side admin writes to `stores` and `user_profiles` are not part of the launch path
- archival is used instead of hard delete for launch safety

## Vendor Onboarding

Before a vendor can accept orders:

1. create or confirm the vendor through admin tooling
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

- contact and waitlist forms open an email draft for launch
- do not rely on browser localStorage for operational lead intake or support workflow