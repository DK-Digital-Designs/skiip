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

Config levers:

- `EMAIL_PROVIDER`
- `EMAIL_NOTIFICATION_EVENTS`
- `WHATSAPP_PROVIDER`
- `WHATSAPP_NOTIFICATION_EVENTS`

Current non-scope:

- there is no active SMS sender path even though `sms` exists in shared notification types and database constraints

Do not widen WhatsApp scope casually. The current launch-safe default is intentionally narrow.

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

## Current Operational Limitation

Delayed retries are not automatically scheduled in this repository.

Current behavior:

- immediate sends are attempted in edge-runtime background work
- stale or failed rows can be reclaimed and retried through `claim_notification_logs()`
- [`notification-dispatch`](../../supabase/functions/notification-dispatch/index.ts) exists to drain backlog

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
https://<project-ref>.supabase.co/functions/v1/resend-email-webhook
```

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
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_WEBHOOK_TOKEN` if callback protection should be enabled
- `WHATSAPP_DEFAULT_COUNTRY_CODE` if the default should not remain `44`
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
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_WEBHOOK_TOKEN`
- `WHATSAPP_DEFAULT_COUNTRY_CODE`
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

1. Place a test order without WhatsApp opt-in.
2. Confirm checkout succeeds and the order still progresses normally.
3. Confirm email notifications are queued and delivered for the applicable event.
4. Place a second test order with WhatsApp opt-in and a valid number.
5. Move that order to `ready`.
6. Confirm Twilio sends the WhatsApp message.
7. Confirm Twilio delivery callbacks update `notification_logs`.
8. Confirm Resend webhook events update `notification_logs`.
9. Confirm failed sends, if forced, record `failed_at`, error message, and retry metadata.
10. If retry sweeps are part of the environment, trigger `notification-dispatch` and confirm backlog rows are reclaimed correctly.

## Operational Notes

- `notification_logs` is both the delivery log and the durable outbox.
- `notification_webhook_events` is the idempotent webhook receipt log.
- `notification-dispatch` is the only retry/backlog sweep mechanism currently present in the repo.
- no in-repo scheduler calls `notification-dispatch`.
- the intended launch-safe baseline is implemented in code; the remaining work is provider-account setup, secret injection, and live verification.
