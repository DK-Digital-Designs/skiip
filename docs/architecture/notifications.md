# Notifications

Read this when you need the notifications details from [SKIIP Architecture](../ARCHITECTURE.md).

Current implementation:

- email provider: Resend
- WhatsApp provider: Twilio
- durable outbox and delivery log: `notification_logs`
- webhook receipt log: `notification_webhook_events`

Current runtime flow:

1. Business mutation succeeds first.
2. Shared notification helpers queue rows into `notification_logs`.
3. Background dispatch runs through edge-runtime `waitUntil()`.
4. WhatsApp rows pass through the shared cost/eligibility guard before Twilio can be called.
5. Provider adapters send allowed messages and record provider attempt metadata.
6. Provider webhooks update delivery state back onto the same notification rows.

WhatsApp guard behavior:

- default mode is `WHATSAPP_SEND_MODE=disabled`
- staging verification should use `allowlist` mode with E.164 test recipients
- `live` mode is blocked outside production unless `WHATSAPP_ALLOW_LIVE_NON_PROD=true`
- daily and per-dispatch caps are enforced locally before Twilio API calls
- duplicate WhatsApp provider attempts are blocked per `(order_id, event_type, recipient)`

Important current limitations:

- there is no scheduler defined in this repo for delayed retry sweeps
- [`notification-dispatch`](../../supabase/functions/notification-dispatch/index.ts) exists for manual or external scheduled backlog draining
- [`whatsapp-notify`](../../supabase/functions/whatsapp-notify/index.ts) is still deployed, but the ordered migration chain removes the database trigger that originally called it; treat it as legacy compatibility code, not the intended primary path
- `sms` exists in shared notification types and database constraints, but there is no live sender path or business flow using SMS today
