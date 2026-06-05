# Current Launch Scope

Read this when you need the current launch scope details from [Notifications](../NOTIFICATIONS.md).

Default launch behavior in code:

- email is enabled for `order_paid`, `order_preparing`, `order_ready`, `order_cancelled`, and `order_refunded`
- WhatsApp backend infrastructure remains available for later activation, but buyer-facing WhatsApp controls/status labels are hidden for the pilot
- buyer checkout captures a required operational phone number for manual order verification/contact, while new buyer checkout payloads explicitly keep `whatsapp_opt_in: false`
- production must keep `WHATSAPP_SEND_MODE=disabled` for the pilot
- the `order_ready` email includes the client-approved 20-minute late-collection/refund wording

Test-event baseline:

- email must be verified for `order_paid` and `order_ready`
- `EMAIL_NOTIFICATION_EVENTS=order_paid,order_ready` is the recommended narrow test-day setting
- WhatsApp remains disabled for the pilot
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
- captured checkout phone numbers are not used for automated WhatsApp or SMS during the pilot

Do not widen WhatsApp scope casually. Re-enabling it requires a deliberate post-pilot product and provider decision.
