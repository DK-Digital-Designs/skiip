# Incident Handling

Read this when you need the incident handling details from [Operations](../OPERATIONS.md).

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

If Stripe confirms payment but the order remains pending after webhook retries, use Admin Orders `Reconcile payment` for that order. If this affects more than one order, pause new order intake through Admin Settings before retrying payment-side operations.

### Buyer gets `401` or `403` on a protected edge function

Check:

- frontend is pointing at the correct Supabase project
- session exists in the browser
- auth header is being forwarded by the client
- function still calls `requireUser()`
- `ALLOWED_ORIGINS` includes the active frontend origin
- hosted traffic is not relying on the wrong fallback origin set
- staging smoke results for buyer, seller, and admin sign-in

### Vendor completes Stripe onboarding but remains in Limited Mode

Check:

- `stores.stripe_account_id`
- `stores.stripe_connect_status`
- `stores.stripe_connect_last_checked_at`
- raw Stripe observability fields on `stores`
- Stripe `account.updated` webhook delivery for the same connected account

Operational notes:

- `stripe_connect_status = 'ready'` is the source of truth for vendor payment readiness.
- The dashboard calls `stripe-connect-status` after Stripe returns to `/#/vendor/dashboard?stripe_return=1`.
- The same status derivation is used by `stripe-webhook` and `stripe-connect-status`; it is safe if both run at the same time.
- If the dashboard did not reconcile, sign in as the vendor and revisit the Stripe return URL or have an admin trigger the same authenticated function for the store.
- Checkout remains blocked until the store has a Stripe account ID and `stripe_connect_status = 'ready'`.

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

### Database performance or saturation warning fires

Check:

- Supabase Studio database reports and Query Performance
- external Metrics API dashboard if configured
- recent deployment, migration, or bulk-operator activity
- Stripe webhook retries and app error logs for downstream impact
- long-running transactions or unusually high connection usage

Operational note:

- the Metrics API is an external observability feed, not an in-app source of truth
- if external metrics are not configured, use Supabase Studio reports, Query Performance, Advisors, and application symptoms
- treat database saturation during live orders as a launch incident, especially if checkout, webhook finalization, or vendor dashboard refresh is affected

### Stripe reconciliation check

For each staging payment rehearsal, compare:

- Stripe test-mode Checkout Session ID
- Stripe test-mode Payment Intent ID
- Stripe test-mode Charge ID
- `orders.platform_fee`
- `orders.stripe_fee`
- `orders.vendor_net`
- the values shown in Admin Orders reconciliation detail

Operational notes:

- May 12 testing must remain in Stripe test mode
- checkout includes a fixed GBP 2.00 `Service Fees` line for the test event
- the service fee is platform-retained and is included in Stripe `application_fee_amount`
- `application_fee_amount` is calculated as `10%` of order subtotal plus GBP 2.00, not as `10%` of the full buyer total
- vendor gross revenue excludes service fees and should use order subtotal plus tip
- `vendor_net` is calculated from buyer total minus platform fee and Stripe fee after the webhook retrieves the expanded balance transaction
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
- the admin used the refund action in Admin Orders

### Notifications fail

Check:

- `notification_logs`
- edge function logs for best-effort queue failures before an outbox row exists
- `notification_webhook_events`
- provider secrets
- provider webhook callbacks
- whether immediate background dispatch ran
- whether `notification-dispatch` has been triggered when backlog recovery is needed

Operational note:

- immediate sends are usually handled by background dispatch after the business mutation completes
- post-mutation notification queueing is best-effort and should not make a committed order transition, refund, webhook payment completion, or admin reconciliation look failed
- delayed retries or backlog sweeps require `notification-dispatch`
- no scheduler for that endpoint is defined in this repository
