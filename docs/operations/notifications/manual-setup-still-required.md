# Manual Setup Still Required

Read this when you need the manual setup still required details from [Notifications](../NOTIFICATIONS.md).

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
