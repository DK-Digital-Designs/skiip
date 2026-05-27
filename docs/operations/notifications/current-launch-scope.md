# Current Launch Scope

Read this when you need the current launch scope details from [Notifications](../NOTIFICATIONS.md).

Default launch behavior in code:

- email is enabled for `order_paid`, `order_preparing`, `order_ready`, `order_cancelled`, and `order_refunded`
- WhatsApp is enabled only for `order_ready`
- checkout does not require WhatsApp
- checkout collects an opted-in WhatsApp number with a country-code selector and stores validated E.164 format
- WhatsApp sends only when the buyer opts in and provides a valid E.164 phone number

Test-event baseline:

- email must be verified for `order_paid` and `order_ready`
- `EMAIL_NOTIFICATION_EVENTS=order_paid,order_ready` is the recommended narrow test-day setting
- WhatsApp should remain disabled or allowlisted until the Meta/Twilio sender is confirmed healthy
- treat WhatsApp as verified only after an allowed opted-in order reaches `ready`, records a Twilio message SID, and stores a delivery callback; otherwise use email/manual support for 30 May 2026

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
