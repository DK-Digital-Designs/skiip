# Incident Response

Read this when you need the incident response details from [Launch Checklist](../LAUNCH_CHECKLIST.md).

### Payment captured but order did not move to `paid`

Check:

- Stripe webhook delivery logs
- `stripe_processed_events`
- `orders.payment_status`
- `audit_logs`

Actions:

- verify webhook secret and target endpoint
- confirm `STRIPE_MODE` matches the Stripe event mode and the hosted endpoint secret is not a Stripe CLI listener secret
- confirm the webhook function is deployed to the right project
- inspect `stripe_processed_events.processing_status`, `attempt_count`, and `last_error`
- use the Admin Orders `Reconcile payment` action only after Stripe confirms the payment succeeded
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
- Admin Orders reconciliation detail display

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

### Checkout must be paused

Actions:

- first use Admin Settings `Checkout availability` to pause buyer checkout and record the reason
- set `PAYMENTS_ENABLED=false` if Admin Settings is unavailable or checkout must be disabled at the environment level
- do not swap production back to test Stripe keys after live orders exist
- keep `stripe-webhook`, `stripe-refund`, and `stripe-reconcile-order` operating with live secrets
- if intake must stop completely, expire open Stripe Checkout Sessions for affected pending orders and record the operator action

Expected buyer behavior:

- checkout returns a clear payment-paused message
- the buyer is told no payment has been taken
- the order remains retryable after payments are re-enabled

### Stripe dispute created

Check:

- `audit_logs` entries with `event_type = stripe_dispute_created`
- linked `orders.charge_id`
- Stripe Dashboard dispute details

Actions:

- assign an owner immediately
- inspect the linked order and fulfilment state
- pause fulfilment or vendor release if needed
- respond through Stripe Dashboard according to the dispute deadline

### Notification failures spike

Check:

- `notification_logs`
- `notification_webhook_events`
- provider callbacks
- provider credentials and account health
- WhatsApp guard metadata such as `whatsapp_guard_block_reason`
- whether `notification-dispatch` is being run when backlog recovery is needed

Actions:

- distinguish intentional optional-provider skips from actual failures
- for WhatsApp, separate expected guard blocks from real Twilio delivery failures before retrying anything
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
