# Notifications

This document is the operator runbook for the current notification stack.

Current implementation:
- email: Resend
- WhatsApp: Twilio
- dispatch model: queue-backed outbox via `notification_logs`
- provider interaction: server-side only through Supabase edge functions

This is the source of truth for what still needs to be created manually in provider dashboards before notifications can be treated as fully live.

## Current Launch Scope

Default launch behavior:
- email is enabled for `order_paid`, `order_preparing`, `order_ready`, `order_cancelled`, and `order_refunded`
- WhatsApp is enabled only for `order_ready`
- checkout does not require WhatsApp
- WhatsApp sends only when the buyer opts in and provides a number

Config levers:
- `EMAIL_NOTIFICATION_EVENTS`
- `WHATSAPP_NOTIFICATION_EVENTS`
- `EMAIL_PROVIDER`
- `WHATSAPP_PROVIDER`

Do not widen WhatsApp scope casually. The current launch-safe default is intentionally narrow.

## Notification Architecture

Current runtime flow:
1. Business state changes first.
2. The backend queues rows into `notification_logs`.
3. Background dispatch resolves the correct provider adapter per channel.
4. Provider APIs send the message.
5. Provider webhooks update delivery state back onto `notification_logs`.
6. `notification_webhook_events` stores webhook deliveries for idempotency and audit traceability.

Important rule:
- notification delivery must never be the source of truth for order state

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
3. Create approved content templates for every WhatsApp event you want enabled.
4. Keep launch scope narrow unless there is a deliberate product decision to expand it.

Current minimum template requirement for launch:
- `TWILIO_TEMPLATE_ORDER_READY`

Additional templates only if you widen `WHATSAPP_NOTIFICATION_EVENTS`:
- `TWILIO_TEMPLATE_ORDER_PAID`
- `TWILIO_TEMPLATE_ORDER_PREPARING`
- `TWILIO_TEMPLATE_ORDER_CANCELLED`
- `TWILIO_TEMPLATE_ORDER_REFUNDED`

Values still needed from you:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM`
- `TWILIO_WEBHOOK_TOKEN` if callback protection should be enabled
- `WHATSAPP_DEFAULT_COUNTRY_CODE` if the default should not remain `44`
- the enabled Twilio template SIDs

## Secrets To Provide Back

Once the provider accounts are created, send these values back so the environment can be completed:

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

Outbox/dispatch:
- `NOTIFICATION_DISPATCH_SECRET`

## Deploy / Admin Steps After Secrets Exist

After the real provider values exist:
1. Update `supabase/.env.functions` locally or the hosted Supabase secrets store.
2. Run `supabase secrets set --env-file supabase/.env.functions`.
3. Deploy edge functions.
4. Confirm the Resend webhook is pointing at the hosted function endpoint, not local dev.
5. Confirm the Twilio WhatsApp sender and template SIDs match the enabled event scope.
6. If you want manual retry sweeps, keep `NOTIFICATION_DISPATCH_SECRET` available for `notification-dispatch`.

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
10. If needed, trigger `notification-dispatch` to sweep backlog and confirm retries behave correctly.

## Operational Notes

- `notification_logs` is both the delivery log and the durable outbox.
- `notification_webhook_events` is the idempotent webhook receipt log.
- `whatsapp-notify` remains only as a compatibility bridge for older trigger paths.
- The intended launch-safe baseline is now implemented. The remaining work is provider-account setup, secret injection, and live smoke verification.
