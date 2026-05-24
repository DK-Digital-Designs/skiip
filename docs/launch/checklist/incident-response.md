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
