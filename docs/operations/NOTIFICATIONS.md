# Notifications

This document is the operator runbook for the current notification stack.

Current implementation:

- email: Resend
- WhatsApp: Twilio
- durable outbox and delivery log: `notification_logs`
- webhook receipt log: `notification_webhook_events`
- immediate dispatch model: edge-runtime background work via `waitUntil()`
- backlog / retry sweep endpoint: `notification-dispatch`

## Current Launch Scope

Default launch behavior in code:

- email is enabled for `order_paid`, `order_preparing`, `order_ready`, `order_cancelled`, and `order_refunded`
- WhatsApp is enabled only for `order_ready`
- checkout does not require WhatsApp
- WhatsApp sends only when the buyer opts in and provides a phone number

Test-event baseline:

- email must be verified for `order_paid` and `order_ready`
- `EMAIL_NOTIFICATION_EVENTS=order_paid,order_ready` is the recommended narrow test-day setting
- WhatsApp should remain disabled or allowlisted until the Meta/Twilio sender is confirmed healthy

Config levers:

- `EMAIL_PROVIDER`
- `EMAIL_NOTIFICATION_EVENTS`
- `WHATSAPP_PROVIDER`
- `WHATSAPP_NOTIFICATION_EVENTS`
- `WHATSAPP_SEND_MODE`
- `WHATSAPP_ALLOWED_RECIPIENTS`
- `WHATSAPP_DAILY_SEND_LIMIT`
- `WHATSAPP_PER_DISPATCH_LIMIT`
- `WHATSAPP_ALLOW_LIVE_NON_PROD`

Current non-scope:

- there is no active SMS sender path even though `sms` exists in shared notification types and database constraints

Do not widen WhatsApp scope casually. The current launch-safe default is intentionally narrow.

## WhatsApp Cost Gate

WhatsApp has one authoritative guard before Twilio can be called.

Guard stages:

1. Eligibility: event must be enabled, event must be `order_ready`, buyer must have opted in, and the recipient phone must normalize to E.164.
2. Mode: `disabled` blocks all sends, `allowlist` permits only configured test numbers, and `live` permits opted-in traffic.
3. Limits: non-production live mode, daily cap, per-dispatch cap, and duplicate logical sends are checked before provider dispatch.

Required safety defaults:

- `WHATSAPP_SEND_MODE=disabled` until testing starts
- staging smoke tests use `WHATSAPP_SEND_MODE=allowlist`
- `WHATSAPP_ALLOWED_RECIPIENTS` must contain normalized E.164 numbers only, for example `+447123456789`
- `WHATSAPP_DAILY_SEND_LIMIT` defaults to `10`
- `WHATSAPP_PER_DISPATCH_LIMIT` defaults to `2`
- `WHATSAPP_ALLOW_LIVE_NON_PROD=false`

`live` mode is treated as production-only. In staging, preview, local, or any environment without `SKIIP_ENVIRONMENT=production` or `prod`, `live` is blocked unless `WHATSAPP_ALLOW_LIVE_NON_PROD=true`.

Guard blocks are terminal local failures. They do not call Twilio, do not record a message SID, and do not schedule another retry. Operators should inspect `notification_logs.metadata.whatsapp_guard_block_reason`.

Guard reason codes:

- `guard_disabled`
- `guard_not_allowlisted`
- `guard_daily_cap_reached`
- `guard_dispatch_cap_reached`
- `guard_duplicate_logical_event`
- `guard_ineligible_event`
- `guard_missing_opt_in`
- `guard_invalid_recipient`
- `guard_live_blocked_non_prod`

Provider attempt counting:

- `whatsapp_provider_attempted_at` is written immediately before Twilio is called
- daily caps count attempted WhatsApp provider rows for the current UTC day
- per-dispatch caps count attempted WhatsApp provider rows in one dispatch sweep
- duplicate protection blocks a later provider attempt for the same `(order_id, event_type, recipient)`

Operator requeue:

- do not manually requeue WhatsApp rows unless the Twilio dashboard and `notification_logs` show that no chargeable provider attempt should be retried
- if a deliberate reattempt is approved, record operator evidence in metadata using `whatsapp_operator_requeue_approved=true` or `whatsapp_operator_requeue_approved_at`
- keep the daily cap low while requeueing so a bad retry cannot drain credit

## Notification Architecture

Current runtime flow:

1. Business state changes first.
2. The backend queues rows into `notification_logs`.
3. Background dispatch resolves the correct provider adapter per channel.
4. Provider APIs send the message.
5. Provider webhooks update delivery state back onto `notification_logs`.
6. `notification_webhook_events` stores webhook deliveries for idempotency and audit traceability.

Current `notification_logs` states:

- `queued`
- `processing`
- `sent`
- `delivered`
- `read`
- `failed`

Important rules:

- notification delivery is not the source of truth for order state
- a failed notification must not block the order/payment mutation that created it
- post-mutation notification queueing is best-effort for order transitions, refunds, webhook payment completion, and admin reconciliation
- if queueing fails before a `notification_logs` row exists, operators must investigate function logs; `notification-dispatch` can only retry rows that were successfully written

## Current Operational Limitation

Delayed retries are not automatically scheduled in this repository.

Current behavior:

- immediate sends are attempted in edge-runtime background work
- stale or failed rows can be reclaimed and retried through `claim_notification_logs()`
- [`notification-dispatch`](../../supabase/functions/notification-dispatch/index.ts) exists to drain backlog
- queue insertion failures are logged with function, operation, order, event, correlation/source event, and supplied operation metadata

Important:

- no GitHub Action, Supabase scheduled function, or other in-repo scheduler currently calls `notification-dispatch`
- if retry sweeps matter in staging or production, you must provide a manual or external scheduled trigger

## Legacy Compatibility Code

[`whatsapp-notify`](../../supabase/functions/whatsapp-notify/index.ts) still exists in the repo and is still deployable.

Current intended reality:

- the ordered migration chain removes the database trigger that used to call it
- the primary current flow is queue-backed dispatch through shared notification helpers

Treat `whatsapp-notify` as compatibility code for older environments, not as the intended primary production path.

## Manual Setup Still Required

These are the remaining non-code tasks before notifications are fully live.

### Resend

Create and configure:

1. Create the Resend account.
2. Verify the sending domain or sender address.
3. Create a sender identity that matches `NOTIFICATION_FROM_EMAIL`.
4. Create a webhook pointing to:

```text
https://jmqjuvfjthwbsbelgccs.supabase.co/functions/v1/resend-email-webhook
```

Current hosted project reference for this environment:

- `jmqjuvfjthwbsbelgccs`

5. Subscribe the webhook to at least:

- `email.sent`
- `email.delivered`
- `email.delivery_delayed`
- `email.failed`
- `email.bounced`
- `email.complained`
- `email.suppressed`

Values still needed from you:

- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`
- `RESEND_WEBHOOK_SECRET`

### Twilio WhatsApp

Create and configure:

1. Create the Twilio account.
2. Enable or connect the WhatsApp sender that will be used for outbound transactional messages.
3. Create approved content templates for every WhatsApp event you intentionally enable.
4. Keep launch scope narrow unless there is a deliberate product decision to expand it.

Current minimum template requirement for launch:

- `TWILIO_TEMPLATE_ORDER_READY`

Additional templates only if you widen `WHATSAPP_NOTIFICATION_EVENTS`:

- `TWILIO_TEMPLATE_ORDER_PAID`
- `TWILIO_TEMPLATE_ORDER_PREPARING`
- `TWILIO_TEMPLATE_ORDER_CANCELLED`
- `TWILIO_TEMPLATE_ORDER_REFUNDED`

Backward-compatible aliases still accepted by code:

- `TWILIO_TEMPLATE_ORDER_CONFIRMATION` for `order_paid`
- `TWILIO_TEMPLATE_READY_FOR_COLLECTION` for `order_ready`
- `TWILIO_WHATSAPP_NUMBER` as an alias for `TWILIO_WHATSAPP_FROM`

Values still needed from you:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`, or the preferred `TWILIO_API_KEY_SID` plus `TWILIO_API_KEY_SECRET`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_WEBHOOK_TOKEN` if callback protection should be enabled
- `WHATSAPP_DEFAULT_COUNTRY_CODE` if the default should not remain `44`
- `WHATSAPP_SEND_MODE`, initially `allowlist` for staging testing
- `WHATSAPP_ALLOWED_RECIPIENTS`, using E.164 test numbers only
- `WHATSAPP_DAILY_SEND_LIMIT`, recommended `3` for staging smoke tests
- `WHATSAPP_PER_DISPATCH_LIMIT`, recommended `1` for staging smoke tests
- the enabled Twilio template SIDs

## Secrets To Provide Back

Once the provider accounts are created, send these values back so the environment can be completed.

Core notification settings:

- `EMAIL_PROVIDER=resend`
- `WHATSAPP_PROVIDER=twilio`
- `EMAIL_NOTIFICATION_EVENTS`
- `WHATSAPP_NOTIFICATION_EVENTS`

Resend:

- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`
- `RESEND_WEBHOOK_SECRET`

Twilio:

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_API_KEY_SID`
- `TWILIO_API_KEY_SECRET`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_WEBHOOK_TOKEN`
- `WHATSAPP_DEFAULT_COUNTRY_CODE`
- `WHATSAPP_SEND_MODE`
- `WHATSAPP_ALLOWED_RECIPIENTS`
- `WHATSAPP_DAILY_SEND_LIMIT`
- `WHATSAPP_PER_DISPATCH_LIMIT`
- `WHATSAPP_ALLOW_LIVE_NON_PROD`
- relevant `TWILIO_TEMPLATE_*` values

Outbox / dispatch:

- `NOTIFICATION_DISPATCH_SECRET` if you want manual or external retry sweeps

## Deploy / Admin Steps After Secrets Exist

After the real provider values exist:

1. Update `supabase/.env.functions` locally or the hosted Supabase secrets store.
2. Run `supabase secrets set --env-file supabase/.env.functions`.
3. Deploy edge functions.
4. Confirm the Resend webhook is pointing at the hosted function endpoint, not local dev.
5. Confirm the Twilio sender and template SIDs match the enabled event scope.
6. Decide whether retry sweeps will be operator-triggered or externally scheduled.
7. If sweeps are required, store `NOTIFICATION_DISPATCH_SECRET` in the system that will call `notification-dispatch`.

## Smoke Test Checklist

Run this after the real provider setup is complete:

1. Set staging to `WHATSAPP_SEND_MODE=allowlist`.
2. Set `WHATSAPP_ALLOWED_RECIPIENTS` to the operator test numbers in E.164 format.
3. Set `WHATSAPP_DAILY_SEND_LIMIT=3` and `WHATSAPP_PER_DISPATCH_LIMIT=1`.
4. Place a test order without WhatsApp opt-in.
5. Confirm checkout succeeds and the order still progresses normally.
6. Confirm email notifications are queued and delivered for the applicable event.
7. Place a second test order with WhatsApp opt-in and an allow-listed number.
8. Move that order to `ready`.
9. Confirm Twilio sends one WhatsApp message and the row records `whatsapp_provider_attempted_at`.
10. Confirm Twilio delivery callbacks update `notification_logs`.
11. Confirm Twilio and Resend webhook events are persisted in `notification_webhook_events`.
12. Place a third test order with WhatsApp opt-in and a non-allow-listed number.
13. Confirm no Twilio message SID is recorded and metadata contains `guard_not_allowlisted`.
14. Lower `WHATSAPP_DAILY_SEND_LIMIT=1`, run a second eligible same-day send, and confirm metadata contains `guard_daily_cap_reached`.
15. If retry sweeps are part of the environment, trigger `notification-dispatch` and confirm backlog rows are reclaimed correctly without exceeding the configured WhatsApp caps.

## Forced Queue Failure Check

Use this only in a local or staging-safe environment.

1. Force `sendTransactionalNotifications()` to fail after a successful authoritative mutation, for example by temporarily making the `notification_logs` insert path return an error.
2. Run an order transition or admin refund against a safe test order.
3. Confirm the mutation response still succeeds and the order/refund state is committed.
4. Confirm function logs include the function name, operation, order id, event type, normalized error, and operation metadata.
5. Restore the forced failure immediately and confirm normal notification queueing resumes.

## Operational Notes

- `notification_logs` is both the delivery log and the durable outbox.
- `notification_webhook_events` is the idempotent webhook receipt log.
- `notification-dispatch` is the only retry/backlog sweep mechanism currently present in the repo.
- no in-repo scheduler calls `notification-dispatch`.
- `notification-dispatch` does not recreate notifications that failed before an outbox row was inserted.
- the intended launch-safe baseline is implemented in code; the remaining work is provider-account setup, secret injection, and live verification.
